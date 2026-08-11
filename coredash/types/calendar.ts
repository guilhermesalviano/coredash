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

export interface CalendarInternalAPIResponse {
  todayEvents: {
    id: string;
    start: string;
    end: string;
    title: string;
    type?: string;
    color?: string;
  }[],
  importantEvents: {
    id: string;
    start: string;
    end: string;
    title: string;
    type?: string;
    color?: string;
  }[],
  futureEvents?: {
    id: string;
    start: string;
    end: string;
    title: string;
    type?: string;
    color?: string;
  }[]
}