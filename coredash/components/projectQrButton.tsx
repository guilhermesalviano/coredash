"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { QrCode, X, Copy, Check, ExternalLink } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export function resolveBaseUrl(customUrl?: string, clientOrigin?: string): string {
  if (customUrl) return customUrl;
  if (clientOrigin) return clientOrigin;
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.CORE_DASH_URL ||
    "http://localhost:3000"
  );
}

interface ProjectQrButtonProps {
  projectUrl?: string;
}

export default function ProjectQrButton({
  projectUrl,
}: ProjectQrButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeUrl, setActiveUrl] = useState<string>(() =>
    resolveBaseUrl(
      projectUrl,
      typeof window !== "undefined" ? window.location.origin : undefined
    )
  );

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setActiveUrl(resolveBaseUrl(projectUrl, window.location.origin));
    }
  }, [projectUrl]);

  const handleOpen = () => {
    if (typeof window !== "undefined") {
      setActiveUrl(resolveBaseUrl(projectUrl, window.location.origin));
    }
    setIsOpen(true);
  };

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, handleClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard write failures
    }
  };

  const modalContent = isOpen && (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="relative flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-[var(--foreground)] shadow-2xl">
        {/* Header */}
        <div className="flex w-full items-center justify-between">
          <h2 id="qr-modal-title" className="text-base font-semibold">
            Server Link
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            className="cursor-pointer rounded-lg p-1 text-[var(--muted)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--foreground)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* QR Code Container (high contrast white card ensures camera scanning compatibility) */}
        <div className="flex items-center justify-center rounded-xl bg-white p-4 shadow-sm">
          <QRCodeSVG
            value={activeUrl}
            size={180}
            level="M"
            marginSize={1}
          />
        </div>

        <p className="text-center text-xs text-[var(--muted)]">
          Scan with your phone to open the running server
        </p>

        {/* URL Display & Action Buttons */}
        <div className="flex w-full items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-xs">
          <span className="truncate font-mono text-[var(--foreground)]">
            {activeUrl}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy server URL"
              title={copied ? "Copied!" : "Copy link"}
              className="cursor-pointer rounded p-1 text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              {copied ? (
                <Check size={15} className="text-emerald-500" />
              ) : (
                <Copy size={15} />
              )}
            </button>
            <a
              href={activeUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open server link in new tab"
              title="Open link"
              className="rounded p-1 text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              <ExternalLink size={15} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Open server QR code"
        title="Server QR code"
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-lg transition-all duration-200 hover:scale-105 hover:border-[var(--border-hover)] active:scale-95 focus:outline-none"
      >
        <QrCode size={22} strokeWidth={1.8} />
      </button>

      {mounted && typeof document !== "undefined" && modalContent
        ? createPortal(modalContent, document.body)
        : null}
    </>
  );
}
