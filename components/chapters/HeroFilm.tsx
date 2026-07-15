"use client";

import { useRef } from "react";
import SplitType from "split-type";
import { gsap, useGSAP } from "@/lib/gsap";
import { getFilm } from "@/lib/frameLoader";
import { FRAME_COUNT, frameSrc } from "@/lib/content";
import styles from "./HeroFilm.module.css";

/**
 * Chapter I — The Reveal.
 *
 * A 720-frame macro film of a clear aligner is scrubbed by scroll through a
 * lerped playhead that glides through frames in order (both directions), so
 * playback never pops. Typography is directed like a film: the visitor sees
 * the visuals first, then one idea is revealed at a time — each composed into
 * the negative space the shot leaves open, each with its own editorial motion,
 * with deliberate silence between. A film scrubber + chapter index and a soft
 * pointer parallax complete the interactive-film feel.
 */

// Warm greige matching the film's backdrop — used for letterbox fill so no
// hard edge ever shows.
const HERO_BG = "#e9e4db";

// Gentle overscan + crop bias, keeping the left-weighted subject and pushing
// the source's bottom-right sparkle watermark toward the corner. A per-frame
// clone patch (below) erases whatever remains.
const ZOOM = 1.06;
const BIAS_X = 0.38;
const BIAS_Y = 0.3;

// Source-normalised watermark box + where to sample clean backdrop from.
const WM = { cx: 0.905, cy: 0.837, w: 0.12, h: 0.15 };

export default function HeroFilm() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrubRef = useRef<HTMLDivElement>(null);
  const idxRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const S = styles;
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d", { alpha: false })!;
      const film = getFilm();
      film.start();

      let target = 0;
      let playhead = 0;
      let painted = -1;
      let raf = 0;

      const dpr = () =>
        Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.5 : 2);

      const resize = () => {
        canvas.width = Math.round(window.innerWidth * dpr());
        canvas.height = Math.round(window.innerHeight * dpr());
        painted = -1;
      };
      resize();
      window.addEventListener("resize", resize);

      const paint = (index: number) => {
        const frame = film.nearest(index);
        if (!frame) return;
        const iw = frame.width;
        const ih = frame.height;
        const cw = canvas.width;
        const ch = canvas.height;
        const scale = Math.max(cw / iw, ch / ih) * ZOOM;
        const dw = iw * scale;
        const dh = ih * scale;
        const dx = (cw - dw) * BIAS_X;
        const dy = (ch - dh) * BIAS_Y;
        ctx.fillStyle = HERO_BG;
        ctx.fillRect(0, 0, cw, ch);
        ctx.drawImage(frame, dx, dy, dw, dh);

        // Erase the sparkle watermark: clone a clean patch from just left of it
        // over the mark, softly blurred so the seam disappears.
        const wmw = WM.w * iw;
        const wmh = WM.h * ih;
        const wx = WM.cx * iw - wmw / 2;
        const wy = WM.cy * ih - wmh / 2;
        const sx = wx - wmw - 0.015 * iw; // clean sample to the left
        ctx.save();
        ctx.filter = "blur(6px)";
        ctx.globalAlpha = 0.98;
        ctx.drawImage(
          frame,
          Math.max(0, sx), wy, wmw, wmh,
          dx + wx * scale - 6, dy + wy * scale - 6,
          wmw * scale + 12, wmh * scale + 12
        );
        ctx.restore();
      };

      const loop = () => {
        playhead += (target - playhead) * 0.16;
        if (Math.abs(target - playhead) < 0.05) playhead = target;
        const frameIndex = Math.round(playhead);
        if (frameIndex !== painted) {
          paint(playhead);
          painted = frameIndex;
        }
        raf = requestAnimationFrame(loop);
      };

      const CHAPTERS: [number, string][] = [
        [0.2, "01 · Arrival"],
        [0.44, "02 · Craft"],
        [0.74, "03 · The Fit"],
        [0.92, "04 · The Reveal"],
        [1.01, "05 · Begin"],
      ];
      const setIndex = (p: number) => {
        const label = CHAPTERS.find(([t]) => p < t)?.[1] ?? CHAPTERS[0][1];
        if (idxRef.current && idxRef.current.textContent !== label)
          idxRef.current.textContent = label;
      };

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const END = "+=620%";

        film.whenReady(1).then(() => (painted = -1));
        raf = requestAnimationFrame(loop);

        // Pointer parallax — the whole caption layer drifts a few px for depth.
        if (!window.matchMedia("(hover: none)").matches) {
          const ox = gsap.quickTo(`.${S.overlay}`, "x", { duration: 0.8, ease: "power3" });
          const oy = gsap.quickTo(`.${S.overlay}`, "y", { duration: 0.8, ease: "power3" });
          const move = (e: PointerEvent) => {
            ox((e.clientX / window.innerWidth - 0.5) * 16);
            oy((e.clientY / window.innerHeight - 0.5) * 12);
          };
          window.addEventListener("pointermove", move, { passive: true });
        }

        /* ————— one clock: the pin, the frame target, and every caption ————— */
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: END,
            pin: true,
            anticipatePin: 1,
            scrub: 0.7,
            onUpdate: (self) => {
              target = self.progress * (FRAME_COUNT - 1);
              if (scrubRef.current)
                scrubRef.current.style.transform = `scaleX(${self.progress})`;
              setIndex(self.progress);
            },
          },
        });

        // scroll cue retires almost immediately
        tl.to(`.${S.cue}`, { opacity: 0, y: -10, duration: 0.02 }, 0.02);

        // — Opening statement — a quiet title card, word by word —
        // Held small and brief so the film is experienced first.
        const b0 = `.${S.b0}`;
        gsap.set(`${b0} .${S.ww}`, { yPercent: 118 });
        gsap.set(`${b0} .${S.b0rule}`, { scaleX: 0, transformOrigin: "left" });
        gsap.set(b0, { opacity: 1 });
        tl.to(`${b0} .${S.b0rule}`, { scaleX: 1, duration: 0.025, ease: "power2.inOut" }, 0.03)
          .to(`${b0} .${S.ww}`, { yPercent: 0, duration: 0.045, stagger: 0.009, ease: "power4.out" }, 0.038)
          .to(b0, { y: -26, duration: 0.06 }, 0.085) // gentle lift on hold
          .to(b0, { opacity: 0, filter: "blur(6px)", duration: 0.028 }, 0.108);

        // — Beat 1 · Arrival (right) — mask reveal + tracking-in —
        const b1 = `.${S.b1}`;
        gsap.set(`${b1} .${S.line}`, { yPercent: 120 });
        gsap.set(`${b1} .${S.kicker}`, { opacity: 0, y: 14, letterSpacing: "0.7em" });
        tl.to(`${b1} .${S.kicker}`, { opacity: 1, y: 0, letterSpacing: "0.42em", duration: 0.03, ease: "power3.out" }, 0.17)
          .to(`${b1} .${S.line}`, { yPercent: 0, duration: 0.05, ease: "power4.out" }, 0.18)
          .fromTo(`${b1} .${S.line}`, { letterSpacing: "0.14em" }, { letterSpacing: "0em", duration: 0.09, ease: "power2.out" }, 0.18)
          .to(b1, { y: -46, duration: 0.06 }, 0.24) // gentle depth drift on hold
          .to(b1, { opacity: 0, filter: "blur(7px)", duration: 0.03 }, 0.28);

        // — Beat 2 · Craft (right-half, left-aligned) — blur resolving into focus —
        const b2 = `.${S.b2}`;
        gsap.set(b2, { opacity: 0 });
        tl.fromTo(b2, { opacity: 0, filter: "blur(16px)", scale: 1.06 }, { opacity: 1, filter: "blur(0px)", scale: 1, duration: 0.05, ease: "power2.out" }, 0.38)
          .fromTo(`${b2} .${S.rule}`, { scaleX: 0 }, { scaleX: 1, duration: 0.05, ease: "power2.inOut" }, 0.39)
          .to(b2, { y: -30, duration: 0.08 }, 0.44)
          .to(b2, { opacity: 0, filter: "blur(6px)", duration: 0.03 }, 0.47);

        // ————— silence over the fit (0.47 → 0.78) —————

        // — Beat 3 · The Reveal (center) — character-by-character climax —
        const b3 = `.${S.b3}`;
        const split = new SplitType(`${b3} .${S.climax}`, { types: "chars" });
        gsap.set(b3, { opacity: 1 });
        gsap.set(`${b3} .${S.scrim}`, { opacity: 0 });
        gsap.set(`${b3} .${S.kicker}`, { opacity: 0, y: 12 });
        gsap.set(split.chars, { yPercent: 110, opacity: 0, filter: "blur(8px)" });
        tl.to(`${b3} .${S.scrim}`, { opacity: 1, duration: 0.05 }, 0.75)
          .to(`${b3} .${S.kicker}`, { opacity: 1, y: 0, duration: 0.03 }, 0.76)
          .to(split.chars, { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 0.06, stagger: 0.0022, ease: "power3.out" }, 0.775)
          .to(b3, { scale: 1.04, duration: 0.1, ease: "power1.inOut" }, 0.86) // slow breathing push
          .to(b3, { opacity: 0, filter: "blur(6px)", duration: 0.03 }, 0.925);

        // — Beat 4 · Begin (bottom-right) — quiet outro on the clean end frames —
        const b4 = `.${S.b4}`;
        gsap.set(b4, { opacity: 0 });
        gsap.set(`${b4} .${S.scrim}`, { opacity: 0 });
        tl.to(`${b4} .${S.scrim}`, { opacity: 1, duration: 0.03 }, 0.955)
          .to(b4, { opacity: 1, duration: 0.03 }, 0.955)
          .fromTo(`${b4} .${S.line}`, { yPercent: 120 }, { yPercent: 0, duration: 0.04, ease: "power4.out" }, 0.958)
          .fromTo(`${b4} .${S.sub}`, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.03 }, 0.978);

        return () => {
          cancelAnimationFrame(raf);
          split.revert();
        };
      });

      // Reduced motion: a still from the reveal + the tagline, no theatre.
      mm.add("(prefers-reduced-motion: reduce)", () => {
        film.whenReady(1).then(() => paint(FRAME_COUNT * 0.87));
        gsap.set([`.${S.b0}`, `.${S.b1}`, `.${S.b2}`, `.${S.b4}`, `.${S.cue}`], { opacity: 0 });
        gsap.set(`.${S.b3}`, { opacity: 1 });
        gsap.set(`.${S.b3} .${S.scrim}`, { opacity: 1 });
      });

      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", resize);
      };
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className={styles.stage} aria-label="Dr Joy Dental Clinics — cinematic introduction">
      {/* Poster = LCP + no-JS fallback; the canvas paints over it. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={frameSrc(0)} alt="" className={styles.poster} fetchPriority="high" />
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.vignette} aria-hidden="true" />

      <div className={styles.overlay}>
        {/* Opening statement — a quiet title card */}
        <div className={`${styles.beat} ${styles.b0}`}>
          <span className={styles.b0rule} aria-hidden="true" />
          <p className={styles.b0line} aria-label="The making of a smile.">
            {["The", "making", "of", "a", "smile."].map((w, i) => (
              <span key={i} className={styles.wm}>
                <span className={styles.ww}>{w}</span>
              </span>
            ))}
          </p>
        </div>

        {/* Beat 1 · Arrival — right */}
        <div className={`${styles.beat} ${styles.b1}`}>
          <p className={styles.kicker}>Invisible Orthodontics</p>
          <h1 className={styles.lineMask}>
            <span className={styles.line}>Almost invisible.</span>
          </h1>
        </div>

        {/* Beat 2 · Craft — lower-left */}
        <div className={`${styles.beat} ${styles.b2}`}>
          <span className={styles.rule} aria-hidden="true" />
          <p className={styles.kicker}>Crafted in our own laboratory</p>
          <p className={styles.lineSm}>Shaped to disappear.</p>
        </div>

        {/* Beat 3 · The Reveal — center climax */}
        <div className={`${styles.beat} ${styles.b3}`}>
          <span className={styles.scrim} aria-hidden="true" />
          <p className={styles.kicker}>Dr Joy Dental Clinics</p>
          <h2 className={styles.climax}>The Art of the Smile</h2>
        </div>

        {/* Beat 4 · Begin — bottom-right outro */}
        <div className={`${styles.beat} ${styles.b4}`}>
          <span className={styles.scrim} aria-hidden="true" />
          <h2 className={styles.lineMask}>
            <span className={styles.line}>Begin yours.</span>
          </h2>
          <p className={styles.sub}>Dr Joy Dental Clinics · Dubai</p>
        </div>

        {/* scroll cue */}
        <div className={styles.cue}>
          <span>Scroll</span>
          <i />
        </div>
      </div>

      {/* film UI — chapter index + scrubber */}
      <div className={styles.filmMeta} aria-hidden="true">
        <span ref={idxRef} className={styles.idx}>01 · Arrival</span>
      </div>
      <div className={styles.scrubTrack} aria-hidden="true">
        <div ref={scrubRef} className={styles.scrubFill} />
      </div>
    </section>
  );
}
