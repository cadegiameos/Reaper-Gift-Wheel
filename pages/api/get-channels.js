import { google } from "googleapis";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  try {
    // 1️⃣ Get stored access token
    const access_token = await redis.get("yt_access_token");
    if (!access_token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // 2️⃣ Authorize YouTube API
    const youtube = google.youtube({
      version: "v3",
      auth: access_token,
    });

    // 3️⃣ Fetch channels the user can manage
    const response = await youtube.channels.list({
      part: "snippet",
      mine: true,
    });

    const channels = response.data.items?.map((item) => ({
      id: item.id,
      title: item.snippet.title,
    })) || [];

    return res.status(200).json({ channels });
  } catch (error) {
    console.error("Error fetching channels:", error);
    return res.status(500).json({ message: "Failed to fetch channels" });
  }
}
