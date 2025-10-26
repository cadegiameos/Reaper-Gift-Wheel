// pages/api/youtube-channels.js
import { google } from "googleapis";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  try {
    const access_token = await redis.get("yt_access_token");
    if (!access_token) {
      return res.status(401).json({ message: "Not connected to YouTube", channels: [] });
    }

    // ✅ Use OAuth2 client (NO API KEY needed or used)
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token });

    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client,
    });

    // ✅ This fetches channels the user OWNS or is directly associated with (Brand/Primary)
    const resp = await youtube.channels.list({
      part: "snippet",
      mine: true,
      maxResults: 50,
    });

    const channels = (resp.data.items || []).map((ch) => ({
      id: ch.id,
      title: ch.snippet?.title || "Untitled",
      thumbnail:
        ch.snippet?.thumbnails?.default?.url ||
        ch.snippet?.thumbnails?.high?.url ||
        ch.snippet?.thumbnails?.medium?.url ||
        null,
      source: "owned-or-managed",
    }));

    return res.status(200).json({ channels });
  } catch (err) {
    console.error("youtube-channels error:", err);
    return res
      .status(500)
      .json({ message: "Failed to load channels", channels: [] });
  }
}
