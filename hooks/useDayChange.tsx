import { useEffect, useRef } from 'react';

export function useDayChange(onDayChange: (newDay: string) => void) {
  const lastDate = useRef(new Date().toDateString());
  const onDayChangeRef = useRef(onDayChange);

  useEffect(() => {
    onDayChangeRef.current = onDayChange;
  }, [onDayChange]);

  useEffect(() => {
    function checkDayChange() {
      const today = new Date().toDateString();
      if (today !== lastDate.current) {
        lastDate.current = today;
        console.log("[log]: day changed.");
        onDayChangeRef.current(today);
      }
    }

    function scheduleAtMidnight() {
      const now = new Date();
      const msUntilMidnight =
        new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();

      const timeout = setTimeout(() => {
        checkDayChange();
        scheduleAtMidnight();
      }, msUntilMidnight);

      return timeout;
    }

    const timeout = scheduleAtMidnight();

    // Browsers throttle/pause timers in hidden tabs and on sleeping devices.
    // Re-check whenever the page becomes visible again or the window regains focus.
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') checkDayChange();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkDayChange);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkDayChange);
    };
  }, []);
}