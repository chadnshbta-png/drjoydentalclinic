"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";
import type { Service } from "@/lib/services";
import styles from "./RevealCard.module.css";

/**
 * The signature interaction of Chapter III.
 *
 * Two perfectly-aligned, TRANSPARENT treatment renders share one stage and
 * float directly in the page — no card, no background, no rectangle. The two
 * layers are masked against each other by a single soft-edged CURSOR SPOTLIGHT:
 *   • AFTER  is visible ONLY inside the feathered circle around the cursor
 *   • BEFORE is the exact inverse, hidden precisely where the after shows
 * so at rest (radius 0) the after image is 100% invisible — not one pixel — and
 * there is never any double-exposure of the two transparent PNGs.
 *
 * Interactions:
 *   • HOVER (desktop) — a premium soft spotlight follows the cursor with eased
 *     lag, revealing the result only under the pointer; leaving closes it.
 *   • CLICK "Reveal the result" — the spotlight BLOOMS out to engulf the whole
 *     image and LOCKS fully revealed until clicked again, then eases back.
 *
 * Performance: cursor position (--mx/--my), radius (--r) and bloom are CSS
 * custom properties animated with GSAP quickTo/tween — no React state changes
 * during pointer movement, so the component never re-renders while animating.
 */

// For these treatments the reveal is inverted: the FINAL result is shown at
// rest (front) and the spotlight uncovers the BEFORE state underneath — the
// opposite of the default (front = before, reveal = after). Invisible
// Orthodontics keeps the default order. Matched by folder slug.
const REVERSED_SLUGS = new Set([
  "Implantology",
  "Veneers & Smile Design",
  "Digital Dentistry",
  "Orthodontics",
]);

// spotlight radius as a fraction of the frame's larger axis
const RADIUS_FRACTION = 0.34;
// soft edge as a fraction of the radius (0 = hard, 1 = fully feathered)
const FEATHER = 0.55;

// Register typed custom properties so masks/gradients interpolate smoothly
// (unregistered custom props animate as untyped strings). Guarded so it runs
// once and never throws on browsers without registerProperty.
let _propsRegistered = false;
function registerRevealProps() {
  if (_propsRegistered || typeof window === "undefined") return;
  _propsRegistered = true;
  const reg = (window as unknown as { CSS?: { registerProperty?: (d: object) => void } })
    .CSS?.registerProperty;
  if (!reg) return;
  const defs: Array<[string, string, string]> = [
    ["--mx", "<percentage>", "50%"],
    ["--my", "<percentage>", "50%"],
    ["--r", "<length>", "0px"],
    ["--bloom", "<length>", "0px"],
    ["--feather", "<number>", "0.55"],
    ["--lift", "<number>", "0"],
    ["--hold", "<number>", "0"],
    ["--spot", "<number>", "0"],
  ];
  for (const [name, syntax, initialValue] of defs) {
    try {
      // inherits:true so values set on .frame cascade to the masked layers
      reg({ name, syntax, inherits: true, initialValue });
    } catch {
      /* already registered — fine */
    }
  }
}

export default function RevealCard({
  service,
  index,
}: {
  service: Service;
  index: number;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLButtonElement>(null);
  const sweepRef = useRef<HTMLDivElement>(null); // the moving sheen (inner)

  // eased setters (created once)
  const mxTo = useRef<((v: number) => void) | null>(null);
  const myTo = useRef<((v: number) => void) | null>(null);

  const [isTouch, setIsTouch] = useState(false);

  // whether the hover spotlight is currently grown open (not the click-lock)
  const spotOpenRef = useRef(false);

  // click-locked "fully revealed" state. When held, hover-follow is ignored so
  // the after image stays completely visible until toggled off.
  const [held, setHeld] = useState(false);
  const heldRef = useRef(false);
  heldRef.current = held;

  useEffect(() => {
    registerRevealProps();
    setIsTouch(
      typeof window !== "undefined" &&
        window.matchMedia("(hover: none)").matches
    );
  }, []);

  // Set up the eased cursor-position animators.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    gsap.set(frame, {
      "--mx": "50%",
      "--my": "50%",
      "--r": "0px",
      "--bloom": "0px",
      "--feather": FEATHER,
      "--spot": 0,
      "--hold": 0,
      "--lift": 0,
    });

    // tight but eased follow — glides with the cursor, feels liquid & expensive
    mxTo.current = gsap.quickTo(frame, "--mx", {
      duration: 0.4,
      ease: "power3.out",
    });
    myTo.current = gsap.quickTo(frame, "--my", {
      duration: 0.4,
      ease: "power3.out",
    });

    return () => {
      mxTo.current = null;
      myTo.current = null;
    };
  }, []);

  // px radius of the spotlight, from the current frame size
  const spotRadius = useCallback(() => {
    const frame = frameRef.current;
    if (!frame) return 220;
    const rect = frame.getBoundingClientRect();
    return Math.max(rect.width, rect.height) * RADIUS_FRACTION;
  }, []);

  // one cinematic light sweep across the frame
  const playSweep = useCallback(() => {
    if (!sweepRef.current) return;
    gsap.fromTo(
      sweepRef.current,
      { xPercent: -120, autoAlpha: 0 },
      {
        xPercent: 120,
        autoAlpha: 1,
        duration: 1.25,
        ease: "power2.inOut",
        onComplete: () => gsap.set(sweepRef.current, { autoAlpha: 0 }),
      }
    );
  }, []);

  /* ————— desktop hover: soft cursor spotlight ————— */

  const onEnter = useCallback(
    (e: React.MouseEvent) => {
      if (isTouch || !frameRef.current) return;
      const rect = frameRef.current.getBoundingClientRect();
      // seed the spotlight at the entry point (no jump-in from centre)
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      gsap.set(frameRef.current, { "--mx": `${x}%`, "--my": `${y}%` });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      if (scaleRef.current)
        tl.to(scaleRef.current, { scale: 1.028, duration: 1.2 }, 0);
      tl.to(
        frameRef.current,
        { "--lift": 1, duration: 0.9, ease: "power2.out" },
        0
      );
      // grow the spotlight in only if not already locked fully open
      if (!heldRef.current) {
        spotOpenRef.current = true;
        tl.to(
          frameRef.current,
          {
            "--r": `${spotRadius()}px`,
            "--spot": 1,
            duration: 0.85,
            ease: "power3.out",
          },
          0
        );
      }
      if (hintRef.current && !heldRef.current)
        tl.to(hintRef.current, { y: -4, duration: 0.5 }, 0);
      if (!heldRef.current) playSweep();
    },
    [isTouch, spotRadius, playSweep]
  );

  const onMove = useCallback(
    (e: React.MouseEvent) => {
      if (isTouch || heldRef.current || !frameRef.current) return;
      const rect = frameRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      mxTo.current?.(gsap.utils.clamp(0, 100, x));
      myTo.current?.(gsap.utils.clamp(0, 100, y));
      // recover the spotlight if it was closed (e.g. right after "Hide result"
      // while the pointer is still over the card)
      if (!spotOpenRef.current) {
        spotOpenRef.current = true;
        gsap.to(frameRef.current, {
          "--r": `${spotRadius()}px`,
          "--spot": 1,
          duration: 0.6,
          ease: "power3.out",
        });
      }
    },
    [isTouch, spotRadius]
  );

  const onLeave = useCallback(() => {
    if (isTouch || !frameRef.current) return;
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    if (scaleRef.current)
      tl.to(
        scaleRef.current,
        { scale: heldRef.current ? 1.02 : 1, duration: 1.2 },
        0
      );
    tl.to(frameRef.current, { "--lift": 0, duration: 1.0 }, 0);
    if (hintRef.current) tl.to(hintRef.current, { y: 0, duration: 0.6 }, 0.05);
    // close the spotlight (after fully hidden again) unless locked open
    if (!heldRef.current) {
      spotOpenRef.current = false;
      tl.to(
        frameRef.current,
        { "--r": "0px", "--spot": 0, duration: 0.7, ease: "power2.inOut" },
        0
      );
    }
  }, [isTouch]);

  /* ————— click / tap: full reveal that BLOOMS and LOCKS until toggled ————— */

  const toggleHeld = useCallback(() => {
    const next = !heldRef.current;
    setHeld(next);
    // the bloom owns the reveal while held; on release the hover spotlight is
    // closed, so re-hovering must grow it again.
    spotOpenRef.current = false;
    const frame = frameRef.current;
    if (!frame) return;

    // a radius large enough to cover the whole frame from any spotlight centre
    const rect = frame.getBoundingClientRect();
    const cover = Math.hypot(rect.width, rect.height) * 1.15;

    // Reveal: bloom the radius out to engulf the frame and lock open.
    // Hide: collapse bloom AND the spotlight back to nothing so it returns to a
    // clean Before (the cursor may have left the card by now).
    gsap.to(frame, {
      "--bloom": next ? `${cover}px` : "0px",
      "--hold": next ? 1 : 0,
      "--r": next ? `${spotRadius()}px` : "0px",
      "--spot": next ? 1 : 0,
      duration: next ? 1.35 : 1.0,
      ease: next ? "power3.inOut" : "power3.out",
    });

    if (scaleRef.current)
      gsap.to(scaleRef.current, {
        scale: next ? 1.02 : 1,
        duration: 1.1,
        ease: "power3.out",
      });

    // keep the pill visible & clickable while held — it becomes "Hide result"
    if (hintRef.current)
      gsap.to(hintRef.current, { y: 0, duration: 0.5, ease: "power2.out" });

    if (next) playSweep();
  }, [spotRadius, playSweep]);

  // On the card: a tap toggles on touch devices (there is no hover there).
  const onCardClick = useCallback(() => {
    if (isTouch) toggleHeld();
  }, [isTouch, toggleHeld]);

  // On the hint pill: the explicit "Reveal the result" / "Hide" trigger on all
  // devices. Stop propagation so it doesn't double-fire the card handler.
  const onHintClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleHeld();
    },
    [toggleHeld]
  );

  // Resolve which render sits on the FRONT (visible at rest) and which the
  // spotlight uncovers. Default: front = before, reveal = after. For the
  // reversed treatments these swap, so the front shows the final result and the
  // spotlight uncovers the before. The mask/silhouette always follows whatever
  // is on the front layer.
  const reversed = REVERSED_SLUGS.has(service.slug);
  const frontSrc = reversed ? service.after : service.before;
  const revealSrc = reversed ? service.before : service.after;
  const frontAlt = reversed
    ? `${service.title} — result`
    : `${service.title} — before`;
  const revealAlt = reversed
    ? `${service.title} — before`
    : `${service.title} — after`;

  return (
    <article
      ref={rootRef}
      className={styles.card}
      data-index={index}
      onMouseEnter={onEnter}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onCardClick}
    >
      <div
        ref={frameRef}
        className={styles.frame}
        style={
          {
            // the front-layer silhouette, used to clip the sheen/halo so they
            // only paint on the treatment itself and never tint the empty frame
            "--subject": `url("${frontSrc}")`,
          } as React.CSSProperties
        }
      >
        <div ref={scaleRef} className={styles.scaler}>
          {/* REVEAL layer — masked to the cursor spotlight; invisible at rest */}
          <div className={`${styles.layer} ${styles.after}`}>
            <Image
              src={revealSrc}
              alt={revealAlt}
              fill
              sizes="(max-width: 900px) 92vw, 60vw"
              className={styles.img}
              priority={index === 0}
              draggable={false}
            />
          </div>

          {/* FRONT layer — the inverse mask; hidden exactly under the spotlight */}
          <div className={`${styles.layer} ${styles.before}`}>
            <Image
              src={frontSrc}
              alt={frontAlt}
              fill
              sizes="(max-width: 900px) 92vw, 60vw"
              className={styles.img}
              priority={index === 0}
              draggable={false}
            />
          </div>

          {/* cinematic light sweep — clipped to the treatment silhouette */}
          <div className={styles.sweep} aria-hidden>
            <div ref={sweepRef} className={styles.sweepInner} />
          </div>
        </div>

        {/* interaction / full-reveal trigger */}
        <button
          ref={hintRef}
          type="button"
          className={styles.hint}
          onClick={onHintClick}
          aria-pressed={held}
          aria-label={
            held
              ? `Return to the final result for ${service.title}`
              : `See the difference for ${service.title}`
          }
        >
          <span className={styles.hintLine} />
          <span className={styles.hintText}>
            {held ? "View Final Result" : "See the Difference"}
          </span>
          <span className={styles.hintArrow}>{held ? "↩" : "→"}</span>
        </button>
      </div>
    </article>
  );
}
