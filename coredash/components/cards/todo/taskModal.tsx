"use client";

import { NewTaskForm, Priority, priorityColor, priorityLabel, TaskRecurrenceForm } from "@/types/task";
import { useEffect, useState } from "react";

const WEEK_DAYS = [
  { label: "Dom", value: 0 },
  { label: "Seg", value: 1 },
  { label: "Ter", value: 2 },
  { label: "Qua", value: 3 },
  { label: "Qui", value: 4 },
  { label: "Sex", value: 5 },
  { label: "Sáb", value: 6 },
];

const DEFAULT_RECURRENCE: TaskRecurrenceForm = {
  repeat: false,
  weeklyInterval: 1,
  weeklyDays: [0],
  weeklyEnd: null,
};

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (form: NewTaskForm) => void;
}

export default function TaskModal({ isOpen, onClose, onAdd }: TaskModalProps) {
  const [form, setForm] = useState<NewTaskForm>({
    title: "",
    priority: "medium",
    recurrence: { ...DEFAULT_RECURRENCE },
  });

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    onAdd(form);
    setForm({
      title: "",
      priority: "medium",
      recurrence: { ...DEFAULT_RECURRENCE },
    });
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return;

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 flex flex-col gap-5"
        style={{
          backgroundColor: "var(--background)",
          color: "var(--foreground)"
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold px-4 py-2">Novo Lembrete</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Descrição</label>
          <input
            autoFocus
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
            style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
            placeholder="Descreva a tarefa..."
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Prioridade</label>
          <div className="flex gap-2">
            {(["high", "medium", "low"] as Priority[]).map((p) => (
              <button
                key={p}
                onClick={() => setForm((f) => ({ ...f, priority: p }))}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                  form.priority === p
                    ? "border-transparent shadow-sm scale-105"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
                style={
                  form.priority === p
                    ? { backgroundColor: priorityColor[p], color: "#374151" }
                    : {}
                }
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: priorityColor[p] }}
                />
                {priorityLabel[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium">Recorrência</label>

          <button
            type="button"
            onClick={() =>
              setForm((f) => {
                const currentRec = f.recurrence ?? DEFAULT_RECURRENCE;
                return {
                  ...f,
                  recurrence: { ...currentRec, repeat: !currentRec.repeat },
                };
              })
            }
            className={`flex items-center cursor-pointer gap-2 w-fit px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
              form.recurrence?.repeat
                ? "bg-indigo-50 border-indigo-400 text-indigo-700"
                : "border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                form.recurrence?.repeat ? "border-indigo-500 bg-indigo-500" : "border-gray-300"
              }`}
            >
              {form.recurrence?.repeat && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </span>
            Repetir semanalmente
          </button>

          {form.recurrence?.repeat && (
            <div className="flex flex-col gap-3 pl-3 border-l-2 border-indigo-100">

              <div className="flex flex-col gap-1.5">
                <span className="text-xs">Dias da semana</span>
                <div className="flex gap-1.5 flex-wrap">
                  {WEEK_DAYS.map((day) => {
                    const selected = form.recurrence?.weeklyDays?.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => {
                          const currentRec = form.recurrence ?? DEFAULT_RECURRENCE;
                          setForm((f) => ({
                            ...f,
                            recurrence: {
                              ...currentRec,
                              weeklyDays: selected
                                ? currentRec.weeklyDays?.filter((d) => d !== day.value)
                                : [...(currentRec.weeklyDays || []), day.value],
                            },
                          }));
                        }}
                        className={`w-10 py-1.5 cursor-pointer rounded-lg text-xs font-medium border transition-all ${
                          selected
                            ? "bg-indigo-500 border-indigo-500 text-white shadow-sm"
                            : "border-gray-200 hover:border-indigo-300"
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs whitespace-nowrap">A cada</span>
                <input
                  type="number"
                  min={1}
                  max={52}
                  value={form.recurrence?.weeklyInterval ?? 1}
                  onChange={(e) => {
                    const currentRec = form.recurrence ?? DEFAULT_RECURRENCE;
                    setForm((f) => ({
                      ...f,
                      recurrence: {
                        ...currentRec,
                        weeklyInterval: Math.max(1, Number(e.target.value)),
                      },
                    }));
                  }}
                  className="w-16 cursor-pointer border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                />
                <span className="text-xs">semana(s)</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs cursor-pointer">Termina em (opcional)</span>
                <input
                  type="date"
                  value={
                    form.recurrence?.weeklyEnd
                      ? new Date(form.recurrence.weeklyEnd).toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) => {
                    const currentRec = form.recurrence ?? DEFAULT_RECURRENCE;
                    setForm((f) => ({
                      ...f,
                      recurrence: {
                        ...currentRec,
                        weeklyEnd: e.target.value
                          ? new Date(e.target.value).getTime()
                          : null,
                      },
                    }));
                  }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                />
                {form.recurrence?.weeklyEnd && (
                  <button
                    type="button"
                    onClick={() => {
                      const currentRec = form.recurrence ?? DEFAULT_RECURRENCE;
                      setForm((f) => ({
                        ...f,
                        recurrence: { ...currentRec, weeklyEnd: null },
                      }));
                    }}
                    className="text-xs hover:text-red-400 transition-colors w-fit cursor-pointer"
                  >
                    Remover data de término
                  </button>
                )}
              </div>

            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.title.trim()}
            className="flex-1 py-2.5 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
          >
            Adicionar Lembrete
          </button>
        </div>
      </div>
    </div>
  );
}
