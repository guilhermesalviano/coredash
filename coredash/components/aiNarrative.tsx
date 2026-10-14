import { useCallback, useEffect, useRef, useState } from "react";

interface WeatherData {
  temp: number;
  condition: string;
  city: string;
  state: string;
  code: number;
}

interface AINarrativeProps {
  weather: WeatherData;
  hour: number;
}

type NarrativeState = "idle" | "loading" | "streaming" | "done" | "error";

export const AINarrative: React.FC<AINarrativeProps> = ({ weather, hour }) => {
  const [text, setText] = useState("");
  const [state, setState] = useState<NarrativeState>("idle");
  const abortRef = useRef<AbortController | null>(null);

  const fetchNarrative = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState("loading");
    setText("");

    try {
      const res = await fetch("/api/ai/narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weather, hour }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error("API error");
      if (!res.body) throw new Error("No response body");

      setState("streaming");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value, { stream: true }).split("\n");

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line);
            // Narrative streams newline-delimited JSON: { response }
            const chunk = json.response ?? json.choices?.[0]?.delta?.content ?? "";
            if (chunk) setText((prev) => prev + chunk);
          } catch {
            // incomplete JSON chunk — skip
          }
        }
      }

      setState("done");
    } catch (err: any) {
      if (err.name !== "AbortError") setState("error");
    }
  }, [weather, hour]);

  useEffect(() => {
    fetchNarrative();
    return () => abortRef.current?.abort();
  }, []);

  const isVisible = state === "streaming" || state === "done";

  return (
    <div
      className="rounded-xl p-3! flex flex-col gap-2 max-w-sm"
      style={{
        background: "rgba(255,255,255,0.035)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="min-h-[2.8rem] flex items-start">
        {state === "loading" && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-white/20">Thinking</span>
            <span className="flex gap-[3px]">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="inline-block w-1 h-1 rounded-full bg-white/25"
                  style={{
                    animation: "narrativePulse 1.2s ease-in-out infinite",
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </span>
          </div>
        )}

        {isVisible && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold tracking-[0.12em] text-white/30 uppercase">
              Rocky says:
            </span>
            <p
              className="text-[12px] leading-[1.65] text-white/55 font-light"
              style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
            >
              {text.split("\n").map((line, i, arr) => (
                <span key={i}>
                  {line}
                  {i < arr.length - 1 && <br />}
                </span>
              ))}
              {state === "streaming" && (
                <span
                  className="inline-block w-[1px] h-[0.9em] bg-white/40 ml-[1px] align-middle"
                  style={{ animation: "cursorBlink 0.8s step-end infinite" }}
                />
              )}
            </p>
          </div>
        )}

        {state === "error" && (
          <p className="text-[11px] text-white/25 italic">
            Sorry, Rocky is offline.&nbsp;
            <button
              onClick={fetchNarrative}
              className="underline hover:text-white/50 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </p>
        )}
      </div>

      <style>{`
        @keyframes narrativePulse {
          0%, 100% { opacity: 0.2; transform: scaleY(1); }
          50% { opacity: 0.7; transform: scaleY(1.4); }
        }
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};