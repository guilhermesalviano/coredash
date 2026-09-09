"use client";

import { useDashboard } from "@/hooks/useDashboard";
import type { WeatherData } from "@/features/weather/types";
import WeatherCard from "../weather";
import Card from "../../card";

export default function WeatherCardClient() {
  const { weather } = useDashboard();

  if (weather.status === "idle" || weather.status === "loading") {
    return <Card className="weather-card">Carregando clima...</Card>;
  }
  if (weather.status === "error" || !weather.data) {
    return <Card className="weather-card">Erro na busca de dados, tente novamente.</Card>;
  }
  return <WeatherCard data={weather.data as WeatherData} />;
}
