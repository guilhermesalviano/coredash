"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Check,
  CloudSun,
  Clock3,
  Home,
  ListChecks,
  ListTodo,
  Moon,
  Plus,
  RefreshCw,
  RotateCw,
  Sun,
  Trash2,
} from "lucide-react";
import WeatherCardClient from "./cards/clients/weatherCardClient";
import StatusReporter from "./statusReporter";
import Settings from "./settings";
import TaskModal from "./cards/todo/taskModal";
import { useActiveCards } from "@/hooks/useActiveCards";
import { useDayChange } from "@/hooks/useDayChange";
import { useStatus } from "@/contexts/statusContext";
import { fetchJson } from "@/lib/api-client";
import { fetchAll } from "@/lib/dashboardStore";
import storage from "@/lib/storage";
import type { CalendarEventItem, CalendarInternalAPIResponse } from "@/types/calendar";
import type { TodoItem } from "@/features/todos/types";
import type { NewTaskForm, Priority, TodoState, TodoType } from "@/types/task";
import { priorityColor } from "@/types/task";
import handleFireConfetti from "./confetti";
import { playTaskCompletionChime } from "@/features/focus/rewards";

type NavSection = "overview" | "calendar" | "weather" | "tasks";
type ThemeMode = "light" | "dark";

const PRIORITIES: Priority[] = ["high", "medium", "low"];
const EVENT_ACCENTS = ["#3b82f6", "#10b981", "#a855f7", "#f59e0b", "#ec4899", "#06b6d4"];

function toTodoState(item: TodoItem): TodoState {
  const priority = PRIORITIES.includes(item.priority as Priority)
    ? (item.priority as Priority)
    : "medium";
  return {
    id: item.id,
    title: item.title,
    checked: item.checked,
    priority,
    sponsor: item.sponsor || "",
    type: item.type,
    status: item.status,
    description: item.description,
    order: item.order,
    completedAt: item.completedAt,
    usualCompletionTime: item.usualCompletionTime || item.lastCheckedHour || "",
    lastCheckedHour: item.lastCheckedHour || "",
  };
}

function capitalizeFirst(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatEventMetaDate(event: CalendarEventItem): string {
  const timeLabel =
    event.start === "All day" ? "DIA INTEIRO" : event.start;
  if (!event.startDateTime) {
    return timeLabel;
  }
  const parsed = new Date(event.startDateTime);
  if (Number.isNaN(parsed.getTime())) {
    return timeLabel;
  }
  const weekday = parsed
    .toLocaleDateString("pt-BR", { weekday: "short" })
    .replace(".", "")
    .toUpperCase();
  const day = parsed.getDate();
  const month = parsed
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "")
    .toUpperCase();
  return `${weekday} ${day} ${month} · ${timeLabel}`;
}

function formatNextHighlightMeta(event: CalendarEventItem): string {
  const timeLabel =
    event.start === "All day" ? "Dia inteiro" : event.start;
  let dayLabel = "Hoje";
  if (event.startDateTime) {
    const parsed = new Date(event.startDateTime);
    if (!Number.isNaN(parsed.getTime())) {
      dayLabel = capitalizeFirst(
        parsed.toLocaleDateString("pt-BR", { weekday: "long" }),
      );
    }
  } else if (event.daysUntil === 1) {
    dayLabel = "Amanhã";
  }
  const tag = event.calendarName || event.location || "Agenda";
  return `${dayLabel} · ${timeLabel} · ${tag}`;
}

function formatRelativeDaysBadge(daysUntil?: number): string {
  if (daysUntil === undefined || daysUntil <= 0) return "Hoje";
  if (daysUntil === 1) return "Amanhã";
  return `${daysUntil}D`;
}

export default function ActiveCards() {
  const { mounted } = useActiveCards();
  const { reportStatus } = useStatus();

  const [activeNav, setActiveNav] = useState<NavSection>("overview");
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [now, setNow] = useState(() => new Date());
  const [calendar, setCalendar] = useState<CalendarInternalAPIResponse | null>(null);
  const [todos, setTodos] = useState<TodoState[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [busyTodoId, setBusyTodoId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState<TodoType>("reminder");

  useEffect(() => {
    const currentAttr = document.documentElement.getAttribute("data-theme");
    const saved = storage.get("theme") as ThemeMode | null;
    const initial: ThemeMode =
      saved === "dark" || saved === "light"
        ? saved
        : currentAttr === "dark"
          ? "dark"
          : "light";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const toggleTheme = () => {
    const next: ThemeMode = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    storage.set("theme", next);
  };

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 10_000);
    return () => window.clearInterval(timer);
  }, []);

  const loadDashboardData = useCallback(async () => {
    const [calRes, todoRes] = await Promise.allSettled([
      fetchJson<CalendarInternalAPIResponse>("/api/calendar"),
      fetchJson<TodoItem[]>("/api/todo?type=all"),
    ]);

    if (calRes.status === "fulfilled") {
      setCalendar(calRes.value);
      reportStatus("calendar", "success");
    } else {
      reportStatus("calendar", "error");
    }

    if (todoRes.status === "fulfilled") {
      setTodos((todoRes.value ?? []).map(toTodoState));
      reportStatus("todo", "success");
    } else {
      reportStatus("todo", "error");
    }
  }, [reportStatus]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  useDayChange(() => {
    setNow(new Date());
    void loadDashboardData();
  });

  const handleRefreshAll = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await Promise.allSettled([fetchAll(), loadDashboardData()]);
    } finally {
      setTimeout(() => setIsRefreshing(false), 450);
    }
  };

  const upcomingEvents = useMemo<CalendarEventItem[]>(() => {
    if (!calendar) return [];
    const list: CalendarEventItem[] = [
      ...(calendar.todayEvents ?? []),
      ...(calendar.nextDayEvents ?? []),
      ...(calendar.futureEvents ?? []),
    ];
    // Deduplicate by id + startDateTime
    const seen = new Set<string>();
    return list.filter((ev) => {
      const key = `${ev.id}-${ev.startDateTime ?? ev.start}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [calendar]);

  const nextEvent = upcomingEvents[0] ?? null;

  const { routines, pendingTasks, completedTasks } = useMemo(() => {
    const routinesList: TodoState[] = [];
    const pendingTaskList: TodoState[] = [];
    const completedTaskList: TodoState[] = [];

    for (const item of todos) {
      if ((item.type ?? "reminder") === "reminder") {
        routinesList.push(item);
      } else if (item.checked === 1 || item.status === "done") {
        completedTaskList.push(item);
      } else {
        pendingTaskList.push(item);
      }
    }

    return {
      routines: routinesList,
      pendingTasks: pendingTaskList,
      completedTasks: completedTaskList,
    };
  }, [todos]);

  const openAddModal = (type: TodoType) => {
    setModalDefaultType(type);
    setModalOpen(true);
  };

  const handleAddTodo = async (form: NewTaskForm) => {
    const todoType: TodoType = form.type ?? modalDefaultType;
    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      priority: form.priority,
      type: todoType,
      checked: 0,
      sponsor: form.sponsor?.trim() || null,
      usualCompletionTime: form.usualCompletionTime || null,
    };

    if (todoType === "reminder" && form.recurrence) {
      payload.repeat = form.recurrence.repeat;
      payload.weeklyInterval = form.recurrence.weeklyInterval;
      payload.weeklyDays = form.recurrence.weeklyDays;
      payload.weeklyEnd = form.recurrence.weeklyEnd;
    }

    try {
      const res = await fetch("/api/todo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await loadDashboardData();
      }
    } catch {
      // Ignore network error
    }
  };

  const handleToggleTodo = async (item: TodoState) => {
    if (busyTodoId !== null) return;
    setBusyTodoId(item.id);
    const nextChecked = item.checked === 1 ? 0 : 1;

    if (nextChecked === 1) {
      playTaskCompletionChime();
      handleFireConfetti();
    }

    setTodos((prev) =>
      prev.map((t) =>
        t.id === item.id
          ? {
              ...t,
              checked: nextChecked,
              status: nextChecked === 1 ? "done" : "todo",
            }
          : t,
      ),
    );

    try {
      await fetchJson<null>("/api/todo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          checked: nextChecked,
          status: nextChecked === 1 ? "done" : "todo",
        }),
      });
    } catch {
      setTodos((prev) =>
        prev.map((t) => (t.id === item.id ? item : t)),
      );
    } finally {
      setBusyTodoId(null);
    }
  };

  const handleDeleteTodo = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (busyTodoId !== null) return;
    setBusyTodoId(id);
    const previous = todos;
    setTodos((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetchJson<null>(`/api/todo?id=${id}`, { method: "DELETE" });
    } catch {
      setTodos(previous);
    } finally {
      setBusyTodoId(null);
    }
  };

  if (!mounted) return null;

  const hoursStr = String(now.getHours()).padStart(2, "0");
  const minutesStr = String(now.getMinutes()).padStart(2, "0");
  const formattedDate = capitalizeFirst(
    now.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
  );

  const showTopRow = activeNav === "overview" || activeNav === "weather" || activeNav === "calendar";
  const showBottomRow = activeNav === "overview" || activeNav === "calendar" || activeNav === "tasks";

  return (
    <>
      <StatusReporter statuses={["stocks", "news"]} />

      <div className="wall-shell">
        {/* Left Navigation Rail */}
        <aside className="wall-rail" aria-label="Navegação principal">
          <div className="wall-rail-group">
            <button
              type="button"
              onClick={() => setActiveNav("overview")}
              className={`wall-rail-btn ${activeNav === "overview" ? "wall-rail-btn--active" : ""}`}
              aria-label="Visão geral"
              title="Visão geral"
            >
              <Home size={20} strokeWidth={2.1} />
            </button>
            <button
              type="button"
              onClick={() => setActiveNav("calendar")}
              className={`wall-rail-btn ${activeNav === "calendar" ? "wall-rail-btn--active" : ""}`}
              aria-label="Agenda e Eventos"
              title="Agenda e Eventos"
            >
              <Calendar size={20} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => setActiveNav("weather")}
              className={`wall-rail-btn ${activeNav === "weather" ? "wall-rail-btn--active" : ""}`}
              aria-label="Clima"
              title="Clima"
            >
              <CloudSun size={20} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => setActiveNav("tasks")}
              className={`wall-rail-btn ${activeNav === "tasks" ? "wall-rail-btn--active" : ""}`}
              aria-label="Rotinas e Tarefas"
              title="Rotinas e Tarefas"
            >
              <ListChecks size={20} strokeWidth={2} />
            </button>
          </div>

          <div className="wall-rail-group wall-rail-group--bottom">
            <button
              type="button"
              onClick={handleRefreshAll}
              className="wall-rail-btn"
              aria-label="Atualizar dados"
              title="Atualizar dados"
            >
              <RefreshCw
                size={19}
                strokeWidth={2}
                className={isRefreshing ? "animate-spin" : ""}
              />
            </button>

            <Settings className="wall-rail-btn" />

            <button
              type="button"
              onClick={toggleTheme}
              className="wall-rail-btn"
              aria-label={theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"}
              title={theme === "light" ? "Modo escuro" : "Modo claro"}
            >
              {theme === "light" ? (
                <Moon size={19} strokeWidth={2} />
              ) : (
                <Sun size={19} strokeWidth={2} />
              )}
            </button>

            <div className="wall-rail-clock" aria-label={`Hora atual ${hoursStr}:${minutesStr}`}>
              <span>{hoursStr}</span>
              <span>{minutesStr}</span>
            </div>
          </div>
        </aside>

        {/* Main Wall Dashboard Grid */}
        <main className="wall-main">
          {showTopRow && (
            <section className="wall-top-grid">
              {/* Top-Left: Giant Digital Clock + Royal Blue PRÓXIMO Highlight Card */}
              <div className="wall-hero-left">
                <div className="wall-clock-card">
                  <div className="wall-big-time">
                    {hoursStr}:{minutesStr}
                  </div>
                  <div className="wall-big-date">{formattedDate}</div>
                </div>

                <div className="wall-next-card">
                  <div className="wall-next-eyebrow">
                    <Calendar size={14} strokeWidth={2.4} />
                    <span>PRÓXIMO</span>
                  </div>
                  {nextEvent ? (
                    <>
                      <h2 className="wall-next-title">
                        {nextEvent.summary || nextEvent.title}
                      </h2>
                      <p className="wall-next-meta">
                        {formatNextHighlightMeta(nextEvent)}
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="wall-next-title">Sem eventos próximos</h2>
                      <p className="wall-next-meta">
                        Sua agenda está livre nos próximos dias
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Top-Right: Weather Card with 24h Curve + 7-Day Strip */}
              <div className="wall-hero-right">
                <WeatherCardClient />
              </div>
            </section>
          )}

          {showBottomRow && (
            <section className="wall-bottom-grid">
              {/* Column 1: Próximos eventos */}
              <article className="wall-card">
                <header className="wall-card-header">
                  <div className="wall-card-title-row">
                    <span className="wall-card-icon wall-card-icon--blue">
                      <Calendar size={18} strokeWidth={2.2} />
                    </span>
                    <h3 className="wall-card-title">Próximos eventos</h3>
                  </div>
                  <span className="wall-count-pill">{upcomingEvents.length}</span>
                </header>

                <div className="wall-card-body">
                  {upcomingEvents.length > 0 ? (
                    <div className="wall-events-list">
                      {upcomingEvents.slice(0, 10).map((event, idx) => {
                        const accentColor =
                          event.color || EVENT_ACCENTS[idx % EVENT_ACCENTS.length];
                        const tagLabel = event.calendarName || "Casa";
                        return (
                          <div
                            key={`${event.id}-${idx}`}
                            className="wall-event-item"
                          >
                            <span
                              className="wall-event-bar"
                              style={{ backgroundColor: accentColor }}
                            />
                            <div className="wall-event-content">
                              <div className="wall-event-top">
                                <span className="wall-event-datetime">
                                  {formatEventMetaDate(event)}
                                </span>
                                <span className="wall-event-days-pill">
                                  {formatRelativeDaysBadge(event.daysUntil)}
                                </span>
                              </div>
                              <div className="wall-event-name">
                                {event.summary || event.title}
                              </div>
                              <span
                                className="wall-event-tag"
                                style={{
                                  backgroundColor: `${accentColor}1f`,
                                  color: accentColor,
                                }}
                              >
                                {tagLabel}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="wall-empty-state">
                      <div className="wall-empty-badge wall-empty-badge--blue">
                        <Calendar size={26} strokeWidth={2.2} />
                      </div>
                      <h4 className="wall-empty-title">Agenda tranquila</h4>
                      <p className="wall-empty-subtitle">
                        Nenhum evento agendado para os próximos dias
                      </p>
                    </div>
                  )}
                </div>
              </article>

              {/* Column 2: Rotinas de hoje */}
              <article className="wall-card">
                <header className="wall-card-header">
                  <div className="wall-card-title-row">
                    <span className="wall-card-icon wall-card-icon--purple">
                      <RotateCw size={18} strokeWidth={2.2} />
                    </span>
                    <h3 className="wall-card-title">Rotinas de hoje</h3>
                  </div>
                  <div className="wall-card-actions">
                    <span className="wall-count-pill">
                      {routines.filter((r) => r.checked === 0).length || routines.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => openAddModal("reminder")}
                      className="wall-icon-action"
                      aria-label="Adicionar rotina"
                      title="Adicionar rotina"
                    >
                      <Plus size={16} strokeWidth={2.4} />
                    </button>
                  </div>
                </header>

                <div className="wall-card-body">
                  {routines.length > 0 ? (
                    <div className="wall-routines-list">
                      {routines.map((routine) => {
                        const isDone = routine.checked === 1;
                        const timeStr =
                          routine.usualCompletionTime ||
                          routine.lastCheckedHour ||
                          "09:00";
                        return (
                          <div
                            key={routine.id}
                            onClick={() => handleToggleTodo(routine)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                void handleToggleTodo(routine);
                              }
                            }}
                            className={`wall-routine-item ${isDone ? "wall-routine-item--done" : ""}`}
                          >
                            <span
                              className={`wall-check-circle ${isDone ? "wall-check-circle--checked" : ""}`}
                            >
                              {isDone && <Check size={13} strokeWidth={3} />}
                            </span>
                            <div className="wall-routine-content">
                              <div className="wall-routine-title">{routine.title}</div>
                              <div className="wall-routine-meta">
                                <span className="wall-routine-time">
                                  <Clock3 size={12} strokeWidth={2.2} />
                                  {timeStr}
                                </span>
                                {routine.sponsor && (
                                  <span className="wall-routine-sponsor">
                                    {routine.sponsor}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteTodo(routine.id, e)}
                              className="wall-item-delete"
                              aria-label={`Remover rotina ${routine.title}`}
                              title="Remover"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="wall-empty-state">
                      <div className="wall-empty-badge wall-empty-badge--green">
                        <Check size={28} strokeWidth={2.6} />
                      </div>
                      <h4 className="wall-empty-title">Rotinas em dia</h4>
                      <p className="wall-empty-subtitle">
                        Adicione uma rotina diária no botão +
                      </p>
                    </div>
                  )}
                </div>
              </article>

              {/* Column 3: Tarefas */}
              <article className="wall-card">
                <header className="wall-card-header">
                  <div className="wall-card-title-row">
                    <span className="wall-card-icon wall-card-icon--amber">
                      <ListTodo size={18} strokeWidth={2.2} />
                    </span>
                    <h3 className="wall-card-title">Tarefas</h3>
                  </div>
                  <div className="wall-card-actions">
                    {pendingTasks.length > 0 && (
                      <span className="wall-count-pill">{pendingTasks.length}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => openAddModal("task")}
                      className="wall-icon-action"
                      aria-label="Adicionar tarefa"
                      title="Adicionar tarefa"
                    >
                      <Plus size={16} strokeWidth={2.4} />
                    </button>
                  </div>
                </header>

                <div className="wall-card-body">
                  {pendingTasks.length > 0 ? (
                    <div className="wall-routines-list">
                      {pendingTasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => handleToggleTodo(task)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              void handleToggleTodo(task);
                            }
                          }}
                          className="wall-routine-item"
                        >
                          <span className="wall-check-circle" />
                          <div className="wall-routine-content">
                            <div className="wall-routine-title">{task.title}</div>
                            {task.sponsor && (
                              <div className="wall-routine-meta">
                                <span className="wall-routine-sponsor">
                                  {task.sponsor}
                                </span>
                              </div>
                            )}
                          </div>
                          <span
                            className="wall-priority-dot"
                            style={{ backgroundColor: priorityColor[task.priority] }}
                            title={`Prioridade ${task.priority}`}
                          />
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTodo(task.id, e)}
                            className="wall-item-delete"
                            aria-label={`Remover tarefa ${task.title}`}
                            title="Remover"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}

                      {completedTasks.length > 0 && (
                        <div className="wall-completed-Count">
                          {completedTasks.length} concluída(s)
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="wall-empty-state">
                      <div className="wall-empty-badge wall-empty-badge--green">
                        <Check size={28} strokeWidth={2.8} />
                      </div>
                      <h4 className="wall-empty-title">Tudo feito</h4>
                      <p className="wall-empty-subtitle">
                        Não há tarefas pendentes
                      </p>
                    </div>
                  )}
                </div>
              </article>
            </section>
          )}
        </main>
      </div>

      <TaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddTodo}
        defaultType={modalDefaultType}
      />
    </>
  );
}
