"use client";

import { useEffect, useState } from "react";
import {
  KANBAN_COLUMNS,
  NewTaskForm,
  Priority,
  priorityColor,
  priorityLabel,
  TaskStatus,
} from "@/types/task";

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (task: NewTaskForm) => Promise<void>;
  defaultStatus?: TaskStatus;
}

export default function TaskCreateModal({
  isOpen,
  onClose,
  onAdd,
  defaultStatus = "todo",
}: TaskCreateModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [prevDefaultStatus, setPrevDefaultStatus] = useState(defaultStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (prevDefaultStatus !== defaultStatus) {
    setPrevDefaultStatus(defaultStatus);
    setStatus(defaultStatus);
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onAdd({
        title: title.trim(),
        priority,
        type: "task",
        status,
        description: description.trim() || null,
      });

      setTitle("");
      setDescription("");
      setPriority("medium");
      setStatus(defaultStatus);
      onClose();
    } catch {
      setError("Não foi possível criar a tarefa. Seus dados foram mantidos. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => !isSubmitting && e.target === e.currentTarget && onClose()}
    >
      <div
        className="rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 flex flex-col gap-5 border border-white/10"
        style={{
          backgroundColor: "var(--surface)",
          color: "var(--foreground)",
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-muted">Kanban</span>
            <h2 className="text-lg font-semibold">Nova Tarefa Persistente</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-200 transition-colors text-xl leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" aria-busy={isSubmitting}>
          <fieldset disabled={isSubmitting} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted">Título</label>
            <input
              autoFocus
              className="w-full border border-gray-700/60 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
              placeholder="Nome da tarefa ou projeto..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted">Descrição (opcional)</label>
            <textarea
              rows={3}
              className="w-full border border-gray-700/60 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
              style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
              placeholder="Detalhes, links ou notas de contexto..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted">Coluna Inicial</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full border border-gray-700/60 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
              >
                {KANBAN_COLUMNS.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.icon} {col.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted">Prioridade</label>
              <div className="flex gap-1.5">
                {(["high", "medium", "low"] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      priority === p
                        ? "border-transparent shadow-sm scale-102 ring-2 ring-indigo-400"
                        : "border-gray-700 text-gray-400 hover:border-gray-500"
                    }`}
                    style={
                      priority === p
                        ? { backgroundColor: priorityColor[p], color: "#1E293B" }
                        : {}
                    }
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: priorityColor[p] }}
                    />
                    {priorityLabel[p]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          </fieldset>

          {error && (
            <p role="alert" className="text-sm text-red-400">{error}</p>
          )}

          <div className="flex gap-2 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-lg border border-gray-700 text-sm font-medium hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Criando…" : "Criar Tarefa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
