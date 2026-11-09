import Card from "../card";
import type { WeatherData } from "@/features/weather/types";

const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 85, 86, 95, 96, 99]);

export default function WeatherCard({ data }: { data: WeatherData }) {
  const raining = RAIN_CODES.has(data.code);
  return (
    <Card className={raining ? "weather-card--raining" : "weather-card"}>
      <div className="weather-main">
        <div>
          <div className="weather-city">{data.city}</div>
          <div className="weather-temp">{data.temp}°</div>
          <div className="weather-condition">{data.condition}</div>
          <div className="weather-feels">Sensação {data.feels}°C</div>
        </div>
        <div className="weather-icon-big">{data.icon}</div>
      </div>
      <div className="weather-hours">
        {data.forecast.map((hour) => (
          <div key={hour.timestamp} className={`weather-hour ${RAIN_CODES.has(hour.code ?? -1) ? "weather-hour--raining" : ""}`}>
            <span className="weather-hour-time">{hour.time}</span>
            <span>{hour.icon}</span>
            <span className="weather-hour-temp">{hour.temp}°</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
