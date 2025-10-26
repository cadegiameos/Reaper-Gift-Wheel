// pages/index.jsx
import React, { useState, useEffect, useRef } from "react";

export default function Home() {
  const [entries, setEntries] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winnerIndex, setWinnerIndex] = useState(null);
  const [flash, setFlash] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [channelTitle, setChannelTitle] = useState(null);

  const canvasRef = useRef(null);

  // scale to window
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const handleResize = () => {
      const scaleX = window.innerWidth / 1920;
      const scaleY = window.innerHeight / 1080;
      setScale(Math.min(scaleX, scaleY));
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // load entries
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/entries");
        const data = await res.json();
        if (Array.isArray(data.entries)) setEntries(data.entries);
      } catch {}
    })();
  }, []);

  // check configured + channel title
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/check-youtube");
        const data = await res.json();
        setConfigured(!!data.configured);
        setChannelTitle(data.channelTitle || null);
      } catch {
        setConfigured(false);
        setChannelTitle(null);
      }
    })();
  }, []);

  // idle rotation
  useEffect(() => {
    const t = setInterval(() => {
      if (!isSpinning) setRotation((r) => (r + 0.1) % 360);
    }, 20);
    return () => clearInterval(t);
  }, [isSpinning]);

  // winner flash
  useEffect(() => {
    if (winnerIndex !== null) {
      const t = setInterval(() => setFlash((f) => !f), 500);
      return () => clearInterval(t);
    }
  }, [winnerIndex]);

  // draw wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const size = canvas.width;
    const radius = size / 2;
    ctx.clearRect(0, 0, size, size);

    if (entries.length === 0) {
      ctx.fillStyle = "white";
      ctx.font = "20px Arial";
      ctx.textAlign = "center";
      ctx.fillText("No entries yet", radius, radius);
      return;
    }

    const anglePer = (2 * Math.PI) / entries.length;

    entries.forEach((entry, i) => {
      const start = i * anglePer;
      const end = start + anglePer;

      ctx.beginPath();
      ctx.moveTo(radius, radius);
      ctx.arc(radius, radius, radius, start, end);
      ctx.fillStyle = `hsl(${(i * 360) / entries.length}, 70%, 85%)`;
      ctx.fill();
      ctx.closePath();

      if (winnerIndex === i && flash) {
        ctx.beginPath();
        ctx.moveTo(radius, radius);
        ctx.arc(radius, radius, radius, start, end);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.closePath();
      }

      ctx.save();
      ctx.translate(radius, radius);
      ctx.rotate(start + anglePer / 2);

      const sliceWidth = radius * anglePer;
      let fontSize = Math.min(40, sliceWidth / (entry.length || 1));
      fontSize = Math.max(fontSize, 10);
      ctx.font = `bold ${fontSize}px Arial`;

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#000";

      const textRadius = radius * 0.6;
      ctx.fillText(entry, textRadius, 0);

      ctx.restore();
    });
  }, [entries, rotation, winnerIndex, flash]);

  const spinWheel = () => {
    if (entries.length === 0) return alert("No entries to spin!");
    setIsSpinning(true);
    const winner = Math.floor(Math.random() * entries.length);
    setWinnerIndex(null);
    setShowWinnerModal(false);

    const spinDegrees = 3600 + winner * (360 / entries.length);
    setRotation(spinDegrees);

    setTimeout(() => {
      setIsSpinning(false);
      setWinnerIndex(winner);
      setFlash(true);
      setShowWinnerModal(true);
    }, 5000);
  };

  // poll chat for gifted messages (only when configured)
  useEffect(() => {
    if (!configured) return;
    const poll = setInterval(async () => {
      try {
        const res = await fetch("/api/youtube-gifts");
        const data = await res.json();
        if (data.added > 0) {
          const r2 = await fetch("/api/entries");
          const updated = await r2.json();
          if (Array.isArray(updated.entries)) setEntries(updated.entries);
        }
      } catch {}
    }, 10000);
    return () => clearInterval(poll);
  }, [configured]);

  const clearEntries = async () => {
    try {
      const res = await fetch("/api/entries", { method: "DELETE" });
      if (res.ok) {
        setEntries([]);
        setWinnerIndex(null);
        setFlash(false);
        setShowWinnerModal(false);
      }
    } catch {}
  };

  return (
    <div
      className="scale-wrapper"
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: `translate(-50%, -50%) scale(${scale})`,
        width: "1920px",
        height: "1080px",
      }}
    >
      <div className="container">
        <h1
          className="title"
          style={{
            fontFamily: "'Tooth and Nail Regular', Arial, sans-serif",
            fontSize: "9.19em",
          }}
        >
          Lolcow Reapers Gifted Member Wheel.
        </h1>

        {!configured && (
          <div style={{ position: "absolute", top: "140px", right: "60px" }}>
            <button
              onClick={() => (window.location.href = "/setup")}
              style={{
                padding: "12px 28px",
                fontSize: "1.2em",
                fontWeight: "bold",
                color: "#fff",
                backgroundColor: "#FF0000",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                boxShadow: "0px 4px 10px rgba(0,0,0,0.3)",
              }}
              title="Owner must connect once"
            >
              ▶︎ Owner Setup
            </button>
          </div>
        )}

        {configured && (
          <div
            style={{
              position: "absolute",
              bottom: "90px",
              right: "24px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(0,0,0,0.5)",
              color: "#fff",
              padding: "10px 14px",
              borderRadius: "999px",
              zIndex: 9999,
            }}
            title={channelTitle ? `Connected: ${channelTitle}` : "Connected"}
          >
            <div
              style={{
                background: "rgba(0,255,0,0.8)",
                color: "#000",
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
              }}
            >
              ✓
            </div>
            <span style={{ fontSize: "0.95em", fontWeight: 600 }}>
              {channelTitle || "Connected"}
            </span>
          </div>
        )}

        {/* Left-side text */}
        <div
          className="subtitle"
          style={{
            position: "absolute",
            left: "13.5%",
            top: "45%",
            transform: "translateY(-50%)",
            whiteSpace: "pre-line",
            textAlign: "center",
            lineHeight: "1.2",
            fontFamily: "'Tooth and Nail Regular', Arial, sans-serif",
            fontSize: "5.25em",
            color: "white",
            textShadow: "1px 1px 4px rgba(0,0,0,0.7)",
          }}
        >
          1 GIFTED{"\n"}={"\n"}1 Entry
        </div>

        {/* Right-side counter */}
        <div
          className="subtitle"
          style={{
            position: "absolute",
            right: "7.5%",
            top: "45%",
            transform: "translateY(-50%)",
            whiteSpace: "pre-line",
            textAlign: "center",
            lineHeight: "1.2",
            fontFamily: "'Tooth and Nail Regular', Arial, sans-serif",
            fontSize: "5.25em",
            color: "white",
            textShadow: "1px 1px 4px rgba(0,0,0,0.7)",
          }}
        >
          GIFTED ENTRIES:{"\n"}
          {entries.length}
        </div>

        <div className="wheel-container">
          <canvas
            ref={canvasRef}
            width={600}
            height={600}
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? "transform 5s ease-out" : "none",
              borderRadius: "50%",
            }}
          />
        </div>

        <div className="controls" style={{ justifyContent: "center" }}>
          <button
            className="spin-btn"
            onClick={spinWheel}
            style={{ padding: "12px 24px", fontSize: "1.15em" }}
          >
            Spin
          </button>
        </div>

        <div className="manual-entry" style={{ flexDirection: "column", alignItems: "center" }}>
          <button
            className="clear-btn"
            onClick={clearEntries}
            style={{ marginTop: "10px" }}
            title="Clear all entries"
          >
            Clear Wheel
          </button>
        </div>

        {/* Winner Modal */}
        {showWinnerModal && winnerIndex !== null && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0,0,0,0.7)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
            }}
          >
            <div
              style={{
                backgroundColor: "#fff",
                padding: "43px 72px",
                borderRadius: "21px",
                textAlign: "center",
                boxShadow: "0 0 30px rgba(0,0,0,0.5)",
                transform: "scale(0)",
                animation: "popBounce 0.5s forwards",
              }}
            >
              <img
                src="/grimreaper.png"
                alt="Grim Reaper"
                className="grim-swing"
                style={{ width: "120px", marginBottom: "20px" }}
              />
              <h2 style={{ fontSize: "2em" }}>💀 Winner! 💀</h2>
              <p
                style={{
                  fontSize: "3.6em",
                  margin: "30px 0",
                  fontFamily: "'Tooth and Nail Regular', Arial, sans-serif",
                  fontWeight: "bold",
                  animation: "textBounce 0.6s ease forwards",
                }}
              >
                {entries[winnerIndex]}
              </p>
              <button
                onClick={() => setShowWinnerModal(false)}
                style={{
                  padding: "14px 28px",
                  fontSize: "1.4em",
                  borderRadius: "11px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes swing {
            0% { transform: rotate(-10deg); }
            50% { transform: rotate(10deg); }
            100% { transform: rotate(-10deg); }
          }
          .grim-swing {
            animation: swing 1.2s ease-in-out infinite;
            transform-origin: top center;
          }
          @keyframes popBounce {
            0% { transform: scale(0); opacity: 0; }
            60% { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(1); }
          }
          @keyframes textBounce {
            0% { transform: scale(0); opacity: 0; }
            60% { transform: scale(1.3); opacity: 1; }
            100% { transform: scale(1); }
          }
        `}</style>

        <footer style={{ textAlign: "center", fontFamily: "Arial", marginTop: "20px" }}>
          Developed By Shkrimpi - v1.2.0 (Owner setup flow)
        </footer>
      </div>
    </div>
  );
}
