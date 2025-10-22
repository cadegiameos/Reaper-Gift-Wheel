let entries = [];

export default function handler(req, res) {
  if (req.method === "GET") {
    res.status(200).json({ entries });
  } else if (req.method === "POST") {
    const { name, amount } = req.body;
    for (let i = 0; i < amount; i++) entries.push(name);
    res.status(200).json({ entries });
  } else if (req.method === "DELETE") {
    entries = [];
    res.status(200).json({ entries });
  } else {
    res.status(405).end();
  }
}
