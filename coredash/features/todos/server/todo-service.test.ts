import "reflect-metadata";
import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import { DataSource } from "typeorm";
import { Todo } from "@/entities/Todo";
import { TodoCheck } from "@/entities/TodoCheck";
import { TodoRecurrence } from "@/entities/TodoRecurrence";
import { v4 as uuidv4 } from "uuid";
import {
  createTodo,
  deleteTodo,
  getTodos,
  setTodoDatabaseConnection,
  updateTodo,
} from "./todo-service";

const testDataSource = new DataSource({
  type: "sqlite",
  database: ":memory:",
  synchronize: true,
  entities: [Todo, TodoCheck, TodoRecurrence],
  logging: false,
});

before(async () => {
  await testDataSource.initialize();
  setTodoDatabaseConnection(testDataSource);
});

after(async () => {
  if (testDataSource.isInitialized) {
    await testDataSource.destroy();
  }
  setTodoDatabaseConnection(null);
});

test("creates and retrieves a persistent kanban task", async () => {
  const task = await createTodo({
    title: "Implement Kanban Board",
    type: "task",
    status: "todo",
    priority: "high",
    description: "Build 4 columns and drag and drop",
  });

  assert.equal(task.title, "Implement Kanban Board");
  assert.equal(task.type, "task");
  assert.equal(task.status, "todo");
  assert.equal(task.description, "Build 4 columns and drag and drop");

  const tasks = await getTodos({ type: "task" });
  const found = tasks.find((t) => t.id === task.id);
  assert.ok(found);
  assert.equal(found.type, "task");
  assert.equal(found.status, "todo");
  assert.equal(found.checked, 0);

  // Clean up
  await deleteTodo(task.id);
});

test("updates task status and synchronizes completedAt and checked", async () => {
  const task = await createTodo({
    title: "Test Task Status Transitions",
    type: "task",
    status: "backlog",
    priority: "medium",
  });

  // Move from backlog to in_progress
  await updateTodo({ id: task.id, status: "in_progress" });
  let tasks = await getTodos({ type: "task" });
  let found = tasks.find((t) => t.id === task.id);
  assert.equal(found?.status, "in_progress");
  assert.equal(found?.checked, 0);
  assert.equal(found?.completedAt, null);

  // Move to done
  await updateTodo({ id: task.id, status: "done" });
  tasks = await getTodos({ type: "task" });
  found = tasks.find((t) => t.id === task.id);
  assert.equal(found?.status, "done");
  assert.equal(found?.checked, 1);
  assert.ok(found?.completedAt);

  // Move back to todo
  await updateTodo({ id: task.id, status: "todo" });
  tasks = await getTodos({ type: "task" });
  found = tasks.find((t) => t.id === task.id);
  assert.equal(found?.status, "todo");
  assert.equal(found?.checked, 0);
  assert.equal(found?.completedAt, null);

  // Clean up
  await deleteTodo(task.id);
});

test("creates and completes a reminder todo", async () => {
  const reminder = await createTodo({
    title: "Morning Routine Reminder",
    type: "reminder",
    priority: "low",
  });

  assert.equal(reminder.type, "reminder");

  const reminders = await getTodos({ type: "reminder" });
  const found = reminders.find((r) => r.id === reminder.id);
  assert.ok(found);
  assert.equal(found.type, "reminder");
  assert.equal(found.checked, 0);

  // Toggle check to completed
  await updateTodo({ id: reminder.id, checked: 1 });
  const updatedReminders = await getTodos({ type: "reminder" });
  const updated = updatedReminders.find((r) => r.id === reminder.id);
  assert.equal(updated?.checked, 1);
  assert.equal(updated?.status, "done");

  // Clean up
  await deleteTodo(reminder.id);
});

test("supports recurrence with ISO date and timestamp weeklyEnd", async () => {
  const todayDay = new Date().getDay();
  const futureIso = "2099-12-31";
  const pastIso = "2000-01-01";

  const activeTodo = await createTodo({
    title: "Recurring Active Todo",
    type: "reminder",
    repeat: true,
    weeklyDays: [todayDay],
    weeklyEnd: futureIso,
  });

  const expiredTodo = await createTodo({
    title: "Recurring Expired Todo",
    type: "reminder",
    repeat: true,
    weeklyDays: [todayDay],
    weeklyEnd: pastIso,
  });

  const todos = await getTodos({ type: "reminder" });
  assert.ok(todos.some((t) => t.id === activeTodo.id));
  assert.ok(!todos.some((t) => t.id === expiredTodo.id));

  await deleteTodo(activeTodo.id);
  await deleteTodo(expiredTodo.id);
});

test("returns todos ordered by last checked hour chronologically", async () => {
  const t1 = await createTodo({ title: "Afternoon Task", type: "reminder", priority: "low" });
  const t2 = await createTodo({ title: "Morning Task", type: "reminder", priority: "medium" });
  const t3 = await createTodo({ title: "Lunch Task", type: "reminder", priority: "high" });

  const checkRepo = testDataSource.getRepository(TodoCheck);
  await checkRepo.save([
    { id: uuidv4(), timestamp: "2026-09-08", hour: "14:30", checked: 1, todo: t1 },
    { id: uuidv4(), timestamp: "2026-09-09", hour: "08:15", checked: 1, todo: t2 },
    { id: uuidv4(), timestamp: "2026-09-09", hour: "12:00", checked: 1, todo: t3 },
  ]);

  const todos = await getTodos({ type: "reminder", onlyUnchecked: true });
  const ids = todos.map((t) => t.id);

  const idxT1 = ids.indexOf(t1.id);
  const idxT2 = ids.indexOf(t2.id);
  const idxT3 = ids.indexOf(t3.id);

  assert.ok(idxT2 < idxT3, "08:15 Morning Task must precede 12:00 Lunch Task");
  assert.ok(idxT3 < idxT1, "12:00 Lunch Task must precede 14:30 Afternoon Task");

  const itemT2 = todos.find((t) => t.id === t2.id);
  assert.equal(itemT2?.lastCheckedHour, "08:15");
  assert.equal(itemT2?.usualCompletionTime, "08:15");

  await deleteTodo(t1.id);
  await deleteTodo(t2.id);
  await deleteTodo(t3.id);
});

test("places items without last checked hour after timed items, sorted by priority", async () => {
  const timed = await createTodo({ title: "Timed Item", type: "reminder", priority: "low" });
  const highUntimed = await createTodo({ title: "High Untimed", type: "task", priority: "high" });
  const mediumUntimed = await createTodo({ title: "Medium Untimed", type: "task", priority: "medium" });

  const checkRepo = testDataSource.getRepository(TodoCheck);
  await checkRepo.save([
    { id: uuidv4(), timestamp: "2026-09-09", hour: "16:00", checked: 1, todo: timed },
  ]);

  const todos = await getTodos({ type: "all", onlyUnchecked: true });
  const ids = todos.map((t) => t.id);

  const idxTimed = ids.indexOf(timed.id);
  const idxHigh = ids.indexOf(highUntimed.id);
  const idxMed = ids.indexOf(mediumUntimed.id);

  assert.ok(idxTimed < idxHigh, "Timed item must precede untimed items");
  assert.ok(idxHigh < idxMed, "High priority untimed must precede medium priority untimed");

  await deleteTodo(timed.id);
  await deleteTodo(highUntimed.id);
  await deleteTodo(mediumUntimed.id);
});

test("records TodoCheck completion hour when task status updates to done", async () => {
  const task = await createTodo({ title: "Status Update Task", type: "task", status: "todo" });

  await updateTodo({ id: task.id, status: "done" });

  const checkRepo = testDataSource.getRepository(TodoCheck);
  const check = await checkRepo.findOne({
    where: { todo: { id: task.id }, checked: 1 },
    relations: ["todo"],
  });

  assert.ok(check, "TodoCheck record with checked: 1 should exist");
  assert.match(check.hour, /^\d{2}:\d{2}$/);

  await deleteTodo(task.id);
});

