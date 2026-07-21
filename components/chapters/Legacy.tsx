"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import styles from "./Legacy.module.css";

/**
 * Chapter II — The Legacy.
 *
 * A seamless continuation of the hero: on the very same warm tone the film
 * left behind, the words "The Legacy" resolve, then a single belief composes
 * itself, word by word, in generous space. It breathes, then blurs away —
 * handing the story to the next chapter like a page turning. No new block,
 * no new image; the hero simply keeps going.
 */

// One belief. Split into two breaths — the statement, then its resolution.
const LINE_1 = ["Since", "2004,", "one", "belief", "has", "guided", "us", "—"];
const LINE_2 = ["a", "smile", "is", "not", "treated.", "It", "is", "composed."];

export default function Legacy() {
  const rootRef = useRef<HTMLElement>(null);

  // The ambient CSS animations run ONLY while the section is on-screen AND the
  // reveal hasn't yet finished. Toggling .playing lets the browser drop those
  // compositing layers the instant they're no longer needed — so the hand-off
  // into Chapter III (where WebGL spins up) is never competing with a large
  // animated gradient still painting every frame.
  //
  // `onScreen` comes from the IntersectionObserver; `revealed` is set by the
  // pin timeline (below) once the scene has lifted away. .playing = onScreen &&
  // !revealed, so the ambient layers stop compositing at the exact moment the
  // words fade out — a beat *before* the un-pin cut, clearing the GPU for the
  // WebGL warm-up that's already running underneath.
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
        // The title resolves with a soft scale + rise + fade — no blur filter.
        // An animated blur() recomputes a gaussian over large text every scrub
        // frame; on this warm tone a gentle settle reads the same and costs
        // nothing, keeping the exit perfectly fluid.
        gsap.set(`.${S.words}`, { opacity: 0, scale: 0.965, y: 24 });
        gsap.set(`.${S.ww}`, { yPercent: 120 });
        // the ambient layers begin faint and warm to full presence as we settle
        gsap.set(`.${S.ambient}`, { opacity: 0 });
        gsap.set(`.${S.sweep}`, { opacity: 0 });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: `.${S.pin}`,
            start: "top top",
            end: "+=360%",
            pin: true,
            scrub: 0.6,
            // once the scene has lifted away (matches the fade-out at ~0.88),
            // release the ambient/sweep compositing layers so the un-pin into
            // Chapter III is a clean cut with nothing left painting behind it.
            onUpdate: (self) => {
              const done = self.progress >= 0.9;
              if (done !== revealed.current) {
                revealed.current = done;
                syncPlaying();
              }
            },
          },
        });

        tl
          // the ambient tone breathes in first, so the section is alive before
          // a single word appears — a seamless continuation of the hero
          .to(`.${S.ambient}`, { opacity: 0.9, duration: 0.14, ease: "power1.out" }, 0)
          // the title resolves out of that tone — a soft rise into focus
          .to(`.${S.mark}`, { opacity: 1, duration: 0.06 }, 0.04)
          .to(
            `.${S.words}`,
            { opacity: 1, scale: 1, y: 0, duration: 0.2, ease: "power2.out" },
            0.06
          )
          // the sentence composes itself, word by word, in two unhurried breaths
          .to(`.${S.l1} .${S.ww}`, { yPercent: 0, duration: 0.2, stagger: 0.028, ease: "power4.out" }, 0.34)
          .to(`.${S.l2} .${S.ww}`, { yPercent: 0, duration: 0.2, stagger: 0.028, ease: "power4.out" }, 0.52)
          // a whisper of parallax as it holds — the words drift up ever so
          // slightly against the ambient behind them
          .to(`.${S.storyWrap}`, { y: -16, duration: 0.3, ease: "none" }, 0.34)
          .to(`.${S.words}`, { y: -10, duration: 0.3, ease: "none" }, 0.34)
          .to(`.${S.ambient}`, { yPercent: 4, duration: 0.3, ease: "none" }, 0.34)
          // ————— it breathes (0.7 → 0.88) —————
          // cinematic hand-off: the scene lifts and fades away, a page turning.
          // A scale-down + fade reads as the old soft dissolve without a blur
          // filter running through the un-pin.
          .to([`.${S.words}`, `.${S.storyWrap}`, `.${S.mark}`], {
            opacity: 0,
            scale: 0.985,
            y: -46,
            duration: 0.16,
            ease: "power2.in",
          }, 0.88)
          .to(`.${S.ambient}`, { opacity: 0, duration: 0.16, ease: "power2.in" }, 0.9);

        return () => {};
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set([`.${S.words}`, `.${S.mark}`, `.${S.ww}`], {
          opacity: 1,
          scale: 1,
          y: 0,
          yPercent: 0,
        });
        gsap.set(`.${S.ambient}`, { opacity: 0.9 });
      });

      ScrollTrigger.refresh();
    },
    { scope: rootRef }
  );

  return (
    <section id="legacy" ref={rootRef} className={`chapter ${styles.legacy}`}>
      <div className={styles.pin}>
        {/* barely-there living tone — never a new visual element, only warmth
            kept in motion behind the words */}
        <div className={styles.ambient} aria-hidden="true" />
        <div className={styles.sweep} aria-hidden="true" />

        <p className={`chapter-mark ${styles.mark}`}>Chapter II · The Legacy</p>

        {/* the title, on the hero's own tone */}
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
