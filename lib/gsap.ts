"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);
gsap.defaults({ ease: "power3.out", duration: 1 });

// Mobile browser chrome (address bar) hides/shows on scroll, firing resize
// events that would otherwise trigger a full ScrollTrigger.refresh() — costly
// and a common cause of pin jitter. Ignoring that resize keeps scrolling
// smooth without altering any animation.
if (typeof window !== "undefined") {
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export { gsap, ScrollTrigger, useGSAP };
