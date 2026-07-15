"use client";

import { useEffect, useRef } from "react";

/**
 * Gold dust for the finale: slow-rising motes that twinkle and drift away
 * from the cursor. 2D canvas, DPR 1, paused entirely while offscreen.
 */
export default function GoldDust({ density = 110 }: { density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let running = false;
    const pointer = { x: -9999, y: -9999 };

    type Mote = {
      x: number; y: number; r: number;
      vy: number; sway: number; phase: number; tw: number;
    };
    let motes: Mote[] = [];

    const seed = () => {
      const { width: w, height: h } = canvas;
      motes = Array.from({ length: density }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.6 + Math.random() * 1.7,
        vy: 0.08 + Math.random() * 0.28,
        sway: 0.15 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
        tw: 0.4 + Math.random() * 0.6,
      }));
    };

    const resize = () => {
      const r = canvas.parentElement!.getBoundingClientRect();
      canvas.width = Math.round(r.width);
      canvas.height = Math.round(r.height);
      seed();
    };
    resize();

    let t = 0;
    const tick = () => {
      if (!running) return;
      t += 0.016;
      const { width: w, height: h } = canvas;
      ctx.clearRect(0, 0, w, h);
      for (const m of motes) {
        m.y -= m.vy;
        m.x += Math.sin(t * m.sway + m.phase) * 0.18;
        // cursor repulsion — the dust parts around the visitor
        const dx = m.x - pointer.x;
        const dy = m.y - pointer.y;
        const d = Math.hypot(dx, dy);
        if (d < 130 && d > 0.01) {
          const push = ((130 - d) / 130) * 1.6;
          m.x += (dx / d) * push;
          m.y += (dy / d) * push;
        }
        if (m.y < -6) { m.y = h + 6; m.x = Math.random() * w; }
        if (m.x < -6) m.x = w + 6;
        if (m.x > w + 6) m.x = -6;
        const a = 0.14 + 0.5 * m.tw * (0.5 + 0.5 * Math.sin(t * (0.6 + m.tw) + m.phase));
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(214, 184, 130, ${a.toFixed(3)})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !running) {
        running = true;
        raf = requestAnimationFrame(tick);
      } else if (!e.isIntersecting) {
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(canvas);

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", resize);

    return () => {
      io.disconnect();
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      aria-hidden="true"
    />
  );
}
