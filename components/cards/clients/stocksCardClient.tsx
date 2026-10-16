"use client";

import { useDashboard } from "@/hooks/useDashboard";
import StocksCard from "../stocks";

export default function StocksCardClient() {
  const { stocks } = useDashboard();
  if (!stocks.data?.length) return null;
  return <StocksCard data={stocks.data} />;
}
