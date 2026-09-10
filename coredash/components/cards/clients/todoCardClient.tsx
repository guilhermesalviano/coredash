"use client";

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NewTaskForm, TodoState } from "@/types/task";
import handleFireConfetti from "@/components/confetti";
import { useStatus } from "@/contexts/statusContext";
import { useViewMode } from "@/hooks/useViewMode";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import { useDayChange } from "@/hooks/useDayChange";
import TodoCard from "../todo";

export default function TodoCardClient() {
  const [todos, setTodos] = useState<TodoState[]>([]);
  const [activeTab, setActiveTab] = useState<"reminders" | "tasks">("reminders");
  const [modalOpen, setModalOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(true);
  const { reportStatus } = useStatus();
  const { setViewMode } = useViewMode();

  const isFirstRender = useRef(true);

  const fetchTodos = useCallback(async () => {
    try {
      const res = await fetch("/api/todo");
      const data = await res.json();
      setTodos(data.data ?? []);
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
    const isTask = activeTab === "tasks" || form.type === "task";
    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      priority: form.priority,
      type: isTask ? "task" : "reminder",
      status: form.status ?? (isTask ? "todo" : undefined),
      description: form.description ?? null,
      checked: 0,
    };

    if (!isTask && form.recurrence) {
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
          type: isTask ? "task" : "reminder",
          status: form.status ?? "todo",
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
    const target = todos.find((t) => t.id === id);
    const newStatusStr = target?.type === "task"
      ? (newStatus === 1 ? "done" : "todo")
      : undefined;

    Promise.all([
      new Promise<void>((resolve) => {
        startTransition(() => {
          setTodos((prev) =>
            prev.map((t) =>
              t.id === id
                ? {
                    ...t,
                    checked: newStatus,
                    status: newStatusStr ? (newStatusStr as TodoState["status"]) : t.status,
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
          status: newStatusStr,
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

  const currentTabItems = useMemo(() => {
    return todos.filter((t) =>
      activeTab === "reminders" ? t.type === "reminder" : t.type === "task",
    );
  }, [todos, activeTab]);

  const { pending, completed, checkedCount } = useMemo(() => {
    const pending: TodoState[] = [];
    const completed: TodoState[] = [];
    for (const t of currentTabItems) {
      (t.checked === 0 ? pending : completed).push(t);
    }
    return { pending, completed, checkedCount: completed.length };
  }, [currentTabItems]);

  const progress =
    currentTabItems.length > 0
      ? Math.round((checkedCount / currentTabItems.length) * 100)
      : 0;

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (currentTabItems.length > 0 && checkedCount === currentTabItems.length) {
      handleFireConfetti();
    }
  }, [checkedCount, currentTabItems.length]);

  return (
    <TodoCard
      modalOpen={modalOpen}
      setModalOpen={setModalOpen}
      add={add}
      toggleCheck={toggleCheck}
      pending={pending}
      completed={completed}
      checkedCount={checkedCount}
      todos={currentTabItems}
      allTodos={todos}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onOpenKanban={() => setViewMode("kanban")}
      isBusy={isBusy}
      progress={progress}
    />
  );
}