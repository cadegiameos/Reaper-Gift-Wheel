// pages/index.jsx
import React, { useState, useEffect, useRef } from "react";

export default function Home() {
  const [entries, setEntries] = useState([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winnerIndex, setWinnerIndex] = useState(null);
  const [flash, setFlash] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [ytConnected, setYtConnected] = useState(false);
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

  // connection check
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/check-youtube");
        const data = await res.json();
        setYtConnected(!!data.exists);
        setChannelTitle(data.channelTitle || null);
      } catch {
        setYtConnected(false);
        setChannelTitle(null);
      }
    })();
  }, []);

<<<<<<< HEAD
  // add entry (kept but inputs disabled in UI)
=======
  // add entry (manual - disabled in UI)
>>>>>>> 2cb884d (final)
  const addEntry = async () => {
    const trimmed = name.trim();
    if (!trimmed || amount < 1) return;
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, amount: Number(amount) }),
      });
      const data = await res.json();
      if (Array.isArray(data.entries)) {
        setEntries(data.entries);
        setName("");
        setAmount(1);
      }
    } catch {}
  };

<<<<<<< HEAD
  // clear entries (editor only)
=======
  // clear entries
>>>>>>> 2cb884d (final)
  const clearEntries = async () => {
    try {
      const res = await fetch("/api/entries", { method: "DELETE" });
      if (res.ok) {
        setEntries([]);
        setWinnerIndex(null);
        setFlash(false);
        setShowWinnerModal(false);
      } else {
        const j = await res.json();
        alert(j.message || "Not allowed");
      }
    } catch {}
  };

  // idle slow rotation
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSpinning) setRotation((prev) => (prev + 0.1) % 360);
    }, 20);
    return () => clearInterval(interval);
  }, [isSpinning]);

<<<<<<< HEAD
  // winner flash
=======
  // winner flashing
>>>>>>> 2cb884d (final)
  useEffect(() => {
    if (winnerIndex !== null) {
      const flashInterval = setInterval(() => setFlash((prev) => !prev), 500);
      return () => clearInterval(flashInterval);
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

    const anglePerSlice = (2 * Math.PI) / entries.length;

    entries.forEach((entry, i) => {
      const startAngle = i * anglePerSlice;
      const endAngle = startAngle + anglePerSlice;

      ctx.beginPath();
      ctx.moveTo(radius, radius);
      ctx.arc(radius, radius, radius, startAngle, endAngle);
      ctx.fillStyle = `hsl(${(i * 360) / entries.length}, 70%, 85%)`;
      ctx.fill();
      ctx.closePath();

      if (winnerIndex === i && flash) {
        ctx.beginPath();
        ctx.moveTo(radius, radius);
        ctx.arc(radius, radius, radius, startAngle, endAngle);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.closePath();
      }

      ctx.save();
      ctx.translate(radius, radius);
      ctx.rotate(startAngle + anglePerSlice / 2);

      const sliceWidth = radius * anglePerSlice;
      let fontSize = Math.min(40, sliceWidth / entry.length);
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

<<<<<<< HEAD
  // poll chat for gifted messages (only when fully connected)
=======
  // poll for gifts
>>>>>>> 2cb884d (final)
  useEffect(() => {
    if (!ytConnected) return;
    const poll = setInterval(async () => {
      try {
        const res = await fetch("/api/youtube-gifts");
        const data = await res.json();
        if (data.added > 0) {
          const res2 = await fetch("/api/entries");
          const updated = await res2.json();
          if (Array.isArray(updated.entries)) setEntries(updated.entries);
        }
      } catch {}
    }, 10000);
    return () => clearInterval(poll);
  }, [ytConnected]);

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

<<<<<<< HEAD
        {/* Connect button (top-right under heading) */}
=======
        {/* Connect button */}
>>>>>>> 2cb884d (final)
        {!ytConnected && (
          <div style={{ position: "absolute", top: "140px", right: "60px" }}>
            <button
              onClick={() => (window.location.href = "/api/auth/google")}
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
            >
              ▶︎ Connect YouTube
            </button>
          </div>
        )}

<<<<<<< HEAD
        {/* Green tick + channel name (moved up a bit) */}
=======
        {/* Connected badge - slightly higher (was 48px, now 90px) */}
>>>>>>> 2cb884d (final)
        {ytConnected && (
          <div
            style={{
              position: "absolute",
<<<<<<< HEAD
              bottom: "48px",
=======
              bottom: "90px",
>>>>>>> 2cb884d (final)
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

        {/* Spin button */}
        <div className="controls" style={{ justifyContent: "center" }}>
          <button
            className="spin-btn"
            onClick={spinWheel}
            style={{ padding: "12px 24px", fontSize: "1.15em" }}
          >
            Spin
          </button>
        </div>

        {/* Manual entry (visible but disabled) */}
        <div
          className="manual-entry"
          style={{ flexDirection: "column", alignItems: "center" }}
        >
          <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
            <input
              type="text"
              placeholder="Enter name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addEntry()}
              disabled
            />
            <input
              type="number"
              min="1"
              max="20"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value))}
              style={{ width: "50px" }}
              disabled
            />
            <button onClick={addEntry} disabled>
              Add Entry
            </button>
          </div>

          <button
            className="clear-btn"
            onClick={clearEntries}
            style={{ marginTop: "10px" }}
            disabled={!ytConnected}
            title={
              ytConnected
                ? "Clear all entries"
                : "Only the connected YouTube editor can clear the wheel"
            }
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

        <footer
          style={{
            textAlign: "center",
            fontFamily: "Arial",
            marginTop: "20px",
          }}
        >
          Developed By Shkrimpi - v1.1.2 - FUCK OFF RASTOV
        </footer>
      </div>
    </div>
  );
}
