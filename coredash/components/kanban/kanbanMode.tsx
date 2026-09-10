"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useViewMode } from "@/hooks/useViewMode";
import { useStatus } from "@/contexts/statusContext";
import { fetchJson } from "@/lib/api-client";
import type { TodoItem } from "@/features/todos/types";
import {
  KANBAN_COLUMNS,
  NewTaskForm,
  priorityColor,
  priorityLabel,
  TaskStatus,
  TodoState,
} from "@/types/task";
import TaskCreateModal from "./taskCreateModal";

export default function KanbanMode() {
  const { setViewMode } = useViewMode();
  const { reportStatus } = useStatus();

  const [tasks, setTasks] = useState<TodoState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialStatus, setModalInitialStatus] = useState<TaskStatus>("todo");
  const [draggingTaskId, setDraggingTaskId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    reportStatus("todo", "loading");
    try {
      const response = await fetchJson<TodoItem[]>("/api/todo?type=task");
      const mapped: TodoState[] = response.map((item) => ({
        id: item.id,
        title: item.title,
        checked: item.checked,
        priority: (item.priority as TodoState["priority"]) || "medium",
        type: item.type,
        status: item.status || (item.checked ? "done" : "todo"),
        description: item.description,
        order: item.order,
        completedAt: item.completedAt,
      }));
      setTasks(mapped);
      reportStatus("todo", "success");
      setError(false);
    } catch {
      reportStatus("todo", "error");
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [reportStatus]);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  const addTask = async (form: NewTaskForm) => {
    try {
      const response = await fetch("/api/todo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          priority: form.priority,
          type: "task",
          status: form.status ?? "todo",
          description: form.description,
        }),
      });
      if (response.ok) {
        await fetchTasks();
      }
    } catch (err) {
      console.error("Failed to add kanban task", err);
    }
  };

  const moveTask = async (id: number, newStatus: TaskStatus) => {
    const originalTasks = [...tasks];
    const targetTask = tasks.find((t) => t.id === id);
    if (!targetTask) return;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: newStatus,
              checked: newStatus === "done" ? 1 : 0,
              completedAt: newStatus === "done" ? new Date().toISOString() : null,
            }
          : t,
      ),
    );

    try {
      await fetchJson<null>("/api/todo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: newStatus,
          checked: newStatus === "done" ? 1 : 0,
        }),
      });
    } catch {
      setTasks(originalTasks);
      setError(true);
    }
  };

  const deleteTask = async (id: number) => {
    const originalTasks = [...tasks];
    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      await fetch(`/api/todo?id=${id}`, {
        method: "DELETE",
      });
    } catch {
      setTasks(originalTasks);
      setError(true);
    }
  };

  // Group tasks by column
  const tasksByColumn = useMemo(() => {
    const grouped: Record<TaskStatus, TodoState[]> = {
      backlog: [],
      todo: [],
      in_progress: [],
      done: [],
    };

    for (const t of tasks) {
      const col = t.status && grouped[t.status] ? t.status : "todo";
      grouped[col].push(t);
    }

    return grouped;
  }, [tasks]);

  const openAddModal = (status: TaskStatus = "todo") => {
    setModalInitialStatus(status);
    setIsModalOpen(true);
  };

  // Drag & drop handlers
  const handleDragStart = (id: number) => {
    setDraggingTaskId(id);
  };

  const handleDragOver = (e: React.DragEvent, colId: TaskStatus) => {
    e.preventDefault();
    if (dragOverColumn !== colId) {
      setDragOverColumn(colId);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (colId: TaskStatus) => {
    if (draggingTaskId !== null) {
      void moveTask(draggingTaskId, colId);
    }
    setDraggingTaskId(null);
    setDragOverColumn(null);
  };

  return (
    <main className="kanban-shell">
      <TaskCreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={addTask}
        defaultStatus={modalInitialStatus}
      />

      {/* Header */}
      <div className="kanban-header">
        <div>
          <p className="focus-eyebrow">Kanban Focus</p>
          <h1 className="kanban-title">Quadro de Tarefas</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => openAddModal("todo")}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            <span className="text-base leading-none font-bold">+</span>
            Nova Tarefa
          </button>
          <button
            type="button"
            onClick={() => setViewMode("dashboard")}
            className="px-3.5 py-2 rounded-xl border border-gray-700 hover:border-gray-500 text-muted hover:text-foreground text-sm font-mono transition-colors cursor-pointer"
          >
            ✕ Voltar ao Dashboard
          </button>
        </div>
      </div>

      {/* Status chips */}
      <div className="kanban-stats-bar">
        {KANBAN_COLUMNS.map((col) => {
          const count = tasksByColumn[col.id].length;
          return (
            <div key={col.id} className="kanban-stat-chip">
              <span className="kanban-stat-dot" style={{ backgroundColor: col.badgeColor }} />
              <span className="font-medium text-foreground">{col.title}</span>
              <span className="font-mono text-muted text-xs">({count})</span>
            </div>
          );
        })}
      </div>

      {(isLoading || error) && (
        <p className="focus-status mb-3" role={error ? "alert" : undefined}>
          {isLoading ? "Carregando tarefas do quadro…" : "Erro ao sincronizar tarefas do quadro."}
        </p>
      )}

      {/* Kanban Columns Grid */}
      <div className="kanban-grid">
        {KANBAN_COLUMNS.map((col) => {
          const colTasks = tasksByColumn[col.id];
          const isOver = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              className={`kanban-column${isOver ? " kanban-column--drag-over" : ""}`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(col.id)}
            >
              {/* Column Header */}
              <div className="kanban-column-header">
                <div className="flex items-center gap-2">
                  <span className="text-base">{col.icon}</span>
                  <h2 className="text-sm font-semibold tracking-wide text-foreground">
                    {col.title}
                  </h2>
                  <span className="kanban-column-badge">{colTasks.length}</span>
                </div>
                <button
                  type="button"
                  onClick={() => openAddModal(col.id)}
                  title={`Adicionar tarefa em ${col.title}`}
                  className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/10 text-muted hover:text-foreground transition-colors cursor-pointer text-sm"
                >
                  +
                </button>
              </div>

              {/* Cards Container */}
              <div className="kanban-cards-list">
                {colTasks.length === 0 ? (
                  <div className="kanban-empty-column">
                    <p className="text-xs text-muted">Sem tarefas</p>
                    <button
                      type="button"
                      onClick={() => openAddModal(col.id)}
                      className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                    >
                      + Adicionar
                    </button>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task.id)}
                      className={`kanban-card${draggingTaskId === task.id ? " opacity-40 scale-98" : ""}`}
                    >
                      {/* Card Header: Priority & Delete */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase"
                          style={{
                            backgroundColor: `${priorityColor[task.priority]}22`,
                            color: priorityColor[task.priority],
                            border: `1px solid ${priorityColor[task.priority]}44`,
                          }}
                        >
                          {priorityLabel[task.priority]}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteTask(task.id)}
                          title="Excluir tarefa"
                          className="text-muted hover:text-red-400 text-xs transition-colors p-1 cursor-pointer opacity-60 hover:opacity-100"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Card Title */}
                      <h3 className={`text-sm font-medium leading-snug mb-1 text-foreground ${task.status === "done" ? "line-through text-muted" : ""}`}>
                        {task.title}
                      </h3>

                      {/* Card Description */}
                      {task.description && (
                        <p className="text-xs text-muted line-clamp-3 mb-2 whitespace-pre-wrap">
                          {task.description}
                        </p>
                      )}

                      {/* Card Footer: Transitions */}
                      <div className="flex items-center justify-between pt-2 mt-1 border-t border-white/5 text-xs">
                        <div className="flex items-center gap-1">
                          {col.id !== "backlog" && (
                            <button
                              type="button"
                              onClick={() => {
                                const prevCol =
                                  col.id === "done"
                                    ? "in_progress"
                                    : col.id === "in_progress"
                                      ? "todo"
                                      : "backlog";
                                void moveTask(task.id, prevCol);
                              }}
                              className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-muted hover:text-foreground transition-colors cursor-pointer text-[11px]"
                              title="Mover para coluna anterior"
                            >
                              ←
                            </button>
                          )}
                          {col.id !== "done" && (
                            <button
                              type="button"
                              onClick={() => {
                                const nextCol =
                                  col.id === "backlog"
                                    ? "todo"
                                    : col.id === "todo"
                                      ? "in_progress"
                                      : "done";
                                void moveTask(task.id, nextCol);
                              }}
                              className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-muted hover:text-foreground transition-colors cursor-pointer text-[11px]"
                              title="Avançar coluna"
                            >
                              →
                            </button>
                          )}
                        </div>

                        {col.id !== "done" ? (
                          <button
                            type="button"
                            onClick={() => moveTask(task.id, "done")}
                            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium transition-colors cursor-pointer"
                          >
                            ✓ Concluir
                          </button>
                        ) : (
                          <span className="text-[10px] text-muted font-mono">Concluído</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
