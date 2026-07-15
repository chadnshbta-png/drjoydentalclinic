"use client";

import { useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, Float, ContactShadows } from "@react-three/drei";
import { craftProgress } from "./progress";

/* ————— shared helpers ————— */

const lerp = THREE.MathUtils.lerp;
const damp = THREE.MathUtils.damp;
const GOLD = "#AC8B51";

/** Positions/orientations of teeth along a dental arch (ellipse segment). */
function archLayout(count: number, rx = 1.45, rz = 1.0) {
  const teeth: { pos: [number, number, number]; rotY: number }[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const a = THREE.MathUtils.degToRad(lerp(-78, 78, t));
    teeth.push({
      pos: [Math.sin(a) * rx, 0, -Math.cos(a) * rz + 0.45],
      rotY: -a,
    });
  }
  return teeth;
}

/** Deterministic pseudo-random (stable across renders, no hydration drift). */
function prand(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const ceramic = {
  color: "#f6f1e8",
  roughness: 0.16,
  clearcoat: 1,
  clearcoatRoughness: 0.1,
  metalness: 0.02,
} as const;

const titanium = {
  color: "#d8cfbd",
  metalness: 0.9,
  roughness: 0.34,
  envMapIntensity: 1.6,
} as const;

/** Alpha-blended frosted glass — real transmission would resolve against the
 *  transparent canvas (black), so glass here is honest alpha + clearcoat. */
function makeGlass(opacity = 0.4) {
  return new THREE.MeshPhysicalMaterial({
    color: "#ffffff",
    transparent: true,
    opacity,
    roughness: 0.07,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.5,
    depthWrite: false,
  });
}

/** Camera parallax rig — the whole scene leans gently toward the cursor. */
export function Rig({ children, intensity = 1 }: { children: ReactNode; intensity?: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!g.current) return;
    g.current.rotation.y = damp(g.current.rotation.y, state.pointer.x * 0.16 * intensity, 3.2, delta);
    g.current.rotation.x = damp(g.current.rotation.x, -state.pointer.y * 0.09 * intensity, 3.2, delta);
  });
  return <group ref={g}>{children}</group>;
}

/** Soft grounding shadow shared by every vignette. */
function Ground({ y = -1.25 }: { y?: number }) {
  return (
    <ContactShadows
      position={[0, y, 0]}
      opacity={0.32}
      scale={7.5}
      blur={2.6}
      far={3.2}
      resolution={256}
      color="#6d5a3c"
    />
  );
}

/** A stylised tooth: crown + neck taper, reads dental at a glance. */
function Tooth({
  scale = 1,
  material,
  ...props
}: {
  scale?: number;
  material: THREE.Material;
} & Omit<React.ComponentProps<"group">, "scale">) {
  return (
    <group {...(props as object)} scale={scale}>
      <RoundedBox args={[0.42, 0.5, 0.34]} radius={0.14} smoothness={3} material={material} />
      <mesh position={[0, -0.32, 0]} material={material}>
        <cylinderGeometry args={[0.13, 0.07, 0.24, 12]} />
      </mesh>
    </group>
  );
}

/* ————— 01 · Invisible Orthodontics — an aligner seats over the arch ————— */

export function AlignerScene(_: { quality: number }) {
  const group = useRef<THREE.Group>(null);
  const shellGroup = useRef<THREE.Group>(null);
  const teethRefs = useRef<(THREE.Group | null)[]>([]);
  const layout = useMemo(() => archLayout(11), []);
  const jitter = useMemo(
    () =>
      layout.map((_, i) => ({
        dx: (prand(i) - 0.5) * 0.3,
        dz: (prand(i + 40) - 0.5) * 0.26,
        rot: (prand(i + 80) - 0.5) * 0.8,
      })),
    [layout]
  );
  const enamel = useMemo(() => new THREE.MeshPhysicalMaterial(ceramic), []);
  const shell = useMemo(() => makeGlass(0.38), []);

  useFrame((state, delta) => {
    const p = craftProgress.aligner;
    if (group.current) {
      group.current.rotation.y = damp(group.current.rotation.y, -0.35 + p * 0.7, 3, delta);
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.035;
    }
    // Act one: the crooked arch finds alignment…
    const settle = THREE.MathUtils.smoothstep(p, 0.08, 0.5);
    layout.forEach((tooth, i) => {
      const g = teethRefs.current[i];
      if (!g) return;
      g.position.set(
        tooth.pos[0] + jitter[i].dx * (1 - settle),
        tooth.pos[1],
        tooth.pos[2] + jitter[i].dz * (1 - settle)
      );
      g.rotation.y = tooth.rotY + jitter[i].rot * (1 - settle);
    });
    // …act two: the clear aligner descends and seats over it.
    const seat = THREE.MathUtils.smoothstep(p, 0.55, 0.88);
    if (shellGroup.current) {
      shellGroup.current.position.y = lerp(1.45, 0.02, seat);
      shellGroup.current.visible = p > 0.4;
      shell.opacity = 0.38 * THREE.MathUtils.smoothstep(p, 0.42, 0.6);
    }
  });

  return (
    <group position={[0, 0.05, 0]}>
      <group ref={group}>
        {layout.map((_, i) => (
          <group key={i} ref={(el) => void (teethRefs.current[i] = el)}>
            <Tooth material={enamel} />
          </group>
        ))}
        {/* the aligner tray — a frosted ghost of the same arch */}
        <group ref={shellGroup} position={[0, 1.45, 0]}>
          {layout.map((tooth, i) => (
            <group key={i} position={tooth.pos} rotation={[0, tooth.rotY, 0]}>
              <RoundedBox args={[0.5, 0.58, 0.42]} radius={0.17} smoothness={3} material={shell} />
            </group>
          ))}
        </group>
        <mesh position={[0, -0.62, 0.28]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.45, 0.012, 12, 96]} />
          <meshStandardMaterial color={GOLD} metalness={1} roughness={0.28} />
        </mesh>
      </group>
      <Ground y={-1.15} />
    </group>
  );
}

/* ————— 02 · Implantology — the implant assembles into the gum line ————— */

export function ImplantScene(_: { quality: number }) {
  const crown = useRef<THREE.Group>(null);
  const abutment = useRef<THREE.Group>(null);
  const screw = useRef<THREE.Group>(null);
  const root = useRef<THREE.Group>(null);
  const enamel = useMemo(() => new THREE.MeshPhysicalMaterial(ceramic), []);
  const gum = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#dda096",
        roughness: 0.45,
        clearcoat: 0.4,
        clearcoatRoughness: 0.35,
      }),
    []
  );

  const threads = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        y: -0.62 - i * 0.14,
        r: lerp(0.2, 0.08, i / 5),
      })),
    []
  );

  useFrame((_, delta) => {
    const p = craftProgress.implant;
    const assemble = THREE.MathUtils.smoothstep(p, 0.1, 0.75);
    if (crown.current)
      crown.current.position.y = damp(crown.current.position.y, lerp(1.7, 0.32, assemble), 4, delta);
    if (abutment.current)
      abutment.current.position.y = damp(abutment.current.position.y, lerp(1.0, -0.02, assemble), 4, delta);
    if (screw.current) {
      // the fixture threads down into the gum as pieces meet
      screw.current.position.y = lerp(0.5, 0, THREE.MathUtils.smoothstep(p, 0.05, 0.5));
      screw.current.rotation.y = (1 - assemble) * Math.PI * 3;
    }
    if (root.current)
      root.current.rotation.y = damp(root.current.rotation.y, -0.2 + p * 0.4, 3, delta);
  });

  return (
    <group position={[0, 0.15, 0]}>
      <group ref={root}>
        {/* gum ridge */}
        <RoundedBox args={[2.9, 0.85, 1.05]} radius={0.12} smoothness={3} position={[0, -1.02, 0]} material={gum} />
        {/* neighbouring teeth */}
        <Tooth material={enamel} position={[-0.95, -0.28, 0]} scale={1.15} />
        <Tooth material={enamel} position={[0.95, -0.28, 0]} scale={1.15} />

        {/* the ceramic crown */}
        <group ref={crown} position={[0, 1.7, 0]}>
          <RoundedBox args={[0.56, 0.5, 0.44]} radius={0.16} smoothness={3} material={enamel} />
        </group>
        {/* the abutment */}
        <group ref={abutment} position={[0, 1.0, 0]}>
          <mesh>
            <cylinderGeometry args={[0.11, 0.16, 0.34, 24]} />
            <meshStandardMaterial {...titanium} />
          </mesh>
        </group>
        {/* the fixture, threading into the ridge */}
        <group ref={screw}>
          <mesh position={[0, -0.78, 0]}>
            <cylinderGeometry args={[0.2, 0.06, 1.05, 24]} />
            <meshStandardMaterial {...titanium} />
          </mesh>
          {threads.map((t, i) => (
            <mesh key={i} position={[0, t.y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[t.r, 0.024, 10, 40]} />
              <meshStandardMaterial {...titanium} />
            </mesh>
          ))}
        </group>
      </group>
      <Ground y={-1.5} />
    </group>
  );
}

/* ————— 03 · Veneers — a porcelain leaf restores the smile line ————— */

export function VeneerScene(_: { quality: number }) {
  const shellRef = useRef<THREE.Group>(null);
  const root = useRef<THREE.Group>(null);
  const light = useRef<THREE.SpotLight>(null);
  const enamel = useMemo(() => new THREE.MeshPhysicalMaterial(ceramic), []);
  const worn = useMemo(
    () => new THREE.MeshPhysicalMaterial({ ...ceramic, color: "#d9c49e", roughness: 0.34 }),
    []
  );
  const porcelain = useMemo(() => makeGlass(0.55), []);
  const wornColor = useMemo(() => new THREE.Color("#d9c49e"), []);
  const brightColor = useMemo(() => new THREE.Color("#f8f4ec"), []);

  useFrame((state, delta) => {
    const p = craftProgress.veneer;
    const seat = THREE.MathUtils.smoothstep(p, 0.12, 0.7);
    if (shellRef.current) {
      shellRef.current.position.z = damp(shellRef.current.position.z, lerp(1.6, 0.26, seat), 4, delta);
      shellRef.current.rotation.y = damp(shellRef.current.rotation.y, lerp(-0.85, 0, seat), 4, delta);
      shellRef.current.position.y = lerp(0.4, 0.06, seat);
    }
    // the worn tooth brightens the moment the veneer seats
    const heal = THREE.MathUtils.smoothstep(p, 0.68, 0.85);
    worn.color.copy(wornColor).lerp(brightColor, heal);
    if (root.current)
      root.current.rotation.y = damp(root.current.rotation.y, state.pointer.x * 0.12, 3, delta);
    if (light.current) {
      light.current.position.x = Math.sin(seat * Math.PI) * 2.2;
      light.current.intensity = 12 + seat * 26;
    }
  });

  return (
    <group ref={root} position={[0, 0.1, 0]}>
      <spotLight ref={light} position={[0, 2.6, 2.4]} angle={0.5} penumbra={1} color="#ffedd0" intensity={14} />
      {/* the smile line — three front teeth, the centre one worn */}
      <Tooth material={enamel} position={[-0.62, 0, -0.12]} scale={1.28} rotation={[0, 0.18, 0]} />
      <group position={[0, 0.06, 0]}>
        <RoundedBox args={[0.54, 0.66, 0.42]} radius={0.16} smoothness={4} material={worn} />
      </group>
      <Tooth material={enamel} position={[0.62, 0, -0.12]} scale={1.28} rotation={[0, -0.18, 0]} />

      {/* the veneer — a porcelain leaf, three-tenths of a millimetre */}
      <group ref={shellRef} position={[0, 0.4, 1.6]}>
        <RoundedBox args={[0.56, 0.68, 0.07]} radius={0.035} smoothness={4} material={porcelain} />
      </group>
      <Ground y={-0.95} />
    </group>
  );
}

/* ————— 04 · Digital Dentistry — a scan resolves a tooth from light ————— */

const SCAN_POINTS = 2600;

export function ScanScene(_: { quality: number }) {
  const points = useRef<THREE.Points>(null);
  const ring = useRef<THREE.Mesh>(null);
  const beam = useRef<THREE.Mesh>(null);
  const shown = useRef(-1);

  const { positions, scattered, formed } = useMemo(() => {
    const formed = new Float32Array(SCAN_POINTS * 3);
    const scattered = new Float32Array(SCAN_POINTS * 3);
    for (let i = 0; i < SCAN_POINTS; i++) {
      const u = prand(i * 3) * Math.PI * 2;
      const v = Math.acos(2 * prand(i * 3 + 1) - 1);
      const bulge = 1 + 0.22 * Math.sin(v * 2);
      const r = 0.72 * bulge;
      const x = r * Math.sin(v) * Math.cos(u) * 0.9;
      let y = 0.95 * Math.cos(v);
      const z = r * Math.sin(v) * Math.sin(u) * 0.75;
      if (y < -0.2) y *= 1.35;
      formed.set([x, y, z], i * 3);
      const rr = 2.6 + prand(i * 7) * 2.2;
      const su = prand(i * 7 + 1) * Math.PI * 2;
      const sv = Math.acos(2 * prand(i * 7 + 2) - 1);
      scattered.set(
        [rr * Math.sin(sv) * Math.cos(su), rr * Math.cos(sv), rr * Math.sin(sv) * Math.sin(su)],
        i * 3
      );
    }
    return { positions: scattered.slice(), scattered, formed };
  }, []);

  useFrame((state) => {
    const p = craftProgress.scan;
    const form = THREE.MathUtils.smoothstep(p, 0.08, 0.75);
    if (Math.abs(form - shown.current) > 0.002 && points.current) {
      const attr = points.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      for (let i = 0; i < arr.length; i++) arr[i] = lerp(scattered[i], formed[i], form);
      attr.needsUpdate = true;
      shown.current = form;
    }
    if (points.current) points.current.rotation.y = state.clock.elapsedTime * 0.16;
    const sweep = Math.sin(state.clock.elapsedTime * 0.9) * 0.85;
    if (ring.current) {
      ring.current.position.y = sweep;
      (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.25 + form * 0.55;
    }
    if (beam.current) {
      beam.current.position.y = sweep;
      (beam.current.material as THREE.MeshBasicMaterial).opacity = 0.05 + form * 0.06;
    }
  });

  return (
    <group>
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.024} color={GOLD} transparent opacity={0.9} sizeAttenuation depthWrite={false} />
      </points>
      {/* the travelling scan ring + light disc */}
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.35, 0.006, 8, 90]} />
        <meshBasicMaterial color="#d9bd8c" transparent opacity={0.5} />
      </mesh>
      <mesh ref={beam} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.35, 48]} />
        <meshBasicMaterial color="#e7cf9f" transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ————— 05 · Orthodontics — the archwire eases the arch straight ————— */

export function OrthoScene(_: { quality: number }) {
  const group = useRef<THREE.Group>(null);
  const teethRefs = useRef<(THREE.Group | null)[]>([]);
  const wire = useRef<THREE.Mesh>(null);
  const layout = useMemo(() => archLayout(11, 1.5, 1.08), []);
  const enamel = useMemo(() => new THREE.MeshPhysicalMaterial(ceramic), []);
  const jitter = useMemo(
    () =>
      layout.map((_, i) => ({
        dy: (prand(i + 7) - 0.5) * 0.26,
        dz: (prand(i + 21) - 0.5) * 0.22,
        rot: (prand(i + 55) - 0.5) * 0.6,
      })),
    [layout]
  );
  const shown = useRef(-1);

  useFrame((_, delta) => {
    const p = craftProgress.ortho;
    const settle = THREE.MathUtils.smoothstep(p, 0.12, 0.82);
    if (group.current)
      group.current.rotation.y = damp(group.current.rotation.y, -0.22 + p * 0.44, 3, delta);

    const wirePoints: THREE.Vector3[] = [];
    layout.forEach((tooth, i) => {
      const g = teethRefs.current[i];
      const y = jitter[i].dy * (1 - settle);
      const z = tooth.pos[2] + jitter[i].dz * (1 - settle);
      if (g) {
        g.position.set(tooth.pos[0], y, z);
        g.rotation.y = tooth.rotY + jitter[i].rot * (1 - settle);
      }
      const out = new THREE.Vector3(tooth.pos[0], y, z).add(
        new THREE.Vector3(Math.sin(-tooth.rotY), 0, Math.cos(-tooth.rotY)).multiplyScalar(0.26)
      );
      wirePoints.push(out);
    });

    if (Math.abs(settle - shown.current) > 0.004 && wire.current) {
      const curve = new THREE.CatmullRomCurve3(wirePoints);
      wire.current.geometry.dispose();
      wire.current.geometry = new THREE.TubeGeometry(curve, 48, 0.026, 8, false);
      shown.current = settle;
    }
  });

  return (
    <group position={[0, 0.05, 0]}>
      <group ref={group}>
        {layout.map((_, i) => (
          <group key={i} ref={(el) => void (teethRefs.current[i] = el)}>
            <Tooth material={enamel} scale={1.05} />
            {/* the bracket */}
            <mesh position={[0, 0.02, 0.21]}>
              <boxGeometry args={[0.11, 0.11, 0.06]} />
              <meshStandardMaterial color={GOLD} metalness={1} roughness={0.22} />
            </mesh>
          </group>
        ))}
        <mesh ref={wire}>
          <tubeGeometry args={[new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(0, 0, 0.1)]), 8, 0.026, 8, false]} />
          <meshStandardMaterial color={GOLD} metalness={1} roughness={0.18} />
        </mesh>
      </group>
      <Ground y={-1.1} />
    </group>
  );
}

/* ————— 06 · Whitening — light, chemistry and restraint ————— */

export function WhiteningScene(_: { quality: number }) {
  const toothMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#e3d5ba",
        roughness: 0.14,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
      }),
    []
  );
  const bar = useRef<THREE.Mesh>(null);
  const barLight = useRef<THREE.PointLight>(null);
  const halo = useRef<THREE.Mesh>(null);
  const toothRef = useRef<THREE.Group>(null);
  const warm = useMemo(() => new THREE.Color("#e0cfae"), []);
  const bright = useMemo(() => new THREE.Color("#fdfdfa"), []);

  useFrame((state) => {
    const p = craftProgress.whitening;
    const glow = THREE.MathUtils.smoothstep(p, 0.12, 0.82);
    toothMat.color.copy(warm).lerp(bright, glow);
    if (toothRef.current)
      toothRef.current.rotation.y = state.clock.elapsedTime * 0.22;
    // the whitening light passes across the tooth
    const sweep = Math.sin(state.clock.elapsedTime * 0.7);
    if (bar.current) {
      bar.current.position.x = sweep * 1.3;
      (bar.current.material as THREE.MeshBasicMaterial).opacity = 0.35 + glow * 0.6;
    }
    if (barLight.current) {
      barLight.current.position.x = sweep * 1.3;
      barLight.current.intensity = 1.5 + glow * 4;
    }
    if (halo.current) {
      halo.current.rotation.z = state.clock.elapsedTime * 0.4;
      (halo.current.material as THREE.MeshBasicMaterial).opacity = 0.12 + glow * 0.5;
      halo.current.scale.setScalar(1.1 + glow * 0.18);
    }
  });

  return (
    <group position={[0, 0.05, 0]}>
      <Float speed={1.3} rotationIntensity={0.12} floatIntensity={0.35}>
        <group ref={toothRef}>
          {/* molar: crown + two roots */}
          <RoundedBox args={[1.15, 0.95, 0.9]} radius={0.3} smoothness={4} material={toothMat} />
          <mesh position={[-0.3, -0.72, 0]} rotation={[0, 0, 0.12]} material={toothMat}>
            <cylinderGeometry args={[0.19, 0.07, 0.7, 14]} />
          </mesh>
          <mesh position={[0.3, -0.72, 0]} rotation={[0, 0, -0.12]} material={toothMat}>
            <cylinderGeometry args={[0.19, 0.07, 0.7, 14]} />
          </mesh>
        </group>
      </Float>
      {/* the whitening light bar */}
      <mesh ref={bar} position={[0, 0.1, 1.15]}>
        <boxGeometry args={[0.05, 2.0, 0.05]} />
        <meshBasicMaterial color="#ffe9c2" transparent opacity={0.4} />
      </mesh>
      <pointLight ref={barLight} position={[0, 0.1, 1.3]} intensity={2} color="#fff3dd" distance={5} />
      <mesh ref={halo} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[1.5, 0.005, 8, 100]} />
        <meshBasicMaterial color="#e6c98f" transparent opacity={0.3} />
      </mesh>
      <Ground y={-1.35} />
    </group>
  );
}

export const sceneMap = {
  aligner: AlignerScene,
  implant: ImplantScene,
  veneer: VeneerScene,
  scan: ScanScene,
  ortho: OrthoScene,
  whitening: WhiteningScene,
} as const;

export type SceneKey = keyof typeof sceneMap;
