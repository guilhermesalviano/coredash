"use client";

import { useEffect, useRef, useState } from "react";
import { useStatus } from "@/contexts/statusContext";
import Image from "next/image";

const PHRASES = [
  "Bribing the servers with coffee...",
  "Counting to infinity... twice.",
  "Teaching pigeons to deliver data...",
  "Reticulating splines...",
  "Convincing the hamsters to run faster...",
  "Downloading more RAM...",
  "Untangling the cloud...",
  "Asking ChatGPT what to do next...",
  "Feeding the gremlins...",
  "Compiling excuses...",
];

const FADE_DURATION = 400;
// Fast loads never show the overlay at all.
const SHOW_DELAY = 300;
// Once shown, stay long enough not to read as a flicker.
const MIN_VISIBLE = 500;
const MAX_DISPLAY = 4500;

type Phase = "waiting" | "visible" | "exiting" | "done";

export default function Loading({ gif = null }: { gif?: string | null }) {
  const { anyLoading } = useStatus();
  const [phase, setPhase] = useState<Phase>("waiting");
  const [phrase, setPhrase] = useState<string>("");
  const shownAt = useRef(0);
  // The overlay belongs to the first load only; later refreshes never bring it back.
  const settled = useRef(false);

  useEffect(() => {
    if (!anyLoading) {
      settled.current = true;
      return;
    }
    if (settled.current) return;
    const timer = setTimeout(() => {
      shownAt.current = Date.now();
      setPhrase(PHRASES[Math.floor(Math.random() * PHRASES.length)]);
      setPhase((current) => (current === "waiting" ? "visible" : current));
    }, SHOW_DELAY);
    return () => clearTimeout(timer);
  }, [anyLoading]);

  useEffect(() => {
    if (anyLoading || phase !== "visible") return;
    const remaining = Math.max(0, MIN_VISIBLE - (Date.now() - shownAt.current));
    const timer = setTimeout(() => setPhase("exiting"), remaining);
    return () => clearTimeout(timer);
  }, [anyLoading, phase]);

  useEffect(() => {
    if (phase !== "exiting") return;
    const timer = setTimeout(() => setPhase("done"), FADE_DURATION);
    return () => clearTimeout(timer);
  }, [phase]);

  // Failsafe: dismiss loading screen after MAX_DISPLAY even if a service or network request is pending
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      settled.current = true;
      setPhase((current) => (current === "visible" ? "exiting" : current === "waiting" ? "done" : current));
    }, MAX_DISPLAY);
    return () => clearTimeout(safetyTimer);
  }, []);

  if (phase === "waiting" || phase === "done") return null;
  const exiting = phase === "exiting";


  return (
    <>
      <style>{`
        body {
          overflow: hidden;
        }
        @keyframes dots {
          0%, 20%  { content: ".";   }
          40%      { content: "..";  }
          60%      { content: "..."; }
          80%, 100%{ content: "";    }
        }
        .loading-dots::after {
          content: "";
          animation: dots 1.4s steps(1) infinite;
        }
      `}</style>
      <div
        className="fixed inset-0 z-100 flex flex-col items-center justify-center gap-4"
        style={{
          background: "var(--background)",
          opacity: exiting ? 0 : 1,
          transition: exiting ? `opacity ${FADE_DURATION}ms ease` : "none",
          pointerEvents: exiting ? "none" : "all",
        }}
      >
        {gif && <Image src={gif} alt="loading" width={120} height={120} unoptimized style={{ objectFit: "contain" }} />}
        {phrase && <p style={{ color: "var(--muted)", fontSize: 13 }}>{phrase}</p>}
        <p className="absolute bottom-4 right-4 w-16" style={{ color: "var(--muted)", fontSize: 11, letterSpacing: "0.1em" }}>
          <span className="loading-dots">loading</span>
        </p>
      </div>
    </>
  );
}
