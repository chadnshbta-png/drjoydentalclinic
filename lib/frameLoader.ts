"use client";

import { FRAME_COUNT, frameSrc } from "./content";

export type Frame = ImageBitmap | HTMLImageElement;

/**
 * Preloads and decodes the hero film.
 *
 * Strategy: the first PRIORITY frames are fetched before the curtain lifts so
 * playback can never outrun the loader on the opening scroll; the remainder
 * streams in behind with bounded concurrency. Frames decode via
 * createImageBitmap (off the main thread where supported) so scrubbing never
 * hitches on decode, and each decoded frame is kept in memory for the life of
 * the page so it is never fetched or decoded twice. Network requests use the
 * HTTP cache (force-cache) so, paired with the immutable Cache-Control header,
 * repeat visits serve every frame straight from disk.
 */
const PRIORITY = 80;
const CONCURRENCY = 8;

class FilmLoader {
  frames: (Frame | null)[] = new Array(FRAME_COUNT).fill(null);
  loaded = 0;
  private started = false;
  private queue: number[] = [];
  private listeners = new Set<(loaded: number) => void>();

  start() {
    if (this.started || typeof window === "undefined") return;
    this.started = true;
    // Priority window first, then the rest in order.
    for (let i = 0; i < FRAME_COUNT; i++) this.queue.push(i);
    for (let c = 0; c < CONCURRENCY; c++) void this.pump();
  }

  private async pump(): Promise<void> {
    const index = this.queue.shift();
    if (index === undefined) return;
    try {
      this.frames[index] = await this.fetchFrame(index);
    } catch {
      // A dropped frame must never blank the film — retry once, then fall
      // back to leaving the slot null (renderer reuses the nearest frame).
      try {
        this.frames[index] = await this.fetchFrame(index);
      } catch {
        /* renderer falls back to nearest loaded frame */
      }
    }
    this.loaded++;
    this.listeners.forEach((l) => l(this.loaded));
    return this.pump();
  }

  private async fetchFrame(i: number): Promise<Frame> {
    if ("createImageBitmap" in window) {
      const res = await fetch(frameSrc(i), { cache: "force-cache" });
      if (!res.ok) throw new Error(`frame ${i}: ${res.status}`);
      const blob = await res.blob();
      return createImageBitmap(blob);
    }
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = frameSrc(i);
    });
  }

  onProgress(cb: (loaded: number) => void) {
    this.listeners.add(cb);
    return () => void this.listeners.delete(cb);
  }

  /** Resolves once the first `n` frames of the priority window are decoded. */
  whenReady(n = PRIORITY): Promise<void> {
    this.start();
    const target = Math.min(n, FRAME_COUNT);
    if (this.countLeading(target) >= target) return Promise.resolve();
    return new Promise((resolve) => {
      const off = this.onProgress(() => {
        if (this.countLeading(target) >= target) {
          off();
          resolve();
        }
      });
    });
  }

  private countLeading(upTo: number) {
    let n = 0;
    while (n < upTo && this.frames[n]) n++;
    return n;
  }

  /** Nearest decoded frame at or below `i`, so playback never flashes blank. */
  nearest(i: number): Frame | null {
    const idx = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(i)));
    if (this.frames[idx]) return this.frames[idx];
    for (let d = 1; d < FRAME_COUNT; d++) {
      if (this.frames[idx - d]) return this.frames[idx - d];
      if (this.frames[idx + d]) return this.frames[idx + d];
    }
    return null;
  }
}

let singleton: FilmLoader | null = null;
export function getFilm(): FilmLoader {
  if (!singleton) singleton = new FilmLoader();
  return singleton;
}
export { PRIORITY };
