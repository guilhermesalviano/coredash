"use client";

import Card from "../card";
import type { StockInternalAPIResponse } from "@/types/stock-api";
import { useLocale } from "@/contexts/localeContext";

export default function StocksCard({ data }: { data: StockInternalAPIResponse[] }) {
  const { locale, t } = useLocale();
  const money = new Intl.NumberFormat(locale, { style: "currency", currency: "BRL" });

  return (
    <Card>
      <h2 className="section-title">📊 {t("stocksTitle")}</h2>
      <div className="stocks-list">
        <div className="stock-row stock-row--head">
          <span>{t("stocksTicker")}</span>
          <span>{t("stocksPrice")}</span>
          <span>{t("stocksChange")}</span>
          <span>{t("stocksPercent")}</span>
        </div>
        {data.map((stock) => (
          <div key={stock.ticker} className="stock-row">
            <span className="stock-ticker">{stock.ticker}</span>
            <span className="stock-price">{money.format(stock.price)}</span>
            <span className="stock-price">{money.format(stock.change)}</span>
            <span className={`stock-change ${stock.change >= 0 ? "pos" : "neg"}`}>
              {stock.change >= 0 ? "+" : ""}{stock.pct.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
