export interface ForecastItem {
  timestamp: string;
  time: string;
  temp: number;
  condition: string;
  icon: string;
  code: number;
}

export interface WeatherData {
  date: string;
  city: string;
  state: string;
  temp: number;
  feels: number;
  condition: string;
  icon: string;
  code: number;
  forecast: ForecastItem[];
}
