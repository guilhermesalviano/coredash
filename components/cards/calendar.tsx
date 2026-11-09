import Card from "../card";
import { differenceInDays, parse, startOfDay } from "date-fns";
import { translate, type Locale } from "@/lib/i18n";

const EVENT_MAPPING: Record<string, { emoji: string; bg: string; color: string }> = {
  birthday: { emoji: "🎂", bg: "bg-cyan-50", color: "text-cyan-700" },
  travel:   { emoji: "✈️", bg: "bg-orange-50", color: "text-orange-700" },
  default:  { emoji: "🚩", bg: "bg-slate-50", color: "text-slate-600" },
};

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function nextEventMessage(date: string, title: string, locale: Locale) {
  const eventDate = parse(date, "dd/MM/yyyy", new Date());
  if (isNaN(eventDate.getTime())) return translate(locale, "calendarNextOn", { title, date });
  const days = differenceInDays(startOfDay(eventDate), startOfDay(new Date()));
  if (days === 0) return translate(locale, "calendarTodayIs", { title });
  if (days < 0) return translate(locale, "calendarPassed", { title });
  return translate(locale, days === 1 ? "calendarInOneDay" : "calendarInDays", { days, title });
}

type TodayEvent = {
  id: string | number;
  color?: string;
  start: string;
  end: string;
  title: string;
};

type ImportantEvent = {
  id: string | number;
  type?: string;
  start: string;
  title: string;
};

type CalendarCardData = {
  todayEvents?: TodayEvent[];
  importantEvents?: ImportantEvent[];
};

export default function CalendarCard({ data, locale = "pt-BR" }: { data: CalendarCardData; locale?: Locale }) {
  const dateStr = new Date().toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });

  return (
    <Card>
      <h2 className="section-title mb-0!">📅 {translate(locale, "calendarTitle")}</h2>

      <div className="calendar-date my-1!">{dateStr}</div>

      <div className="calendar-events mb-1!">
        {!data.todayEvents?.length && (
          <div className="calendar-event" style={{ borderLeft: "3px solid #9CA3AF" }}>
            <span className="event-title">{translate(locale, "calendarEmpty")}</span>
          </div>
        )}
        {data.todayEvents?.map((ev) => {
          const separatorIdx = ev.title.indexOf(" - ");
          const calendarName = separatorIdx !== -1 ? ev.title.slice(0, separatorIdx) : null;
          const eventTitle = separatorIdx !== -1 ? ev.title.slice(separatorIdx + 3) : ev.title;
          return (
          <div key={ev.id} className="calendar-event max-sm:flex-col max-sm:gap-2!" style={{ borderLeft: `3px solid ${ev.color || "#9CA3AF"}` }}>
            <div className="flex items-center gap-2">
              {calendarName && <span className="event-title">{capitalize(calendarName)}:</span>}
              {ev.start === "All day" || ev.start === "Dia todo" ? (
                <span className="event-time">{translate(locale, "allDay")}</span>
              ) : (
                <>
                  <span className="event-time">{ev.start}</span>
                  <span>-</span>
                  <span className="event-time">{ev.end}</span>
                </>
              )}
            </div>
            <span className="event-title">{eventTitle}</span>
          </div>
        );
        })}
      </div>

      {data.importantEvents?.filter((ev) => ev.type == "birthday").map((ev) => {
        const m = EVENT_MAPPING[ev.type ?? "default"] ?? EVENT_MAPPING.default;
        return (
          <div key={ev.id} className={`flex items-center gap-2 text-[0.7rem] my-2! px-2! py-1! rounded-md font-medium animate-appear ${m.bg} ${m.color}`}>
            <span className={ev.type === "birthday" ? "animate-bounce" : ""}>{m.emoji}</span>
            <span>{nextEventMessage(ev.start, ev.title, locale)}</span>
          </div>
        );
      })}
    </Card>
  );
}