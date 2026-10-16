import { format, eachDayOfInterval, startOfMonth, endOfMonth, isToday } from "date-fns";
import Card from "../card";

export const HABITS = [
  { id: "wakedup", label: "Wake up early", icon: "🐓" },
  { id: "gym",     label: "Exercise",      icon: "💪" },
  { id: "study",   label: "Study",         icon: "📚" },
];

function monthGrid(date: Date) {
  return eachDayOfInterval({ start: startOfMonth(date), end: endOfMonth(date) });
}

interface Props {
  view: "day" | "month";
  onViewChange: (v: "day" | "month") => void;
  completedDates: Record<string, string[]>;
  onToggle: (habitId: string) => void;
}

export default function MultiHabitTracker({ view, onViewChange, completedDates, onToggle }: Props) {
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const monthDays = monthGrid(today);

  return (
    <Card className="w-full max-w-md p-6!">
      <div className="flex justify-between items-center mb-6!">
        <h2 className="text-xl font-bold">Habit Tracker - {format(today, "MMMM")}</h2>
        <div className="flex bg-gray-100 rounded-lg p-1!">
          {(["day", "month"] as const).map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`px-3! py-1! text-sm rounded-md transition text-gray-500 ${view === v ? "bg-white shadow-sm" : ""}`}
            >
              {v === "day" ? "Day" : "Month"}
            </button>
          ))}
        </div>
      </div>

      {view === "day" ? (
        <div className="space-y-2!">
          {HABITS.map((habit) => {
            const isDone = completedDates[todayStr]?.includes(habit.id) || false;
            return (
              <div
                key={habit.id}
                onClick={() => onToggle(habit.id)}
                className={`flex items-center justify-between rounded-xl p-2! border-2 cursor-pointer ${
                  isDone ? "border-orange-500 bg-orange-50" : "border-gray-100 hover:border-orange-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{habit.icon}</span>
                  <span className={`font-medium ${isDone ? "text-orange-900" : "text-gray-700"}`}>
                    {habit.label}
                  </span>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  isDone ? "bg-orange-500 border-orange-500" : "border-gray-300"
                }`}>
                  {isDone && (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8.5L6 11.5L13 4.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-wrap gap-6">
          {HABITS.map((habit) => (
            <div key={habit.id} className="flex gap-2">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-gray-600">{habit.label}</p>
                <div className="grid grid-cols-7 gap-1 pt-1!">
                  {monthDays.map((day) => {
                    const dateKey = format(day, "yyyy-MM-dd");
                    const isDone = completedDates[dateKey]?.includes(habit.id);
                    return (
                      <div
                        key={dateKey}
                        title={dateKey}
                        className={`rounded-sm text-[10px] flex items-center justify-center w-4 h-4 ${
                          isDone ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-400"
                        } ${isToday(day) ? "ring-2 ring-orange-300" : ""}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}