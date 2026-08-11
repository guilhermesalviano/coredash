import Card from "../card";
import { differenceInDays, parse, startOfDay } from "date-fns";

const EVENT_MAPPING: Record<string, { emoji: string; bg: string; color: string }> = {
  birthday: { emoji: "🎂", bg: "bg-cyan-50", color: "text-cyan-700" },
  travel:   { emoji: "✈️", bg: "bg-orange-50", color: "text-orange-700" },
  default:  { emoji: "🚩", bg: "bg-slate-50", color: "text-slate-600" },
};

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function nextEventMessage(date: string, title: string) {
  const eventDate = parse(date, "dd/MM/yyyy", new Date());
  if (isNaN(eventDate.getTime())) return `Próximo evento: ${title} em ${date}`;
  const days = differenceInDays(startOfDay(eventDate), startOfDay(new Date()));
  if (days === 0) return `Hoje é o ${title}!`;
  if (days < 0)  return `${title} já passou`;
  return `Faltam ${days} ${days === 1 ? "dia" : "dias"} para o ${title}`;
}

type TodayEvent = {
  id: string | number;
  color: string;
  start: string;
  end: string;
  title: string;
};

type ImportantEvent = {
  id: string | number;
  type: string;
  start: string;
  title: string;
};

type CalendarCardData = {
  todayEvents?: TodayEvent[];
  importantEvents?: ImportantEvent[];
};

export default function CalendarCard({ data }: { data: CalendarCardData }) {
  const dateStr = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <Card>
      <h2 className="section-title mb-0!">📅 Calendário</h2>

      <div className="calendar-date my-1!">{dateStr}</div>

      <div className="calendar-events mb-1!">
        {!data.todayEvents?.length && (
          <div className="calendar-event" style={{ borderLeft: "3px solid #9CA3AF" }}>
            <span className="event-title">Nenhum evento para hoje</span>
          </div>
        )}
        {data.todayEvents?.map((ev) => {
          const separatorIdx = ev.title.indexOf(" - ");
          const calendarName = separatorIdx !== -1 ? ev.title.slice(0, separatorIdx) : null;
          const eventTitle = separatorIdx !== -1 ? ev.title.slice(separatorIdx + 3) : ev.title;
          return (
          <div key={ev.id} className="calendar-event max-sm:flex-col max-sm:gap-2!" style={{ borderLeft: `3px solid ${ev.color}` }}>
            <div className="flex items-center gap-2">
              {calendarName && <span className="event-title">{capitalize(calendarName)}:</span>}
              {ev.start === "All day" ? (
                <span className="event-time">{ev.start}</span>
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
        const m = EVENT_MAPPING[ev.type] ?? EVENT_MAPPING.default;
        return (
          <div key={ev.id} className={`flex items-center gap-2 text-[0.7rem] my-2! px-2! py-1! rounded-md font-medium animate-appear ${m.bg} ${m.color}`}>
            <span className={ev.type === "birthday" ? "animate-bounce" : ""}>{m.emoji}</span>
            <span>{nextEventMessage(ev.start, ev.title)}</span>
          </div>
        );
      })}
    </Card>
  );
}