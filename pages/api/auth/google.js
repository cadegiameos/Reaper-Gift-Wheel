// pages/api/auth/google.js
export default function handler(req, res) {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";

export default function handler(req, res) {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";

  const options = {
    redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
    client_id: process.env.GOOGLE_CLIENT_ID,
    access_type: "offline", // ensures we get a refresh token
    response_type: "code",
    prompt: "consent", // always ask for consent to ensure refresh token
    scope: "https://www.googleapis.com/auth/youtube.readonly",
  };

  const params = new URLSearchParams(options);

  res.redirect(`${rootUrl}?${params.toString()}`);
}
