"use client";

import { useViewMode } from "@/hooks/useViewMode";

export default function KanbanToggle() {
  const { mode, toggleKanban } = useViewMode();
  const isActive = mode === "kanban";

  return (
    <button
      type="button"
      onClick={toggleKanban}
      aria-pressed={isActive}
      aria-label={isActive ? "Exit pipeline tasks" : "Enter pipeline tasks"}
      className={`focus-toggle${isActive ? " focus-toggle--active" : ""}`}
    >
      <span aria-hidden="true">▦</span>
      {isActive ? "Pipeline on" : "Pipeline"}
    </button>
  );
}
