"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useDashboardSlice } from "@/hooks/useDashboard";
import { retrySlice } from "@/lib/dashboardStore";
import { errorCopy } from "@/lib/i18n";
import { useLocale } from "@/contexts/localeContext";
import Card from "../card";
import CardState from "../cardState";

const NewsCard = () => {
  const news = useDashboardSlice("news");
  const { locale, t } = useLocale();
  const [blurred, setBlurred] = useState(true);

  if ((news.status === "idle" || news.status === "loading") && !news.data) {
    return <CardState title={t("newsTitle")} message={t("newsLoading")} loading />;
  }
  if (news.status === "error" && !news.data?.length) {
    return (
      <CardState
        title={t("newsTitle")}
        message={news.error ? errorCopy(news.error, locale) : t("newsError")}
        onRetry={() => { void retrySlice("news"); }}
      />
    );
  }
  if (!news.data?.length) return null;

  return (
    <Card>
      <div className="flex items-center justify-between mb-2 gap-2">
        <h2 className="section-title">📰 {t("newsTitle")}</h2>
        <button
          type="button"
          onClick={() => setBlurred((value) => !value)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-white/5"
          aria-label={blurred ? t("newsShowLabel") : t("newsHideLabel")}
        >
          {blurred ? <Eye size={14} /> : <EyeOff size={14} />}
          {blurred ? t("newsShow") : t("newsHide")}
        </button>
      </div>

      <div
        className="news-list transition-all duration-300 select-none"
        style={{ filter: blurred ? "blur(6px)" : "none", pointerEvents: blurred ? "none" : "auto" }}
      >
        {news.data.map((item) => (
          <div
            key={item.id}
            className="news-item cursor-pointer"
            onClick={() => { if (item.url) window.open(item.url, "_blank", "noopener,noreferrer"); }}
          >
            <span className="news-tag">{item.tag}</span>
            <div className="min-w-0">
              <div className="news-title">{item.title}</div>
              <div className="news-source">{item.source}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default NewsCard;
