"use client";

import { useCallback, useEffect, useState } from "react";
import Card from "@/components/card";
import SectionTitle from "@/components/sectionTitle";
import { GmailMessage } from "@/types/gmail";
import { useLocale } from "@/contexts/localeContext";
import type { Locale } from "@/lib/i18n";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeDate(dateStr: string, locale: Locale): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return locale === "en" ? "just now" : "agora";
  if (diffMin < 60) return locale === "en" ? `${diffMin}m ago` : `há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return locale === "en" ? `${diffH}h ago` : `há ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return locale === "en" ? `${diffD}d ago` : `há ${diffD} d`;
  return date.toLocaleDateString(locale, { day: "2-digit", month: "short" });
}

function senderName(from: string): string {
  // "Name - email@..." or "email@..."
  const match = from.match(/^([^<@]+?)(?:\s*[-–]\s*|\s+<)/);
  if (match) return match[1].trim();
  return from.split("@")[0];
}

// ─── Email row ────────────────────────────────────────────────────────────────

function EmailRow({
  email,
  onOpen,
}: {
  email: GmailMessage;
  onOpen: (id: string) => void;
}) {
  const { locale } = useLocale();
  return (
    <button
      onClick={() => onOpen(email.id)}
      style={{
        width: "100%",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "10px 0",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: 3,
        textAlign: "left",
        transition: "opacity 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span style={{
          fontSize: 12.5,
          fontWeight: email.isUnread ? 600 : 400,
          color: "var(--foreground)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          flex: 1,
        }}>
          {email.isUnread && (
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#1a73e8", marginRight: 6, verticalAlign: "middle", flexShrink: 0 }} />
          )}
          {senderName(email.from)}
        </span>
        <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-mono)", flexShrink: 0 }}>
          {relativeDate(email.date, locale)}
        </span>
      </div>

      <div style={{
        fontSize: 12,
        fontWeight: email.isUnread ? 500 : 400,
        color: email.isUnread ? "var(--foreground)" : "var(--muted)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}>
        {email.subject || "(no subject)"}
      </div>

      <div style={{
        fontSize: 11,
        color: "var(--muted)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        opacity: 0.7,
      }}>
        {email.snippet}
      </div>
    </button>
  );
}

// ─── Email modal ──────────────────────────────────────────────────────────────

function EmailModal({
  email,
  onClose,
}: {
  email: GmailMessage;
  onClose: () => void;
}) {
  const { locale } = useLocale();
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16, animation: "appear 0.15s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          width: "100%",
          maxWidth: 600,
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", margin: 0, lineHeight: 1.4, flex: 1 }}>
              {email.subject || "(no subject)"}
            </h3>
            <button onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 16, lineHeight: 1, padding: 2, flexShrink: 0 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
            >✕</button>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>{email.from}</span>
            <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{relativeDate(email.date, locale)}</span>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
          {email.body ? (
            <iframe
              srcDoc={email.body}
              sandbox="allow-same-origin"
              style={{ width: "100%", border: "none", minHeight: 300 }}
              onLoad={(e) => {
                const iframe = e.currentTarget;
                iframe.style.height = iframe.contentDocument?.body?.scrollHeight + "px";
              }}
            />
          ) : (
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.65, margin: 0 }}>
              {email.snippet}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

export default function GmailCard() {
  const [emails, setEmails] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [olderError, setOlderError] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [openEmail, setOpenEmail] = useState<GmailMessage | null>(null);
  const [loadingBody, setLoadingBody] = useState(false);

  const { t } = useLocale();

  const loadInbox = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch("/api/emails");
      if (!response.ok) throw new Error("gmail");
      const json = await response.json();
      setEmails(json.data?.emails ?? []);
      setNextPageToken(json.data?.nextPageToken);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInbox();
  }, [loadInbox]);

  const loadMore = async () => {
    if (!nextPageToken || loadingMore) return;
    setLoadingMore(true);
    setOlderError(false);
    try {
      const startAt = emails.length + 1;
      const res = await fetch(`/api/emails?pageToken=${encodeURIComponent(nextPageToken)}&startAt=${startAt}`);
      if (!res.ok) throw new Error("gmail");
      const json = await res.json();
      setEmails((prev) => [...prev, ...(json.data?.emails ?? [])]);
      setNextPageToken(json.data?.nextPageToken);
    } catch {
      setOlderError(true);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleOpen = useCallback(async (id: string) => {
    const found = emails.find((e) => e.id === id) ?? null;
    setOpenEmail(found);
    if (!found) return;

    // Optimistically mark as read in local state
    if (found.isUnread) {
      setEmails((prev) => prev.map((e) => e.id === id ? { ...e, isUnread: false } : e));
      setOpenEmail((prev) => prev ? { ...prev, isUnread: false } : prev);
      // Fire-and-forget — no need to await, UI is already updated
      fetch("/api/emails/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }).catch(() => {
        // Revert on failure
        setEmails((prev) => prev.map((e) => e.id === id ? { ...e, isUnread: true } : e));
      });
    }

    if (found.body) return;

    setLoadingBody(true);
    try {
      const res = await fetch(`/api/emails/${id}`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.data) {
        setOpenEmail((prev) => prev ? { ...prev, body: json.data.body } : prev);
        setEmails((prev) => prev.map((e) => e.id === id ? { ...e, body: json.data.body } : e));
      }
    } finally {
      setLoadingBody(false);
    }
  }, [emails]);

  const unreadCount = emails.filter((e) => e.isUnread).length;

  return (
    <>
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SectionTitle>📧 {t("gmailInbox")}</SectionTitle>
            {unreadCount > 0 && (
              <span style={{
                background: "#1a73e8", color: "#fff",
                fontSize: 10, fontWeight: 700,
                borderRadius: 10, padding: "1px 6px",
                fontFamily: "var(--font-mono)",
              }}>
                {unreadCount}
              </span>
            )}
          </div>
          <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
            {t("gmailShown", { count: emails.length })}
          </span>
        </div>

        {loading && (
          <div style={{ color: "var(--muted)", fontSize: 13 }}>{t("gmailLoading")}</div>
        )}

        {error && (
          <div className="card-state" role="alert">
            <p>{t("gmailError")}</p>
            <button type="button" className="card-retry" onClick={() => { void loadInbox(); }}>{t("retry")}</button>
          </div>
        )}

        {!loading && !error && emails.length === 0 && (
          <div style={{ color: "var(--muted)", fontSize: 13 }}>{t("gmailEmpty")}</div>
        )}

        {!loading && !error && emails.map((email) => (
          <EmailRow key={email.id} email={email} onOpen={handleOpen} />
        ))}

        {!loading && !error && olderError && (
          <p className="card-state" role="alert">{t("gmailOlderError")}</p>
        )}
        {!loading && !error && nextPageToken && (
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            style={{
              width: "100%",
              marginTop: 10,
              padding: "12px 0",
              minHeight: 44,
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: 8,
              cursor: loadingMore ? "default" : "pointer",
              fontSize: 12,
              color: "var(--muted)",
              fontFamily: "var(--font-mono)",
              transition: "border-color 0.15s, color 0.15s",
              opacity: loadingMore ? 0.5 : 1,
            }}
          >
            {loadingMore ? t("gmailLoading") : t("gmailOlder")}
          </button>
        )}
      </Card>

      {openEmail && (
        <EmailModal
          email={loadingBody ? { ...openEmail, body: undefined } : openEmail}
          onClose={() => setOpenEmail(null)}
        />
      )}
    </>
  );
}
