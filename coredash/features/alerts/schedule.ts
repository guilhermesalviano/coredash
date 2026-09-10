import type { ScheduledAlert } from "./types";

export const ALERT_DURATION_MS = 10_000;
export const CATCH_UP_MS = 5 * 60_000;
export const RAIN_COOLDOWN_MS = 6 * 60 * 60_000;

const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);

export function localDateKey(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function getDueScheduledAlerts(
  schedule: readonly ScheduledAlert[],
  now: Date,
  delivered: ReadonlySet<string>,
): ScheduledAlert[] {
  const day = localDateKey(now);
  return schedule.flatMap((alert) => {
    const due = new Date(now);
    due.setHours(alert.hour, alert.minute, 0, 0);
    const age = now.getTime() - due.getTime();
    const id = `${day}:${alert.id}`;
    return age >= 0 && age <= CATCH_UP_MS && !delivered.has(id)
      ? [{ ...alert, id }]
      : [];
  });
}

export function shouldShowRainAlert(code: number | undefined, lastShown: number | null, now: Date): boolean {
  const hour = now.getHours();
  if (hour >= 21 || hour < 7 || code === undefined || !RAIN_CODES.has(code)) return false;
  return lastShown === null || !Number.isFinite(lastShown) || now.getTime() - lastShown >= RAIN_COOLDOWN_MS;
}
