"use client";

import { useStatus } from "@/contexts/statusContext";

export default function ActionLoader() {
  const { anyActionLoading } = useStatus();

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 200,
        width: 28,
        height: 28,
        opacity: anyActionLoading ? 1 : 0,
        transition: "opacity 0.25s ease",
        pointerEvents: "none",
      }}
    >
      {/* Track ring */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: "2.5px solid var(--border)",
        }}
      />
      {/* Spinning arc — pure CSS, GPU composited */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: "2.5px solid transparent",
          borderTopColor: "var(--accent)",
          animation: anyActionLoading ? "action-spin 0.7s linear infinite" : "none",
        }}
      />
      <style>{`
        @keyframes action-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
