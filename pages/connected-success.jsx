// pages/connected-success.jsx
import React, { useEffect, useState } from "react";

export default function ConnectedSuccess() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/youtube-channels");
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load channels");
        setChannels(data.channels || []);
      } catch (e) {
        setError(e.message);
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
      if (!res.ok) throw new Error("Failed to save channel");
      window.location.href = "/";
    } catch (e) {
      alert(e.message);
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#121212",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "20px",
      }}
    >
      <h1 style={{ marginBottom: 6 }}>✅ YouTube Connected</h1>
      <p style={{ marginBottom: 24 }}>
        Select the channel to use for gifted memberships:
      </p>

      {loading && <p>Loading channels…</p>}
      {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}

      {!loading && channels.length === 0 && (
        <p>No channels found for this Google account or Brand identity.</p>
      )}

      {!loading && channels.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            width: "85%",
            maxWidth: 960,
          }}
        >
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => handleSelect(ch)}
              disabled={saving}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: "#1f1f1f",
                padding: 18,
                borderRadius: 12,
                cursor: "pointer",
                border: "1px solid #2a2a2a",
              }}
            >
              {ch.thumbnail && (
                <img
                  src={ch.thumbnail}
                  alt={ch.title}
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: "50%",
                    marginBottom: 12,
                  }}
                />
              )}
              <span style={{ fontWeight: 600 }}>{ch.title}</span>
              <small style={{ opacity: 0.7, marginTop: 6 }}>
                Owned / Editor Access
              </small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
