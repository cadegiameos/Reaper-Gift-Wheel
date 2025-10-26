// pages/api/youtube-channels.js
import { google } from "googleapis";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  try {
    // 1) Require a valid OAuth token
    const access_token = await redis.get("yt_access_token");
    if (!access_token) {
      return res
        .status(401)
        .json({ message: "Not connected to YouTube", channels: [] });
    }

    // 2) YouTube client with the current identity (personal channel OR brand/editor identity)
    const youtube = google.youtube({
      version: "v3",
      auth: access_token,
    });

    // 3) Ask YouTube which channel this identity represents
    //    NOTE: This returns the channel *for the identity selected at Google sign-in*.
    //    If the user needs a Brand/Editor channel, they MUST pick that identity in the Google account chooser.
    const resp = await youtube.channels.list({
      part: "snippet",
      mine: true,
      maxResults: 50,
    });

    const items = resp?.data?.items ?? [];

    const channels =
      items.map((ch) => ({
        id: ch.id,
        title: ch.snippet?.title || "Untitled",
        thumbnail:
          ch.snippet?.thumbnails?.default?.url ||
          ch.snippet?.thumbnails?.high?.url ||
          ch.snippet?.thumbnails?.medium?.url ||
          null,
        customUrl: ch.snippet?.customUrl || null,
      })) ?? [];

    // 4) If nothing returned, provide a high-signal hint back to the UI
    //    (This happens if: the account has no YouTube channel, or the user selected
    //     the wrong identity in the Google chooser, or YouTube Data API v3 is not enabled.)
    if (channels.length === 0) {
      return res.status(200).json({
        channels: [],
        note:
          "No channels were returned for this Google identity. If you manage a Brand/Editor channel, " +
          "sign in again and in Google's account picker choose the Brand/Channel identity (not your personal account). " +
          "Also ensure YouTube Data API v3 is enabled for your GCP project and that the channel is fully created.",
      });
    }

    return res.status(200).json({ channels });
  } catch (err) {
    console.error("youtube-channels error:", err?.response?.data || err);
    return res
      .status(500)
      .json({ message: "Failed to load channels", channels: [] });
  }
}
