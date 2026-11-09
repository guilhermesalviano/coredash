"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { useStatusActions } from "@/contexts/statusContext";
import { useDayChange } from "@/hooks/useDayChange";
import MultiHabitTracker from "../habitsTracker";

export default function HabitsCardClient() {
  const [view, setView] = useState<"day" | "month">("day");
  const [completedDates, setCompletedDates] = useState<Record<string, string[]>>({});
  const { reportStatus } = useStatusActions();
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const fetchHabits = useCallback(async () => {
    try {
      const res = await fetch("/api/habits");
      if (!res.ok) throw new Error("habits");
      const data = await res.json();
      setCompletedDates(data.data ?? {});
      reportStatus("habit", "success");
    } catch {
      reportStatus("habit", "error");
    }
  }, []);

  useDayChange(() => fetchHabits());
  useEffect(() => { fetchHabits(); }, []);

  const toggleHabit = async (habitId: string) => {
    const current = completedDates[todayStr] || [];
    const isCompleted = current.includes(habitId);
    const previous = completedDates;
    setCompletedDates({
      ...completedDates,
      [todayStr]: isCompleted ? current.filter((id) => id !== habitId) : [...current, habitId],
    });
    try {
      const response = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habit: habitId, createdAt: todayStr }),
      });
      if (!response.ok) throw new Error("habit");
    } catch {
      setCompletedDates(previous);
    }
  };

  return (
    <MultiHabitTracker
      view={view}
      onViewChange={setView}
      completedDates={completedDates}
      onToggle={toggleHabit}
    />
  );
}