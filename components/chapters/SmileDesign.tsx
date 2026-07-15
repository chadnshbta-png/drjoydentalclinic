"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { gsap, useGSAP } from "@/lib/gsap";
import { getLenis } from "@/components/SmoothScroll";
import type { ChoiceMeta } from "@/components/three/smileScenes";
import type { SmileStep } from "@/components/three/SmileCanvas";
import styles from "./SmileDesign.module.css";

const SmileCanvas = dynamic(() => import("@/components/three/SmileCanvas"), { ssr: false });

/**
 * "Let's Design Your Perfect Smile" — a guided digital consultation, not a
 * form. Text and controls live on the left; a single, unmistakable 3D subject
 * lives on the right and transforms from condition to treatment. Clean zones,
 * generous space, one idea per screen.
 */

interface Choice extends ChoiceMeta {
  condition: string;
  treatment: string;
  duration: string;
  appts: string;
  comfort: number;
  outcome: string;
}

const CHOICES: Choice[] = [
  { id: "align", label: "Alignment", sub: "Crowding or gaps", color: "#B69A69",
    condition: "Gently misaligned teeth", treatment: "Invisalign Clear Aligners",
    duration: "6–12 months", appts: "Every 6–8 weeks", comfort: 5,
    outcome: "A straight, discreet smile — no metal, no compromise." },
  { id: "missing", label: "Missing Teeth", sub: "One or more gaps", color: "#AC8B51",
    condition: "A gap in the smile", treatment: "Dental Implant",
    duration: "3–6 months", appts: "3–4 visits", comfort: 4,
    outcome: "A permanent tooth that looks and feels entirely your own." },
  { id: "design", label: "Smile Design", sub: "Shape, shade & symmetry", color: "#C9B291",
    condition: "A smile ready to shine", treatment: "Porcelain Veneers",
    duration: "2–3 weeks", appts: "2–3 visits", comfort: 5,
    outcome: "A bespoke, camera-ready smile, crafted in our own laboratory." },
  { id: "pain", label: "Pain or Discomfort", sub: "Sensitivity or ache", color: "#957846",
    condition: "A tooth asking for care", treatment: "Gentle Restorative Care",
    duration: "1–3 visits", appts: "As needed", comfort: 5,
    outcome: "Comfort restored — and the cause resolved, gently." },
  { id: "preventive", label: "Preventive Care", sub: "Keep it healthy", color: "#D6B882",
    condition: "A healthy smile to protect", treatment: "Hygiene & Guard Program",
    duration: "Ongoing", appts: "Twice a year", comfort: 5,
    outcome: "A healthy smile, protected for life." },
];

const JOURNEY = [
  { t: "Consultation", d: "A relaxed conversation about your smile." },
  { t: "Digital Scan", d: "A precise 3D scan — no impressions, no discomfort." },
  { t: "Treatment", d: "Your bespoke plan, performed by specialists." },
  { t: "Follow-up", d: "Gentle check-ins as your smile settles." },
  { t: "Your New Smile", d: "The moment it all comes together." },
];

const STEPS: SmileStep[] = ["choose", "reveal", "journey", "result"];
const STEP_LABELS = ["Choose", "Your smile", "The journey", "Your plan"];

export default function SmileDesign() {
  const rootRef = useRef<HTMLElement>(null);
  const revealRef = useRef(0);
  const [step, setStep] = useState<SmileStep>("choose");
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [live, setLive] = useState(false);
  const [seen, setSeen] = useState(false);

  const choice = selected != null ? CHOICES[selected] : null;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setLive(e.isIntersecting);
        if (e.isIntersecting) setSeen(true);
      },
      { threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const select = (i: number) => {
    revealRef.current = 0;
    setSelected(i);
    setRevealed(false);
    setStep("reveal");
  };

  const revealTreatment = () => {
    gsap.to(revealRef, { current: 1, duration: 2.4, ease: "power2.inOut", onComplete: () => setRevealed(true) });
  };

  const reset = () => {
    revealRef.current = 0;
    setSelected(null);
    setRevealed(false);
    setStep("choose");
  };

  const stepIndex = STEPS.indexOf(step);
  const goReserve = () => getLenis()?.scrollTo("#reserve", { duration: 1.8 });

  // Each screen's content rises and resolves from a soft blur.
  useGSAP(
    () => {
      gsap.fromTo(
        `.${styles.stepBody} > *`,
        { opacity: 0, y: 20, filter: "blur(6px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.8, stagger: 0.08, ease: "power3.out" }
      );
    },
    { scope: rootRef, dependencies: [step, revealed] }
  );

  // Title reveals once as the section enters.
  useGSAP(
    () => {
      gsap.fromTo(
        `.${styles.title} .line-mask > span`,
        { yPercent: 118 },
        {
          yPercent: 0,
          stagger: 0.1,
          duration: 1.1,
          ease: "power4.out",
          scrollTrigger: { trigger: rootRef.current, start: "top 68%", once: true },
        }
      );
    },
    { scope: rootRef }
  );

  return (
    <section id="smile" ref={rootRef} className={styles.smile}>
      {/* ——— left: typography + controls ——— */}
      <div className={styles.uiCol}>
        <header className={styles.header}>
          <p className={styles.kicker}>A Personal Consultation</p>
          <h2 className={styles.title}>
            <span className="line-mask"><span>Let&rsquo;s design your</span></span>
            <span className="line-mask"><span>perfect smile.</span></span>
          </h2>
        </header>

        <div className={styles.stepBody} key={`${step}-${revealed}`}>
          {step === "choose" && (
            <>
              <p className={styles.question}>What would you like to improve?</p>
              <ul className={styles.choiceList}>
                {CHOICES.map((c, i) => (
                  <li key={c.id}>
                    <button className={styles.choice} onClick={() => select(i)}>
                      <span className={styles.choiceDot} style={{ background: c.color }} />
                      <span className={styles.choiceText}>
                        <strong>{c.label}</strong>
                        <span>{c.sub}</span>
                      </span>
                      <span className={styles.choiceArrow}>→</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {step === "reveal" && choice && !revealed && (
            <>
              <p className={styles.smallLabel}>{choice.label}</p>
              <h3 className={styles.condition}>{choice.condition}.</h3>
              <p className={styles.lede}>Watch it resolve into the treatment designed for you.</p>
              <button className="btn-hairline" onClick={revealTreatment}>Reveal my treatment</button>
            </>
          )}

          {step === "reveal" && choice && revealed && (
            <>
              <p className={styles.smallLabel}>Recommended for you</p>
              <h3 className={styles.treatment}>{choice.treatment}</h3>
              <p className={styles.lede}>{choice.outcome}</p>
              <button className="btn-hairline" onClick={() => setStep("journey")}>See your journey</button>
            </>
          )}

          {step === "journey" && choice && (
            <>
              <p className={styles.smallLabel}>Your {choice.treatment} journey</p>
              <ol className={styles.timeline}>
                {JOURNEY.map((s, i) => (
                  <li key={s.t} className={styles.tStage}>
                    <span className={styles.tBead} />
                    <div>
                      <span className={styles.tNo}>{String(i + 1).padStart(2, "0")}</span>
                      <h4>{s.t}</h4>
                      <p>{s.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <button className="btn-hairline" onClick={() => setStep("result")}>Your recommendation</button>
            </>
          )}

          {step === "result" && choice && (
            <>
              <p className={styles.smallLabel}>Your personalised recommendation</p>
              <h3 className={styles.treatment}>{choice.treatment}</h3>
              <dl className={styles.plan}>
                <div><dt>Estimated duration</dt><dd>{choice.duration}</dd></div>
                <div><dt>Appointments</dt><dd>{choice.appts}</dd></div>
                <div>
                  <dt>Comfort</dt>
                  <dd className={styles.comfort}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <i key={i} className={i < choice.comfort ? styles.dotOn : ""} />
                    ))}
                  </dd>
                </div>
                <div><dt>Expected outcome</dt><dd>A smile you&rsquo;ll want to share</dd></div>
              </dl>
              <div className={styles.resultCta}>
                <button className="btn-hairline" onClick={goReserve}>Reserve your consultation</button>
                <button className={styles.restart} onClick={reset}>Start over</button>
              </div>
            </>
          )}
        </div>

        <div className={styles.progress}>
          {step !== "choose" && (
            <button
              className={styles.back}
              onClick={() => {
                const prev = STEPS[Math.max(0, stepIndex - 1)];
                if (prev === "choose") reset();
                else setStep(prev);
              }}
            >
              ← Back
            </button>
          )}
          <div className={styles.dots}>
            {STEP_LABELS.map((l, i) => (
              <span key={l} className={`${styles.dot} ${i === stepIndex ? styles.dotActive : ""} ${i < stepIndex ? styles.dotDone : ""}`}>
                <i />
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ——— right: the single 3D subject ——— */}
      <div className={styles.canvasCol}>
        {seen && (
          <SmileCanvas step={step} choiceId={choice?.id ?? "align"} revealRef={revealRef} frameloop={live ? "always" : "never"} />
        )}
      </div>
    </section>
  );
}
