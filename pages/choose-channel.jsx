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
        if (!res.ok) throw new Error(data.message || "Failed to load channels");
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
        window.location.href = "/connected-success"; // ✅ Redirect after saving
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
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "100px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Select a YouTube Channel to Monitor</h1>

      {loading && <p>Loading channels...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && channels.length === 0 && (
        <p>No channels found. Are you sure this Google account has a channel or editor access?</p>
      )}

      <div style={{ marginTop: "20px" }}>
        {channels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => handleSelect(ch.id, ch.title)}
            style={{
              padding: "12px 24px",
              margin: "10px",
              fontSize: "16px",
              backgroundColor: "#FF0000", // YouTube red
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            {ch.title} {ch.role === "editor" ? "(Editor Access)" : ""}
          </button>
        ))}
      </div>
    </div>
  );
}
