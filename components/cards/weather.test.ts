import assert from "node:assert/strict";
import test from "node:test";
import type { ForecastItem } from "@/features/weather/types";
import { nextHours } from "./weather";

function hour(timestamp: string): ForecastItem {
  return { timestamp, time: timestamp.slice(11, 13) + "h", temp: 20, condition: "Clear", icon: "☀️", code: 0 };
}

test("weather card keeps only the next 7 hours", () => {
  const now = Date.parse("2026-11-09T10:10:00-03:00");
  const forecast = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now + index * 60 * 60 * 1000);
    return hour(date.toISOString());
  });

  const shown = nextHours(forecast, now);
  assert.equal(shown.length, 7);
  assert.equal(shown[0].timestamp, forecast[0].timestamp);
  assert.equal(shown[6].timestamp, forecast[6].timestamp);
});

test("weather card drops hours that already passed", () => {
  const now = Date.parse("2026-11-09T10:10:00-03:00");
  const past = hour(new Date(now - 2 * 60 * 60 * 1000).toISOString());
  const upcoming = Array.from({ length: 8 }, (_, index) => hour(new Date(now + index * 60 * 60 * 1000).toISOString()));

  const shown = nextHours([past, ...upcoming], now);
  assert.equal(shown.length, 7);
  assert.equal(shown[0].timestamp, upcoming[0].timestamp);
});
