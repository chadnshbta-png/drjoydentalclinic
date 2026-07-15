"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { stats } from "@/lib/content";
import styles from "./Counters.module.css";

/**
 * The Measure of Trust — the statistics, reimagined as editorial numerals that
 * count up and fill with liquid gold as they scroll through, on the dark
 * ground that carries the story into the booking chapter. No cards.
 */
export default function Counters() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const S = styles;

      // heading rises from its mask
      gsap.fromTo(
        `.${S.title} .line-mask > span`,
        { yPercent: 118 },
        {
          yPercent: 0,
          stagger: 0.12,
          duration: 1.1,
          ease: "power4.out",
          scrollTrigger: { trigger: `.${S.head}`, start: "top 78%", once: true },
        }
      );

      // Scroll-scrubbed: each numeral counts up + fills with gold in sequence.
      const items = gsap.utils.toArray<HTMLElement>(`.${S.stat}`);
      const nums = items.map((el) => el.querySelector<HTMLElement>(`.${S.num}`)!);
      const vals = nums.map((n) => Number(n.dataset.value ?? 0));
      const sufs = nums.map((n) => n.dataset.suffix ?? "");
      const shown = items.map(() => -1);

      ScrollTrigger.create({
        trigger: rootRef.current,
        start: "top 72%",
        end: "bottom 78%",
        scrub: true,
        onUpdate: (self) => {
          for (let i = 0; i < items.length; i++) {
            // staggered local progress so they fill left-to-right
            const local = gsap.utils.clamp(0, 1, (self.progress - i * 0.1) / 0.46);
            if (Math.abs(local - shown[i]) < 0.004) continue;
            shown[i] = local;
            const eased = gsap.parseEase("power2.out")(local);
            nums[i].textContent = `${Math.round(eased * vals[i])}${sufs[i]}`;
            items[i].style.setProperty("--fill", `${(eased * 100).toFixed(1)}%`);
          }
        },
      });

      // reveal each stat block (rule draws, label fades) as it enters
      ScrollTrigger.batch(`.${S.stat}`, {
        start: "top 88%",
        once: true,
        onEnter: (els) =>
          gsap.fromTo(
            els,
            { opacity: 0, y: 48 },
            { opacity: 1, y: 0, stagger: 0.12, duration: 1, ease: "power3.out" }
          ),
      });
    },
    { scope: rootRef }
  );

  return (
    <section ref={rootRef} className={styles.counters}>
      <div className={`container ${styles.head}`}>
        <p className={styles.kicker}>The Measure of Trust</p>
        <h2 className={styles.title}>
          <span className="line-mask"><span>Twenty-one years,</span></span>
          <span className="line-mask"><span>told in four numbers.</span></span>
        </h2>
      </div>

      <div className={`container ${styles.grid}`}>
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={styles.stat}
            style={{ "--lift": `${[0, 40, 14, 54][i] ?? 0}px` } as React.CSSProperties}
          >
            <span className={styles.num} data-value={s.value} data-suffix={s.suffix}>
              0{s.suffix}
            </span>
            <span className={styles.rule} aria-hidden="true" />
            <span className={styles.label}>{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
