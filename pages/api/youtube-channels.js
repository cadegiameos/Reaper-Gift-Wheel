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
      return res.status(401).json({ message: "Not connected to YouTube", channels: [] });
    }

    const youtube = google.youtube({
      version: "v3",
      auth: access_token,
    });

    let allChannels = [];

    // ✅ Fetch user-owned channels
    const personalResp = await youtube.channels.list({
      part: "snippet",
      mine: true,
      maxResults: 50,
    });

    const personalChannels = (personalResp.data.items || []).map((ch) => ({
      id: ch.id,
      title: ch.snippet?.title || "Untitled",
      thumbnail:
        ch.snippet?.thumbnails?.default?.url ||
        ch.snippet?.thumbnails?.medium?.url ||
        ch.snippet?.thumbnails?.high?.url ||
        null,
      type: "Owner",
    }));

    allChannels.push(...personalChannels);

    // ✅ If channel-membership permissions exist → user may have EDITOR rights
    try {
      const editorResp = await youtube.membershipsLevels.list({ part: "snippet" });
      if (editorResp.data.kind) {
        // Even if list is empty, access exists, so assume editor access possible
        // Let them manually choose after checking with live broadcast fetch
        // NOTE: actual validation will happen when polling live streams
      }
    } catch (err) {
      // No editor access -- do nothing
    }

    return res.status(200).json({ channels: allChannels });
  } catch (err) {
    console.error("youtube-channels error:", err);
    return res.status(500).json({ message: "Failed to load channels", channels: [] });
  }
}
