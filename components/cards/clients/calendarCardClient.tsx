"use client";

import { useCallback, useEffect, useState } from "react";
import { useStatus } from "@/contexts/statusContext";
import { useDayChange } from "@/hooks/useDayChange";
import { fetchJson } from "@/lib/api-client";
import type { CalendarInternalAPIResponse } from "@/types/calendar";
import CalendarCard from "../calendar";

export default function CalendarCardClient() {
  const [calendar, setCalendar] = useState<any>(null);
  const { reportStatus } = useStatus();

  const fetchCalendar = useCallback(async () => {
    try {
      const data = await fetchJson<CalendarInternalAPIResponse>("/api/calendar");
      setCalendar(data);
      reportStatus("calendar", "success");
    } catch {
      reportStatus("calendar", "error");
    }
  }, [reportStatus]);

  useDayChange(() => fetchCalendar());

  useEffect(() => { fetchCalendar(); }, []);

  if (!calendar || calendar.length === 0) return null;

  return <CalendarCard data={calendar} />;
}
