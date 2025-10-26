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

    // ✅ Step 1: Get owned channels (`mine: true`)
    const resp = await youtube.channels.list({
      part: "snippet",
      mine: true,
      maxResults: 50,
    });

    const ownedChannels =
      (resp.data.items || []).map((ch) => ({
        id: ch.id,
        title: ch.snippet?.title || "Untitled",
        thumbnail:
          ch.snippet?.thumbnails?.default?.url ||
          ch.snippet?.thumbnails?.high?.url ||
          ch.snippet?.thumbnails?.medium?.url ||
          null,
        access: "owner", // Mark owned channels
      })) || [];

    // ✅ Step 2: For each owned channel, test if user is an EDITOR by checking memberships
    for (const ch of ownedChannels) {
      try {
        // Try calling memberships for this channel — if allowed, mark as editor
        await youtube.membershipsLevels.list({
          part: "snippet",
          // Force this channel context
          auth: access_token,
        });
        ch.access = "editor"; // User has elevated permissions
      } catch {
        // If this fails, user is likely only owner, not editor of others
        // Keep it as owner
      }
    }

    return res.status(200).json({ channels: ownedChannels });
  } catch (err) {
    console.error("youtube-channels error:", err);
    return res
      .status(500)
      .json({ message: "Failed to load channels", channels: [] });
  }
}
