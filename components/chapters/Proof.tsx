"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { testimonials, insurers } from "@/lib/content";
import styles from "./Proof.module.css";

/**
 * Chapter IV — The Stories. A gallery in a dark room: patient stories pinned
 * to the wall like framed portraits, lit only where the visitor looks. A warm
 * spotlight tracks the cursor; the whole collage drifts for depth; hovering a
 * card brings it forward and straightens it. A deliberately different
 * interaction from every other chapter.
 */

// hand-composed collage — left/top in %, width in %, base rotation, parallax depth
const PLACEMENT = [
  { left: 4, top: 40, w: 29, rot: -3, depth: 26 },
  { left: 40, top: 33, w: 30, rot: 2, depth: 15 },
  { left: 71, top: 46, w: 25, rot: 3, depth: 32 },
  { left: 16, top: 70, w: 29, rot: 2, depth: 20 },
  { left: 51, top: 73, w: 29, rot: -2, depth: 10 },
];

export default function Proof() {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Cards arrive like frames being hung — scattered, staggered.
      gsap.fromTo(
        `.${styles.card}`,
        { opacity: 0, y: 64, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.1,
          ease: "power3.out",
          stagger: 0.1,
          scrollTrigger: { trigger: stageRef.current, start: "top 68%", once: true },
        }
      );
      gsap.fromTo(
        `.${styles.intro} > *`,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.12,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: stageRef.current, start: "top 72%", once: true },
        }
      );

      // Cursor: spotlight position + gentle parallax drift of the whole wall.
      if (!window.matchMedia("(hover: none)").matches) {
        const stage = stageRef.current!;
        gsap.set(stage, { "--px": 0, "--py": 0 });
        const px = gsap.quickTo(stage, "--px", { duration: 0.6, ease: "power3" });
        const py = gsap.quickTo(stage, "--py", { duration: 0.6, ease: "power3" });
        const move = (e: PointerEvent) => {
          const r = stage.getBoundingClientRect();
          const mx = e.clientX - r.left;
          const my = e.clientY - r.top;
          stage.style.setProperty("--mx", `${mx}px`);
          stage.style.setProperty("--my", `${my}px`);
          px((mx / r.width - 0.5) * 2);
          py((my / r.height - 0.5) * 2);
        };
        stage.addEventListener("pointermove", move, { passive: true });
        return () => stage.removeEventListener("pointermove", move);
      }
    },
    { scope: rootRef }
  );

  return (
    <section id="stories" ref={rootRef} className={styles.stories}>
      <div ref={stageRef} className={styles.stage}>
        <span className={styles.ghost} aria-hidden="true">Smiles</span>

        <div className={styles.intro}>
          <p className={styles.mark}>Chapter IV · The Stories</p>
          <h2 className={styles.introTitle}>Real patients. Real transformations.</h2>
          <p className={styles.introHint}>
            <i />
            Move through the room — the light follows you
          </p>
        </div>

        {testimonials.map((t, i) => {
          const p = PLACEMENT[i % PLACEMENT.length];
          return (
            <div
              key={t.name}
              className={styles.cardPos}
              style={
                {
                  left: `${p.left}%`,
                  top: `${p.top}%`,
                  width: `${p.w}%`,
                  ["--rot"]: `${p.rot}deg`,
                  ["--depth"]: p.depth,
                } as React.CSSProperties
              }
            >
              <article className={styles.card} tabIndex={0}>
                <span className={styles.quoteMark} aria-hidden="true">“</span>
                <p className={styles.quote}>{t.quote}</p>
                <footer className={styles.foot}>
                  <span className={styles.rule} />
                  <cite className={styles.name}>{t.name}</cite>
                  <span className={styles.treatment}>{t.treatment}</span>
                </footer>
              </article>
            </div>
          );
        })}

        {/* the spotlight veil — darkens all but where the cursor looks */}
        <div className={styles.veil} aria-hidden="true" />
      </div>

      {/* trust layer — a whisper, not a section */}
      <div className={styles.marquee} aria-label="Insurance partners">
        <div className={styles.track}>
          {[...insurers, ...insurers].map((name, i) => (
            <span key={`${name}-${i}`}>
              {name}
              <i>✦</i>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
