"use client";

import { useEffect, useRef, useState } from "react";
import { clinicianClusters } from "@/lib/content";

/**
 * The medical ecosystem — an interactive constellation of the 100+ clinicians,
 * grouped into specialty clusters around a central hub. Nodes orbit and
 * twinkle; the cursor (or a specialty chip) lights a cluster and its links.
 * Canvas 2D for a hundred nodes at 60fps; labels are crisp HTML overlays.
 */

type Node = {
  ci: number;
  ang: number;
  r: number;
  speed: number;
  phase: number;
  size: number;
  lead: boolean;
  x: number;
  y: number;
};

export default function ClinicianConstellation() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(-1);
  const activeRef = useRef(-1);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const wrap = wrapRef.current!;
    let raf = 0;
    let running = false;
    let W = 0;
    let H = 0;
    const pointer = { x: -9999, y: -9999, on: false };

    const centers: { x: number; y: number }[] = [];
    let hub = { x: 0, y: 0 };
    let nodes: Node[] = [];
    const glow = clinicianClusters.map(() => 0.3);

    const rand = (s: number) => {
      const x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };

    const build = () => {
      const r = wrap.getBoundingClientRect();
      W = r.width;
      H = r.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      setDims({ w: W, h: H });

      hub = { x: 0.5 * W, y: 0.48 * H };
      centers.length = 0;
      clinicianClusters.forEach((c) => centers.push({ x: c.pos[0] * W, y: c.pos[1] * H }));

      nodes = [];
      const spread = Math.min(W, H);
      clinicianClusters.forEach((c, ci) => {
        for (let i = 0; i < c.count; i++) {
          const lead = i < c.leads.length;
          nodes.push({
            ci,
            ang: rand(ci * 40 + i) * Math.PI * 2,
            r: spread * (lead ? 0.03 : 0.045 + rand(ci * 13 + i) * 0.075),
            speed: (0.06 + rand(ci * 7 + i) * 0.16) * (rand(i) > 0.5 ? 1 : -1),
            phase: rand(ci * 3 + i) * Math.PI * 2,
            size: lead ? 3.1 : 1.3 + rand(ci * 5 + i) * 1.1,
            lead,
            x: 0,
            y: 0,
          });
        }
      });
    };

    let t = 0;
    const tick = () => {
      if (!running) return;
      t += 0.016;
      ctx.clearRect(0, 0, W, H);

      // ease cluster glow toward target (active chip, or cursor proximity)
      const act = activeRef.current;
      for (let ci = 0; ci < clinicianClusters.length; ci++) {
        let target = 0.28;
        if (act === ci) target = 1;
        else if (act === -1 && pointer.on) {
          const d = Math.hypot(pointer.x - centers[ci].x, pointer.y - centers[ci].y);
          target = Math.max(target, 0.9 - d / (Math.min(W, H) * 0.42));
        }
        glow[ci] += (target - glow[ci]) * 0.08;
      }

      // hub → cluster spokes
      ctx.lineWidth = 1;
      for (let ci = 0; ci < centers.length; ci++) {
        const g = glow[ci];
        ctx.strokeStyle = `rgba(182,154,105,${(0.1 + g * 0.32).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(hub.x, hub.y);
        ctx.lineTo(centers[ci].x, centers[ci].y);
        ctx.stroke();
      }

      // cluster → node filaments + the nodes themselves
      for (const n of nodes) {
        n.ang += n.speed * 0.016;
        const c = centers[n.ci];
        const g = glow[n.ci];
        let nx = c.x + Math.cos(n.ang + n.phase) * n.r;
        let ny = c.y + Math.sin(n.ang + n.phase) * n.r * 0.9;
        // cursor repulsion — the field reacts to the hand
        if (pointer.on) {
          const dx = nx - pointer.x;
          const dy = ny - pointer.y;
          const d = Math.hypot(dx, dy);
          if (d < 90 && d > 0.01) {
            const push = (90 - d) / 90 * 14;
            nx += (dx / d) * push;
            ny += (dy / d) * push;
          }
        }
        n.x = nx;
        n.y = ny;

        ctx.strokeStyle = `rgba(182,154,105,${(0.04 + g * 0.16).toFixed(3)})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(nx, ny);
        ctx.stroke();

        const tw = 0.6 + 0.4 * Math.sin(t * 1.6 + n.phase);
        const a = (n.lead ? 0.85 : 0.42) * (0.5 + g * 0.7) * tw;
        if (n.lead) {
          const grd = ctx.createRadialGradient(nx, ny, 0, nx, ny, n.size * 3.4);
          grd.addColorStop(0, `rgba(226,196,140,${Math.min(1, a).toFixed(3)})`);
          grd.addColorStop(1, "rgba(226,196,140,0)");
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(nx, ny, n.size * 3.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = `rgba(${n.lead ? "245,232,205" : "214,184,130"},${Math.min(1, a).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(nx, ny, n.size * (1 + g * 0.35), 0, Math.PI * 2);
        ctx.fill();
      }

      // the hub
      const hp = 0.6 + 0.4 * Math.sin(t * 1.2);
      const hg = ctx.createRadialGradient(hub.x, hub.y, 0, hub.x, hub.y, 26);
      hg.addColorStop(0, `rgba(226,196,140,${(0.5 * hp).toFixed(3)})`);
      hg.addColorStop(1, "rgba(226,196,140,0)");
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.arc(hub.x, hub.y, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(245,232,205,0.95)";
      ctx.beginPath();
      ctx.arc(hub.x, hub.y, 4.5, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(tick);
    };

    build();

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
      pointer.on = true;
    };
    const onLeave = () => (pointer.on = false);
    wrap.addEventListener("pointermove", onMove, { passive: true });
    wrap.addEventListener("pointerleave", onLeave);
    const onResize = () => build();
    window.addEventListener("resize", onResize);

    return () => {
      io.disconnect();
      running = false;
      cancelAnimationFrame(raf);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div ref={wrapRef} className="clinician-stage">
      <canvas ref={canvasRef} className="clinician-canvas" aria-hidden="true" />
      {/* central hub label */}
      <div className="clinician-hub" style={{ left: dims.w * 0.5, top: dims.h * 0.48 }}>
        <strong>100+</strong>
        <span>clinicians</span>
      </div>
      {/* specialty chips */}
      {clinicianClusters.map((c, ci) => (
        <button
          key={c.field}
          className={`clinician-chip ${active === ci ? "on" : ""}`}
          style={{ left: c.pos[0] * dims.w, top: c.pos[1] * dims.h }}
          onMouseEnter={() => setActive(ci)}
          onMouseLeave={() => setActive(-1)}
          onFocus={() => setActive(ci)}
          onBlur={() => setActive(-1)}
        >
          <span className="clinician-count">{c.count}</span>
          <span className="clinician-name">{c.short}</span>
          <span className="clinician-lead">{c.leads[0]}</span>
        </button>
      ))}
    </div>
  );
}
