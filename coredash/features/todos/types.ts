export interface TodoItem {
  id: number;
  title: string;
  checked: number;
  priority: string;
  sponsor: string;
  usualCompletionTime: string;
}

export interface CreateTodoInput {
  title: string;
  checked: number;
  priority?: string;
  repeat?: number | boolean;
  weeklyInterval?: number;
  weeklyDays?: number[] | string | null;
  weeklyEnd?: number | string | null;
}

export interface UpdateTodoInput {
  id: number;
  checked: number;
}

