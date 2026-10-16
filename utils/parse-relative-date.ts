export const parseRelativeDate = (dateStr: string): number => {
  const now = new Date().getTime();
  const amount = parseInt(dateStr.replace(/\D/g, "")) || 0;
  const lower = dateStr.toLowerCase();

  if (lower.includes("min")) return now - amount * 60 * 1000;
  if (lower.includes("hour")) return now - amount * 60 * 60 * 1000;
  if (lower.includes("day")) return now - amount * 24 * 60 * 60 * 1000;
  if (lower.includes("week")) return now - amount * 7 * 24 * 60 * 60 * 1000;
  if (lower.includes("month")) return now - amount * 30 * 24 * 60 * 60 * 1000;

  return now;
};