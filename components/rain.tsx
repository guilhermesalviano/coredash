import { useCallback, useEffect, useRef } from "react";

interface RainDrop {
  x: number;
  y: number;
  len: number;
  speed: number;
  alpha: number;
  width: number;
}

export const RainCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropsRef = useRef<RainDrop[]>([]);
  const rafRef = useRef<number>(0);

  const initDrops = useCallback((w: number, h: number) => {
    const count = Math.floor(w * 0.25);
    dropsRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      len: 10 + Math.random() * 18,
      speed: 7 + Math.random() * 10,
      alpha: 0.08 + Math.random() * 0.22,
      width: 0.4 + Math.random() * 0.6,
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initDrops(canvas.width, canvas.height);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const d of dropsRef.current) {
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.len * 0.2, d.y + d.len);
        ctx.strokeStyle = `rgba(160,200,240,${d.alpha})`;
        ctx.lineWidth = d.width;
        ctx.stroke();
        d.y += d.speed;
        d.x -= d.speed * 0.2;
        if (d.y > canvas.height) { d.y = -d.len; d.x = Math.random() * canvas.width; }
        if (d.x < 0) d.x = canvas.width;
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [initDrops]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};