"use client";

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NewTaskForm, TodoState } from "@/types/task";
import handleFireConfetti from "@/components/confetti";
import { useStatus } from "@/contexts/statusContext";
import { useViewMode } from "@/hooks/useViewMode";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import { fetchJson } from "@/lib/api-client";
import { useDayChange } from "@/hooks/useDayChange";
import TodoCard from "../todo";

export default function TodoCardClient() {
  const [todos, setTodos] = useState<TodoState[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(true);
  const { reportStatus } = useStatus();
  const { setViewMode } = useViewMode();

  const isFirstRender = useRef(true);

  const fetchTodos = useCallback(async () => {
    try {
      const data = await fetchJson<TodoState[]>("/api/todo?type=reminder");
      setTodos(data ?? []);
      reportStatus("todo", "success");
    } catch {
      reportStatus("todo", "error");
    } finally {
      setIsBusy(false);
    }
  }, [reportStatus]);

  useDayChange(() => {
    fetchTodos();
  });

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const add = async (form: NewTaskForm) => {
    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      priority: form.priority,
      type: "reminder",
      checked: 0,
    };

    if (form.recurrence) {
      payload.repeat = form.recurrence.repeat;
      payload.weeklyInterval = form.recurrence.weeklyInterval;
      payload.weeklyDays = form.recurrence.weeklyDays;
      payload.weeklyEnd = form.recurrence.weeklyEnd;
    }

    const response = await fetch("/api/todo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      setTodos((prev) => [
        ...prev,
        {
          id: data.data.id,
          title: form.title.trim(),
          checked: 0,
          priority: form.priority,
          type: "reminder",
          status: "todo",
          description: form.description,
        },
      ]);
    } else {
      console.error(`Error ${response.status} creating todo.`);
    }
  };

  const toggleCheck = (id: number, currentStatus: number) => {
    if (isBusy) return;
    setIsBusy(true);

    const newStatus = currentStatus === 0 ? 1 : 0;

    Promise.all([
      new Promise<void>((resolve) => {
        startTransition(() => {
          setTodos((prev) =>
            prev.map((t) =>
              t.id === id
                ? {
                    ...t,
                    checked: newStatus,
                    status: newStatus === 1 ? "done" : "todo",
                  }
                : t,
            ),
          );
          resolve();
        });
      }),

      fetchWithTimeout("/api/todo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          checked: newStatus,
        }),
      }),
    ])
      .catch(() => {
        startTransition(() => {
          setTodos((prev) =>
            prev.map((t) => (t.id === id ? { ...t, checked: currentStatus } : t)),
          );
        });
      })
      .finally(() => setIsBusy(false));
  };

  const { pending, completed, checkedCount } = useMemo(() => {
    const pending: TodoState[] = [];
    const completed: TodoState[] = [];
    for (const t of todos) {
      (t.checked === 0 ? pending : completed).push(t);
    }
    return { pending, completed, checkedCount: completed.length };
  }, [todos]);

  const progress =
    todos.length > 0
      ? Math.round((checkedCount / todos.length) * 100)
      : 0;

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (todos.length > 0 && checkedCount === todos.length) {
      handleFireConfetti();
    }
  }, [checkedCount, todos.length]);

  return (
    <TodoCard
      modalOpen={modalOpen}
      setModalOpen={setModalOpen}
      add={add}
      toggleCheck={toggleCheck}
      pending={pending}
      completed={completed}
      checkedCount={checkedCount}
      todos={todos}
      onOpenPipeline={() => setViewMode("kanban")}
      isBusy={isBusy}
      progress={progress}
    />
  );
}