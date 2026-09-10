"use client";

import WeatherCardClient from "./cards/clients/weatherCardClient";
import CalendarCardClient from "./cards/clients/calendarCardClient";
import StocksCardClient from "@/components/cards/clients/stocksCardClient";
import StatusReporter from "./statusReporter";
import TodoCardClient from "./cards/clients/todoCardClient";
import NarrativeSummaryCard from "./cards/narrativeSummaryCard";
import SpotifyCard from "./cards/spotify";
import GmailCard from "./cards/gmail";
import { CardId, useActiveCards } from "@/hooks/useActiveCards";
import NewsCard from "./cards/news";
import WishlistDropsCard from "./cards/wishlistDrops";

const isWeekend = [0, 6].includes(new Date().getDay());

const CARD_MAP: Record<CardId, React.ComponentType | null> = {
  weather:   WeatherCardClient,
  narrative: NarrativeSummaryCard,
  calendar:  CalendarCardClient,
  gmail:     GmailCard,
  todo:      TodoCardClient,
  spotify:   SpotifyCard,
  stocks:    isWeekend ? null : StocksCardClient,
  news:     NewsCard,
  wishlistDrops: WishlistDropsCard,
};

export default function ActiveCards() {
  const { active, mounted } = useActiveCards();

  const autoSuccessStatuses = [
    ...(isWeekend ? ["stocks"] : []),
  ];

  if (!mounted) return null;

  const cards = active
    .map((id) => ({ id, Component: CARD_MAP[id] }))
    .filter((c): c is { id: CardId; Component: React.ComponentType } => !!c.Component);

  return (
    <>
      {autoSuccessStatuses.length > 0 && (
        <StatusReporter statuses={autoSuccessStatuses} />
      )}

      <div className="gap-4 m-4!" style={{ columns: "25rem" }}>
        {cards.map(({ id, Component }) => (
          <div key={id} style={{ breakInside: "avoid", marginBottom: "1rem" }}>
            <Component />
          </div>
        ))}
      </div>
    </>
  );
}
