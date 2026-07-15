"use client";

import { useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { getLenis } from "@/components/SmoothScroll";
import { brand } from "@/lib/content";
import styles from "./ReserveDock.module.css";

/** Floating concierge — appears once the film has finished its opening act. */
export default function ReserveDock() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [openActions, setOpenActions] = useState(false);

  useGSAP(
    () => {
      gsap.set(rootRef.current, { y: 90, opacity: 0 });
      ScrollTrigger.create({
        trigger: "#legacy",
        start: "top 85%",
        onEnter: () =>
          gsap.to(rootRef.current, { y: 0, opacity: 1, duration: 0.9 }),
        onLeaveBack: () =>
          gsap.to(rootRef.current, { y: 90, opacity: 0, duration: 0.6 }),
      });
    },
    { scope: rootRef }
  );

  return (
    <div
      ref={rootRef}
      className={styles.dock}
      onMouseEnter={() => setOpenActions(true)}
      onMouseLeave={() => setOpenActions(false)}
    >
      <div className={`${styles.actions} ${openActions ? styles.actionsOpen : ""}`}>
        <a
          href={`https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(brand.whatsappMessage)}`}
          target="_blank"
          rel="noopener"
        >
          WhatsApp
        </a>
        <a href={`tel:${brand.tollFreeTel}`}>Call {brand.tollFree}</a>
      </div>
      <button
        className={styles.pill}
        onClick={() => {
          if (window.matchMedia("(hover: none)").matches && !openActions) {
            setOpenActions(true);
            return;
          }
          getLenis()?.scrollTo("#reserve", { duration: 1.8 });
        }}
      >
        <span className={styles.dot} />
        Reserve a Visit
      </button>
    </div>
  );
}
