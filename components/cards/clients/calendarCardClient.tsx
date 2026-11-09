"use client";

import { useCallback, useEffect, useState } from "react";
import { useStatus } from "@/contexts/statusContext";
import { useLocale } from "@/contexts/localeContext";
import { useDayChange } from "@/hooks/useDayChange";
import { ApiClientError, fetchJson } from "@/lib/api-client";
import type { CalendarInternalAPIResponse } from "@/types/calendar";
import CalendarCard from "../calendar";
import CardState from "../../cardState";

export default function CalendarCardClient() {
  const [calendar, setCalendar] = useState<CalendarInternalAPIResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const { reportStatus } = useStatus();
  const { locale, t } = useLocale();

  const fetchCalendar = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await fetchJson<CalendarInternalAPIResponse>("/api/calendar");
      setCalendar(data);
      setStatus("success");
      setErrorCode(null);
      reportStatus("calendar", "success");
    } catch (error: unknown) {
      setStatus("error");
      setErrorCode(error instanceof ApiClientError && error.status === 504 ? "timeout" : "failed");
      reportStatus("calendar", "error");
    }
  }, [reportStatus]);

  useDayChange(() => { void fetchCalendar(); });
  useEffect(() => { void fetchCalendar(); }, [fetchCalendar]);

  if (status === "loading" && !calendar) {
    return <CardState title={t("calendarTitle")} message={t("calendarLoading")} loading />;
  }
  if (status === "error" && !calendar) {
    return (
      <CardState
        title={t("calendarTitle")}
        message={errorCode === "timeout" ? t("errorTimeout") : t("calendarError")}
        onRetry={() => { void fetchCalendar(); }}
      />
    );
  }
  if (!calendar) return null;

  return <CalendarCard data={calendar} locale={locale} />;
}
