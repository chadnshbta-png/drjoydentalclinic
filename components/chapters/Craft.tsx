"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { View, PerspectiveCamera } from "@react-three/drei";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { vignettes } from "@/lib/content";
import { craftProgress } from "@/components/three/progress";
import { sceneMap, Rig, type SceneKey } from "@/components/three/scenes";
import Studio from "@/components/three/Studio";
import ServiceTree from "@/components/ServiceTree";
import styles from "./Craft.module.css";

const CraftCanvas = dynamic(() => import("@/components/three/CraftCanvas"), {
  ssr: false,
});

/**
 * Chapter III — The Craft. Six disciplines, six 3D studies, one camera that
 * leans with the visitor's cursor; then the Living Index — the knowledge
 * tree of all thirty-seven treatments.
 */
export default function Craft() {
  const rootRef = useRef<HTMLElement>(null);
  const [quality, setQuality] = useState(2);
  const [webgl, setWebgl] = useState(true);

  useEffect(() => {
    if (window.innerWidth < 900 || navigator.hardwareConcurrency <= 4)
      setQuality(1);
    try {
      const c = document.createElement("canvas");
      if (!c.getContext("webgl2") && !c.getContext("webgl")) setWebgl(false);
    } catch {
      setWebgl(false);
    }
  }, []);

  useGSAP(
    () => {
      // Intro lines rise from masks.
      gsap.fromTo(
        `.${styles.introTitle} .line-mask > span`,
        { yPercent: 115 },
        {
          yPercent: 0,
          stagger: 0.12,
          duration: 1.1,
          ease: "power4.out",
          scrollTrigger: { trigger: `.${styles.intro}`, start: "top 76%", once: true },
        }
      );

      const blocks = gsap.utils.toArray<HTMLElement>(`.${styles.vignette}`);
      blocks.forEach((block) => {
        const scene = block.dataset.scene as SceneKey;
        const pinned = block.querySelector<HTMLElement>(`.${styles.pinned}`)!;

        ScrollTrigger.create({
          trigger: block,
          start: "top top",
          end: "bottom bottom",
          pin: pinned,
          pinSpacing: false,
          onUpdate: (self) => {
            craftProgress[scene] = self.progress;
          },
        });

        gsap
          .timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: block,
              start: "top top",
              end: "bottom bottom",
              scrub: 0.5,
            },
          })
          .fromTo(
            block.querySelector(`.${styles.card}`),
            { opacity: 0, y: 70 },
            { opacity: 1, y: 0, duration: 0.22 },
            0.06
          )
          .to(
            block.querySelector(`.${styles.card}`),
            { opacity: 0, y: -60, duration: 0.2 },
            0.8
          );
      });
    },
    { scope: rootRef }
  );

  return (
    <section id="craft" ref={rootRef} className={`chapter ${styles.craft}`}>
      <div className={`container ${styles.intro}`}>
        <div className={styles.introLeft}>
          <p className="chapter-mark">Chapter III · The Craft</p>
          <h2 className={styles.introTitle}>
            <span className="line-mask"><span>Six disciplines.</span></span>
            <span className="line-mask"><span>Practised like crafts.</span></span>
          </h2>
        </div>
        <div className={styles.introRight}>
          <p className={styles.introCopy}>
            From preventive dentistry to full-mouth rehabilitation — every
            treatment at Dr Joy is planned digitally, performed by
            specialists, and finished in our own laboratory.
          </p>
          <div className={styles.introMeta}>
            <span>06 studies</span>
            <i />
            <span>37 treatments</span>
          </div>
        </div>
      </div>

      {vignettes.map((v, i) => {
        const Scene = sceneMap[v.scene as SceneKey];
        return (
          <div
            key={v.id}
            className={`${styles.vignette} ${i % 2 ? styles.flip : ""}`}
            data-scene={v.scene}
          >
            <div className={styles.pinned}>
              {webgl && (
                <View className={styles.view}>
                  <PerspectiveCamera makeDefault position={[0, 0.25, 5.8]} fov={38} />
                  <Studio />
                  <Rig>
                    <Scene quality={quality} />
                  </Rig>
                </View>
              )}
              <article className={styles.card}>
                <span className={styles.numeral}>{v.numeral}</span>
                <h3 className={styles.title}>{v.title}</h3>
                <p className={styles.copy}>{v.copy}</p>
                <ul className={styles.services}>
                  {v.services.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        );
      })}

      <ServiceTree />

      {webgl && <CraftCanvas />}
    </section>
  );
}
