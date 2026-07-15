"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, Float, ContactShadows } from "@react-three/drei";

/**
 * The Smile Design scenes — floating choice objects, and one elegant
 * condition→treatment transformation per path. Clean, minimal, luxury;
 * nothing medical or clinical-looking. A shared `reveal` ref (0 → 1) drives
 * each transformation so the parent can choreograph the reveal.
 */

const lerp = THREE.MathUtils.lerp;
const damp = THREE.MathUtils.damp;
const smooth = THREE.MathUtils.smoothstep;
const GOLD = "#AC8B51";

const ceramic = {
  color: "#f4eee2",
  roughness: 0.15,
  clearcoat: 1,
  clearcoatRoughness: 0.1,
  metalness: 0.02,
} as const;

function glassMat(opacity = 0.42) {
  return new THREE.MeshPhysicalMaterial({
    color: "#ffffff",
    transparent: true,
    opacity,
    roughness: 0.05,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.6,
    depthWrite: false,
  });
}

function prand(s: number) {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function Tooth({
  material,
  scale = 1,
  ...props
}: { material: THREE.Material; scale?: number } & Omit<React.ComponentProps<"group">, "scale">) {
  return (
    <group {...(props as object)} scale={scale}>
      <RoundedBox args={[0.42, 0.5, 0.34]} radius={0.14} smoothness={3} material={material} />
      <mesh position={[0, -0.32, 0]} material={material}>
        <cylinderGeometry args={[0.13, 0.07, 0.24, 12]} />
      </mesh>
    </group>
  );
}

function Ground({ y = -1.15 }: { y?: number }) {
  return (
    <ContactShadows position={[0, y, 0]} opacity={0.28} scale={7} blur={2.6} far={3} resolution={256} color="#3a2c17" />
  );
}

export type RevealRef = { current: number };

/* ————— smooth scene entrance — every scene arrives, never cuts ————— */

export function Enter({ children, sceneKey }: { children: ReactNode; sceneKey: string | number }) {
  const g = useRef<THREE.Group>(null);
  const t = useRef(0);
  useEffect(() => {
    t.current = 0;
  }, [sceneKey]);
  useFrame((_, dt) => {
    if (!g.current) return;
    t.current = Math.min(1, t.current + dt * 1.7);
    const e = 1 - Math.pow(1 - t.current, 3);
    g.current.scale.setScalar(0.82 + e * 0.18);
    g.current.position.y = (1 - e) * -0.45;
    g.current.rotation.y = (1 - e) * 0.4;
  });
  return <group ref={g}>{children}</group>;
}

/* ————— the clean centrepiece — a single, unmistakable tooth ————— */

export function HeroTooth({ finished = false }: { finished?: boolean }) {
  const g = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Mesh>(null);
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: finished ? "#f8f4ec" : "#f2ebdd",
        roughness: 0.13,
        clearcoat: 1,
        clearcoatRoughness: 0.07,
      }),
    [finished]
  );
  useFrame((state, dt) => {
    if (g.current) g.current.rotation.y += dt * 0.3;
    if (halo.current) {
      halo.current.rotation.z = state.clock.elapsedTime * 0.4;
      halo.current.rotation.x = Math.PI / 2.3 + Math.sin(state.clock.elapsedTime * 0.4) * 0.35;
    }
  });
  return (
    <group position={[0, 0.1, 0]}>
      <Float speed={1.2} rotationIntensity={0.14} floatIntensity={0.5}>
        <group ref={g}>
          <RoundedBox args={[0.95, 1.15, 0.8]} radius={0.28} smoothness={4} material={mat} />
          <mesh position={[0, -0.86, 0]} material={mat}>
            <cylinderGeometry args={[0.24, 0.09, 0.7, 16]} />
          </mesh>
        </group>
      </Float>
      {finished && (
        <mesh ref={halo} rotation={[Math.PI / 2.3, 0, 0]}>
          <torusGeometry args={[1.3, 0.008, 10, 120]} />
          <meshBasicMaterial color="#c9a86a" transparent opacity={0.55} />
        </mesh>
      )}
      <Ground y={-1.3} />
    </group>
  );
}

/* ————— choice objects — floating glass gems with tracked labels ————— */

export type ChoiceMeta = { id: string; label: string; sub: string; color: string };

// Decorative floating gem — glows when its matching choice chip is hovered.
// Interaction lives in the HTML layer, so the experience never depends on GL.
function Gem({
  position,
  color,
  active,
}: {
  position: [number, number, number];
  color: string;
  active: boolean;
}) {
  const shell = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.Mesh>(null);
  const glass = useMemo(() => glassMat(0.5), []);

  useFrame((state, dt) => {
    const k = active ? 1.28 : 1;
    if (shell.current) {
      shell.current.scale.setScalar(damp(shell.current.scale.x, k, 6, dt));
      shell.current.rotation.y += dt * 0.35;
      shell.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.1;
    }
    if (core.current) {
      const m = core.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = damp(m.emissiveIntensity, active ? 0.95 : 0.24, 6, dt);
    }
  });

  return (
    <group position={position}>
      <Float speed={1.5} rotationIntensity={0.15} floatIntensity={0.7}>
        <mesh ref={shell}>
          <icosahedronGeometry args={[0.64, 0]} />
          <primitive object={glass} attach="material" />
        </mesh>
        <mesh ref={core} scale={0.52}>
          <icosahedronGeometry args={[0.6, 0]} />
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.35} emissive={color} emissiveIntensity={0.24} />
        </mesh>
      </Float>
    </group>
  );
}

export function Choices({ choices, hovered }: { choices: ChoiceMeta[]; hovered: number }) {
  const positions = useMemo<[number, number, number][]>(
    () =>
      choices.map((_, i) => {
        const t = choices.length === 1 ? 0.5 : i / (choices.length - 1);
        const a = lerp(-0.66, 0.66, t);
        return [Math.sin(a) * 3.5, Math.cos(a) * 0.45 + 0.35, -Math.abs(Math.sin(a)) * 0.8];
      }),
    [choices]
  );
  return (
    <group position={[0, 0.2, 0]}>
      {choices.map((c, i) => (
        <Gem key={c.id} position={positions[i]} color={c.color} active={hovered === i} />
      ))}
    </group>
  );
}

/* ————— condition → treatment scenes ————— */

// Alignment: a crooked arch straightens, and a clear aligner settles over it.
function AlignScene({ reveal }: { reveal: RevealRef }) {
  const group = useRef<THREE.Group>(null);
  const shell = useRef<THREE.Group>(null);
  const teeth = useRef<(THREE.Group | null)[]>([]);
  const enamel = useMemo(() => new THREE.MeshPhysicalMaterial(ceramic), []);
  const glass = useMemo(() => glassMat(0.36), []);
  const layout = useMemo(() => {
    const arr: { pos: [number, number, number]; rotY: number; jx: number; jz: number; jr: number }[] = [];
    const n = 9;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const a = THREE.MathUtils.degToRad(lerp(-70, 70, t));
      arr.push({
        pos: [Math.sin(a) * 1.7, 0, -Math.cos(a) * 1.05 + 0.5],
        rotY: -a,
        jx: (prand(i) - 0.5) * 0.32,
        jz: (prand(i + 9) - 0.5) * 0.28,
        jr: (prand(i + 18) - 0.5) * 0.8,
      });
    }
    return arr;
  }, []);

  useFrame((state, dt) => {
    const p = reveal.current;
    const straight = smooth(p, 0.05, 0.55);
    const seat = smooth(p, 0.55, 0.95);
    if (group.current) group.current.rotation.y = damp(group.current.rotation.y, -0.35 + state.pointer.x * 0.12, 3, dt);
    layout.forEach((tooth, i) => {
      const g = teeth.current[i];
      if (!g) return;
      g.position.set(tooth.pos[0] + tooth.jx * (1 - straight), 0, tooth.pos[2] + tooth.jz * (1 - straight));
      g.rotation.y = tooth.rotY + tooth.jr * (1 - straight);
    });
    if (shell.current) {
      shell.current.position.y = lerp(1.7, 0.02, seat);
      shell.current.visible = p > 0.5;
      glass.opacity = 0.36 * smooth(p, 0.52, 0.7);
    }
  });

  return (
    <group position={[0, 0.1, 0]}>
      <group ref={group}>
        {layout.map((_, i) => (
          <group key={i} ref={(el) => void (teeth.current[i] = el)}>
            <Tooth material={enamel} />
          </group>
        ))}
        <group ref={shell} position={[0, 1.7, 0]}>
          {layout.map((tooth, i) => (
            <group key={i} position={tooth.pos} rotation={[0, tooth.rotY, 0]}>
              <RoundedBox args={[0.5, 0.58, 0.42]} radius={0.17} smoothness={3} material={glass} />
            </group>
          ))}
        </group>
        <mesh position={[0, -0.62, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.68, 0.012, 12, 96]} />
          <meshStandardMaterial color={GOLD} metalness={1} roughness={0.28} />
        </mesh>
      </group>
      <Ground />
    </group>
  );
}

// Missing: a gap in the arch; a gold implant rises and a crown completes it.
function MissingScene({ reveal }: { reveal: RevealRef }) {
  const root = useRef<THREE.Group>(null);
  const post = useRef<THREE.Group>(null);
  const crown = useRef<THREE.Group>(null);
  const enamel = useMemo(() => new THREE.MeshPhysicalMaterial(ceramic), []);
  const positions = useMemo(() => [-1.5, -0.75, 0.75, 1.5], []);

  useFrame((state, dt) => {
    const p = reveal.current;
    const rise = smooth(p, 0.1, 0.55);
    const seat = smooth(p, 0.55, 0.95);
    if (root.current) root.current.rotation.y = damp(root.current.rotation.y, -0.15 + state.pointer.x * 0.12, 3, dt);
    if (post.current) {
      post.current.position.y = lerp(-1.4, -0.3, rise);
      post.current.visible = p > 0.08;
    }
    if (crown.current) {
      crown.current.position.y = lerp(1.6, 0.3, seat);
      crown.current.visible = p > 0.5;
    }
  });

  return (
    <group ref={root} position={[0, 0.15, 0]}>
      {positions.map((x, i) => (
        <Tooth key={i} material={enamel} position={[x, 0.2, 0]} scale={1.15} />
      ))}
      {/* the implant fixture */}
      <group ref={post}>
        <mesh>
          <cylinderGeometry args={[0.14, 0.05, 0.8, 20]} />
          <meshStandardMaterial color="#cfc6b4" metalness={1} roughness={0.3} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0, 0.24 - i * 0.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[lerp(0.15, 0.07, i / 3), 0.022, 8, 32]} />
            <meshStandardMaterial color="#cfc6b4" metalness={1} roughness={0.3} />
          </mesh>
        ))}
      </group>
      {/* the crown */}
      <group ref={crown}>
        <Tooth material={enamel} scale={1.15} />
      </group>
      <Ground y={-1.2} />
    </group>
  );
}

// Smile design: a dull tooth brightens as a porcelain veneer settles onto it.
function DesignScene({ reveal }: { reveal: RevealRef }) {
  const root = useRef<THREE.Group>(null);
  const veneer = useRef<THREE.Group>(null);
  const light = useRef<THREE.SpotLight>(null);
  const enamel = useMemo(() => new THREE.MeshPhysicalMaterial(ceramic), []);
  const worn = useMemo(() => new THREE.MeshPhysicalMaterial({ ...ceramic, color: "#d9c49e", roughness: 0.34 }), []);
  const porcelain = useMemo(() => glassMat(0.55), []);
  const wornC = useMemo(() => new THREE.Color("#d9c49e"), []);
  const brightC = useMemo(() => new THREE.Color("#f8f4ec"), []);

  useFrame((state, dt) => {
    const p = reveal.current;
    const seat = smooth(p, 0.1, 0.7);
    if (root.current) root.current.rotation.y = damp(root.current.rotation.y, state.pointer.x * 0.12, 3, dt);
    if (veneer.current) {
      veneer.current.position.z = lerp(1.6, 0.26, seat);
      veneer.current.position.y = lerp(0.4, 0.06, seat);
      veneer.current.visible = p > 0.05;
    }
    const heal = smooth(p, 0.6, 0.9);
    worn.color.copy(wornC).lerp(brightC, heal);
    if (light.current) light.current.intensity = 10 + seat * 24;
  });

  return (
    <group ref={root} position={[0, 0.1, 0]}>
      <spotLight ref={light} position={[0, 2.5, 2.4]} angle={0.5} penumbra={1} color="#ffedd0" intensity={12} />
      <Tooth material={enamel} position={[-0.62, 0, -0.12]} scale={1.3} rotation={[0, 0.18, 0]} />
      <group position={[0, 0.06, 0]}>
        <RoundedBox args={[0.54, 0.66, 0.42]} radius={0.16} smoothness={4} material={worn} />
      </group>
      <Tooth material={enamel} position={[0.62, 0, -0.12]} scale={1.3} rotation={[0, -0.18, 0]} />
      <group ref={veneer} position={[0, 0.4, 1.6]}>
        <RoundedBox args={[0.56, 0.68, 0.07]} radius={0.035} smoothness={4} material={porcelain} />
      </group>
      <Ground y={-0.95} />
    </group>
  );
}

// Pain: a warm ache calms into a soothing gold glow. Abstract, never clinical.
function ComfortScene({ reveal }: { reveal: RevealRef }) {
  const toothRef = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Mesh>(null);
  const glowLight = useRef<THREE.PointLight>(null);
  const mat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#f0e7d6", roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.08 }),
    []
  );
  const ache = useMemo(() => new THREE.Color("#d98a7a"), []);
  const calm = useMemo(() => new THREE.Color("#e9c98f"), []);

  useFrame((state, dt) => {
    const p = reveal.current;
    const relief = smooth(p, 0.1, 0.85);
    const t = state.clock.elapsedTime;
    // ache pulse (fast, warm) eases into a slow calm breath (gold)
    const pulse = (Math.sin(t * (6 - relief * 4.4)) * 0.5 + 0.5) * (1 - relief * 0.6);
    if (toothRef.current) toothRef.current.rotation.y = damp(toothRef.current.rotation.y, state.pointer.x * 0.14, 3, dt);
    if (glowLight.current) {
      glowLight.current.color.copy(ache).lerp(calm, relief);
      glowLight.current.intensity = 1.4 + pulse * 2.6;
    }
    if (halo.current) {
      const m = halo.current.material as THREE.MeshBasicMaterial;
      m.color.copy(ache).lerp(calm, relief);
      m.opacity = 0.18 + pulse * 0.4;
      halo.current.scale.setScalar(1.2 + pulse * 0.25 + relief * 0.2);
      halo.current.rotation.z = t * 0.3;
    }
  });

  return (
    <group position={[0, 0.05, 0]}>
      <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.4}>
        <group ref={toothRef}>
          <RoundedBox args={[1.05, 0.95, 0.86]} radius={0.3} smoothness={4} material={mat} />
          <mesh position={[-0.28, -0.72, 0]} rotation={[0, 0, 0.12]} material={mat}>
            <cylinderGeometry args={[0.18, 0.07, 0.68, 14]} />
          </mesh>
          <mesh position={[0.28, -0.72, 0]} rotation={[0, 0, -0.12]} material={mat}>
            <cylinderGeometry args={[0.18, 0.07, 0.68, 14]} />
          </mesh>
        </group>
      </Float>
      <mesh ref={halo} rotation={[Math.PI / 2.2, 0, 0]}>
        <torusGeometry args={[1.35, 0.02, 12, 100]} />
        <meshBasicMaterial color="#e9c98f" transparent opacity={0.3} />
      </mesh>
      <pointLight ref={glowLight} position={[0, 0, 1.4]} intensity={2} color="#e9c98f" distance={6} />
      <Ground y={-1.35} />
    </group>
  );
}

// Preventive: a protective ring of light forms around a healthy tooth.
function PreventScene({ reveal }: { reveal: RevealRef }) {
  const toothRef = useRef<THREE.Group>(null);
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const sparks = useRef<THREE.Points>(null);
  const mat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#f4eee2", roughness: 0.13, clearcoat: 1, clearcoatRoughness: 0.07 }),
    []
  );
  const sparkPos = useMemo(() => {
    const a = new Float32Array(60 * 3);
    for (let i = 0; i < 60; i++) {
      const u = prand(i) * Math.PI * 2;
      const v = Math.acos(2 * prand(i + 60) - 1);
      const r = 1.5;
      a.set([r * Math.sin(v) * Math.cos(u), r * Math.cos(v), r * Math.sin(v) * Math.sin(u)], i * 3);
    }
    return a;
  }, []);

  useFrame((state, dt) => {
    const p = reveal.current;
    const shield = smooth(p, 0.1, 0.85);
    const t = state.clock.elapsedTime;
    if (toothRef.current) toothRef.current.rotation.y = damp(toothRef.current.rotation.y, state.pointer.x * 0.14, 3, dt);
    [ring1, ring2].forEach((rr, k) => {
      if (!rr.current) return;
      rr.current.scale.setScalar(shield * (1.25 + k * 0.18));
      rr.current.rotation.z = t * (0.4 - k * 0.2);
      rr.current.rotation.x = Math.PI / 2.3 + Math.sin(t * 0.4 + k) * 0.4;
      (rr.current.material as THREE.MeshBasicMaterial).opacity = shield * (0.5 - k * 0.2);
    });
    if (sparks.current) {
      sparks.current.rotation.y = t * 0.12;
      (sparks.current.material as THREE.PointsMaterial).opacity = shield * (0.5 + Math.sin(t * 2) * 0.2);
      sparks.current.scale.setScalar(0.8 + shield * 0.4);
    }
  });

  return (
    <group position={[0, 0.05, 0]}>
      <Float speed={1.2} rotationIntensity={0.12} floatIntensity={0.45}>
        <group ref={toothRef}>
          <RoundedBox args={[0.95, 1.15, 0.8]} radius={0.28} smoothness={4} material={mat} />
          <mesh position={[0, -0.86, 0]} material={mat}>
            <cylinderGeometry args={[0.24, 0.09, 0.7, 16]} />
          </mesh>
        </group>
      </Float>
      <mesh ref={ring1} rotation={[Math.PI / 2.3, 0, 0]}>
        <torusGeometry args={[1.2, 0.014, 12, 120]} />
        <meshBasicMaterial color="#e9c98f" transparent opacity={0} />
      </mesh>
      <mesh ref={ring2} rotation={[Math.PI / 2.3, 0, 0]}>
        <torusGeometry args={[1.2, 0.01, 12, 120]} />
        <meshBasicMaterial color="#d6b882" transparent opacity={0} />
      </mesh>
      <points ref={sparks}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sparkPos, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.05} color="#e9c98f" transparent opacity={0} sizeAttenuation depthWrite={false} />
      </points>
      <Ground y={-1.3} />
    </group>
  );
}

const CONDITION: Record<string, (p: { reveal: RevealRef }) => React.JSX.Element> = {
  align: AlignScene,
  missing: MissingScene,
  design: DesignScene,
  pain: ComfortScene,
  preventive: PreventScene,
};

export function ConditionScene({ choiceId, reveal }: { choiceId: string; reveal: RevealRef }) {
  const Scene = CONDITION[choiceId] ?? AlignScene;
  return <Scene reveal={reveal} />;
}

// A calm floating gem — backdrop for the journey + result screens.
export function AmbientSmile() {
  const ref = useRef<THREE.Mesh>(null);
  const glass = useMemo(() => glassMat(0.4), []);
  useFrame((state, dt) => {
    if (ref.current) {
      ref.current.rotation.y += dt * 0.15;
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
    }
  });
  return (
    <group position={[0, 0.1, 0]}>
      <Float speed={1.1} rotationIntensity={0.2} floatIntensity={0.6}>
        <mesh ref={ref}>
          <icosahedronGeometry args={[1.15, 0]} />
          <primitive object={glass} attach="material" />
        </mesh>
        <mesh scale={0.4}>
          <icosahedronGeometry args={[1.1, 0]} />
          <meshStandardMaterial color={GOLD} metalness={0.5} roughness={0.35} emissive={GOLD} emissiveIntensity={0.3} />
        </mesh>
      </Float>
      <Ground y={-1.4} />
    </group>
  );
}
