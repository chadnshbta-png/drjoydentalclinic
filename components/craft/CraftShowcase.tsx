"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import type { Service } from "@/lib/services";
import RevealCard from "./RevealCard";
import styles from "./CraftShowcase.module.css";

/**
 * Chapter III · The Craft — rebuilt as a luxury, image-first showcase.
 *
 * Data-driven: it renders whatever `services` the server loader found in
 * public/services (no hardcoding). Each service is an alternating editorial
 * row — a large hero reveal frame beside minimal supporting text — so the
 * image is always the hero and everything breathes.
 */
export default function CraftShowcase({ services }: { services: Service[] }) {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Chapter mark — a quiet fade up to open the section.
      gsap.from(`.${styles.mark}`, {
        autoAlpha: 0,
        y: 16,
        duration: 0.9,
        ease: "power2.out",
        scrollTrigger: { trigger: `.${styles.head}`, start: "top 82%", once: true },
      });

      // Heading — each line rises from its mask with a soft blur clearing, so
      // the title resolves into focus rather than simply appearing.
      gsap.from(`.${styles.headLine} > span`, {
        yPercent: 120,
        filter: prefersReduced ? "blur(0px)" : "blur(10px)",
        duration: 1.25,
        ease: "power4.out",
        stagger: 0.12,
        scrollTrigger: { trigger: `.${styles.head}`, start: "top 78%", once: true },
        clearProps: "filter",
      });

      // Description — gentle translate + opacity, a beat after the heading.
      gsap.from(`.${styles.headMeta}`, {
        autoAlpha: 0,
        y: 24,
        duration: 1.1,
        ease: "power3.out",
        delay: 0.15,
        scrollTrigger: { trigger: `.${styles.head}`, start: "top 72%", once: true },
      });

      // Each row choreographs its own entrance: the image floats up with a
      // subtle scale + fade, and the supporting text staggers in beside it.
      gsap.utils.toArray<HTMLElement>(`.${styles.row}`).forEach((row) => {
        const visual = row.querySelector(`.${styles.visual}`);
        const textBits = row.querySelectorAll(`.${styles.info} > *`);

        const tl = gsap.timeline({
          defaults: { ease: "power3.out" },
          scrollTrigger: { trigger: row, start: "top 78%", once: true },
        });

        if (visual)
          tl.from(
            visual,
            {
              autoAlpha: 0,
              yPercent: 9,
              scale: 0.93,
              duration: 1.4,
              ease: "expo.out",
              transformOrigin: "50% 65%",
            },
            0
          );

        if (textBits.length)
          tl.from(
            textBits,
            {
              autoAlpha: 0,
              y: 34,
              duration: 1.05,
              ease: "power3.out",
              stagger: 0.12,
            },
            0.22
          );
      });

      // Subtle image parallax — the inner wrapper drifts slightly against the
      // scroll for depth. Applied to .visualInner so it never fights the
      // entrance tween on .visual. Skipped for reduced-motion.
      if (!prefersReduced) {
        gsap.utils.toArray<HTMLElement>(`.${styles.visualInner}`).forEach((v) => {
          gsap.fromTo(
            v,
            { yPercent: 4 },
            {
              yPercent: -4,
              ease: "none",
              scrollTrigger: {
                trigger: v,
                start: "top bottom",
                end: "bottom top",
                scrub: 1,
              },
            }
          );
        });
      }

      ScrollTrigger.refresh();
    },
    { scope: rootRef, dependencies: [services.length] }
  );

  return (
    <section id="craft" ref={rootRef} className={`chapter ${styles.craft}`}>
      <div className={`container ${styles.head}`}>
        <p className={`chapter-mark ${styles.mark}`}>Chapter III · The Craft</p>
        <h2 className={styles.title}>
          <span className={styles.headLine}>
            <span>Every treatment,</span>
          </span>
          <span className={styles.headLine}>
            <span>a transformation.</span>
          </span>
        </h2>
        <p className={styles.headMeta}>
          Move across each study to bring the result into the light — or reveal
          it in full. The same precision we bring to the chair.
        </p>
      </div>

      <div className={styles.rows}>
        {services.map((service, i) => (
          <div
            key={service.slug}
            className={`${styles.row} ${i % 2 ? styles.rowReverse : ""}`}
          >
            <div className={styles.visual}>
              <div className={styles.visualInner}>
                <RevealCard service={service} index={i} />
              </div>
            </div>

            <div className={styles.info}>
              <span className={styles.index}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className={styles.serviceTitle}>{service.title}</h3>
              <p className={styles.serviceCopy}>{service.description}</p>
              <a
                className={styles.cta}
                href="#reserve"
                aria-label={`${service.cta} — ${service.title}`}
              >
                <span>{service.cta}</span>
                <i className={styles.ctaLine} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
