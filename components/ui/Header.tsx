"use client";

import { useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { getLenis } from "@/components/SmoothScroll";
import { brand } from "@/lib/content";
import Magnetic from "./Magnetic";
import styles from "./Header.module.css";

const chapters = [
  { numeral: "I", label: "The Reveal", target: 0 },
  { numeral: "II", label: "The Legacy", target: "#legacy" },
  { numeral: "III", label: "The Craft", target: "#craft" },
  { numeral: "IV", label: "The Stories", target: "#stories" },
  { numeral: "V", label: "The Places", target: "#places" },
  { numeral: "VI", label: "The People", target: "#people" },
  { numeral: "VII", label: "Reserve", target: "#reserve" },
] as const;

export default function Header() {
  const rootRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [open, setOpen] = useState(false);

  useGSAP(
    () => {
      const tl = gsap.timeline({ paused: true });
      tl.set(overlayRef.current, { pointerEvents: "auto" })
        .to(overlayRef.current, {
          clipPath: "inset(0 0 0% 0)",
          duration: 0.9,
          ease: "power4.inOut",
        })
        .fromTo(
          `.${styles.item}`,
          { yPercent: 120, opacity: 0 },
          { yPercent: 0, opacity: 1, stagger: 0.06, duration: 0.8 },
          "-=0.35"
        )
        .fromTo(
          `.${styles.overlayFoot}`,
          { opacity: 0 },
          { opacity: 1, duration: 0.5 },
          "-=0.4"
        );
      tlRef.current = tl;

      ScrollTrigger.create({
        start: 0,
        end: () => ScrollTrigger.maxScroll(window),
        onUpdate: (self) => {
          if (fillRef.current)
            fillRef.current.style.transform = `scaleY(${self.progress})`;
        },
      });
    },
    { scope: rootRef }
  );

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      getLenis()?.stop();
      tlRef.current?.play();
    } else {
      getLenis()?.start();
      tlRef.current?.reverse();
    }
  };

  const go = (target: string | number) => {
    setOpen(false);
    tlRef.current?.reverse();
    getLenis()?.start();
    getLenis()?.scrollTo(target as string, { duration: 1.6 });
  };

  return (
    <div ref={rootRef}>
      <header className={styles.bar} data-open={open}>
        <div className={`${styles.glass} ${open ? styles.glassOpen : ""}`}>
          <button
            className={styles.brand}
            onClick={() => go(0)}
            aria-label="Back to the beginning"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo/img-logo-png-192x.png"
              alt="Dr Joy Dental Clinic"
              className={open ? "logo-gold" : ""}
              width={148}
              height={44}
            />
          </button>

          <div className={styles.right}>
            <a href={`tel:${brand.tollFreeTel}`} className={styles.phone}>
              {brand.tollFree}
            </a>
            <Magnetic strength={0.4}>
              <button
                className={styles.menuBtn}
                onClick={toggle}
                aria-expanded={open}
                aria-label={open ? "Close menu" : "Open menu"}
              >
                <span className={styles.menuWord}>{open ? "Close" : "Menu"}</span>
                <span className={`${styles.burger} ${open ? styles.burgerX : ""}`}>
                  <i />
                  <i />
                </span>
              </button>
            </Magnetic>
          </div>
        </div>
      </header>

      {/* Chapter index overlay */}
      <div ref={overlayRef} className={styles.overlay} aria-hidden={!open}>
        <nav className={styles.chapters}>
          {chapters.map((c) => (
            <button key={c.numeral} className={styles.itemMask} onClick={() => go(c.target)}>
              <span className={styles.item}>
                <em>{c.numeral}</em>
                {c.label}
              </span>
            </button>
          ))}
        </nav>
        <div className={styles.overlayFoot}>
          <a href={`https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(brand.whatsappMessage)}`} target="_blank" rel="noopener">
            WhatsApp
          </a>
          <span>·</span>
          <a href={`tel:${brand.tollFreeTel}`}>{brand.tollFree}</a>
          <span>·</span>
          <span>Dubai, U.A.E.</span>
        </div>
      </div>

      {/* Timecode rail */}
      <div className={styles.rail} aria-hidden="true">
        <div ref={fillRef} className={styles.railFill} />
      </div>
    </div>
  );
}
