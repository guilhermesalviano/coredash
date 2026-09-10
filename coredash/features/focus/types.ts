import type { ForecastItem, WeatherData } from "@/features/weather/types";
import type { Priority, TodoType } from "@/types/task";

export interface FocusTodo {
  id: number;
  title: string;
  checked: number;
  priority: Priority;
  type?: TodoType;
}

export interface FocusCalendarEvent {
  id: string;
  start: string;
  end: string;
  startDateTime?: string;
  endDateTime?: string;
  title: string;
  type?: string;
  color?: string;
}

export interface FocusCalendarSelection {
  event: FocusCalendarEvent | null;
  isCurrent: boolean;
}

export interface FocusViewModel {
  calendar: FocusCalendarSelection;
  todos: FocusTodo[];
  weather: WeatherData | null;
  weatherAlert: ForecastItem | null;
}
