import { getResolvedRuntimeSettings } from '@/features/settings/server/runtime-settings';
import { CalendarEventsResponse } from '@/types/services';
import { addDays } from 'date-fns';
import { auth as googleAuth, calendar as createCalendar, type calendar_v3 } from '@googleapis/calendar';
import { globalSingleton } from '@/lib/global-singleton';
import logger from '@/lib/logger';
import { createMemoryCache } from '@/utils/in-memory-cache';

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

// One client per service account. Reusing it keeps the access token between
// requests instead of signing and exchanging a new JWT on every call.
const calendarClients = globalSingleton('calendarClients', () => new Map<string, calendar_v3.Calendar>());
// Calendar display names rarely change, so they are not re-fetched with the events.
const calendarNames = globalSingleton('calendarNames', () => createMemoryCache<string>(ONE_DAY_IN_MS));

function getCalendarClient(clientEmail: string, privateKey: string): calendar_v3.Calendar {
  const key = `${clientEmail}\n${privateKey}`;
  let client = calendarClients.get(key);
  if (!client) {
    const auth = new googleAuth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });
    client = createCalendar({ version: 'v3', auth });
    // Credentials changed in Settings: drop the previous client and its names.
    calendarClients.clear();
    calendarNames.clear();
    calendarClients.set(key, client);
  }
  return client;
}

async function getCalendarName(calendar: calendar_v3.Calendar, calendarId: string): Promise<string> {
  const cached = calendarNames.get(calendarId);
  if (cached) return cached;
  const meta = await calendar.calendars.get({ calendarId });
  const name = meta.data.summary || calendarId;
  calendarNames.set(calendarId, name);
  return name;
}

export async function fetchGoogleCalendarAPI(): Promise<CalendarEventsResponse> {
  const settings = await getResolvedRuntimeSettings();
  const calendarsIds = settings.calendarIds;

  if (!calendarsIds || calendarsIds.length === 0 || !settings.googleClientEmail || !settings.googlePrivateKey) {
    return [];
  }

  const calendar = getCalendarClient(settings.googleClientEmail, settings.googlePrivateKey);

  const now = new Date();

  const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(addDays(now, 14)).toISOString();

  // Calendars are independent, so they are fetched together. One failing
  // calendar is skipped and the order of the configured IDs is kept.
  const perCalendar = await Promise.all(calendarsIds.map(async (calendarId): Promise<CalendarEventsResponse> => {
    try {
      const [calendarName, response] = await Promise.all([
        getCalendarName(calendar, calendarId),
        calendar.events.list({
          calendarId: calendarId,
          timeMin: startOfDay,
          timeMax: endOfDay,
          timeZone: settings.timezone,
          singleEvents: true,
          orderBy: 'startTime',
        }),
      ]);

      if (response.status !== 200) {
        logger.warn(`Google Calendar: status ${response.status} for calendar "${calendarId}"`);
        return [];
      }

      const fetchedItems = (response.data.items as CalendarEventsResponse) || [];
      return fetchedItems.map((item) => ({ ...item, calendarName }));
    } catch (err) {
      // A service account needs explicit access to shared calendars — share it via Google Calendar settings
      logger.warn(`Google Calendar: failed to fetch calendar "${calendarId}": ${err}`);
      return [];
    }
  }));

  return perCalendar.flat();
}
