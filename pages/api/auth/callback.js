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

    // ✅ Save refresh token in Redis
    await redis.set("YT_REFRESH_TOKEN", data.refresh_token);

    // ✅ Set secure HttpOnly cookie so ONLY the editor can clear wheel later
    res.setHeader("Set-Cookie", [
      `yt_editor=1; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${
        30 * 24 * 60 * 60
      }`, // valid for 30 days
    ]);

    // ✅ Redirect editor back to main page
    return res.redirect("/?connected=youtube");
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to exchange code" });
  }
}
