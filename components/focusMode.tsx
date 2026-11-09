"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDayChange } from "@/hooks/useDayChange";
import { useDashboard } from "@/hooks/useDashboard";
import { retrySlice } from "@/lib/dashboardStore";
import { useStatus } from "@/contexts/statusContext";
import { fetchJson } from "@/lib/api-client";
import type { TodoItem } from "@/features/todos/types";
import type { CalendarInternalAPIResponse } from "@/types/calendar";
import type { TodoState, Priority } from "@/types/task";
import { selectFocusView } from "@/features/focus/select-focus";
import { FOCUS_HEADLINES } from "@/features/focus/headlines";
import type { FocusCalendarEvent } from "@/features/focus/types";
import Card from "@/components/card";
import handleFireConfetti from "@/components/confetti";
import { fireTaskRewardConfetti, playTaskCompletionChime } from "@/features/focus/rewards";
import { useLocale } from "@/contexts/localeContext";
import { weatherCondition } from "@/lib/i18n";

const PRIORITIES: Priority[] = ["high", "medium", "low"];

function toTodoState(todo: TodoItem): TodoState {
  const priority = PRIORITIES.includes(todo.priority as Priority) ? todo.priority as Priority : "low";
  return { id: todo.id, title: todo.title, checked: todo.checked, priority, type: todo.type };
}

function formatEventTime(start: string, end: string, allDay: string): string {
  if (start === "All day" || start === "Dia todo") return allDay;
  return end ? `${start} – ${end}` : start;
}

function FocusTodo({
  todo,
  disabled,
  isCompleting,
  onToggle,
  completeLabel,
  priorityLabel,
}: {
  todo: TodoState;
  disabled: boolean;
  isCompleting: boolean;
  onToggle: (id: number, e: React.MouseEvent<HTMLButtonElement>) => void;
  completeLabel: string;
  priorityLabel: string;
}) {
  return (
    <button
      type="button"
      className={`focus-todo ${isCompleting ? "focus-todo--completed" : ""}`}
      onClick={(e) => onToggle(todo.id, e)}
      disabled={disabled}
      aria-label={completeLabel}
    >
      <span className={`focus-todo-check ${isCompleting ? "focus-todo-check--checked" : ""}`} aria-hidden="true">
        {isCompleting && "✓"}
      </span>
      <span className={`focus-todo-title ${isCompleting ? "focus-todo-title--completed" : ""}`}>
        {todo.title}
      </span>
      <span className={`focus-priority focus-priority--${todo.priority}`} aria-label={priorityLabel} />
    </button>
  );
}

export default function FocusMode() {
  const { weather } = useDashboard();
  const { locale, t } = useLocale();
  const { reportStatus } = useStatus();
  const [calendar, setCalendar] = useState<CalendarInternalAPIResponse | null>(null);
  const [todos, setTodos] = useState<TodoState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyTodo, setBusyTodo] = useState<number | null>(null);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [rewardMessage, setRewardMessage] = useState<string | null>(null);
  const [completedStreak, setCompletedStreak] = useState(0);
  const [now, setNow] = useState(() => new Date());

  const fetchFocusData = useCallback(async () => {
    setIsLoading(true);
    reportStatus("calendar", "loading");
    reportStatus("todo", "loading");
    const [calendarResult, todoResult] = await Promise.allSettled([
      fetchJson<CalendarInternalAPIResponse>("/api/calendar"),
      fetchJson<TodoItem[]>("/api/todo?onlyUnchecked=true&type=reminder"),
    ]);

    let hasError = false;
    if (calendarResult.status === "fulfilled") {
      setCalendar(calendarResult.value);
      reportStatus("calendar", "success");
    } else {
      reportStatus("calendar", "error");
      hasError = true;
    }
    if (todoResult.status === "fulfilled") {
      setTodos(
        todoResult.value
          .filter((t) => t.type === "reminder")
          .map(toTodoState),
      );
      reportStatus("todo", "success");
    } else {
      reportStatus("todo", "error");
      hasError = true;
    }

    setError(hasError);
    setIsLoading(false);
  }, [reportStatus]);

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
    (calendar?.nextDayEvents ?? []) as FocusCalendarEvent[],
    todos,
    weather.data,
    now,
  ), [calendar, todos, weather.data, now]);

  const toggleTodo = async (id: number, e?: React.MouseEvent<HTMLButtonElement>) => {
    if (busyTodo !== null || completingId !== null) return;

    // Immediate sensory dopamine reward
    playTaskCompletionChime();

    let origin: { x: number; y: number } | undefined;
    if (e && typeof window !== "undefined") {
      origin = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    }

    const isLastTask = todos.length === 1;

    if (isLastTask) {
      handleFireConfetti();
      setRewardMessage(t("reward.allClear"));
    } else {
      fireTaskRewardConfetti(origin);
      setRewardMessage(t(`reward.${Math.floor(Math.random() * 8)}`));
    }

    setCompletingId(id);
    setCompletedStreak((prev) => prev + 1);
    setBusyTodo(id);

    // Give user 300ms to enjoy the visual checkmark pop and sound
    await new Promise((resolve) => setTimeout(resolve, 300));

    const previous = todos;
    setTodos((current) => current.filter((todo) => todo.id !== id));
    setCompletingId(null);

    try {
      await fetchJson<null>("/api/todo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, checked: 1 }),
      });
    } catch {
      setTodos(previous);
      setError(true);
      setCompletedStreak((prev) => Math.max(0, prev - 1));
    } finally {
      setBusyTodo(null);
    }
  };

  const weatherUnavailable = weather.status === "error" || !weather.data;
  const headline = t(`headline.${Math.floor(now.getTime() / 60_000) % FOCUS_HEADLINES.length}`);

  return (
    <main className="focus-shell">
      <div className="focus-heading">
        <div>
          <p className="focus-eyebrow">{t("focusEyebrow")}</p>
          <h1>{headline}</h1>
        </div>
        <div className="focus-date">
          {now.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}
        </div>
      </div>

      {(isLoading || error) && (
        <div className="focus-status" role={error ? "alert" : undefined}>
          {isLoading ? t("focusUpdating") : t("focusError")}
          {error && !isLoading ? (
            <button type="button" className="card-retry" onClick={() => { void fetchFocusData(); }}>{t("retry")}</button>
          ) : null}
        </div>
      )}

      <div className="focus-grid">
        <Card className="focus-card focus-card--primary">
          {view.calendar.isTomorrow ? (
            <>
              <div className="focus-card-header">
                <p className="focus-card-label">{t("focusTomorrow")}</p>
                {view.calendar.tomorrowEvents.length > 0 && (
                  <span className="focus-count">{view.calendar.tomorrowEvents.length}</span>
                )}
              </div>
              {view.calendar.tomorrowEvents.length > 0 ? (
                <div className="focus-calendar-list">
                  {view.calendar.tomorrowEvents.map((event) => (
                    <div
                      key={event.id}
                      className="focus-calendar-item"
                      style={{ borderLeftColor: event.color || "var(--accent)" }}
                    >
                      <span className="focus-calendar-item-time">
                        {formatEventTime(event.start, event.end, t("allDay"))}
                      </span>
                      <span className="focus-calendar-item-title">{event.title}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="focus-empty">
                  <h2>{t("focusNoTomorrow")}</h2>
                  <p>{t("focusTomorrowClear")}</p>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="focus-card-label">{view.calendar.isCurrent ? t("focusNow") : t("focusUpNext")}</p>
              {view.calendar.event ? (
                <div className="focus-event">
                  <span className="focus-event-time">
                    {formatEventTime(view.calendar.event.start, view.calendar.event.end, t("allDay"))}
                  </span>
                  <h2>{view.calendar.event.title}</h2>
                  <p>{view.calendar.isCurrent ? t("focusInBlock") : t("focusNextThing")}</p>
                </div>
              ) : (
                <div className="focus-empty">
                  <h2>{t("focusNoEvents")}</h2>
                  <p>{t("focusRoom")}</p>
                </div>
              )}
            </>
          )}
        </Card>

        <Card className="focus-card">
          <div className="focus-card-header">
            <div className="flex items-center gap-2">
              <p className="focus-card-label">{t("focusReminders")}</p>
              {completedStreak > 0 && (
                <span className="focus-reward-streak" title={t("focusStreak", { count: completedStreak })}>
                  🔥 {t("focusDone", { count: completedStreak })}
                </span>
              )}
            </div>
            <span className="focus-count">{todos.length}</span>
          </div>

          {rewardMessage && (
            <div className="focus-reward-banner" role="status" aria-live="polite">
              <span>{rewardMessage}</span>
            </div>
          )}

          {view.todos.length > 0 ? (
            <div className="focus-todos">
              {view.todos.map((todo) => (
                <FocusTodo
                  key={todo.id}
                  todo={todo}
                  disabled={busyTodo !== null || completingId !== null}
                  isCompleting={completingId === todo.id}
                  completeLabel={t("completeReminder", { title: todo.title })}
                  priorityLabel={t("priorityLabel", { priority: todo.priority })}
                  onToggle={toggleTodo}
                />
              ))}
            </div>
          ) : (
            <div className="focus-empty focus-empty--small">
              <h2>{t("focusAllClear")}</h2>
              <p>{t("focusNoUnfinished")}</p>
            </div>
          )}
        </Card>

        <Card className="focus-card focus-weather-card">
          <p className="focus-card-label">{t("focusOutside")}</p>
          {weatherUnavailable ? (
            <div>
              <p className="focus-muted">{t("weatherUnavailable")}</p>
              <button type="button" className="card-retry" onClick={() => { void retrySlice("weather"); }}>{t("retry")}</button>
            </div>
          ) : (
            <div className="focus-weather-body">
              <div className="focus-weather-overview">
                <div className="focus-weather-main">
                  <span className="focus-weather-icon" aria-hidden="true">{view.weather?.icon}</span>
                  <div>
                    <strong>{view.weather?.temp}°</strong>
                    <span>{weatherCondition(view.weather?.code ?? -1, locale)}</span>
                  </div>
                </div>
                <p className="focus-weather-feels">{t("focusFeels", { temp: view.weather?.feels ?? "", city: view.weather?.city ?? "" })}</p>
                {view.weatherAlert && (
                  <p className="focus-weather-alert">🌧️ {t("weatherRain", { time: view.weatherAlert.time })}</p>
                )}
              </div>

              {view.forecast.length > 0 && (
                <div className="focus-weather-hours">
                  {view.forecast.map((hour) => (
                    <div key={hour.timestamp} className="focus-weather-hour">
                      <span className="focus-weather-hour-time">{hour.time}</span>
                      <span className="focus-weather-hour-icon">{hour.icon}</span>
                      <span className="focus-weather-hour-temp">{hour.temp}°</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
