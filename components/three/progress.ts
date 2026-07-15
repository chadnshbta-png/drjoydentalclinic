"use client";

/**
 * Scroll → 3D bridge. ScrollTrigger writes each vignette's pin progress here;
 * scenes read it inside useFrame. Mutable module state on purpose — no React
 * re-renders on scroll.
 */
export const craftProgress: Record<string, number> = {
  aligner: 0,
  implant: 0,
  veneer: 0,
  scan: 0,
  ortho: 0,
  whitening: 0,
};
