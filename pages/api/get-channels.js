// pages/api/get-channels.js
// ✅ If you are now ONLY using youtube-channels.js, you can delete this file.
// ✅ If something in your frontend still calls /api/get-channels, here is a safe redirect version.

export default async function handler(req, res) {
  return res.redirect(307, '/api/youtube-channels');
}
