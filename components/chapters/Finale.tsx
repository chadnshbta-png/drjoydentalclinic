"use client";

import { useRef, useState, type FormEvent } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { brand, clinics } from "@/lib/content";
import GoldDust from "@/components/ui/GoldDust";
import Magnetic from "@/components/ui/Magnetic";
import styles from "./Finale.module.css";

/**
 * Chapter VII — The Finale. The house lights dim; gold dust hangs in the
 * projector beam; a cursor-borne light moves across the dark. The story ends
 * the way every good one should: with a reservation — then the credits roll.
 */
export default function Finale() {
  const rootRef = useRef<HTMLElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const [sent, setSent] = useState(false);

  useGSAP(
    () => {
      gsap.fromTo(
        `.${styles.reserveTitle} .line-mask > span`,
        { yPercent: 115 },
        {
          yPercent: 0,
          stagger: 0.12,
          duration: 1.1,
          ease: "power4.out",
          scrollTrigger: { trigger: `.${styles.reserve}`, start: "top 70%", once: true },
        }
      );

      gsap.fromTo(
        `.${styles.form}`,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1.1,
          scrollTrigger: { trigger: `.${styles.form}`, start: "top 85%", once: true },
        }
      );

      ScrollTrigger.batch(`.${styles.creditLine}`, {
        start: "top 94%",
        once: true,
        onEnter: (els) =>
          gsap.fromTo(
            els,
            { opacity: 0, y: 18 },
            { opacity: 1, y: 0, stagger: 0.05, duration: 0.8 }
          ),
      });

      // The visitor carries a light through the dark scene.
      if (!window.matchMedia("(hover: none)").matches) {
        const sx = gsap.quickTo(spotRef.current, "x", { duration: 0.6, ease: "power3" });
        const sy = gsap.quickTo(spotRef.current, "y", { duration: 0.6, ease: "power3" });
        const move = (e: PointerEvent) => {
          const r = rootRef.current!.getBoundingClientRect();
          if (r.bottom < 0 || r.top > window.innerHeight) return;
          sx(e.clientX);
          sy(e.clientY - r.top);
        };
        window.addEventListener("pointermove", move, { passive: true });
        return () => window.removeEventListener("pointermove", move);
      }
    },
    { scope: rootRef }
  );

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const branch = String(data.get("branch") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const text =
      `Hello, Dr Joy Dental Clinic. I would like to reserve a visit.` +
      `\nName: ${name}\nPhone: ${phone}` +
      (branch ? `\nPreferred clinic: ${branch}` : "") +
      (message ? `\nNote: ${message}` : "");
    window.open(
      `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener"
    );
    setSent(true);
  };

  return (
    <section id="reserve" ref={rootRef} className={`chapter ${styles.finale}`}>
      {/* the lights dim */}
      <div className={styles.dim} aria-hidden="true" />

      <GoldDust />
      <div ref={spotRef} className={styles.spot} aria-hidden="true" />

      <div className={`container ${styles.reserve}`}>
        <div className={styles.reserveLeft}>
          <p className={`chapter-mark ${styles.markLight}`}>Chapter VII · The Finale</p>
          <h2 className={styles.reserveTitle}>
            <span className="line-mask"><span>Every great smile</span></span>
            <span className="line-mask"><span>begins with</span></span>
            <span className="line-mask"><span>a reservation.</span></span>
          </h2>

          <p className={styles.concierge}>
            A concierge team confirms every reservation personally. Most
            patients are seen within twenty-four hours — sooner, when it
            matters.
          </p>

          <div className={styles.quickRow}>
            <Magnetic strength={0.35}>
              <a
                className={styles.quickPill}
                href={`https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(brand.whatsappMessage)}`}
                target="_blank"
                rel="noopener"
              >
                WhatsApp us
              </a>
            </Magnetic>
            <Magnetic strength={0.35}>
              <a className={styles.quickPill} href={`tel:${brand.tollFreeTel}`}>
                {brand.tollFree}
              </a>
            </Magnetic>
          </div>
        </div>

        <form className={styles.form} onSubmit={submit}>
          <div className={styles.field}>
            <label htmlFor="rv-name">Name</label>
            <input id="rv-name" name="name" type="text" required autoComplete="name" />
          </div>
          <div className={styles.field}>
            <label htmlFor="rv-phone">Phone</label>
            <input id="rv-phone" name="phone" type="tel" required autoComplete="tel" />
          </div>
          <div className={styles.field}>
            <label htmlFor="rv-branch">Preferred clinic</label>
            <select id="rv-branch" name="branch" defaultValue="">
              <option value="" disabled>
                Select a clinic
              </option>
              {clinics.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="rv-message">Message</label>
            <textarea id="rv-message" name="message" rows={3} />
          </div>
          <Magnetic strength={0.3} className={styles.submitWrap}>
            <button type="submit" className="btn-hairline btn-hairline--light">
              {sent ? "Sent — we will be in touch" : "Reserve via WhatsApp"}
            </button>
          </Magnetic>
        </form>
      </div>

      {/* end credits — the cast roll */}
      <footer className={styles.credits}>
        <div className="container">
          <div className={styles.creditHead}>
            <div className={styles.shine}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo/img-logo-png-192x.png"
                alt="Dr Joy Dental Clinic"
                width={230}
                height={69}
                loading="lazy"
                decoding="async"
              />
            </div>
            <p className={`${styles.creditLine} ${styles.tag}`}>
              The Art of the Smile — since 2004
            </p>
          </div>

          <p className={`${styles.castLabel} ${styles.creditLine}`}>Starring — thirteen clinics across Dubai</p>
          <p className={`${styles.cast} ${styles.creditLine}`}>
            {clinics.map((c, i) => (
              <span key={c.name}>
                <a href={c.maps} target="_blank" rel="noopener">
                  {c.short}
                </a>
                {i < clinics.length - 1 && <i> · </i>}
              </span>
            ))}
          </p>

          <p className={`${styles.record} ${styles.creditLine}`}>
            Established 2004 <i>✦</i> Superbrands Award <i>✦</i> In-house dental
            laboratory <i>✦</i> EN · العربية · РУ
          </p>

          <div className={styles.creditFoot}>
            <span className={styles.creditLine}>
              © {new Date().getFullYear()} {brand.name} — all rights reserved
            </span>
            <Magnetic strength={0.5}>
              <span className={`${styles.creditLine} ${styles.fin}`}>✦ fin</span>
            </Magnetic>
          </div>
        </div>
      </footer>
    </section>
  );
}
