import { useEffect, useState } from "react";

export const useClock = () => {
  const [time, setTime] = useState(() => {
    const n = new Date();
    return {
      h: String(n.getHours()).padStart(2, "0"),
      m: String(n.getMinutes()).padStart(2, "0"),
      s: String(n.getSeconds()).padStart(2, "0"),
      day: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][n.getDay()],
      date: n.getDate(),
      month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][n.getMonth()],
      hour: n.getHours(),
    };
  });

  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date();
      setTime({
        h: String(n.getHours()).padStart(2, "0"),
        m: String(n.getMinutes()).padStart(2, "0"),
        s: String(n.getSeconds()).padStart(2, "0"),
        day: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][n.getDay()],
        date: n.getDate(),
        month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][n.getMonth()],
        hour: n.getHours(),
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return time;
};