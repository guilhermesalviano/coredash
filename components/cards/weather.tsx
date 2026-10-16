import { CloudRain, Droplets, Wind } from "lucide-react";
import Card from "../card";
import type { WeatherData } from "@/features/weather/types";

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export default function WeatherCard({ data }: { data: WeatherData }) {
  const hours = data.forecast.slice(0, 24);
  const temps = hours.map((h) => h.temp);
  const minTemp = temps.length > 0 ? Math.min(...temps) : data.temp - 5;
  const maxTemp = temps.length > 0 ? Math.max(...temps) : data.temp + 5;
  const tempRange = Math.max(4, maxTemp - minTemp);

  const chartWidth = 720;
  const chartHeight = 108;
  const padLeft = 18;
  const padRight = 18;
  const padTop = 26;
  const padBottom = 16;
  const innerWidth = chartWidth - padLeft - padRight;
  const innerHeight = chartHeight - padTop - padBottom;

  const points = hours.map((hour, idx) => {
    const x =
      hours.length > 1
        ? padLeft + (idx / (hours.length - 1)) * innerWidth
        : chartWidth / 2;
    const normalized = (hour.temp - minTemp) / tempRange;
    const y = padTop + (1 - normalized) * innerHeight;
    return { x, y, temp: hour.temp, label: hour.time.replace("h", "") };
  });

  const linePath = buildSmoothPath(points);
  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(chartHeight - 2).toFixed(1)} L ${points[0].x.toFixed(1)} ${(chartHeight - 2).toFixed(1)} Z`
      : "";

  const currentMarkerIndex = Math.min(4, Math.max(0, Math.floor(points.length * 0.2)));
  const markerPoint = points[currentMarkerIndex];

  const dailyList = data.daily && data.daily.length > 0 ? data.daily.slice(0, 7) : [];
  const hi = data.tempMax ?? maxTemp;
  const lo = data.tempMin ?? minTemp;

  return (
    <Card className="wall-card wall-weather-card">
      <div className="wall-weather-top">
        <div className="wall-weather-current">
          <span className="wall-weather-main-icon" aria-hidden="true">
            {data.icon}
          </span>
          <span className="wall-weather-temp">{data.temp}°</span>
          <div className="wall-weather-summary">
            <span className="wall-weather-condition">{data.condition}</span>
            <span className="wall-weather-sub">
              {data.city} · Máx {hi}° · Mín {lo}°
            </span>
          </div>
        </div>

        <div className="wall-weather-pills">
          <div className="wall-weather-pill" title="Probabilidade de chuva">
            <CloudRain size={13} />
            <span>{data.precipitationProb ?? 0}%</span>
          </div>
          <div className="wall-weather-pill" title="Umidade relativa">
            <Droplets size={13} />
            <span>{data.humidity ?? 0}%</span>
          </div>
          <div className="wall-weather-pill" title="Velocidade do vento">
            <Wind size={13} />
            <span>{data.windSpeed ?? 0} km/h</span>
          </div>
        </div>
      </div>

      {points.length > 1 && (
        <div className="wall-weather-chart-wrap">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="wall-weather-svg"
            preserveAspectRatio="none"
            aria-label="Previsão horária de temperatura"
          >
            <defs>
              <linearGradient id="wallTempFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d97706" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#d97706" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {areaPath && <path d={areaPath} fill="url(#wallTempFill)" />}

            {markerPoint && (
              <line
                x1={markerPoint.x}
                y1={padTop - 8}
                x2={markerPoint.x}
                y2={chartHeight - 2}
                stroke="#e11d48"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                opacity="0.7"
              />
            )}

            <path
              d={linePath}
              fill="none"
              stroke="#d97706"
              strokeWidth="2.2"
              strokeLinecap="round"
            />

            {points.map((pt, idx) => {
              const showLabel =
                idx === 0 ||
                idx === points.length - 1 ||
                idx === currentMarkerIndex ||
                idx % 2 === 0;
              return (
                <g key={idx}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={idx === currentMarkerIndex ? 3.6 : 2.8}
                    fill="#d97706"
                    stroke="var(--surface)"
                    strokeWidth="1.4"
                  />
                  {showLabel && (
                    <text
                      x={pt.x}
                      y={pt.y - 8}
                      textAnchor="middle"
                      className="wall-chart-temp-label"
                    >
                      {pt.temp}°
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          <div className="wall-weather-hours-axis" aria-hidden="true">
            {points.map((pt, idx) =>
              idx % 2 === 0 ? (
                <span
                  key={idx}
                  className="wall-chart-hour-label"
                  style={{ left: `${(pt.x / chartWidth) * 100}%` }}
                >
                  {pt.label}
                </span>
              ) : null,
            )}
          </div>
        </div>
      )}

      {dailyList.length > 0 && (
        <div className="wall-weather-daily">
          {dailyList.map((day, idx) => (
            <div
              key={day.date}
              className={`wall-daily-item ${idx === 0 ? "wall-daily-item--today" : ""}`}
            >
              <span className="wall-daily-day">{day.dayLabel}</span>
              <span className="wall-daily-icon" aria-hidden="true">
                {day.icon}
              </span>
              <div className="wall-daily-temps">
                <span className="wall-daily-max">{day.tempMax}°</span>
                <span className="wall-daily-min">{day.tempMin}°</span>
                <span className="wall-daily-rain">{day.precipitationProb}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
