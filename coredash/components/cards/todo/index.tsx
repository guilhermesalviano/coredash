import Card from "@/components/card";
import TaskModal from "./taskModal";
import TodoItem from "./todoItem";
import { NewTaskForm, TodoState } from "@/types/task";

interface TodoProps {
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  add: (form: NewTaskForm) => void;
  toggleCheck: (id: number, currentStatus: number) => void;
  pending: TodoState[];
  completed: TodoState[];
  checkedCount: number;
  todos?: TodoState[];
  allTodos?: TodoState[];
  activeTab?: "reminders" | "tasks";
  setActiveTab?: (tab: "reminders" | "tasks") => void;
  onOpenKanban?: () => void;
  isBusy: boolean;
  progress: number;
}

export default function TodoCard({
  modalOpen,
  setModalOpen,
  add,
  toggleCheck,
  pending,
  completed,
  checkedCount,
  todos,
  allTodos = [],
  activeTab = "reminders",
  setActiveTab,
  onOpenKanban,
  isBusy,
  progress,
}: TodoProps) {
  const reminderCount = allTodos.filter((t) => t.type === "reminder").length;
  const taskCount = allTodos.filter((t) => t.type === "task").length;

  return (
    <>
      <TaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={add}
      />

      <Card>
        {/* Header with Tabs and Actions */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex items-center justify-between">
            {/* Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setActiveTab?.("reminders")}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeTab === "reminders"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                ⏰ Lembretes {reminderCount > 0 && <span className="opacity-75">({reminderCount})</span>}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab?.("tasks")}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeTab === "tasks"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                📋 Tarefas {taskCount > 0 && <span className="opacity-75">({taskCount})</span>}
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {onOpenKanban && (
                <button
                  type="button"
                  onClick={onOpenKanban}
                  title="Abrir Pipeline de Tarefas em tela cheia"
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-gray-700 hover:border-gray-500 text-muted hover:text-foreground text-xs font-mono transition-colors cursor-pointer"
                >
                  Pipeline ↗
                </button>
              )}
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                <span className="text-sm leading-none">+</span>
                {activeTab === "reminders" ? "Lembrete" : "Tarefa"}
              </button>
            </div>
          </div>
        </div>

        <div
          className={`todo-list relative transition-opacity ${isBusy ? "opacity-50 pointer-events-none" : "opacity-100"}`}
        >
          {isBusy && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-black/40 z-30 rounded-lg backdrop-blur-xs">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full border-3 border-gray-200 dark:border-gray-700" />
                <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-cyan-500 animate-spin" />
              </div>
            </div>
          )}

          {todos?.length === 0 || !todos ? (
            <div className="py-6 text-center">
              <p className="text-sm text-gray-400">
                {activeTab === "reminders"
                  ? "Nenhum lembrete programado para hoje."
                  : "Nenhuma tarefa persistente cadastrada."}
              </p>
              {activeTab === "tasks" && onOpenKanban && (
                <button
                  type="button"
                  onClick={onOpenKanban}
                  className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 font-mono underline cursor-pointer"
                >
                  Abrir Pipeline para criar e organizar tarefas →
                </button>
              )}
            </div>
          ) : (
            <>
              {pending.map((t) => (
                <TodoItem key={t.id} todo={t} onToggle={toggleCheck} />
              ))}
              {completed.map((t) => (
                <TodoItem key={t.id} todo={t} onToggle={toggleCheck} />
              ))}
            </>
          )}
        </div>

        <div className="flex justify-between items-center my-2">
          <div className="w-full mt-4 px-4">
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner border border-slate-200 dark:border-slate-700">
              <div
                className="h-full bg-cyan-500 transition-transform duration-500"
                style={{
                  transform: `translateX(-${100 - progress}%)`,
                  width: "100%",
                }}
              />
            </div>
          </div>
          <div className="todo-summary">
            {checkedCount}/{todos?.length || 0} concluídas
          </div>
        </div>
      </Card>
    </>
  );
}