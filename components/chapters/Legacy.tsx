"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import styles from "./Legacy.module.css";

/**
 * Chapter II — The Legacy. Completely reconceived.
 *
 * A single, cinematic composition on the hero's own warm greige. Four layers,
 * drawn in depth:
 *   1. a vast, faded roman numeral "II" — the chapter, held like a watermark
 *      in the marble
 *   2. a hairline of gold that draws itself across the frame
 *   3. one belief, resolving character by character in the Aureate serif
 *   4. a quiet caption, the years and the promise
 *
 * A soft key-light breathes behind it all (one radial gradient, no filter) and
 * a slow beam of studio light passes across — cinematic depth for almost no
 * cost. The whole scene parallaxes gently on scroll, then lifts away as the
 * greige dissolves into the ivory of Chapter III — both edges seamless, the
 * hero's tone carried in, the Craft's page handed out.
 *
 * Performance: transforms + opacity only — no blur(), no drop-shadow(), no
 * mix-blend-mode. The ambient layers animate ONLY while the section is on
 * screen (IntersectionObserver toggles .playing), and their will-change is
 * scoped to that same window, so the hand-off into the WebGL chapter never
 * competes with a compositing layer that is no longer needed.
 */

// split a line to characters for the resolve, preserving spaces
function toChars(line: string) {
  return line.split("").map((ch) => (ch === " " ? " " : ch));
}

export default function Legacy() {
  const rootRef = useRef<HTMLElement>(null);

  // Ambient light only lives while the section is genuinely on screen, so the
  // browser drops the layer the instant we scroll past — clearing the GPU for
  // the WebGL warm-up of Chapter III.
  const onScreen = useRef(false);
  const revealed = useRef(false);
  const syncPlaying = () => {
    const el = rootRef.current;
    if (el) el.classList.toggle(styles.playing, onScreen.current && !revealed.current);
  };

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        onScreen.current = e.isIntersecting;
        syncPlaying();
      },
      { rootMargin: "0px" }
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useGSAP(
    () => {
      const S = styles;
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // initial states — everything composes out of the warm tone
        gsap.set(`.${S.numeral}`, { opacity: 0, scale: 1.08, yPercent: 6 });
        gsap.set(`.${S.rule}`, { scaleX: 0, transformOrigin: "left center" });
        gsap.set(`.${S.mark}`, { opacity: 0, y: 14 });
        gsap.set(`.${S.char}`, { opacity: 0, yPercent: 115 });
        gsap.set(`.${S.caption}`, { opacity: 0, y: 18 });
        gsap.set(`.${S.key}`, { opacity: 0 });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: `.${S.pin}`,
            start: "top top",
            end: "+=340%",
            pin: true,
            scrub: 0.6,
            onUpdate: (self) => {
              // release the ambient light once the scene has lifted, a beat
              // before the un-pin, so nothing composites into the hand-off
              const done = self.progress >= 0.9;
              if (done !== revealed.current) {
                revealed.current = done;
                syncPlaying();
              }
            },
          },
        });

        tl
          // the key-light breathes in first — the scene is lit before anything
          // is said
          .to(`.${S.key}`, { opacity: 1, duration: 0.14, ease: "power1.out" }, 0)
          // the vast numeral resolves out of the tone, held far back
          .to(`.${S.numeral}`, { opacity: 0.16, scale: 1, yPercent: 0, duration: 0.24, ease: "power2.out" }, 0.02)
          // the chapter mark, then the gold hairline draws across
          .to(`.${S.mark}`, { opacity: 1, y: 0, duration: 0.1, ease: "power2.out" }, 0.14)
          .to(`.${S.rule}`, { scaleX: 1, duration: 0.22, ease: "power3.inOut" }, 0.18)
          // the belief resolves, character by character, in two calm waves
          .to(
            `.${S.l1} .${S.char}`,
            { opacity: 1, yPercent: 0, duration: 0.02, stagger: 0.006, ease: "power3.out" },
            0.34
          )
          .to(
            `.${S.l2} .${S.char}`,
            { opacity: 1, yPercent: 0, duration: 0.02, stagger: 0.006, ease: "power3.out" },
            0.5
          )
          // the caption settles beneath
          .to(`.${S.caption}`, { opacity: 1, y: 0, duration: 0.1, ease: "power2.out" }, 0.6)
          // ——— it holds and breathes (0.66 → 0.84) ———
          // a whisper of depth: the layers drift at different speeds as it holds
          .to(`.${S.numeral}`, { yPercent: -5, duration: 0.5, ease: "none" }, 0.34)
          .to(`.${S.beliefWrap}`, { y: -14, duration: 0.5, ease: "none" }, 0.34)
          .to(`.${S.caption}`, { y: -6, duration: 0.4, ease: "none" }, 0.6)
          // cinematic hand-off: the composition lifts and fades as the greige
          // dissolves into ivory — a page turning into Chapter III
          .to(
            [`.${S.stage}`],
            { yPercent: -8, opacity: 0, duration: 0.16, ease: "power2.in" },
            0.86
          )
          .to(`.${S.key}`, { opacity: 0, duration: 0.16, ease: "power2.in" }, 0.86)
          .to(`.${S.pin}`, { "--dissolve": 1, duration: 0.2, ease: "power1.inOut" }, 0.82);
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(
          [`.${S.numeral}`, `.${S.mark}`, `.${S.rule}`, `.${S.char}`, `.${S.caption}`, `.${S.key}`],
          { opacity: 1, scale: 1, y: 0, yPercent: 0, scaleX: 1 }
        );
        gsap.set(`.${S.numeral}`, { opacity: 0.16 });
      });

      ScrollTrigger.refresh();
    },
    { scope: rootRef }
  );

  return (
    <section id="legacy" ref={rootRef} className={`chapter ${styles.legacy}`}>
      <div className={styles.pin}>
        {/* cinematic lighting — a soft key that breathes, and a slow beam */}
        <div className={styles.key} aria-hidden="true" />
        <div className={styles.beam} aria-hidden="true" />

        {/* the vast chapter numeral, held far back in the marble */}
        <div className={styles.numeral} aria-hidden="true">
          II
        </div>

        <div className={styles.stage}>
          <p className={`chapter-mark ${styles.mark}`}>Chapter II · The Legacy</p>
          <span className={styles.rule} aria-hidden="true" />

          <h2 className={styles.belief} aria-label="A smile is not treated. It is composed.">
            <span className={styles.beliefWrap}>
              <span className={`${styles.line} ${styles.l1}`}>
                {toChars("A smile is not treated.").map((ch, i) => (
                  <span key={i} className={styles.cm}>
                    <span className={styles.char}>{ch}</span>
                  </span>
                ))}
              </span>
              <span className={`${styles.line} ${styles.l2}`}>
                {toChars("It is composed.").map((ch, i) => (
                  <span key={i} className={styles.cm}>
                    <span className={styles.char}>{ch}</span>
                  </span>
                ))}
              </span>
            </span>
          </h2>

          <p className={styles.caption}>
            <span>Since 2004</span>
            <i />
            <span>Thirteen ateliers, one belief</span>
          </p>
        </div>
      </div>
    </section>
  );
}
