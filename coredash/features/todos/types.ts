export type TodoType = "reminder" | "task";
export type TaskStatus = "backlog" | "todo" | "in_progress" | "done";

export interface TodoItem {
  id: number;
  title: string;
  checked: number;
  priority: string;
  sponsor: string;
  usualCompletionTime: string;
  type: TodoType;
  status: TaskStatus;
  description?: string | null;
  order: number;
  createdAt?: string;
  completedAt?: string | null;
}

export interface CreateTodoInput {
  title: string;
  checked?: number;
  priority?: string;
  type?: TodoType;
  status?: TaskStatus;
  description?: string | null;
  order?: number;
  repeat?: number | boolean;
  weeklyInterval?: number;
  weeklyDays?: number[] | string | null;
  weeklyEnd?: number | string | null;
}

export interface UpdateTodoInput {
  id: number;
  checked?: number;
  status?: TaskStatus;
  order?: number;
  title?: string;
  description?: string | null;
  priority?: string;
}

export interface GetTodosOptions {
  type?: TodoType | "all";
  status?: TaskStatus;
  onlyUnchecked?: boolean;
}

