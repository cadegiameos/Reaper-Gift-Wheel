export default async function handler(req, res) {
  // Example expected payload:
  // { "gifter": "John", "giftCount": 5 }
  if (req.method === "POST") {
    console.log("Received gift event:", req.body);
    res.status(200).json({ ok: true });
  } else {
    res.status(405).end();
  }
}
