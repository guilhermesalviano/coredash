import { priorityColor, TodoState } from "@/types/task";

const statusLabel: Record<string, string> = {
  backlog: "Backlog",
  todo: "Backlog",
  in_progress: "Em Progresso",
  done: "Concluído",
};

export default function TodoItem({
  todo,
  onToggle,
}: {
  todo: TodoState;
  onToggle: (id: number, current: number) => void;
}) {
  const isDone = todo.checked === 1 || todo.status === "done";
  return (
    <div
      className={`todo-item${isDone ? " done" : ""}`}
      onClick={() => onToggle(todo.id, todo.checked)}
    >
      <div
        className="rotate-90 tracking-widest text-gray-500 select-none text-xs"
        style={{ cursor: "grab" }}
      >
        ...
      </div>
      <div className="todo-checkbox">{isDone ? "✓" : ""}</div>
      <span className="todo-text">{todo.title}</span>

      {todo.type === "task" && todo.status && (
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-muted border border-white/5">
          {statusLabel[todo.status] ?? todo.status}
        </span>
      )}

      <div
        className="todo-dot"
        style={{ background: priorityColor[todo.priority] }}
      />
    </div>
  );
}
