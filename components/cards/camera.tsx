"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useVisibilityPolling } from "@/hooks/use-visibility-polling";
import { useLocale } from "@/contexts/localeContext";
import Card from "../card";
import CardState from "../cardState";

const REFRESH_MS = 2000;

type CameraState = "loading" | "live" | "offline" | "unconfigured";

const CameraCard = () => {
  const { t } = useLocale();
  const [frame, setFrame] = useState<string | null>(null);
  const [state, setState] = useState<CameraState>("loading");
  const busy = useRef(false);
  const paused = useRef(false);
  const disposed = useRef(false);
  const frameUrl = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (busy.current || paused.current) return;
    busy.current = true;
    try {
      const response = await fetch("/api/camera/snapshot", { cache: "no-store" });
      if (disposed.current) return;
      if (response.status === 404) {
        // Nothing to poll until a camera address is saved.
        paused.current = true;
        setState("unconfigured");
        return;
      }
      if (!response.ok) throw new Error("camera unavailable");
      const blob = await response.blob();
      if (disposed.current) return;
      const next = URL.createObjectURL(blob);
      const previous = frameUrl.current;
      frameUrl.current = next;
      setFrame(next);
      setState("live");
      // The <img> keeps the decoded frame until the new one is painted.
      if (previous) setTimeout(() => URL.revokeObjectURL(previous), 1000);
    } catch {
      if (!disposed.current) setState("offline");
    } finally {
      busy.current = false;
    }
  }, []);

  useVisibilityPolling(refresh, REFRESH_MS);

  useEffect(() => {
    disposed.current = false;
    return () => {
      disposed.current = true;
      if (frameUrl.current) URL.revokeObjectURL(frameUrl.current);
      frameUrl.current = null;
    };
  }, []);

  const title = `📷 ${t("cameraTitle")}`;

  if (state === "unconfigured") {
    return (
      <CardState
        title={title}
        message={t("cameraNotConfigured")}
        onRetry={() => {
          paused.current = false;
          setState("loading");
          void refresh();
        }}
      />
    );
  }
  if (!frame) {
    return state === "offline"
      ? <CardState title={title} message={t("cameraError")} onRetry={() => { void refresh(); }} />
      : <CardState title={title} message={t("cameraLoading")} loading />;
  }

  const live = state === "live";

  return (
    <Card>
      <div className="flex items-center justify-between mb-2 gap-2">
        <h2 className="section-title">{title}</h2>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
          <span className="status-dot" style={{ background: live ? "#6EE7B7" : "#F87171" }} />
          {live ? t("cameraLive") : t("cameraOffline")}
        </span>
      </div>
      {/* Frames are short-lived blob URLs, which next/image cannot optimize. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={frame}
        alt={t("cameraAlt")}
        className="block w-full rounded-lg bg-black"
        style={{ aspectRatio: "16 / 9", objectFit: "cover", opacity: live ? 1 : 0.5 }}
      />
    </Card>
  );
};

export default CameraCard;
