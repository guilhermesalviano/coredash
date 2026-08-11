import { GOOGLE } from '@/config/config';
import { CalendarEventsResponse } from '@/types/services';
import { addDays } from 'date-fns';
import { google } from 'googleapis';
import logger from '@/lib/logger';

export async function fetchGoogleCalendarAPI(): Promise<CalendarEventsResponse> {
 const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: GOOGLE.clientEmail,
      private_key: GOOGLE.privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  });

  const calendar = google.calendar({ version: 'v3', auth });

  const now = new Date();

  const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(addDays(now, 7)).toISOString();

  const calendarsIds = GOOGLE.calendarIds;

  if (!calendarsIds || calendarsIds.length === 0) throw new Error("Env 'GOOGLE_CALENDAR_IDS' not defined.");

  let allEvents: CalendarEventsResponse = [];

  for (const calendarId of calendarsIds) {
    try {
      const [calendarMeta, response] = await Promise.all([
        calendar.calendars.get({ calendarId }),
        calendar.events.list({
          calendarId: calendarId,
          timeMin: startOfDay,
          timeMax: endOfDay,
          singleEvents: true,
          orderBy: 'startTime',
        }),
      ]);

      if (response.status !== 200) {
        logger.warn(`Google Calendar: status ${response.status} for calendar "${calendarId}"`);
        continue;
      }

      const calendarName = calendarMeta.data.summary || calendarId;
      const fetchedItems = (response.data.items as CalendarEventsResponse) || [];
      allEvents.push(...fetchedItems.map((item) => ({ ...item, calendarName })));
    } catch (err) {
      // A service account needs explicit access to shared calendars — share it via Google Calendar settings
      logger.warn(`Google Calendar: failed to fetch calendar "${calendarId}": ${err}`);
    }
  }

  return allEvents;
}