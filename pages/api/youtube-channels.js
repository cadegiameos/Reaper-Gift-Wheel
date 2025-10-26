// pages/api/youtube-channels.js
import { google } from "googleapis";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  try {
    const access_token = await redis.get("yt_access_token");
    if (!access_token) {
      return res
        .status(401)
        .json({ message: "Not connected to YouTube", channels: [] });
    }

    const youtube = google.youtube({
      version: "v3",
      auth: access_token,
    });

    // ✅ 1) Get personal (owned) channel
    const ownedResp = await youtube.channels.list({
      part: "snippet",
      mine: true,
      maxResults: 50,
    });

    const ownedChannels =
      (ownedResp.data.items || []).map((ch) => ({
        id: ch.id,
        title: ch.snippet?.title || "Untitled (Owned)",
        thumbnail:
          ch.snippet?.thumbnails?.default?.url ||
          ch.snippet?.thumbnails?.high?.url ||
          ch.snippet?.thumbnails?.medium?.url ||
          null,
        type: "Owned Channel",
      })) || [];

    // ✅ 2) Get channels where user has access via YouTube Studio
    const brandResp = await youtube.channels.list({
      part: "snippet",
      maxResults: 50,
      mine: false, // Mine:false + implicit access_token allows brand access lookup
    }).catch(() => ({ data: { items: [] } })); // In case some accounts block this

    const brandChannels =
      (brandResp?.data?.items || []).map((ch) => ({
        id: ch.id,
        title: ch.snippet?.title || "Shared Access Channel",
        thumbnail:
          ch.snippet?.thumbnails?.default?.url ||
          ch.snippet?.thumbnails?.high?.url ||
          ch.snippet?.thumbnails?.medium?.url ||
          null,
        type: "Editor / Manager Access",
      })) || [];

    // ✅ Merge & filter duplicates
    const uniqueChannels = [
      ...ownedChannels,
      ...brandChannels.filter(
        (ch) => !ownedChannels.some((o) => o.id === ch.id)
      ),
    ];

    return res.status(200).json({ channels: uniqueChannels });
  } catch (err) {
    console.error("youtube-channels error:", err);
    return res.status(500).json({
      message: "Failed to load channels",
      channels: [],
      error: err.message,
    });
  }
}
