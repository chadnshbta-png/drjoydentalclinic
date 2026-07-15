"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * Magnetic hover physics: the wrapped element leans toward the cursor inside
 * a proximity field and glides back with an elastic settle when released.
 * Transform-only, quickTo-driven — no re-renders, no layout work.
 */
export default function Magnetic({
  children,
  strength = 0.32,
  range = 1.7,
  className,
}: {
  children: ReactNode;
  strength?: number;
  range?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current!;
      if (window.matchMedia("(hover: none)").matches) return;
      const xTo = gsap.quickTo(el, "x", { duration: 0.55, ease: "power3" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.55, ease: "power3" });
      let inside = false;

      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const dist = Math.hypot(dx, dy);
        const field = (Math.max(r.width, r.height) / 2) * (1 + range);
        if (dist < field) {
          inside = true;
          const pull = strength * (1 - dist / field);
          xTo(dx * pull);
          yTo(dy * pull);
        } else if (inside) {
          inside = false;
          gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)" });
        }
      };

      window.addEventListener("pointermove", move, { passive: true });
      return () => window.removeEventListener("pointermove", move);
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={className} style={{ display: "inline-block", willChange: "transform" }}>
      {children}
    </div>
  );
}
