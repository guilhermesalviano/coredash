import { format, subDays } from "date-fns";
import { In, Like } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { ONE_MINUTE_IN_MS } from "@/constants";
import { getDatabaseConnection } from "@/lib/db";
import { createMemoryCache } from "@/utils/in-memory-cache";
import { Todo } from "@/entities/Todo";
import { TodoCheck } from "@/entities/TodoCheck";
import { TodoRecurrence } from "@/entities/TodoRecurrence";
import type { CreateTodoInput, TodoItem, UpdateTodoInput } from "@/features/todos/types";

const PRIORITY_WEIGHT: Record<string, number> = { high: 1, medium: 2, low: 3 };
const todoCache = createMemoryCache<TodoItem[]>(ONE_MINUTE_IN_MS);

export async function getTodos(onlyUnchecked = false): Promise<TodoItem[]> {
  const cached = todoCache.get("default");
  if (cached) return onlyUnchecked ? cached.filter((todo) => todo.checked === 0) : cached;

  const today = new Date();
  const todayString = format(today, "yyyy-MM-dd");
  const db = await getDatabaseConnection();
  const todoRepository = db.getRepository(Todo);
  const checkRepository = db.getRepository(TodoCheck);

  const todos = await todoRepository.find({
    where: [
      { createdAt: Like(`${todayString}%`) as unknown as Date },
      { recurrence: { repeat: 1, weeklyDays: Like(`%${today.getDay()}%`) } },
    ],
    relations: ["recurrence"],
  });

  const activeTodos = todos.filter((todo) => {
    const end = todo.recurrence?.weeklyEnd;
    if (end === null || end === undefined) return true;
    const endOfToday = new Date(today);
    endOfToday.setHours(0, 0, 0, 0);
    return Number(end) >= endOfToday.getTime();
  });

  const sortedTodos = [...activeTodos].sort((a, b) => {
    const priorityA = a.priority ? PRIORITY_WEIGHT[a.priority.toLowerCase()] ?? 99 : 99;
    const priorityB = b.priority ? PRIORITY_WEIGHT[b.priority.toLowerCase()] ?? 99 : 99;
    if (priorityA !== priorityB) return priorityA - priorityB;
    if (priorityA === 1) return a.title.localeCompare(b.title);
    return 0;
  });

  const ids = sortedTodos.map((todo) => todo.id);
  const [todayChecks, historyChecks] = await Promise.all([
    checkRepository.find({ where: { todo: In(ids), timestamp: Like(`${todayString}%`) }, relations: ["todo"] }),
    checkRepository.find({ where: { todo: In(ids), timestamp: Like(`${format(subDays(today, 1), "yyyy-MM-dd")}%`) }, relations: ["todo"] }),
  ]);

  const result = sortedTodos.map((todo): TodoItem => ({
    id: todo.id,
    title: todo.title,
    checked: todayChecks.find((check) => check.todo?.id === todo.id)?.checked ?? 0,
    priority: todo.priority ?? "",
    sponsor: todo.sponsor ?? "",
    usualCompletionTime: historyChecks.find((check) => check.todo?.id === todo.id)?.hour ?? "",
  }));

  todoCache.set("default", result);
  return onlyUnchecked ? result.filter((todo) => todo.checked === 0) : result;
}

export async function createTodo(input: CreateTodoInput) {
  const db = await getDatabaseConnection();
  const recurrence = await db.getRepository(TodoRecurrence).save({
    repeat: input.repeat ? 1 : 0,
    weeklyInterval: input.weeklyInterval ?? 1,
    weeklyDays: Array.isArray(input.weeklyDays) ? input.weeklyDays.join(",") : input.weeklyDays ?? null,
    weeklyEnd: input.weeklyEnd == null ? null : String(input.weeklyEnd),
  });
  const todo = await db.getRepository(Todo).save({
    title: input.title,
    priority: input.priority,
    createdAt: format(new Date(), "yyyy-MM-dd"),
    recurrence,
  });
  await db.getRepository(TodoCheck).save({
    id: uuidv4(),
    timestamp: format(new Date(), "yyyy-MM-dd"),
    hour: format(new Date(), "HH:mm"),
    checked: input.checked,
    todo,
  });
  todoCache.clear();
  return todo;
}

export async function updateTodo(input: UpdateTodoInput): Promise<void> {
  const db = await getDatabaseConnection();
  const todo = await db.getRepository(Todo).findOne({ where: { id: input.id } });
  if (!todo) throw new Error("Todo not found");

  const timestamp = format(new Date(), "yyyy-MM-dd");
  const repository = db.getRepository(TodoCheck);
  const existing = await repository.findOne({ where: { todo: { id: input.id }, timestamp }, relations: ["todo"] });
  if (existing) {
    await repository.update({ id: existing.id }, { checked: input.checked, hour: format(new Date(), "HH:mm") });
  } else {
    await repository.save({ id: uuidv4(), timestamp, hour: format(new Date(), "HH:mm"), checked: input.checked, todo });
  }
  todoCache.clear();
}

