import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

async function getAccessToken() {
  const refresh = await redis.get("YT_REFRESH_TOKEN");
  if (!refresh) throw new Error("No refresh token saved");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refresh,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`Failed to refresh access token: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

async function getActiveLiveChatId(accessToken) {
  // Try cached first (reduces quota)
  let liveChatId = await redis.get("YT_LIVE_CHAT_ID");
  if (liveChatId) return liveChatId;

  const res = await fetch(
    "https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,contentDetails&broadcastStatus=active&mine=true",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`liveBroadcasts error: ${JSON.stringify(data)}`);
  }

  const item = Array.isArray(data.items) && data.items[0];
  liveChatId = item?.snippet?.liveChatId;
  if (!liveChatId) throw new Error("No active liveChatId (is the stream live?)");

  // Cache for 5 minutes
  await redis.set("YT_LIVE_CHAT_ID", liveChatId, { ex: 300 });
  return liveChatId;
}

function extractGiftCount(displayMessage) {
  const msg = (displayMessage || "").toLowerCase();
  if (!msg.includes("gift")) return 0;

  const m = msg.match(/gift(?:ed|ing)?\s+(\d{1,3})/i);
  if (m && m[1]) {
    const n = parseInt(m[1], 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  if (msg.includes("gifted")) return 1;
  return 0;
}

async function addEntriesToWheel(name, amount) {
  const existing = (await redis.get("wheelEntries")) || [];
  const newEntries = [...existing, ...Array(amount).fill(String(name))];
  await redis.set("wheelEntries", newEntries);
  return newEntries;
}

export default async function handler(req, res) {
  try {
    const hasRefresh = !!(await redis.get("YT_REFRESH_TOKEN"));
    if (!hasRefresh) {
      return res.status(200).json({ ok: true, skipped: "no_youtube_connection" });
    }

    const accessToken = await getAccessToken();
    const liveChatId = await getActiveLiveChatId(accessToken);

    const pageTokenKey = `YT_PAGE_TOKEN:${liveChatId}`;
    const seenIdKey = `YT_SEEN_SET:${liveChatId}`;

    const pageToken = (await redis.get(pageTokenKey)) || undefined;
    const url = new URL("https://www.googleapis.com/youtube/v3/liveChat/messages");
    url.searchParams.set("liveChatId", liveChatId);
    url.searchParams.set("part", "snippet,authorDetails");
    url.searchParams.set("maxResults", "200");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const resp = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await resp.json();
    if (!resp.ok) {
      return res.status(500).json({ error: "liveChat messages error", details: data });
    }

    if (data.nextPageToken) await redis.set(pageTokenKey, data.nextPageToken);

    const items = Array.isArray(data.items) ? data.items : [];
    let added = 0;

    for (const item of items) {
      const id = item?.id;
      if (!id) continue;

      const sadd = await redis.sadd(seenIdKey, id);
      await redis.expire(seenIdKey, 60 * 60 * 6); // 6 hours

      if (sadd !== 1) continue;

      const displayMessage = item?.snippet?.displayMessage || "";
      const author = item?.authorDetails?.displayName || "Unknown";

      const count = extractGiftCount(displayMessage);
      if (count > 0) {
        await addEntriesToWheel(author, count);
        added += count;
      }
    }

    const pollMs = data?.pollingIntervalMillis ?? 8000;

    return res.status(200).json({
      ok: true,
      processed: items.length,
      added,
      nextPollInMs: pollMs,
    });
  } catch (err) {
    console.error("YT Poll error:", err);
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}
