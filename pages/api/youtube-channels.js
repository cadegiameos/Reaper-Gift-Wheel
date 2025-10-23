import { google } from "googleapis";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  try {
    const accessToken = await redis.get("yt_access_token");

    if (!accessToken) {
      return res.status(401).json({ message: "Not authenticated with YouTube" });
    }

    const youtube = google.youtube({
      version: "v3",
      auth: accessToken,
    });

    // Get channels managed by the signed-in user
    const resp = await youtube.channels.list({
      part: "id,snippet",
      mine: true, // Only channels they own or manage (editor-level counts)
    });

    const items = resp.data.items || [];

    const channels = items.map((ch) => ({
      id: ch.id,
      title: ch.snippet.title,
      thumbnail: ch.snippet.thumbnails?.default?.url || null,
    }));

    return res.status(200).json({ channels });
  } catch (err) {
    console.error("Error fetching YouTube channels:", err);
    return res.status(500).json({ message: "Failed to fetch channels" });
  }
}
