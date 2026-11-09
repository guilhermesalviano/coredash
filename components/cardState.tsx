"use client";

import Card from "./card";
import { useLocale } from "@/contexts/localeContext";

export default function CardState({
  title,
  message,
  loading = false,
  onRetry,
}: {
  title?: string;
  message: string;
  loading?: boolean;
  onRetry?: () => void;
}) {
  const { t } = useLocale();

  return (
    <Card>
      {title ? <h2 className="section-title">{title}</h2> : null}
      <p className="card-state" role={loading ? "status" : "alert"}>{message}</p>
      {!loading && onRetry ? (
        <button type="button" className="card-retry" onClick={onRetry}>
          {t("retry")}
        </button>
      ) : null}
    </Card>
  );
}
