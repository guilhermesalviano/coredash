import { format } from "date-fns";
import { In, IsNull, Like, type DataSource } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { ONE_MINUTE_IN_MS } from "@/constants";
import { createMemoryCache } from "@/utils/in-memory-cache";
import { Todo } from "@/entities/Todo";
import { TodoCheck } from "@/entities/TodoCheck";
import { TodoRecurrence } from "@/entities/TodoRecurrence";
import type {
  CreateTodoInput,
  GetTodosOptions,
  TaskStatus,
  TodoItem,
  TodoType,
  UpdateTodoInput,
} from "@/features/todos/types";

const PRIORITY_WEIGHT: Record<string, number> = { high: 1, medium: 2, low: 3 };
const todoCache = createMemoryCache<TodoItem[]>(ONE_MINUTE_IN_MS);

let dbConnectionOverride: DataSource | null = null;

export function setTodoDatabaseConnection(ds: DataSource | null) {
  dbConnectionOverride = ds;
  todoCache.clear();
}

async function getDb(): Promise<DataSource> {
  if (dbConnectionOverride) return dbConnectionOverride;
  const { getDatabaseConnection } = await import("@/lib/db");
  return getDatabaseConnection();
}

export async function getTodos(
  options?: GetTodosOptions | boolean,
): Promise<TodoItem[]> {
  const normalizedOptions: GetTodosOptions =
    typeof options === "boolean"
      ? { onlyUnchecked: options, type: "all" }
      : {
          type: options?.type ?? "all",
          status: options?.status,
          onlyUnchecked: options?.onlyUnchecked ?? false,
          orderBy: options?.orderBy ?? "lastCheckedHour",
        };

  const cacheKey = `${normalizedOptions.type}:${normalizedOptions.status ?? ""}:${normalizedOptions.onlyUnchecked ? "1" : "0"}:${normalizedOptions.orderBy ?? "lastCheckedHour"}`;
  const cached = todoCache.get(cacheKey);
  if (cached) return cached;

  const today = new Date();
  const todayString = format(today, "yyyy-MM-dd");
  const db = await getDb();
  const todoRepository = db.getRepository(Todo);
  const checkRepository = db.getRepository(TodoCheck);

  // 1. Fetch Reminders (if type === "reminder" or type === "all")
  let activeReminders: Todo[] = [];
  if (normalizedOptions.type === "reminder" || normalizedOptions.type === "all") {
    const reminderTodos = await todoRepository.find({
      where: [
        { type: "reminder", createdAt: Like(`${todayString}%`) as unknown as Date },
        { type: "reminder", recurrence: { repeat: 1, weeklyDays: Like(`%${today.getDay()}%`) } },
        { type: IsNull(), createdAt: Like(`${todayString}%`) as unknown as Date },
        { type: IsNull(), recurrence: { repeat: 1, weeklyDays: Like(`%${today.getDay()}%`) } },
      ],
      relations: ["recurrence"],
    });

    activeReminders = reminderTodos.filter((todo) => {
      const end = todo.recurrence?.weeklyEnd;
      if (end === null || end === undefined) return true;
      const endOfToday = new Date(today);
      endOfToday.setHours(0, 0, 0, 0);
      return Number(end) >= endOfToday.getTime();
    });
  }

  // 2. Fetch Persistent Tasks (if type === "task" or type === "all")
  let tasks: Todo[] = [];
  if (normalizedOptions.type === "task" || normalizedOptions.type === "all") {
    const taskWhere: Record<string, unknown> = { type: "task" };
    if (normalizedOptions.status) {
      taskWhere.status = normalizedOptions.status;
    }

    tasks = await todoRepository.find({
      where: taskWhere,
    });
  }

  const reminderIds = activeReminders.map((t) => t.id);
  const allTodoIds = [...reminderIds, ...tasks.map((t) => t.id)];

  const [todayChecks, completionChecks] = await Promise.all([
    reminderIds.length > 0
      ? checkRepository.find({
          where: { todo: In(reminderIds), timestamp: Like(`${todayString}%`) },
          relations: ["todo"],
        })
      : Promise.resolve([]),
    allTodoIds.length > 0
      ? checkRepository.find({
          where: { todo: In(allTodoIds), checked: 1 },
          order: { timestamp: "DESC", hour: "DESC" },
          relations: ["todo"],
        })
      : Promise.resolve([]),
  ]);

  const lastCheckedHourMap = new Map<number, string>();
  for (const check of completionChecks) {
    if (check.todo?.id && !lastCheckedHourMap.has(check.todo.id) && check.hour) {
      lastCheckedHourMap.set(check.todo.id, check.hour);
    }
  }

  const items: TodoItem[] = [];

  for (const todo of activeReminders) {
    const checked = todayChecks.find((c) => c.todo?.id === todo.id)?.checked ?? 0;
    if (normalizedOptions.onlyUnchecked && checked === 1) continue;
    if (normalizedOptions.status && (checked === 1 ? "done" : "todo") !== normalizedOptions.status) continue;

    const checkedHour = lastCheckedHourMap.get(todo.id) ?? "";

    items.push({
      id: todo.id,
      title: todo.title,
      checked,
      priority: todo.priority ?? "medium",
      sponsor: todo.sponsor ?? "",
      usualCompletionTime: checkedHour,
      lastCheckedHour: checkedHour,
      type: "reminder",
      status: checked === 1 ? "done" : "todo",
      description: todo.description ?? null,
      order: todo.order ?? 0,
      createdAt: todo.createdAt ? format(new Date(todo.createdAt), "yyyy-MM-dd") : todayString,
      completedAt: todo.completedAt ? format(new Date(todo.completedAt), "yyyy-MM-dd HH:mm") : null,
    });
  }

  for (const task of tasks) {
    const isDone = task.status === "done";
    if (normalizedOptions.onlyUnchecked && isDone) continue;

    let checkedHour = lastCheckedHourMap.get(task.id) ?? "";
    if (!checkedHour && task.completedAt) {
      try {
        checkedHour = format(new Date(task.completedAt), "HH:mm");
      } catch {
        // Ignore parsing error
      }
    }

    items.push({
      id: task.id,
      title: task.title,
      checked: isDone ? 1 : 0,
      priority: task.priority ?? "medium",
      sponsor: task.sponsor ?? "",
      usualCompletionTime: checkedHour,
      lastCheckedHour: checkedHour,
      type: "task",
      status: (task.status as TaskStatus) || "todo",
      description: task.description ?? null,
      order: task.order ?? 0,
      createdAt: task.createdAt ? format(new Date(task.createdAt), "yyyy-MM-dd") : todayString,
      completedAt: task.completedAt ? format(new Date(task.completedAt), "yyyy-MM-dd HH:mm") : null,
    });
  }

  const orderBy = normalizedOptions.orderBy ?? "lastCheckedHour";

  // Sort: unchecked first, then by lastCheckedHour (if requested), then priority / order / title
  const sorted = [...items].sort((a, b) => {
    if (a.checked !== b.checked) {
      return a.checked - b.checked;
    }

    if (orderBy === "lastCheckedHour") {
      const hourA = a.lastCheckedHour || a.usualCompletionTime || "";
      const hourB = b.lastCheckedHour || b.usualCompletionTime || "";

      if (hourA && hourB) {
        if (hourA !== hourB) return hourA.localeCompare(hourB);
      } else if (hourA && !hourB) {
        return -1;
      } else if (!hourA && hourB) {
        return 1;
      }
    }

    if (a.type === "task" && b.type === "task" && a.status === b.status) {
      if (a.order !== b.order) return a.order - b.order;
    }
    const priorityA = a.priority ? PRIORITY_WEIGHT[a.priority.toLowerCase()] ?? 99 : 99;
    const priorityB = b.priority ? PRIORITY_WEIGHT[b.priority.toLowerCase()] ?? 99 : 99;
    if (priorityA !== priorityB) return priorityA - priorityB;
    return a.title.localeCompare(b.title);
  });

  todoCache.set(cacheKey, sorted);
  return sorted;
}

export async function createTodo(input: CreateTodoInput): Promise<Todo> {
  const db = await getDb();
  const todoType: TodoType = input.type ?? "reminder";
  const initialStatus: TaskStatus = input.status ?? (todoType === "task" ? "todo" : "todo");

  let recurrence: TodoRecurrence | null = null;
  if (todoType === "reminder") {
    recurrence = await db.getRepository(TodoRecurrence).save({
      repeat: input.repeat ? 1 : 0,
      weeklyInterval: input.weeklyInterval ?? 1,
      weeklyDays: Array.isArray(input.weeklyDays) ? input.weeklyDays.join(",") : input.weeklyDays ?? null,
      weeklyEnd: input.weeklyEnd == null ? null : String(input.weeklyEnd),
    });
  }

  const todoRepository = db.getRepository(Todo);
  let order = input.order;
  if (order === undefined && todoType === "task") {
    const highestOrder = await todoRepository
      .createQueryBuilder("todo")
      .where("todo.type = :type AND todo.status = :status", { type: "task", status: initialStatus })
      .select("MAX(todo.order)", "max")
      .getRawOne<{ max: number | null }>();
    order = (highestOrder?.max ?? -1) + 1;
  }

  const todo = await todoRepository.save({
    title: input.title.trim(),
    type: todoType,
    status: initialStatus,
    description: input.description ?? null,
    order: order ?? 0,
    priority: input.priority ?? "medium",
    createdAt: new Date(),
    recurrence,
  });

  if (todoType === "reminder") {
    await db.getRepository(TodoCheck).save({
      id: uuidv4(),
      timestamp: format(new Date(), "yyyy-MM-dd"),
      hour: format(new Date(), "HH:mm"),
      checked: input.checked ?? 0,
      todo,
    });
  }

  todoCache.clear();
  return todo;
}

export async function updateTodo(input: UpdateTodoInput): Promise<void> {
  const db = await getDb();
  const todoRepository = db.getRepository(Todo);
  const todo = await todoRepository.findOne({ where: { id: input.id } });
  if (!todo) throw new Error("Todo not found");

  const updates: Partial<Todo> = {};

  if (input.title !== undefined) updates.title = input.title.trim();
  if (input.priority !== undefined) updates.priority = input.priority;
  if (input.description !== undefined) updates.description = input.description;
  if (input.order !== undefined) updates.order = input.order;

  if (input.status !== undefined) {
    updates.status = input.status;
    if (input.status === "done") {
      updates.completedAt = new Date();
    } else if (todo.status === "done") {
      updates.completedAt = null;
    }
  } else if (input.checked !== undefined && todo.type === "task") {
    if (input.checked === 1) {
      updates.status = "done";
      updates.completedAt = new Date();
    } else {
      updates.status = "todo";
      updates.completedAt = null;
    }
  }

  if (Object.keys(updates).length > 0) {
    await todoRepository.update({ id: input.id }, updates);
  }

  // Update TodoCheck for reminders or when checked/status is explicitly provided
  if (todo.type === "reminder" || input.checked !== undefined || input.status !== undefined) {
    const checkedVal =
      input.checked !== undefined
        ? input.checked
        : input.status === "done"
          ? 1
          : 0;

    const timestamp = format(new Date(), "yyyy-MM-dd");
    const checkRepository = db.getRepository(TodoCheck);
    const existing = await checkRepository.findOne({
      where: { todo: { id: input.id }, timestamp },
      relations: ["todo"],
    });
    if (existing) {
      await checkRepository.update(
        { id: existing.id },
        { checked: checkedVal, hour: format(new Date(), "HH:mm") },
      );
    } else {
      await checkRepository.save({
        id: uuidv4(),
        timestamp,
        hour: format(new Date(), "HH:mm"),
        checked: checkedVal,
        todo,
      });
    }
  }

  todoCache.clear();
}

export async function deleteTodo(id: number): Promise<void> {
  const db = await getDb();
  const todoRepository = db.getRepository(Todo);
  const checkRepository = db.getRepository(TodoCheck);
  const todo = await todoRepository.findOne({ where: { id }, relations: ["recurrence"] });
  if (!todo) throw new Error("Todo not found");

  await checkRepository.delete({ todo: { id } });
  await todoRepository.delete({ id });
  if (todo.recurrence?.id) {
    await db.getRepository(TodoRecurrence).delete({ id: todo.recurrence.id });
  }
  todoCache.clear();
}
