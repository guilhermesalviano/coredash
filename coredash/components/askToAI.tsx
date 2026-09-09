"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  content: string;
  streaming?: boolean;
}

// ─── Sparkle / AI icon ───────────────────────────────────────────────────────

function SparkleIcon({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--muted)"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ─── Typing dots ──────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <span style={{ display: "inline-flex", gap: 3, alignItems: "center", padding: "2px 0" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "var(--muted)",
            opacity: 0.4,
            display: "inline-block",
            animation: "aiDot 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.18}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes aiDot {
          0%, 100% { opacity: 0.25; transform: translateY(0); }
          50% { opacity: 0.8; transform: translateY(-3px); }
        }
        @keyframes aiSlideIn {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes aiPulseRing {
          0%   { box-shadow: 0 0 0 0 var(--ai-ring); }
          70%  { box-shadow: 0 0 0 6px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
      `}</style>
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AIAssistantButton() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    const assistantId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: "assistant", content: "", streaming: true },
    ]);
    setInput("");
    setLoading(true);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          stream: true,
          system:
            "You are Rocky, a smart and concise personal assistant embedded in a personal dashboard. Be helpful, direct, and warm. Keep answers brief unless detail is needed. You can help with tasks, planning, questions, and anything the user needs.",
          messages: history,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error("API error");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const json = JSON.parse(data);
            if (json.type === "content_block_delta" && json.delta?.type === "text_delta") {
              accumulated += json.delta.text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: accumulated } : m
                )
              );
            }
          } catch { /* skip malformed */ }
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, streaming: false } : m
        )
      );
    } catch (err: unknown) {
      if (!(err instanceof Error) || err.name !== "AbortError") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Sorry, I couldn't reach the server. Try again.", streaming: false }
              : m
          )
        );
      }
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const hasUnread = !open && messages.length > 0 && messages[messages.length - 1].role === "assistant";

  return (
    <div ref={panelRef} style={{ position: "relative", flexShrink: 0 }}>

      {/* ── Trigger button — mirrors ThemeToggle exactly ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open AI assistant"
        style={{
          background: open ? "var(--border)" : "none",
          border: "1px solid var(--border)",
          borderRadius: "50%",
          width: 34,
          height: 34,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "border-color 0.2s, background 0.2s",
          flexShrink: 0,
          position: "relative",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-hover)")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
      >
        <SparkleIcon />
        {/* Pulsing ring when there's a new assistant message and panel is closed */}
        {hasUnread && (
          <span style={{
            position: "absolute",
            inset: -2,
            borderRadius: "50%",
            border: "1.5px solid var(--border-hover, #888)",
            animation: "aiPulseRing 1.8s ease-out infinite",
            pointerEvents: "none",
          }} />
        )}
      </button>

      {/* ── Chat panel ── */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            width: 340,
            maxHeight: 480,
            display: "flex",
            flexDirection: "column",
            background: "var(--surface, #fff)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            boxShadow: "0 12px 40px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.06)",
            overflow: "hidden",
            animation: "aiSlideIn 0.18s cubic-bezier(0.22,1,0.36,1)",
            zIndex: 200,
          }}
        >
          {/* Header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "11px 14px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <SparkleIcon size={13} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--foreground, #111)" }}>
                Rocky
              </span>
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--muted, #888)",
                marginLeft: 2,
              }}>
                AI Assistant
              </span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 11,
                    color: "var(--muted, #888)",
                    padding: "2px 6px",
                    borderRadius: 6,
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground, #111)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted, #888)")}
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: 3,
                }}
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "14px 14px 8px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            minHeight: 120,
          }}>
            {messages.length === 0 && (
              <div style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "24px 0",
              }}>
                <SparkleIcon size={22} />
                <p style={{ fontSize: 12.5, color: "var(--muted, #888)", textAlign: "center", lineHeight: 1.5, maxWidth: 200, margin: 0 }}>
                  Ask me anything — tasks, plans, questions, or just chat.
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                  gap: 2,
                }}
              >
                <div
                  style={{
                    maxWidth: "86%",
                    padding: "8px 12px",
                    borderRadius: msg.role === "user" ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
                    background: msg.role === "user"
                      ? "var(--foreground, #111)"
                      : "var(--surface-2, #f4f4f5)",
                    color: msg.role === "user"
                      ? "var(--surface, #fff)"
                      : "var(--foreground, #111)",
                    fontSize: 12.5,
                    lineHeight: 1.55,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {msg.streaming && msg.content === "" ? (
                    <TypingDots />
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div style={{
            borderTop: "1px solid var(--border)",
            padding: "10px 12px",
            display: "flex",
            alignItems: "flex-end",
            gap: 8,
            flexShrink: 0,
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // auto-grow
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
              }}
              onKeyDown={handleKeyDown}
              placeholder="Message Rocky…"
              rows={1}
              style={{
                flex: 1,
                background: "var(--surface-2, #f4f4f5)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "7px 10px",
                fontSize: 12.5,
                color: "var(--foreground, #111)",
                resize: "none",
                outline: "none",
                fontFamily: "inherit",
                lineHeight: 1.5,
                maxHeight: 100,
                overflowY: "auto",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--border-hover, #888)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "none",
                background: input.trim() && !loading ? "var(--foreground, #111)" : "var(--border)",
                color: input.trim() && !loading ? "var(--surface, #fff)" : "var(--muted, #888)",
                cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background 0.15s, color 0.15s",
              }}
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}