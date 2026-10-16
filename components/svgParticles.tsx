"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

type Shape = "star" | "circle" | "diamond" | "cross";

interface Particle {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  rot: number;
  size: number;
  color: string;
  shape: Shape;
  duration: number;
  delay: number;
}

interface Burst {
  id: number;
  particles: Particle[];
}

// ─── Palette ──────────────────────────────────────────────────────────────────

const PALETTE = [
  "rgba(255,210,60,0.95)",
  "rgba(80,200,255,0.95)",
  "rgba(255,90,150,0.95)",
  "rgba(80,230,140,0.95)",
  "rgba(200,110,255,0.95)",
  "rgba(255,160,60,0.95)",
  "rgba(60,180,255,0.95)",
];

const SHAPES: Shape[] = ["star", "circle", "diamond", "cross"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

// ─── SVG shape renderers ──────────────────────────────────────────────────────

function StarPath({ size }: { size: number }) {
  const r = size / 2;
  const ir = r * 0.42;
  const points = Array.from({ length: 5 }, (_, i) => {
    const outer = ((i * 2 * Math.PI) / 5) - Math.PI / 2;
    const inner = outer + Math.PI / 5;
    return [
      `${r + r * Math.cos(outer)},${r + r * Math.sin(outer)}`,
      `${r + ir * Math.cos(inner)},${r + ir * Math.sin(inner)}`,
    ];
  }).flat().join(" ");
  return <polygon points={points} />;
}

function DiamondPath({ size }: { size: number }) {
  const h = size / 2;
  return <polygon points={`${h},0 ${size},${h} ${h},${size} 0,${h}`} />;
}

function CrossPath({ size }: { size: number }) {
  const t = size * 0.28;
  const s = size;
  const h = size / 2;
  return (
    <polygon points={
      `${h - t},0 ${h + t},0 ${h + t},${h - t} ${s},${h - t} ` +
      `${s},${h + t} ${h + t},${h + t} ${h + t},${s} ${h - t},${s} ` +
      `${h - t},${h + t} 0,${h + t} 0,${h - t} ${h - t},${h - t}`
    } />
  );
}

function ParticleShape({ shape, size, color }: { shape: Shape; size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill={color}
      style={{ display: "block", overflow: "visible" }}
    >
      {shape === "star"    && <StarPath size={size} />}
      {shape === "circle"  && <circle cx={size / 2} cy={size / 2} r={size / 2} />}
      {shape === "diamond" && <DiamondPath size={size} />}
      {shape === "cross"   && <CrossPath size={size} />}
    </svg>
  );
}

// ─── Burst layer ──────────────────────────────────────────────────────────────

function BurstLayer({ burst }: { burst: Burst }) {
  return (
    <>
      {burst.particles.map(p => (
        <div
          key={p.id}
          style={{
            position: "fixed",
            left: p.x - p.size / 2,
            top: p.y - p.size / 2,
            width: p.size,
            height: p.size,
            pointerEvents: "none",
            // CSS custom props consumed by @keyframes particle-fly
            ["--dx" as string]: `${p.dx}px`,
            ["--dy" as string]: `${p.dy}px`,
            ["--rot" as string]: `${p.rot}deg`,
            animation: `particle-fly ${p.duration}s ${p.delay}s cubic-bezier(.2,.8,.4,1) forwards`,
            opacity: 0,
            animationFillMode: "both",
          }}
        >
          <ParticleShape shape={p.shape} size={p.size} color={p.color} />
        </div>
      ))}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

function createBurst(x: number, y: number, burstId: number): Burst {
  const count = Math.floor(rand(10, 18));
  const particles: Particle[] = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + rand(-0.3, 0.3);
    const distance = rand(45, 110);
    const size = rand(6, 14);
    return {
      id: i,
      x,
      y,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      rot: rand(-360, 360),
      size,
      color: pick(PALETTE),
      shape: pick(SHAPES),
      duration: rand(0.55, 0.9),
      delay: rand(0, 0.08),
    };
  });
  return { id: burstId, particles };
}

export function SvgParticles() {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [mounted, setMounted] = useState(false);
  const counter = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = useCallback((e: MouseEvent) => {
    const id = counter.current++;
    const burst = createBurst(e.clientX, e.clientY, id);
    setBursts(b => [...b, burst]);

    const maxLife = Math.max(...burst.particles.map(p => p.duration + p.delay));
    setTimeout(() => {
      setBursts(b => b.filter(bu => bu.id !== id));
    }, (maxLife + 0.15) * 1000);
  }, []);

  useEffect(() => {
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [handleClick]);

  if (!mounted) return null;

  return createPortal(
    <div
      aria-hidden
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999 }}
    >
      {bursts.map(b => <BurstLayer key={b.id} burst={b} />)}
    </div>,
    document.body
  );
}
