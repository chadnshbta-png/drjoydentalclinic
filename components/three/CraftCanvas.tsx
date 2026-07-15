"use client";

import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";

/**
 * One WebGL context for the entire experience. Every vignette portals its
 * scene here through drei's <View>; offscreen views are culled automatically,
 * so at most one vignette pays for rendering at any moment. The whole render
 * loop is additionally paused (`frameloop="never"`) while the Craft chapter is
 * off screen, so it costs nothing during the rest of the journey.
 */
export default function CraftCanvas({
  frameloop = "always",
}: {
  frameloop?: "always" | "never";
}) {
  return (
    <Canvas
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none",
      }}
      dpr={[1, 1.75]}
      frameloop={frameloop}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
      eventSource={typeof document !== "undefined" ? document.body : undefined}
    >
      <View.Port />
    </Canvas>
  );
}
