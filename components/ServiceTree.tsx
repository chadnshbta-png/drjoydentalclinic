"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { serviceLedger } from "@/lib/content";
import styles from "./ServiceTree.module.css";

/**
 * The Living Index — a premium interactive knowledge tree. A heart node feeds
 * four discipline nodes; choosing one grows its treatments into a clean,
 * width-aware row layout below, connected by drawn branches. Children are
 * packed into centred rows (measured widths, fixed row spacing) so labels can
 * never overlap or collide, at any viewport size.
 */

const CATS = [
  { key: "Align", x: 0.16, hue: "Orthodontics & Aligners" },
  { key: "Restore", x: 0.39, hue: "Implants & Restorations" },
  { key: "Design", x: 0.61, hue: "Cosmetic & Smile Design" },
  { key: "Care", x: 0.84, hue: "Comfort & Prevention" },
] as const;

const HEART: [number, number] = [0.5, 0.12];
const CAT_Y = 0.32; // discipline row
const BAND_TOP = 0.5; // where treatment rows begin
const BAND_BOTTOM = 0.93;

type Rect = { x: number; y: number; w: number; h: number };
type Pt = { x: number; y: number };

/** A soft vertical S-curve — reads as a branch drooping down. */
function branch(a: Pt, b: Pt): string {
  const midY = (a.y + b.y) / 2;
  return `M ${a.x} ${a.y} C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y}`;
}

export default function ServiceTree() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [radial, setRadial] = useState(true);
  const [fontsReady, setFontsReady] = useState(false);
  const [layout, setLayout] = useState<{
    w: number;
    h: number;
    heart: Pt;
    cats: Pt[];
    children: Rect[][];
  } | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px)");
    const apply = () => setRadial(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    (document as Document).fonts?.ready.then(() => setFontsReady(true));
    const t = setTimeout(() => setFontsReady(true), 600);
    return () => {
      mq.removeEventListener("change", apply);
      clearTimeout(t);
    };
  }, []);

  useLayoutEffect(() => {
    if (!radial) return;
    const measure = () => {
      const el = stageRef.current;
      if (!el) return;
      const { width: w, height: h } = el.getBoundingClientRect();

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      ctx.font = "500 12.5px Manrope, system-ui, sans-serif";
      const widthOf = (t: string) => Math.ceil(ctx.measureText(t).width) + 34;

      const heart = { x: HEART[0] * w, y: HEART[1] * h };
      const cats = CATS.map((c) => ({ x: c.x * w, y: CAT_Y * h }));

      const gap = 22;
      const rowH = 32;
      const maxRowW = w * 0.84;

      const children = CATS.map((_, ci) => {
        const items = serviceLedger[ci].items;
        const sizes = items.map((t) => widthOf(t));

        // pack into centred rows — width-aware, so nothing can overlap
        const rows: number[][] = [[]];
        let rowW = 0;
        items.forEach((_, i) => {
          const need = sizes[i] + gap;
          if (rowW + need > maxRowW && rows[rows.length - 1].length > 0) {
            rows.push([]);
            rowW = 0;
          }
          rows[rows.length - 1].push(i);
          rowW += need;
        });

        const bandTop = BAND_TOP * h;
        const bandBottom = BAND_BOTTOM * h;
        const rowGap = Math.min(84, (bandBottom - bandTop) / Math.max(1, rows.length));
        const blockH = (rows.length - 1) * rowGap;
        const firstY = (bandTop + bandBottom) / 2 - blockH / 2;

        const out: Rect[] = new Array(items.length);
        rows.forEach((row, r) => {
          const totalW = row.reduce((s, i) => s + sizes[i] + gap, 0) - gap;
          let x = w / 2 - totalW / 2;
          const y = firstY + r * rowGap;
          row.forEach((i) => {
            out[i] = { x: x + sizes[i] / 2, y, w: sizes[i], h: rowH };
            x += sizes[i] + gap;
          });
        });
        return out;
      });

      setLayout({ w, h, heart, cats, children });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [radial, fontsReady]);

  // Entrance: heart blooms, trunks draw, discipline nodes settle.
  useGSAP(
    () => {
      if (!radial || !layout) return;
      const trunks = gsap.utils.toArray<SVGPathElement>(`.${styles.trunk}`);
      trunks.forEach((p) => {
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      });
      gsap
        .timeline({ scrollTrigger: { trigger: stageRef.current, start: "top 74%", once: true } })
        .fromTo(`.${styles.heart}`, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.9, ease: "back.out(1.6)" })
        .to(trunks, { strokeDashoffset: 0, duration: 1, ease: "power2.inOut", stagger: 0.07 }, "-=0.3")
        .fromTo(`.${styles.cat}`, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: "back.out(1.8)", stagger: 0.08 }, "-=0.6");
    },
    { scope: rootRef, dependencies: [radial, layout ? 1 : 0] }
  );

  // Branch growth on discipline change — connectors draw, treatments bloom in rows.
  useGSAP(
    () => {
      if (!radial || !layout) return;
      const paths = gsap.utils.toArray<SVGPathElement>(`.${styles.branchOn}`);
      paths.forEach((p) => {
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      });
      gsap
        .timeline()
        .to(paths, { strokeDashoffset: 0, duration: 0.7, ease: "power2.out", stagger: 0.025 })
        .fromTo(
          `.${styles.leafOn} span`,
          { opacity: 0, y: 12, scale: 0.72 },
          { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "back.out(1.6)", stagger: 0.03 },
          "-=0.55"
        );
    },
    { scope: rootRef, dependencies: [active, radial, layout ? 1 : 0] }
  );

  return (
    <div ref={rootRef} className={styles.wrap}>
      <div className={styles.head}>
        <div>
          <p className={styles.headKicker}>The Living Index</p>
          <h3 className={styles.headTitle}>
            Thirty-seven treatments.
            <br />
            One tree of care.
          </h3>
        </div>
        <p className={styles.headHint}>
          {radial ? "Choose a discipline — its branch unfolds." : "Choose a discipline — its treatments unfold."}
          <i />
        </p>
      </div>

      {radial ? (
        <div ref={stageRef} className={styles.stage}>
          {layout && (
            <>
              <svg className={styles.lines} viewBox={`0 0 ${layout.w} ${layout.h}`} preserveAspectRatio="none">
                {layout.cats.map((c, i) => (
                  <path key={`t${i}`} className={styles.trunk} d={branch(layout.heart, { x: c.x, y: c.y - 30 })} />
                ))}
                {layout.children[active].map((l, i) => (
                  <path
                    key={`b${active}-${i}`}
                    className={styles.branchOn}
                    d={branch({ x: layout.cats[active].x, y: layout.cats[active].y + 34 }, { x: l.x, y: l.y - 16 })}
                  />
                ))}
              </svg>

              <div className={styles.heart} style={{ left: layout.heart.x, top: layout.heart.y }}>
                <em>✦</em>
                37 treatments
              </div>

              {CATS.map((c, i) => (
                <button
                  key={c.key}
                  className={`${styles.cat} ${i === active ? styles.catOn : ""}`}
                  style={{ left: layout.cats[i].x, top: layout.cats[i].y }}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                >
                  <strong>{c.key}</strong>
                  <span>{c.hue}</span>
                  <i className={styles.catCount}>{serviceLedger[i].items.length}</i>
                </button>
              ))}

              {serviceLedger[active].items.map((item, i) => (
                <div
                  key={`${active}-${item}`}
                  className={styles.leafOn}
                  style={{ left: layout.children[active][i].x, top: layout.children[active][i].y }}
                >
                  <span>{item}</span>
                </div>
              ))}
            </>
          )}
        </div>
      ) : (
        <div className={styles.stack}>
          {CATS.map((c, i) => (
            <div key={c.key} className={styles.stackGroup}>
              <button
                className={`${styles.stackCat} ${i === active ? styles.stackCatOn : ""}`}
                onClick={() => setActive(i === active ? -1 : i)}
                aria-expanded={i === active}
              >
                <strong>{c.key}</strong>
                <span>{c.hue}</span>
                <i>{i === active ? "—" : "+"}</i>
              </button>
              <div className={`${styles.stackLeaves} ${i === active ? styles.stackLeavesOn : ""}`}>
                {serviceLedger[i].items.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
