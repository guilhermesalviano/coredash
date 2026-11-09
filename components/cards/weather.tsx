"use client";

import Card from "../card";
import type { WeatherData } from "@/features/weather/types";
import { useLocale } from "@/contexts/localeContext";
import { translate, weatherCondition } from "@/lib/i18n";

const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 85, 86, 95, 96, 99]);
const FORECAST_HOURS = 7;

export function nextHours(forecast: WeatherData["forecast"], now = Date.now()) {
  const upcoming = forecast.filter((hour) => {
    const timestamp = Date.parse(hour.timestamp);
    return Number.isNaN(timestamp) || timestamp >= now - 30 * 60 * 1000;
  });
  return (upcoming.length > 0 ? upcoming : forecast).slice(0, FORECAST_HOURS);
}

function hourLabel(timestamp: string, locale: string, fallback: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleTimeString(locale, { hour: "2-digit" });
}

export default function WeatherCard({ data }: { data: WeatherData }) {
  const { locale } = useLocale();
  const raining = RAIN_CODES.has(data.code);
  const hours = nextHours(data.forecast);
  return (
    <Card className={raining ? "weather-card--raining" : "weather-card"}>
      <div className="weather-main">
        <div>
          <div className="weather-city">{data.city}</div>
          <div className="weather-temp">{data.temp}°</div>
          <div className="weather-condition">{weatherCondition(data.code, locale)}</div>
          <div className="weather-feels">{translate(locale, "weatherFeels", { temp: data.feels })}</div>
        </div>
        <div className="weather-icon-big">{data.icon}</div>
      </div>
      <div className="weather-hours">
        {hours.map((hour) => (
          <div key={hour.timestamp} className={`weather-hour ${RAIN_CODES.has(hour.code ?? -1) ? "weather-hour--raining" : ""}`}>
            <span className="weather-hour-time">{hourLabel(hour.timestamp, locale, hour.time)}</span>
            <span>{hour.icon}</span>
            <span className="weather-hour-temp">{hour.temp}°</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
