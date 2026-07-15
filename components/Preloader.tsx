"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { getFilm, PRIORITY } from "@/lib/frameLoader";
import { getLenis } from "./SmoothScroll";
import styles from "./Preloader.module.css";

/**
 * The curtain. Holds the room dark-ivory while the film's priority window
 * decodes, then lifts. Scroll is locked until the reveal.
 */
export default function Preloader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const film = getFilm();
    film.start();

    // Lock scroll under the curtain.
    document.documentElement.scrollTop = 0;
    const lockInterval = window.setInterval(() => getLenis()?.stop(), 100);

    const off = film.onProgress((loaded) => {
      const p = Math.min(1, loaded / PRIORITY);
      if (lineRef.current) lineRef.current.style.transform = `scaleX(${p})`;
    });

    let cancelled = false;
    Promise.all([
      // Never hold the curtain hostage to a slow line — after 6s the film
      // keeps streaming behind the experience and playback falls back to the
      // nearest decoded frame.
      Promise.race([
        film.whenReady(PRIORITY),
        new Promise((r) => setTimeout(r, 5000)),
      ]),
      document.fonts?.ready ?? Promise.resolve(),
      // Hold the mark a beat so the reveal never feels abrupt on fast lines.
      new Promise((r) => setTimeout(r, 650)),
    ]).then(() => {
      if (cancelled || !rootRef.current) return;
      window.clearInterval(lockInterval);
      const tl = gsap.timeline({
        onComplete: () => {
          getLenis()?.start();
          setGone(true);
        },
      });
      tl.to(lineRef.current, { scaleX: 1, duration: 0.25, ease: "power2.out" })
        .to(`.${styles.emblem}`, { opacity: 0, y: -14, duration: 0.45 }, "+=0.1")
        .to(rootRef.current, {
          clipPath: "inset(0 0 100% 0)",
          duration: 0.9,
          ease: "power4.inOut",
        }, "-=0.15");
    });

    return () => {
      cancelled = true;
      window.clearInterval(lockInterval);
      off();
      getLenis()?.start();
    };
  }, []);

  if (gone) return null;

  return (
    <div ref={rootRef} className={styles.curtain} aria-hidden="true">
      <div className={styles.emblem}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo/img-logo-png-192x.png"
          alt=""
          className="logo-gold"
          width={200}
          height={60}
        />
        <div className={styles.track}>
          <div ref={lineRef} className={styles.line} />
        </div>
        <span className={styles.word}>The Art of the Smile</span>
      </div>
    </div>
  );
}
