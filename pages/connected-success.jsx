import React, { useEffect, useState } from "react";

export default function ConnectedSuccess() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/youtube-channels");
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load channels");
        setChannels(data.channels || []);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSelect = async (ch) => {
    setSaving(true);
    try {
      const res = await fetch("/api/set-channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: ch.id, channelTitle: ch.title }),
      });

      if (res.ok) {
        window.location.href = "/";
      } else {
        alert("Failed to save channel. Try again.");
        setSaving(false);
      }
    } catch (e) {
      alert("Error saving channel: " + e.message);
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        width: "100vw",
        minHeight: "100vh",
        background: "#121212",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "60px 20px",
      }}
    >
      <h1 style={{ marginBottom: 10 }}>✅ YouTube Connected</h1>
      <p style={{ marginBottom: 30 }}>
        Select the channel to monitor for gifted memberships:
      </p>

      {loading && <p>Loading channels…</p>}
      {err && <p style={{ color: "salmon" }}>{err}</p>}

      {!loading && channels.length === 0 && (
        <div style={{ textAlign: "center", opacity: 0.9 }}>
          <p>No channels found.</p>
          <p>
            Make sure you logged in using the Brand/editor identity with the
            correct access.
          </p>
        </div>
      )}

      {channels.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            width: "90%",
            maxWidth: 960,
          }}
        >
          {channels.map((ch) => (
            <button
              key={ch.id}
              disabled={saving}
              onClick={() => handleSelect(ch)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: "#222",
                padding: 18,
                borderRadius: 10,
                cursor: "pointer",
                border: "1px solid #333",
              }}
            >
              {ch.thumbnail && (
                <img
                  src={ch.thumbnail}
                  alt={ch.title}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    marginBottom: 12,
                  }}
                />
              )}
              <span style={{ fontSize: "1.05em", fontWeight: 700 }}>
                {ch.title}
              </span>
              <small style={{ opacity: 0.7, marginTop: 6 }}>
                Owned / Editor
              </small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
