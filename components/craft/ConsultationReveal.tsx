"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";
import type { Service } from "@/lib/services";
import styles from "./ConsultationReveal.module.css";

/**
 * The right-column visual for "A Personal Consultation".
 *
 * Deliberately SIMPLER than the Services RevealCard — no hover, no cursor
 * spotlight, no circular mask. It shows the selected treatment's transparent
 * Before render floating on the page, then, when the consultation reveals the
 * treatment, performs one premium crossfade to the After render:
 *   • Before eases out (fade + soft settle)
 *   • After eases in (fade + gentle rise + micro-scale)
 * driven by the SAME `revealRef` (0→1) the section already tweens, so the visual
 * and the copy stay in lock-step with the "Reveal my treatment" button.
 *
 * The After stays fully shown until another treatment is selected (the pair
 * prop changes) or the reveal is toggled back (revealRef returns to 0).
 */
export default function ConsultationReveal({
  pair,
  revealRef,
  active,
}: {
  /** the selected treatment's before/after pair, or null while choosing */
  pair: Service | null;
  /** shared 0→1 reveal progress the section tweens on "Reveal my treatment" */
  revealRef: React.MutableRefObject<number>;
  /** whether the section is on screen (gates the RAF follower) */
  active: boolean;
}) {
  const beforeRef = useRef<HTMLDivElement>(null);
  const afterRef = useRef<HTMLDivElement>(null);
  const setter = useRef<((p: number) => void) | null>(null);

  // Map reveal progress (0→1) onto the two layers. Kept in a single setter so
  // both the RAF follower and the pair-change reset use identical math.
  const paint = (p: number) => {
    const before = beforeRef.current;
    const after = afterRef.current;
    if (!before || !after) return;
    // before recedes over the first ~70% of the travel; after blooms over the
    // last ~85% — a brief, elegant overlap rather than a hard swap.
    const bOut = gsap.utils.clamp(0, 1, p / 0.7);
    const aIn = gsap.utils.clamp(0, 1, (p - 0.15) / 0.85);
    before.style.opacity = String(1 - bOut);
    before.style.transform = `translateY(${bOut * -8}px) scale(${1 - bOut * 0.02})`;
    after.style.opacity = String(aIn);
    after.style.transform = `translateY(${(1 - aIn) * 14}px) scale(${0.985 + aIn * 0.015})`;
  };
  setter.current = paint;

  // Follow revealRef every frame while the section is on screen — the section
  // owns the 0→1 tween, we just render it. No re-render during animation.
  useEffect(() => {
    if (!active) return;
    const tick = () => setter.current?.(revealRef.current);
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [active, revealRef]);

  // On a new selection, snap the layers back to "before shown" immediately so
  // the crossfade always starts from a clean state.
  useEffect(() => {
    paint(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pair?.slug]);

  return (
    <div className={styles.stage} aria-hidden={!pair}>
      {pair && (
        <>
          <div ref={beforeRef} className={`${styles.layer} ${styles.before}`}>
            <Image
              src={pair.before}
              alt={`${pair.title} — before`}
              fill
              sizes="(max-width: 1024px) 90vw, 42vw"
              className={styles.img}
              draggable={false}
              priority={false}
            />
          </div>
          <div ref={afterRef} className={`${styles.layer} ${styles.after}`}>
            <Image
              src={pair.after}
              alt={`${pair.title} — after`}
              fill
              sizes="(max-width: 1024px) 90vw, 42vw"
              className={styles.img}
              draggable={false}
              priority={false}
            />
          </div>
        </>
      )}
    </div>
  );
}
