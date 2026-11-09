"use client";

import { useStatusState } from "@/contexts/statusContext";
import { useLocale } from "@/contexts/localeContext";

export default function SystemsStatus() {
  const { isAllLive, anyLoading } = useStatusState();
  const { t } = useLocale();

  if (anyLoading) {
    return (
      <div className="flex items-center gap-2 animate-pulse" role="status" aria-label={t("statusLoading")}>
        <span className="status-dot" style={{ background: "#9CA3AF" }} />
      </div>
    );
  }

  const statusColor = isAllLive ? "#6EE7B7" : "#F87171";

  return (
    <div className="flex items-center gap-2" role="status" aria-label={isAllLive ? t("statusOk") : t("statusError")}>
      <span className="status-dot w-4" style={{ background: statusColor }} />
    </div>
  );
}