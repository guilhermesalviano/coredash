export interface ForecastItem {
  timestamp: string;
  time: string;
  temp: number;
  condition: string;
  icon: string;
  code: number;
  precipitationProb?: number;
}

export interface DailyForecastItem {
  date: string;
  dayLabel: string;
  tempMax: number;
  tempMin: number;
  precipitationProb: number;
  code: number;
  icon: string;
}

export interface WeatherData {
  date: string;
  city: string;
  state: string;
  temp: number;
  feels: number;
  tempMax?: number;
  tempMin?: number;
  humidity?: number;
  windSpeed?: number;
  precipitationProb?: number;
  condition: string;
  icon: string;
  code: number;
  forecast: ForecastItem[];
  daily?: DailyForecastItem[];
}
