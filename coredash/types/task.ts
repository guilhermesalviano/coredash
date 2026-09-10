export type Priority = "high" | "medium" | "low";
export type TodoType = "reminder" | "task";
export type TaskStatus = "backlog" | "todo" | "in_progress" | "done";

export interface TodoState {
  id: number;
  title: string;
  checked: number;
  priority: Priority;
  type?: TodoType;
  status?: TaskStatus;
  description?: string | null;
  order?: number;
  completedAt?: string | null;
  usualCompletionTime?: string;
  lastCheckedHour?: string;
}

export interface TaskRecurrenceForm {
  repeat: boolean;
  weeklyInterval: number;
  weeklyDays?: number[] | null;
  weeklyEnd?: number | null;
}

export interface NewTaskForm {
  title: string;
  priority: Priority;
  type?: TodoType;
  status?: TaskStatus;
  description?: string | null;
  recurrence?: TaskRecurrenceForm;
}

export interface KanbanColumnDef {
  id: TaskStatus;
  title: string;
  icon: string;
  badgeColor: string;
}

export const KANBAN_COLUMNS: KanbanColumnDef[] = [
  { id: "backlog", title: "Backlog", icon: "📥", badgeColor: "#94A3B8" },
  { id: "todo", title: "A Fazer", icon: "📋", badgeColor: "#60A5FA" },
  { id: "in_progress", title: "Em Progresso", icon: "⏳", badgeColor: "#FBBF24" },
  { id: "done", title: "Concluído", icon: "✅", badgeColor: "#34D399" },
];

export const priorityColor: Record<Priority, string> = {
  high: "#FCA5A5",
  medium: "#FDE68A",
  low: "#6EE7B7",
};

export const priorityLabel: Record<Priority, string> = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};