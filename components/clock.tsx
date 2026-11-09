"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/contexts/localeContext";

export default function Clock() {
  const { locale, t } = useLocale();
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setTime(new Date());
    const initial = setTimeout(update, 0);
    const interval = setInterval(update, 1000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, []);

  return time?.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }) ?? t("clockLoading");
}
