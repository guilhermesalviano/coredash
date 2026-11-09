import type { KeyboardEvent } from "react";

/** Keeps Tab and Shift+Tab inside the dialog that handles the event. */
export function trapFocus(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== "Tab") return;
  const dialog = event.currentTarget;
  const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
    'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]',
  )).filter((element) => element.tabIndex >= 0 && !element.matches(":disabled") && element.getClientRects().length > 0);
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;
  const target = event.shiftKey
    ? (active === first || active === dialog ? last : null)
    : (active === last || active === dialog ? first : null);
  if (target) {
    event.preventDefault();
    target.focus();
  }
}
