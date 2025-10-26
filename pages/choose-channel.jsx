// pages/choose-channel.jsx
import React, { useEffect, useState } from "react";

export default function ChooseChannel() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchChannels() {
      try {
        const res = await fetch("/api/youtube-channels");
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch channels");
        setChannels(data.channels || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchChannels();
  }, []);

  const handleSelect = async (channelId, channelTitle) => {
    try {
      const res = await fetch("/api/set-channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, channelTitle }),
      });
      if (res.ok) {
        window.location.href = "/"; // back to wheel
      } else {
        alert("Failed to save channel. Try again.");
      }
    } catch (err) {
      alert("Request failed: " + err.message);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 100,
        color: "#fff",
        background: "#0f0f0f",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ marginBottom: 10 }}>Select a YouTube Channel to Monitor</h1>

      <div style={{ maxWidth: 720, textAlign: "center", opacity: 0.9 }}>
        <p style={{ margin: "6px 0" }}>
          If you have <b>editor access</b> to a channel (Brand Account), make sure you
          choose that channel’s identity in Google’s account picker during sign in.
        </p>
        <p style={{ margin: "6px 0" }}>
          Tip: If it’s not listed here,{" "}
          <a
            href="/api/auth/google"
            style={{ color: "#ff4d4d", textDecoration: "underline" }}
          >
            reconnect
          </a>{" "}
          and pick the Brand Account in the Google prompt.
        </p>
      </div>

      {loading && <p style={{ marginTop: 20 }}>Loading channels…</p>}
      {error && <p style={{ color: "salmon", marginTop: 20 }}>{error}</p>}

      <div
        style={{
          marginTop: 28,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          width: "90%",
          maxWidth: 900,
        }}
      >
        {channels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => handleSelect(ch.id, ch.title)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: 10,
              padding: 18,
              cursor: "pointer",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.border = "1px solid #ff0000")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.border = "1px solid #333")
            }
          >
            {ch.thumbnail && (
              <img
                src={ch.thumbnail}
                alt={ch.title}
                style={{ width: 80, height: 80, borderRadius: "50%", marginBottom: 12 }}
              />
            )}
            <span style={{ fontWeight: "bold" }}>{ch.title}</span>
          </button>
        ))}
      </div>

      {!loading && channels.length === 0 && !error && (
        <p style={{ marginTop: 24, opacity: 0.9 }}>
          No channels found for the selected identity.
        </p>
      )}
    </div>
  );
}
