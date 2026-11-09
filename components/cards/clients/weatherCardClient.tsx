"use client";

import { useDashboardSlice } from "@/hooks/useDashboard";
import { retrySlice } from "@/lib/dashboardStore";
import { errorCopy } from "@/lib/i18n";
import { useLocale } from "@/contexts/localeContext";
import type { WeatherData } from "@/features/weather/types";
import WeatherCard from "../weather";
import CardState from "../../cardState";

export default function WeatherCardClient() {
  const weather = useDashboardSlice("weather");
  const { locale, t } = useLocale();

  if ((weather.status === "idle" || weather.status === "loading") && !weather.data) {
    return <CardState title={t("weatherTitle")} message={t("weatherLoading")} loading />;
  }
  if (weather.status === "error" && !weather.data) {
    return (
      <CardState
        title={t("weatherTitle")}
        message={errorCopy(weather.error, locale)}
        onRetry={() => { void retrySlice("weather"); }}
      />
    );
  }
  if (!weather.data) return null;
  return <WeatherCard data={weather.data as WeatherData} />;
}
