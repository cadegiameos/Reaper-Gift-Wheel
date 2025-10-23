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

  const canvasRef = useRef(null);

  // Track scale for resizing
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

  // Load entries on mount
  useEffect(() => {
    const loadEntries = async () => {
      try {
        const res = await fetch("/api/entries");
        const data = await res.json();
        if (Array.isArray(data.entries)) setEntries(data.entries);
      } catch (e) {
        console.error("Failed to load entries:", e);
      }
    };
    loadEntries();
  }, []);

  // Check if fully connected (token + channel)
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/check-youtube", { cache: "no-store" });
        const data = await res.json();
        setYtConnected(!!data.exists);
      } catch {
        setYtConnected(false);
      }
    };
    check();
  }, []);
  // Add entry manually (disabled unless unlocked in future)
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
    } catch (e) {
      console.error("Failed to add entry:", e);
    }
  };

  // Clear entries (only if connected)
  const clearEntries = async () => {
    if (!ytConnected) return;
    try {
      await fetch("/api/entries", { method: "DELETE" });
      setEntries([]);
      setWinnerIndex(null);
      setFlash(false);
      setShowWinnerModal(false);
    } catch (e) {
      console.error("Failed to clear entries:", e);
    }
  };

  // Default spin rotation animation
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSpinning) setRotation((prev) => (prev + 0.1) % 360);
    }, 20);
    return () => clearInterval(interval);
  }, [isSpinning]);

  // Flash effect on winner
  useEffect(() => {
    if (winnerIndex !== null) {
      const flashInterval = setInterval(() => setFlash((prev) => !prev), 500);
      return () => clearInterval(flashInterval);
    }
  }, [winnerIndex]);

  // Spin logic
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

  // Poll YouTube gifts (ONLY when fully connected)
  useEffect(() => {
    if (!ytConnected) return;
    const poll = setInterval(async () => {
      try {
        const res = await fetch("/api/youtube-gifts");
        const data = await res.json();
        if (data.added > 0) {
          const entriesRes = await fetch("/api/entries");
          const updated = await entriesRes.json();
          if (Array.isArray(updated.entries)) setEntries(updated.entries);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
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
        {/* Title */}
        <h1
          className="title"
          style={{
            fontFamily: "'Tooth and Nail Regular', Arial, sans-serif",
            fontSize: "9.19em",
          }}
        >
          Lolcow Reapers Gifted Member Wheel.
        </h1>

        {/* ✅ Green tick bottom-right when fully connected */}
        {ytConnected && (
          <div
            style={{
              position: "absolute",
              bottom: "20px",
              right: "20px",
              background: "rgba(0,255,0,0.7)",
              color: "#000",
              padding: "10px 15px",
              borderRadius: "50%",
              fontSize: "1.5em",
              fontWeight: "bold",
              zIndex: 9999,
            }}
          >
            ✓
          </div>
        )}

        {/* ▶ Connect YouTube button if not connected */}
        {!ytConnected && (
          <div style={{ position: "absolute", top: "140px", right: "60px" }}>
            <button
              onClick={() => (window.location.href = "/api/auth/google")}
              style={{
                padding: "12px 28px",
                fontSize: "1.2em",
                fontWeight: "bold",
                color: "#fff",
                backgroundColor: "#FF0000", // YouTube red
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                boxShadow: "0px 4px 10px rgba(0,0,0,0.3)",
              }}
            >
              ▶︎ Connect YouTube
            </button>
            <div
              style={{
                marginTop: "10px",
                padding: "8px 12px",
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                borderRadius: "8px",
                fontSize: "0.95em",
                lineHeight: 1.2,
                backdropFilter: "blur(2px)",
                pointerEvents: "none",
                textAlign: "center",
              }}
              aria-live="polite"
            >
              Waiting for YouTube editor to connect…
            </div>
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

        {/* Wheel */}
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
            0% {
              transform: rotate(-10deg);
            }
            50% {
              transform: rotate(10deg);
            }
            100% {
              transform: rotate(-10deg);
            }
          }
          .grim-swing {
            animation: swing 1.2s ease-in-out infinite;
            transform-origin: top center;
          }

          @keyframes popBounce {
            0% {
              transform: scale(0);
              opacity: 0;
            }
            60% {
              transform: scale(1.2);
              opacity: 1;
            }
            100% {
              transform: scale(1);
            }
          }

          @keyframes textBounce {
            0% {
              transform: scale(0);
              opacity: 0;
            }
            60% {
              transform: scale(1.3);
              opacity: 1;
            }
            100% {
              transform: scale(1);
            }
          }
        `}</style>

        <footer
          style={{
            textAlign: "center",
            fontFamily: "Arial",
            marginTop: "20px",
          }}
        >
          Developed By Shkrimpi - v1.1.2
        </footer>
      </div>
    </div>
  );
}
