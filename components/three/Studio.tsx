"use client";

import { Environment, Lightformer } from "@react-three/drei";

/**
 * The lighting room every vignette lives in: a soft white key from above and
 * warm gold rims from the sides — the film's salon, rebuilt as an env map.
 * Rendered once (frames={1}); costs nothing per frame.
 */
export default function Studio() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 4]} intensity={1.1} />
      <Environment resolution={256} frames={1}>
        <Lightformer
          form="rect"
          intensity={3.2}
          position={[0, 4, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[8, 8, 1]}
          color="#ffffff"
        />
        <Lightformer
          form="rect"
          intensity={1.6}
          position={[-5, 1, 2]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[6, 3, 1]}
          color="#e8d5b0"
        />
        <Lightformer
          form="rect"
          intensity={1.6}
          position={[5, 1, 2]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[6, 3, 1]}
          color="#e8d5b0"
        />
        <Lightformer
          form="circle"
          intensity={1.1}
          position={[0, 2, -6]}
          scale={[5, 5, 1]}
          color="#d9c193"
        />
      </Environment>
    </>
  );
}
