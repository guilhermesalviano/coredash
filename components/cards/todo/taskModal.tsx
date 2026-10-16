"use client";

import { NewTaskForm, Priority, priorityColor, priorityLabel, TaskRecurrenceForm, TodoType } from "@/types/task";
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
  repeat: true,
  weeklyInterval: 1,
  weeklyDays: [0, 1, 2, 3, 4, 5, 6],
  weeklyEnd: null,
};

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (form: NewTaskForm) => void;
  defaultType?: TodoType;
}

export default function TaskModal({ isOpen, onClose, onAdd, defaultType = "reminder" }: TaskModalProps) {
  const [form, setForm] = useState<NewTaskForm>(() => ({
    title: "",
    priority: "medium",
    type: defaultType,
    sponsor: "",
    usualCompletionTime: "09:00",
    recurrence: { ...DEFAULT_RECURRENCE },
  }));

  const [lastDefaultType, setLastDefaultType] = useState<TodoType>(defaultType);
  if (defaultType !== lastDefaultType) {
    setLastDefaultType(defaultType);
    setForm((prev) => ({ ...prev, type: defaultType }));
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const resetAndClose = () => {
    setForm({
      title: "",
      priority: "medium",
      type: defaultType,
      sponsor: "",
      usualCompletionTime: "09:00",
      recurrence: { ...DEFAULT_RECURRENCE },
    });
    onClose();
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    onAdd(form);
    resetAndClose();
  };

  if (!isOpen) return null;

  const isReminder = (form.type ?? "reminder") === "reminder";

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="rounded-3xl shadow-2xl w-full max-w-md mx-4 p-6 flex flex-col gap-5 border"
        style={{
          backgroundColor: "var(--surface)",
          color: "var(--foreground)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {isReminder ? "Nova Rotina" : "Nova Tarefa"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-2 p-1 rounded-xl" style={{ backgroundColor: "var(--surface2)" }}>
          {(["reminder", "task"] as TodoType[]).map((t) => {
            const active = (form.type ?? "reminder") === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: t }))}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  active ? "shadow-sm" : "opacity-60 hover:opacity-90"
                }`}
                style={
                  active
                    ? { backgroundColor: "var(--surface)", color: "var(--foreground)" }
                    : {}
                }
              >
                {t === "reminder" ? "Rotina de hoje" : "Tarefa"}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide opacity-70">Título</label>
          <input
            autoFocus
            className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            style={{
              backgroundColor: "var(--surface2)",
              color: "var(--foreground)",
              borderColor: "var(--border)",
            }}
            placeholder={isReminder ? "Ex: Tomar vitaminas..." : "Descreva a tarefa..."}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        {isReminder && (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide opacity-70">Horário</label>
              <input
                type="time"
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                style={{
                  backgroundColor: "var(--surface2)",
                  color: "var(--foreground)",
                  borderColor: "var(--border)",
                }}
                value={form.usualCompletionTime ?? "09:00"}
                onChange={(e) => setForm((f) => ({ ...f, usualCompletionTime: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide opacity-70">Tag / Pessoa</label>
              <input
                type="text"
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                style={{
                  backgroundColor: "var(--surface2)",
                  color: "var(--foreground)",
                  borderColor: "var(--border)",
                }}
                placeholder="Ex: Dani"
                value={form.sponsor ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, sponsor: e.target.value }))}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide opacity-70">Prioridade</label>
          <div className="flex gap-2">
            {(["high", "medium", "low"] as Priority[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setForm((f) => ({ ...f, priority: p }))}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  form.priority === p
                    ? "border-transparent shadow-sm scale-[1.02]"
                    : "opacity-70 hover:opacity-100"
                }`}
                style={
                  form.priority === p
                    ? { backgroundColor: priorityColor[p], color: "#1f2937" }
                    : { borderColor: "var(--border)" }
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

        {isReminder && (
          <div className="flex flex-col gap-3">
            <label className="text-xs font-semibold uppercase tracking-wide opacity-70">Recorrência</label>

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
              className={`flex items-center cursor-pointer gap-2 w-fit px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                form.recurrence?.repeat
                  ? "bg-blue-500/10 border-blue-500 text-blue-600"
                  : " opacity-75"
              }`}
              style={!form.recurrence?.repeat ? { borderColor: "var(--border)" } : {}}
            >
              <span
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                  form.recurrence?.repeat ? "border-blue-600 bg-blue-600" : "border-gray-300"
                }`}
              >
                {form.recurrence?.repeat && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
              Repetir semanalmente
            </button>

            {form.recurrence?.repeat && (
              <div className="flex flex-col gap-3 pl-3 border-l-2 border-blue-500/30">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs opacity-75">Dias da semana</span>
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
                          className={`w-10 py-1.5 cursor-pointer rounded-lg text-xs font-semibold border transition-all ${
                            selected
                              ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                              : "opacity-75 hover:border-blue-400"
                          }`}
                          style={!selected ? { borderColor: "var(--border)" } : {}}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-colors cursor-pointer"
            style={{ borderColor: "var(--border)" }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!form.title.trim()}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
          >
            {isReminder ? "Adicionar Rotina" : "Adicionar Tarefa"}
          </button>
        </div>
      </div>
    </div>
  );
}
