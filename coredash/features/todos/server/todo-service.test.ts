import "reflect-metadata";
import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import { DataSource } from "typeorm";
import { Todo } from "@/entities/Todo";
import { TodoCheck } from "@/entities/TodoCheck";
import { TodoRecurrence } from "@/entities/TodoRecurrence";
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
