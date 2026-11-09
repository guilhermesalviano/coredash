"use client";

import { useDashboardSlice } from "@/hooks/useDashboard";
import { retrySlice } from "@/lib/dashboardStore";
import { errorCopy } from "@/lib/i18n";
import { useLocale } from "@/contexts/localeContext";
import StocksCard from "../stocks";
import CardState from "../../cardState";

export default function StocksCardClient() {
  const stocks = useDashboardSlice("stocks");
  const { locale, t } = useLocale();

  if ((stocks.status === "idle" || stocks.status === "loading") && !stocks.data) {
    return <CardState title={t("stocksTitle")} message={t("stocksLoading")} loading />;
  }
  if (stocks.status === "error" && !stocks.data?.length) {
    return (
      <CardState
        title={t("stocksTitle")}
        message={errorCopy(stocks.error, locale)}
        onRetry={() => { void retrySlice("stocks"); }}
      />
    );
  }
  if (!stocks.data?.length) return null;
  return <StocksCard data={stocks.data} />;
}
