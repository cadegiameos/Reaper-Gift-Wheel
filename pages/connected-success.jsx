// pages/connected-success.jsx
import React, { useEffect, useState } from "react";

export default function ConnectedSuccess() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
<<<<<<< HEAD
  const [error, setError] = useState("");
=======
  const [err, setErr] = useState("");
>>>>>>> 2cb884d (final)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/youtube-channels");
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load channels");
        setChannels(data.channels || []);
<<<<<<< HEAD
      } catch (err) {
        setError(err.message);
=======
      } catch (e) {
        setErr(e.message);
>>>>>>> 2cb884d (final)
      } finally {
        setLoading(false);
      }
    })();
  }, []);

<<<<<<< HEAD
  const handleSelect = async (channelId, title) => {
=======
  const handleSelect = async (ch) => {
>>>>>>> 2cb884d (final)
    setSaving(true);
    try {
      const res = await fetch("/api/set-channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
<<<<<<< HEAD
        body: JSON.stringify({ channelId, channelTitle: title }),
      });
      if (!res.ok) throw new Error("Failed to save channel");
      window.location.href = "/";
    } catch (err) {
      alert(err.message);
=======
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
>>>>>>> 2cb884d (final)
      setSaving(false);
    }
  };

  return (
<<<<<<< HEAD
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
      {error && <p style={{ color: "salmon" }}>{error}</p>}

      {!loading && channels.length === 0 && (
        <div style={{ maxWidth: 700, textAlign: "center", opacity: 0.9 }}>
          <p>No channels found for this Google identity.</p>
          <p>
            If you need to monitor a Brand Account, make sure you selected that
            Brand identity in Google’s account chooser during sign-in.
          </p>
        </div>
      )}

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
            onClick={() => handleSelect(ch.id, ch.title)}
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
          </button>
        ))}
      </div>
=======
    <div style={{
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
    }}>
      <h1 style={{ marginBottom: 6 }}>✅ YouTube Connected</h1>
      <p style={{ marginBottom: 24 }}>Select the channel to use for gifted memberships:</p>

      {loading && <p>Loading channels…</p>}
      {err && <p style={{ color: "#ff6b6b" }}>{err}</p>}

      {!loading && channels.length === 0 && (
        <p>No channels found for this Google account.</p>
      )}

      {!loading && channels.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          width: "85%",
          maxWidth: 960,
        }}>
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
                  style={{ width: 76, height: 76, borderRadius: "50%", marginBottom: 12 }}
                />
              )}
              <span style={{ fontWeight: 600 }}>{ch.title}</span>
              <small style={{ opacity: 0.7, marginTop: 6 }}>
                {ch.source === "owned-or-managed" ? "Owned / Editor access" : ""}
              </small>
            </button>
          ))}
        </div>
      )}
>>>>>>> 2cb884d (final)
    </div>
  );
}
