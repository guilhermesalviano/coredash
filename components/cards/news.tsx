"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import Card from "../card";

const NewsCard = () => {
  const { news } = useDashboard();
  const [blurred, setBlurred] = useState(true);

  if (!news.data?.length) return null;

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <h2 className="section-title">📰 Últimas Notícias</h2>
        <button
          onClick={() => setBlurred(b => !b)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-white/5"
          aria-label={blurred ? "Mostrar notícias" : "Ocultar notícias"}
        >
          {blurred ? <Eye size={14} /> : <EyeOff size={14} />}
          {blurred ? "Mostrar" : "Ocultar"}
        </button>
      </div>

      <div
        className="news-list transition-all duration-300 select-none"
        style={{ filter: blurred ? "blur(6px)" : "none", pointerEvents: blurred ? "none" : "auto" }}
      >
        {news.data.map((n: any) => (
          <div
            key={n.id}
            className="news-item cursor-pointer"
            onClick={() => window.open(n.url, "_blank")}
          >
            <span className="news-tag w-16">{n.tag}</span>
            <div>
              <div className="news-title max-w-82">{n.title}</div>
              <div className="news-source">{n.source}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default NewsCard;