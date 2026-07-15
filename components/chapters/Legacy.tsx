"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import styles from "./Legacy.module.css";

/**
 * Chapter II — The Legacy.
 *
 * A seamless continuation of the hero: the words "The Legacy" resolve, the
 * atelier image grows out from inside the letters until it fills the frame,
 * then slides upward while a single belief composes itself, word by word,
 * in generous space. It breathes, then blurs away — handing the story to the
 * next chapter like a page turning.
 */

// One belief. Split into two breaths — the statement, then its resolution.
const LINE_1 = ["Since", "2004,", "one", "belief", "has", "guided", "us", "—"];
const LINE_2 = ["a", "smile", "is", "not", "treated.", "It", "is", "composed."];

export default function Legacy() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const S = styles;
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(`.${S.imgWrap}`, { scale: 0.34, opacity: 0, filter: "blur(14px)" });
        gsap.set(`.${S.words}`, { opacity: 0, scale: 0.86 });
        gsap.set(`.${S.ww}`, { yPercent: 120 });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: `.${S.pin}`,
            start: "top top",
            end: "+=420%",
            pin: true,
            scrub: 0.5,
          },
        });

        tl
          // the words resolve in the space the film left behind
          .to(`.${S.mark}`, { opacity: 1, duration: 0.03 }, 0.02)
          .to(`.${S.words}`, { opacity: 1, scale: 1, duration: 0.08, ease: "power2.out" }, 0.03)
          // the image grows out from inside the letters
          .to(`.${S.imgWrap}`, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.16, ease: "power2.out" }, 0.1)
          .to(`.${S.words}`, { scale: 1.9, opacity: 0, filter: "blur(6px)", duration: 0.13, ease: "power2.in" }, 0.11)
          // it settles, then slides up to make room for the belief
          .to(`.${S.imgWrap}`, {
            y: () => -window.innerHeight * 0.2,
            scale: 0.66,
            duration: 0.14,
            ease: "power2.inOut",
          }, 0.26)
          // the sentence composes itself, word by word, in two breaths
          .to(`.${S.l1} .${S.ww}`, { yPercent: 0, duration: 0.14, stagger: 0.012, ease: "power4.out" }, 0.34)
          .to(`.${S.l2} .${S.ww}`, { yPercent: 0, duration: 0.14, stagger: 0.012, ease: "power4.out" }, 0.46)
          // ————— it breathes (0.6 → 0.82) —————
          // cinematic hand-off: the scene lifts and blurs away, a page turning
          .to([`.${S.imgWrap}`, `.${S.storyWrap}`, `.${S.mark}`], {
            opacity: 0,
            filter: "blur(12px)",
            y: -46,
            duration: 0.14,
            ease: "power2.in",
          }, 0.84);

        return () => {};
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(`.${S.imgWrap}`, { opacity: 1, scale: 1 });
        gsap.set(`.${S.words}`, { opacity: 0 });
        gsap.set([`.${S.mark}`, `.${S.ww}`], { opacity: 1, yPercent: 0 });
      });

      ScrollTrigger.refresh();
    },
    { scope: rootRef }
  );

  return (
    <section id="legacy" ref={rootRef} className={`chapter ${styles.legacy}`}>
      <div className={styles.pin}>
        <p className={`chapter-mark ${styles.mark}`}>Chapter II · The Legacy</p>

        {/* the image, grown from inside the words */}
        <div className={styles.imgWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/atelier.png" alt="A clear aligner presented under atelier light" decoding="async" />
          <span className={styles.imgSheen} aria-hidden="true" />
        </div>

        {/* the words the image emerges from */}
        <h2 className={styles.words} aria-label="The Legacy">
          The Legacy
        </h2>

        {/* the single belief, composed word by word */}
        <div className={styles.storyWrap}>
          <p
            className={`${styles.line} ${styles.l1}`}
            aria-label="Since 2004, one belief has guided us —"
          >
            {LINE_1.map((w, i) => (
              <span key={i} className={styles.wm}>
                <span className={styles.ww}>{w}</span>
              </span>
            ))}
          </p>
          <p
            className={`${styles.line} ${styles.l2}`}
            aria-label="a smile is not treated. It is composed."
          >
            {LINE_2.map((w, i) => (
              <span key={i} className={styles.wm}>
                <span className={styles.ww}>{w}</span>
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
