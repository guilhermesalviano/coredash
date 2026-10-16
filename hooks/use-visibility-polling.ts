import { useEffect } from "react";

export function useVisibilityPolling(
  callback: () => void | Promise<void>,
  intervalMs: number,
) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const schedule = () => {
      if (disposed || document.visibilityState !== "visible") return;
      timer = setTimeout(() => {
        timer = null;
        if (document.visibilityState === "visible") void callback();
        schedule();
      }, intervalMs);
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState !== "visible") {
        if (timer) clearTimeout(timer);
        timer = null;
        return;
      }
      void callback();
      if (timer) clearTimeout(timer);
      timer = null;
      schedule();
    };

    void callback();
    schedule();
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [callback, intervalMs]);
}
