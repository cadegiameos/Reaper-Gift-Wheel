import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  const code = req.query.code;

  if (!code) return res.status(400).json({ error: "No code provided" });

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
        grant_type: "authorization_code",
      }),
    });

    const data = await tokenRes.json();

    if (!data.refresh_token) {
      return res.status(400).json({ error: "No refresh token returned" });
    }

    // Save refresh token to Redis
    await redis.set("YT_REFRESH_TOKEN", data.refresh_token);

    // Set an HttpOnly cookie so only the connected editor can clear
    res.setHeader("Set-Cookie", [
      // 30 days
      `yt_editor=1; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`,
    ]);

    return res.redirect("/?connected=youtube");
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to exchange code" });
  }
}
