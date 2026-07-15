"use client";

import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import Studio from "./Studio";
import { Rig } from "./scenes";
import { ConditionScene, HeroTooth, Enter, type RevealRef } from "./smileScenes";

export type SmileStep = "choose" | "reveal" | "journey" | "result";

export default function SmileCanvas({
  step,
  choiceId,
  revealRef,
  frameloop,
}: {
  step: SmileStep;
  choiceId: string;
  revealRef: RevealRef;
  frameloop: "always" | "never";
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop={frameloop}
      style={{ position: "absolute", inset: 0 }}
    >
      <PerspectiveCamera makeDefault position={[0, 0.3, 6.4]} fov={40} />
      <Studio />
      <Rig intensity={0.5}>
        {step === "choose" && (
          <Enter sceneKey="hero">
            <HeroTooth />
          </Enter>
        )}
        {step === "reveal" && (
          <Enter sceneKey={choiceId}>
            <ConditionScene choiceId={choiceId} reveal={revealRef} />
          </Enter>
        )}
        {(step === "journey" || step === "result") && (
          <Enter sceneKey="finished">
            <HeroTooth finished />
          </Enter>
        )}
      </Rig>
    </Canvas>
  );
}
