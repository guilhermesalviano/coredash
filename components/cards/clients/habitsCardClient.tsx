"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { useStatus } from "@/contexts/statusContext";
import { useDayChange } from "@/hooks/useDayChange";
import MultiHabitTracker from "../habitsTracker";

export default function HabitsCardClient() {
  const [view, setView] = useState<"day" | "month">("day");
  const [completedDates, setCompletedDates] = useState<Record<string, string[]>>({});
  const { reportStatus } = useStatus();
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const fetchHabits = useCallback(async () => {
    try {
      const res = await fetch("/api/habits");
      const data = await res.json();
      setCompletedDates(data.data);
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
    setCompletedDates({
      ...completedDates,
      [todayStr]: isCompleted ? current.filter((id) => id !== habitId) : [...current, habitId],
    });
    await fetch("/api/habits", {
      method: "POST",
      body: JSON.stringify({ habit: habitId, createdAt: todayStr }),
    });
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