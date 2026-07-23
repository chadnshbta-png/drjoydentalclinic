"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { founder, ethos, milestones } from "@/lib/content";
import styles from "./People.module.css";

/**
 * Chapter VI — The People. A calm, layered founder composition — the monogram
 * portrait, the founding conviction, two quiet ethos lines held in clear space
 * — flowing into the milestone timeline. Nothing competes for attention.
 */

// Two ethos lines only (the belief itself now lives in Chapter II).
const QUOTES = ethos.slice(1, 3);

export default function People() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const S = styles;

      gsap.fromTo(
        `.${S.founderLine} > span`,
        { yPercent: 118 },
        {
          yPercent: 0,
          stagger: 0.12,
          duration: 1.15,
          ease: "power4.out",
          scrollTrigger: { trigger: `.${S.founderWrap}`, start: "top 70%", once: true },
        }
      );

      gsap.fromTo(
        `.${S.medallion}`,
        { opacity: 0, scale: 0.8, rotate: -6 },
        {
          opacity: 1,
          scale: 1,
          rotate: 0,
          duration: 1.3,
          ease: "power3.out",
          scrollTrigger: { trigger: `.${S.founderWrap}`, start: "top 66%", once: true },
        }
      );

      gsap.fromTo(
        `.${S.quote}`,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.16,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: `.${S.founderWrap}`, start: "top 58%", once: true },
        }
      );

      const bg = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
      if (bg) {
        gsap.to(`.${S.bgWord}`, {
          yPercent: -20,
          ease: "none",
          scrollTrigger: { trigger: `.${S.founderWrap}`, start: "top bottom", end: "bottom top", scrub: 1 },
        });
        gsap.utils.toArray<HTMLElement>(`.${S.quote}`).forEach((q, i) => {
          gsap.to(q, {
            y: i % 2 ? -28 : 28,
            ease: "none",
            scrollTrigger: { trigger: `.${S.founderWrap}`, start: "top bottom", end: "bottom top", scrub: 1.3 },
          });
        });

        const med = rootRef.current!.querySelector<HTMLElement>(`.${S.medallion}`);
        if (med && !window.matchMedia("(hover: none)").matches) {
          gsap.set(med, { transformPerspective: 800 });
          const rx = gsap.quickTo(med, "rotationX", { duration: 0.7, ease: "power3" });
          const ry = gsap.quickTo(med, "rotationY", { duration: 0.7, ease: "power3" });
          const move = (e: PointerEvent) => {
            const r = med.getBoundingClientRect();
            if (r.bottom < 0 || r.top > window.innerHeight) return;
            rx(-((e.clientY - (r.top + r.height / 2)) / r.height) * 14);
            ry(((e.clientX - (r.left + r.width / 2)) / r.width) * 16);
          };
          window.addEventListener("pointermove", move, { passive: true });
        }
      }

      gsap.fromTo(
        `.${S.tLine}`,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.6,
          ease: "power2.inOut",
          scrollTrigger: { trigger: `.${S.timeline}`, start: "top 74%", once: true },
        }
      );
      ScrollTrigger.batch(`.${S.milestone}`, {
        start: "top 86%",
        once: true,
        onEnter: (els) =>
          gsap.fromTo(els, { opacity: 0, y: 34 }, { opacity: 1, y: 0, stagger: 0.12, duration: 0.9, ease: "power3.out" }),
      });
    },
    { scope: rootRef }
  );

  return (
    <section id="people" ref={rootRef} className={`chapter ${styles.people}`}>
      {/* ——— layered founder composition ——— */}
      <div className={styles.founderWrap}>
        <span className={styles.bgWord} aria-hidden="true">People</span>

        <div className="container">
          <p className="chapter-mark">Chapter VI · The People</p>

          <div className={styles.founderGrid}>
            <div className={styles.founderText}>
              <h2 className={styles.founderQuote}>
                {founder.line.split(" — ").map((part, i) => (
                  <span key={i} className={`line-mask ${styles.founderLine}`}>
                    <span>{i === 0 ? `${part} —` : part}</span>
                  </span>
                ))}
              </h2>
              <p className={styles.founderName}>
                {founder.name}
                <em> · {founder.role}</em>
              </p>
            </div>

            <figure className={styles.medallion}>
              <span className={styles.medRing} aria-hidden="true" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo/img-logo-png-192x.png" alt="Dr Joy Dental Clinic" className="logo-gold" loading="lazy" decoding="async" />
              <figcaption>Founder · Dr Joy Dental Clinics</figcaption>
            </figure>
          </div>
        </div>

        {/* two quiet ethos lines, held in clear space */}
        <div className={styles.quotes} aria-hidden="false">
          {QUOTES.map((q, i) => (
            <blockquote key={q} className={`${styles.quote} ${styles[`q${i}`]}`}>
              “{q}”
            </blockquote>
          ))}
        </div>
      </div>

      {/* ——— milestone timeline ——— */}
      <div className={`container ${styles.timeline}`}>
        <span className={styles.tLine} aria-hidden="true" />
        {milestones.map((m, i) => {
          // "·" marks an undated stop. On desktop it's a tiny dot on the rail;
          // on mobile we tag it so CSS can hide the orphaned dot and let the
          // bead alone mark the stop. Dated anchors (2004 / Today) keep a label.
          const dated = m.marker !== "·";
          return (
            <div
              key={i}
              className={`${styles.milestone} ${dated ? styles.dated : styles.undated}`}
            >
              <span className={styles.tBead} aria-hidden="true" />
              <span className={styles.tMarker} aria-hidden={!dated}>
                {m.marker}
              </span>
              <p className={styles.tText}>{m.text}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
