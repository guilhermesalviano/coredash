"use client";

import { useStatus } from "@/contexts/statusContext";

export default function SystemsStatus() {
  const { isAllLive, anyLoading } = useStatus();

  if (anyLoading) {
    return (
      <div className="flex items-center gap-2 animate-pulse">
        <span className="status-dot" style={{ background: "#9CA3AF" }} />
      </div>
    );
  }

  const statusColor = isAllLive ? "#6EE7B7" : "#F87171";

  return (
    <div className="flex items-center gap-2">
      <span className="status-dot w-4" style={{ background: statusColor }} />
    </div>
  );
}