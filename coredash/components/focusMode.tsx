"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDayChange } from "@/hooks/useDayChange";
import { useDashboard } from "@/hooks/useDashboard";
import { fetchJson } from "@/lib/api-client";
import type { TodoItem } from "@/features/todos/types";
import type { CalendarInternalAPIResponse } from "@/types/calendar";
import type { TodoState, Priority } from "@/types/task";
import { selectFocusView } from "@/features/focus/select-focus";
import type { FocusCalendarEvent } from "@/features/focus/types";
import Card from "@/components/card";

const PRIORITIES: Priority[] = ["high", "medium", "low"];

function toTodoState(todo: TodoItem): TodoState {
  const priority = PRIORITIES.includes(todo.priority as Priority) ? todo.priority as Priority : "low";
  return { id: todo.id, title: todo.title, checked: todo.checked, priority };
}

function formatEventTime(start: string, end: string): string {
  if (start === "All day") return "All day";
  return end ? `${start} – ${end}` : start;
}

function FocusTodo({ todo, disabled, onToggle }: { todo: TodoState; disabled: boolean; onToggle: (id: number) => void }) {
  return (
    <button
      type="button"
      className="focus-todo"
      onClick={() => onToggle(todo.id)}
      disabled={disabled}
      aria-label={`Complete task: ${todo.title}`}
    >
      <span className="focus-todo-check" aria-hidden="true" />
      <span className="focus-todo-title">{todo.title}</span>
      <span className={`focus-priority focus-priority--${todo.priority}`} aria-label={`${todo.priority} priority`} />
    </button>
  );
}

export default function FocusMode() {
  const { weather } = useDashboard();
  const [calendar, setCalendar] = useState<CalendarInternalAPIResponse | null>(null);
  const [todos, setTodos] = useState<TodoState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyTodo, setBusyTodo] = useState<number | null>(null);
  const [now, setNow] = useState(() => new Date());

  const fetchFocusData = useCallback(async () => {
    setIsLoading(true);
    const [calendarResult, todoResult] = await Promise.allSettled([
      fetchJson<CalendarInternalAPIResponse>("/api/calendar"),
      fetchJson<TodoItem[]>("/api/todo?onlyUnchecked=true"),
    ]);

    let hasError = false;
    if (calendarResult.status === "fulfilled") setCalendar(calendarResult.value);
    else hasError = true;
    if (todoResult.status === "fulfilled") setTodos(todoResult.value.map(toTodoState));
    else hasError = true;

    setError(hasError);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void fetchFocusData();
  }, [fetchFocusData]);

  useDayChange(() => {
    setNow(new Date());
    void fetchFocusData();
  });

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30_000);
    const refreshOnVisible = () => {
      if (document.visibilityState === "visible") {
        setNow(new Date());
        void fetchFocusData();
      }
    };
    document.addEventListener("visibilitychange", refreshOnVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshOnVisible);
    };
  }, [fetchFocusData]);

  const view = useMemo(() => selectFocusView(
    (calendar?.todayEvents ?? []) as FocusCalendarEvent[],
    todos,
    weather.data,
    now,
  ), [calendar, todos, weather.data, now]);

  const toggleTodo = async (id: number) => {
    if (busyTodo !== null) return;
    const previous = todos;
    setBusyTodo(id);
    setTodos((current) => current.filter((todo) => todo.id !== id));

    try {
      await fetchJson<null>("/api/todo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, checked: 1 }),
      });
    } catch {
      setTodos(previous);
      setError(true);
    } finally {
      setBusyTodo(null);
    }
  };

  const weatherUnavailable = weather.status === "error" || !weather.data;

  return (
    <main className="focus-shell">
      <div className="focus-heading">
        <div>
          <p className="focus-eyebrow">Focus mode</p>
          <h1>Just what matters now.</h1>
        </div>
        <div className="focus-date">
          {now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </div>
      </div>

      {(isLoading || error) && (
        <p className="focus-status" role={error ? "alert" : undefined}>
          {isLoading ? "Updating your focus view…" : "Some information could not be updated."}
        </p>
      )}

      <div className="focus-grid">
        <Card className="focus-card focus-card--primary">
          <p className="focus-card-label">{view.calendar.isCurrent ? "Right now" : "Up next"}</p>
          {view.calendar.event ? (
            <div className="focus-event">
              <span className="focus-event-time">
                {formatEventTime(view.calendar.event.start, view.calendar.event.end)}
              </span>
              <h2>{view.calendar.event.title}</h2>
              <p>{view.calendar.isCurrent ? "You are in this time block." : "This is the next thing on your calendar."}</p>
            </div>
          ) : (
            <div className="focus-empty">
              <h2>No upcoming events</h2>
              <p>You have room to choose what matters next.</p>
            </div>
          )}
        </Card>

        <Card className="focus-card">
          <div className="focus-card-header">
            <p className="focus-card-label">Next tasks</p>
            <span className="focus-count">{todos.length}</span>
          </div>
          {view.todos.length > 0 ? (
            <div className="focus-todos">
              {view.todos.map((todo) => (
                <FocusTodo key={todo.id} todo={todo} disabled={busyTodo !== null} onToggle={toggleTodo} />
              ))}
            </div>
          ) : (
            <div className="focus-empty focus-empty--small">
              <h2>All clear</h2>
              <p>No unfinished tasks for today.</p>
            </div>
          )}
        </Card>

        <Card className="focus-card focus-weather-card">
          <p className="focus-card-label">Outside</p>
          {weatherUnavailable ? (
            <p className="focus-muted">Weather is unavailable right now.</p>
          ) : (
            <>
              <div className="focus-weather-main">
                <span className="focus-weather-icon" aria-hidden="true">{view.weather?.icon}</span>
                <div>
                  <strong>{view.weather?.temp}°</strong>
                  <span>{view.weather?.condition}</span>
                </div>
              </div>
              <p className="focus-weather-feels">Feels like {view.weather?.feels}° in {view.weather?.city}</p>
              {view.weatherAlert && (
                <p className="focus-weather-alert">🌧️ Rain expected around {view.weatherAlert.time}</p>
              )}
            </>
          )}
        </Card>
      </div>
    </main>
  );
}
