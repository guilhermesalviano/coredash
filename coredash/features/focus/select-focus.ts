import type { ForecastItem, WeatherData } from "@/features/weather/types";
import type { FocusCalendarEvent, FocusCalendarSelection, FocusTodo } from "./types";

const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 85, 86, 95, 96, 99]);

function localTimeFromLabel(label: string, now: Date): number | null {
  const match = label.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const date = new Date(now);
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date.getTime();
}

function eventStart(event: FocusCalendarEvent, now: Date): number | null {
  if (event.startDateTime) {
    const timestamp = Date.parse(event.startDateTime);
    if (!Number.isNaN(timestamp)) return timestamp;
  }
  return localTimeFromLabel(event.start, now);
}

function eventEnd(event: FocusCalendarEvent, now: Date, start: number): number {
  if (event.endDateTime) {
    const timestamp = Date.parse(event.endDateTime);
    if (!Number.isNaN(timestamp)) return timestamp;
  }
  return localTimeFromLabel(event.end, now) ?? start + 60 * 60 * 1000;
}

export function selectFocusCalendarEvent(
  events: FocusCalendarEvent[],
  now: Date,
): FocusCalendarSelection {
  const timedEvents = events
    .map((event) => ({ event, start: eventStart(event, now) }))
    .filter((item): item is { event: FocusCalendarEvent; start: number } => item.start !== null)
    .sort((a, b) => a.start - b.start);

  const currentTime = now.getTime();
  const current = timedEvents.find(({ event, start }) => currentTime >= start && currentTime <= eventEnd(event, now, start));
  if (current) return { event: current.event, isCurrent: true };

  const next = timedEvents.find(({ start }) => start > currentTime);
  if (next) return { event: next.event, isCurrent: false };

  const allDay = events.find((event) => event.start === "All day");
  return { event: allDay ?? null, isCurrent: Boolean(allDay) };
}

export function selectWeatherAlert(weather: WeatherData | null, now: Date): ForecastItem | null {
  if (!weather) return null;

  const horizon = now.getTime() + 3 * 60 * 60 * 1000;
  return weather.forecast.find((item) => {
    const timestamp = Date.parse(item.timestamp);
    return !Number.isNaN(timestamp) && timestamp >= now.getTime() && timestamp <= horizon && RAIN_CODES.has(item.code);
  }) ?? null;
}

export function selectFocusView(
  events: FocusCalendarEvent[],
  todos: FocusTodo[],
  weather: WeatherData | null,
  now: Date,
): { calendar: FocusCalendarSelection; todos: FocusTodo[]; weather: WeatherData | null; weatherAlert: ForecastItem | null } {
  return {
    calendar: selectFocusCalendarEvent(events, now),
    todos: todos.filter((todo) => !todo.type || todo.type === "reminder").slice(0, 3),
    weather,
    weatherAlert: selectWeatherAlert(weather, now),
  };
}
