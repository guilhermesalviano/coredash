import assert from "node:assert/strict";
import test from "node:test";
import { selectFocusCalendarEvent, selectFocusView, selectWeatherAlert } from "./select-focus";
import type { FocusCalendarEvent, FocusTodo } from "./types";
import type { WeatherData } from "@/features/weather/types";

const events: FocusCalendarEvent[] = [
  {
    id: "current",
    start: "10:00",
    end: "11:00",
    startDateTime: "2026-09-09T10:00:00-03:00",
    endDateTime: "2026-09-09T11:00:00-03:00",
    title: "Current meeting",
  },
  {
    id: "next",
    start: "14:00",
    end: "15:00",
    startDateTime: "2026-09-09T14:00:00-03:00",
    endDateTime: "2026-09-09T15:00:00-03:00",
    title: "Next meeting",
  },
];

const todos: FocusTodo[] = [
  { id: 1, title: "High priority", checked: 0, priority: "high" },
  { id: 2, title: "Medium priority", checked: 0, priority: "medium" },
  { id: 3, title: "Low priority", checked: 0, priority: "low" },
  { id: 4, title: "Later task", checked: 0, priority: "low" },
];

const weather: WeatherData = {
  date: "2026-09-09",
  city: "São Paulo",
  state: "SP",
  temp: 22,
  feels: 22,
  condition: "Nublado",
  icon: "☁️",
  code: 3,
  forecast: [
    { timestamp: "2026-09-09T12:00:00-03:00", time: "12h", temp: 23, condition: "Chuva", icon: "🌧️", code: 61 },
    { timestamp: "2026-09-09T18:00:00-03:00", time: "18h", temp: 20, condition: "Chuva", icon: "🌧️", code: 61 },
  ],
};

test("selects the event happening now before the next event", () => {
  const selection = selectFocusCalendarEvent(events, new Date("2026-09-09T10:30:00-03:00"));
  assert.equal(selection.event?.id, "current");
  assert.equal(selection.isCurrent, true);
});

test("selects the next event when no event is active", () => {
  const selection = selectFocusCalendarEvent(events, new Date("2026-09-09T12:00:00-03:00"));
  assert.equal(selection.event?.id, "next");
  assert.equal(selection.isCurrent, false);
});

test("limits focused todos to the first three", () => {
  const view = selectFocusView([], todos, weather, new Date("2026-09-09T09:00:00-03:00"));
  assert.deepEqual(view.todos.map((todo) => todo.id), [1, 2, 3]);
});

test("selects rain only within the three-hour weather horizon", () => {
  const alert = selectWeatherAlert(weather, new Date("2026-09-09T09:30:00-03:00"));
  assert.equal(alert?.time, "12h");

  const noAlert = selectWeatherAlert(weather, new Date("2026-09-09T19:00:00-03:00"));
  assert.equal(noAlert, null);
});

test("filters focused todos to shows only reminders", () => {
  const mixedTodos: FocusTodo[] = [
    { id: 10, title: "Persistent Task 1", checked: 0, priority: "high", type: "task" },
    { id: 11, title: "Reminder 1", checked: 0, priority: "medium", type: "reminder" },
    { id: 12, title: "Persistent Task 2", checked: 0, priority: "low", type: "task" },
    { id: 13, title: "Reminder 2", checked: 0, priority: "low", type: "reminder" },
  ];
  const view = selectFocusView([], mixedTodos, weather, new Date("2026-09-09T09:00:00-03:00"));
  assert.deepEqual(view.todos.map((todo) => todo.id), [11, 13]);
});
