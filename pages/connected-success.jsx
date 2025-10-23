import React, { useEffect, useState } from "react";

export default function ConnectedSuccess() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch channel list from the API
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const res = await fetch("/api/youtube-channels");
        const data = await res.json();
        if (data?.channels) {
          setChannels(data.channels);
        }
      } catch (err) {
        console.error("Failed to fetch channels:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchChannels();
  }, []);

  // ✅ Save chosen channelId AND channelTitle
  const handleSelectChannel = async (channelId, channelTitle) => {
    setSaving(true);
    try {
      const res = await fetch("/api/set-channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, channelTitle }),
      });

      if (res.ok) {
        window.location.href = "/";
      } else {
        alert("Failed to save channel. Try again.");
        setSaving(false);
      }
    } catch (err) {
      alert("Error saving channel.");
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
      <h1 style={{ marginBottom: "10px" }}>✅ YouTube Connected!</h1>
      <p style={{ marginBottom: "30px" }}>
        Select the channel you want to use for membership detection:
      </p>

      {loading ? (
        <p>Loading channels...</p>
      ) : channels.length === 0 ? (
        <p>No channels found. Are you sure this account can manage channels?</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
            width: "80%",
            maxWidth: "900px",
          }}
        >
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => handleSelectChannel(ch.id, ch.title)}
              disabled={saving}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: "#222",
                padding: "20px",
                borderRadius: "10px",
                cursor: "pointer",
                border: "1px solid #333",
                transition: "0.2s",
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
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    marginBottom: "15px",
                  }}
                />
              )}
              <span style={{ fontSize: "1.1em", fontWeight: "bold" }}>
                {ch.title}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
