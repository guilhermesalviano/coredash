export interface GoogleCalendarEvent {
  kind: string;
  etag: string;
  id: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  htmlLink: string;
  created: string;
  updated: string;
  summary: string;
  description?: string;
  location?: string;
  creator: {
    email: string;
    self?: boolean;
  };
  organizer: {
    email: string;
    self?: boolean;
  };
  start: {
    dateTime?: string;
    timeZone?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    timeZone?: string;
    date?: string;
  };
  recurringEventId?: string;
  originalStartTime?: {
    dateTime: string;
    timeZone: string;
  };
  calendarName?: string;
  iCalUID: string;
  sequence: number;
  reminders: {
    useDefault: boolean;
    overrides?: Array<{ method: string; minutes: number }>;
  };
  eventType: string;
}

export interface CalendarEventItem {
  id: string;
  start: string;
  end: string;
  startDateTime?: string;
  endDateTime?: string;
  title: string;
  summary?: string;
  calendarName?: string;
  location?: string;
  daysUntil?: number;
  type?: string;
  color?: string;
}

export interface CalendarInternalAPIResponse {
  todayEvents: CalendarEventItem[];
  nextDayEvents?: CalendarEventItem[];
  importantEvents: CalendarEventItem[];
  futureEvents?: CalendarEventItem[];
}
