"use client";

import { useEffect, useState } from "react";
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
const MIN_DISPLAY = 1500;

export default function Loading() {
  const { anyLoading } = useStatus();
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [gif, setGif] = useState<string | null>(null);
  const [phrase, setPhrase] = useState<string>("");

  useEffect(() => {
    setPhrase(PHRASES[Math.floor(Math.random() * PHRASES.length)]);
    fetch("/api/gifs")
      .then((r) => r.json())
      .then((gifs: string[]) => setGif(gifs[Math.floor(Math.random() * gifs.length)]));
  }, []);

  useEffect(() => {
    if (anyLoading) return;

    const t = setTimeout(() => {
      setExiting(true);
      setTimeout(() => setVisible(false), FADE_DURATION);
    }, MIN_DISPLAY);
    return () => clearTimeout(t);
  }, [anyLoading]);

  if (!visible) return null;

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
