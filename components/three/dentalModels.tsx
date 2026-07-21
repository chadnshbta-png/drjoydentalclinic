"use client";

import { useMemo, type ReactNode } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";

/**
 * Shared dental GLB models for The Craft. Two real assets replace the old
 * procedural teeth:
 *   • human_teeth.glb   — the full dentition (arch + gums)
 *   • incisor.glb       — a single maxillary central incisor
 * Each is auto-centred and auto-scaled to the scene, and re-dressed in premium
 * physically-based materials (glossy enamel, soft gums). Loaded once, cached by
 * drei, and shared across every vignette.
 */

const HUMAN = "/models/human_teeth.glb";
const INCISOR = "/models/incisor.glb";

useGLTF.preload(HUMAN);
useGLTF.preload(INCISOR);

/* ————— premium PBR materials ————— */

// Premium natural enamel — a smooth dentine body under a wet clearcoat. The
// two-lobe finish (a soft base spec + a sharper clearcoat) gives the layered,
// polished depth of real enamel, and a warm sheen fakes the translucency of
// the thin incisal edges. Reflections come from the Studio env. No transmission
// — its screen-buffer pass reads wrong on this alpha canvas, so the wet look is
// carried entirely by the clearcoat (fast + correct).
export function makeEnamel(color = "#f4eede") {
  const m = new THREE.MeshPhysicalMaterial({
    color,
    // a touch more body roughness than a mirror — enamel is wet, not chrome;
    // this softens the base highlight so it reads as depth beneath the coat
    roughness: 0.19,
    metalness: 0,
    // a flawless wet coat, barely softened so specular highlights bloom gently
    clearcoat: 1,
    clearcoatRoughness: 0.055,
    ior: 1.66,
    reflectivity: 0.52,
    envMapIntensity: 1.72,
    specularIntensity: 1,
    specularColor: new THREE.Color("#fffaf0"),
  });
  // a warm sheen concentrated at grazing angles → the glow of thin edges
  m.sheen = 0.6;
  m.sheenRoughness = 0.45;
  m.sheenColor = new THREE.Color("#fff2da");
  return m;
}

// Soft, living gum tissue — a warm base, softer and more matte than enamel, with
// a broad velvety sheen that fakes the light-scatter (subsurface) of real
// gingiva. The lighter, cooler sheen reading over the deeper base gives subtle
// colour variation, so the surface never looks like flat plastic.
export function makeGum(color = "#c67c78") {
  const m = new THREE.MeshPhysicalMaterial({
    color,
    // softer, more matte than enamel — real tissue diffuses light broadly
    roughness: 0.8,
    metalness: 0,
    // a faint wet film near the gum line, not a hard gloss
    clearcoat: 0.24,
    clearcoatRoughness: 0.7,
    envMapIntensity: 0.58,
  });
  // a strong, broad sheen is the cheapest convincing stand-in for subsurface
  m.sheen = 1;
  m.sheenRoughness = 0.66;
  m.sheenColor = new THREE.Color("#f0b4aa");
  return m;
}

export function makeGlass(opacity = 0.32) {
  return new THREE.MeshPhysicalMaterial({
    color: "#ffffff",
    transparent: true,
    opacity,
    roughness: 0.045,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.7,
    depthWrite: false,
  });
}

export function makeCeramic() {
  const m = new THREE.MeshPhysicalMaterial({
    color: "#fbf6ee",
    // a hair less mirror-smooth than before → the hand-polished ceramic look
    roughness: 0.1,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    ior: 1.58,
    reflectivity: 0.5,
    envMapIntensity: 1.75,
    specularColor: new THREE.Color("#fffaf2"),
  });
  m.sheen = 0.55;
  m.sheenRoughness = 0.45;
  m.sheenColor = new THREE.Color("#fff6e8");
  return m;
}

/* ————— geometry access + normalisation ————— */

type Norm = { offset: THREE.Vector3; scale: number };

function normalise(box: THREE.Box3, target: number): Norm {
  const c = box.getCenter(new THREE.Vector3());
  const s = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(s.x, s.y, s.z) || 1;
  return { offset: c.multiplyScalar(-1), scale: target / maxDim };
}

export function useDentition() {
  const { nodes } = useGLTF(HUMAN) as unknown as {
    nodes: Record<string, THREE.Mesh>;
  };
  const teeth = nodes["Teeth_TeethMaterial_0"].geometry as THREE.BufferGeometry;
  const gums = nodes["Gums_GumsMaterial_0"].geometry as THREE.BufferGeometry;
  return { teeth, gums };
}

export function useIncisor() {
  const { nodes } = useGLTF(INCISOR) as unknown as {
    nodes: Record<string, THREE.Mesh>;
  };
  return nodes["Object_2"].geometry as THREE.BufferGeometry;
}

/**
 * The full smile — arch + gums, centred, scaled to `target`, dressed in enamel
 * and gum materials. `children` render in the same centred, un-scaled frame so
 * a scene can attach brackets, aligners, etc. that track the teeth.
 */
export function Dentition({
  target = 3.4,
  rotation = [0, 0, 0],
  position = [0, 0, 0],
  enamel,
  gum,
  teethOnly = false,
  children,
}: {
  target?: number;
  rotation?: [number, number, number];
  position?: [number, number, number];
  enamel?: THREE.Material;
  gum?: THREE.Material;
  teethOnly?: boolean;
  children?: ReactNode;
}) {
  const { teeth, gums } = useDentition();
  const enamelMat = useMemo(() => enamel ?? makeEnamel(), [enamel]);
  const gumMat = useMemo(() => gum ?? makeGum(), [gum]);
  // Always normalise against the full arch so a teeth-only glass shell lines up
  // exactly over the solid arch.
  const { offset, scale } = useMemo(() => {
    teeth.computeBoundingBox();
    gums.computeBoundingBox();
    const box = teeth.boundingBox!.clone().union(gums.boundingBox!);
    return normalise(box, target);
  }, [teeth, gums, target]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group position={offset}>
        <mesh geometry={teeth} material={enamelMat} />
        {!teethOnly && <mesh geometry={gums} material={gumMat} />}
        {children}
      </group>
    </group>
  );
}

/**
 * A single tooth — centred, scaled, enamel-dressed. `children` render in the
 * same centred frame so a scene can add a veneer shell or implant post.
 */
export function SingleTooth({
  target = 2.4,
  rotation = [0, 0, 0],
  position = [0, 0, 0],
  enamel,
  children,
}: {
  target?: number;
  rotation?: [number, number, number];
  position?: [number, number, number];
  enamel?: THREE.Material;
  children?: ReactNode;
}) {
  const geom = useIncisor();
  const enamelMat = useMemo(() => enamel ?? makeEnamel(), [enamel]);
  const { offset, scale } = useMemo(() => {
    geom.computeBoundingBox();
    return normalise(geom.boundingBox!.clone(), target);
  }, [geom, target]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group position={offset}>
        <mesh geometry={geom} material={enamelMat} />
        {children}
      </group>
    </group>
  );
}
