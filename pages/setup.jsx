// pages/setup.jsx
import React from "react";

export default function Setup() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      background: "#0f0f10",
      color: "#fff",
      gap: 16,
      textAlign: "center",
      padding: 24
    }}>
      <h1>Owner Setup</h1>
      <p>Channel owner: connect once, then editors can use the wheel without logging in.</p>
      <button
        onClick={() => (window.location.href = "/api/auth/google")}
        style={{
          padding: "12px 22px",
          fontSize: "1.1rem",
          fontWeight: 700,
          background: "#ff0000",
          color: "#fff",
          border: "none",
          borderRadius: 10,
          cursor: "pointer"
        }}
      >
        Connect YouTube (Owner Setup)
      </button>
      <p style={{opacity:.8, maxWidth: 640}}>
        If your channel is a Brand Account, select that Brand identity in Google’s account chooser during sign-in.
      </p>
    </div>
  );
}
