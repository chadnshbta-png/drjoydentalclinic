"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { clinics } from "@/lib/content";
import styles from "./Places.module.css";

/**
 * Chapter V — The Places. A single dolly shot across Dubai: thirteen rooms,
 * one shoreline of gold. Vertical scroll drives the horizontal camera on
 * desktop; on touch layouts it relaxes into a snap filmstrip.
 */
export default function Places() {
  const rootRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 761px) and (prefers-reduced-motion: no-preference)", () => {
        const track = trackRef.current!;
        const distance = () => -(track.scrollWidth - window.innerWidth);

        const pan = gsap.to(track, {
          x: distance,
          ease: "none",
          scrollTrigger: {
            trigger: `.${styles.stage}`,
            start: "top top",
            end: () => `+=${track.scrollWidth - window.innerWidth}`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const idx = Math.min(
                clinics.length - 1,
                Math.floor(self.progress * clinics.length)
              );
              document
                .querySelectorAll(`.${styles.dot}`)
                .forEach((d, i) => d.classList.toggle(styles.dotOn, i <= idx));
            },
          },
        });

        // Gentle counter-drift inside each frame — depth without noise.
        gsap.utils.toArray<HTMLElement>(`.${styles.photo} img`).forEach((img) => {
          gsap.fromTo(
            img,
            { xPercent: -6 },
            {
              xPercent: 6,
              ease: "none",
              scrollTrigger: {
                containerAnimation: pan,
                trigger: img,
                start: "left right",
                end: "right left",
                scrub: true,
              },
            }
          );
        });
      });
    },
    { scope: rootRef }
  );

  return (
    <section id="places" ref={rootRef} className="chapter">
      <div className={styles.stage}>
        <div className={styles.heading}>
          <p className="chapter-mark">Chapter V · The Places</p>
          <h2>Thirteen addresses. One standard of calm.</h2>
        </div>

        <div className={styles.constellation} aria-hidden="true">
          {clinics.map((c) => (
            <span key={c.name} className={styles.dot} />
          ))}
        </div>

        <div ref={trackRef} className={styles.track}>
          {clinics.map((c, i) => (
            <article key={c.name} className={styles.panel}>
              <div className={styles.photo}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.image} alt={c.name} loading="lazy" />
                <span className={styles.index}>
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <div className={styles.info}>
                <h3>{c.name}</h3>
                <p className={styles.address}>{c.address}</p>
                <div className={styles.infoRow}>
                  <a href={c.maps} target="_blank" rel="noopener" className={styles.directions}>
                    Get directions
                  </a>
                  <a href={`tel:${c.phone.replace(/\s/g, "")}`} className={styles.phone}>
                    {c.phone}
                  </a>
                </div>
              </div>
            </article>
          ))}
          <div className={styles.finalPanel}>
            <p>
              Wherever you are in Dubai,
              <br />
              a Dr Joy clinic is minutes away.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
