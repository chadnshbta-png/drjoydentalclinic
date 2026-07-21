"use client";

import { useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { craftProgress } from "./progress";
import {
  Dentition,
  SingleTooth,
  makeEnamel,
  makeGlass,
  makeCeramic,
} from "./dentalModels";
import {
  makeImplantFixture,
  makeAbutment,
  makeCrown,
  makeBracket,
  makeAnatomicTooth,
  makeRealisticEnamel,
  BRACKET_SLOT_Z,
  BRACKET_SLOT_Y,
} from "./proceduralDental";

/* ————— shared helpers ————— */

const lerp = THREE.MathUtils.lerp;
const damp = THREE.MathUtils.damp;
const smooth = THREE.MathUtils.smoothstep;
const GOLD = "#AC8B51";

// Base orientations that stand the real GLB assets up, facing the camera.
const ARCH_ROT: [number, number, number] = [0, 0, Math.PI];
const TOOTH_ROT: [number, number, number] = [Math.PI / 2, 0, 0];

// Real medical titanium — full metal with a fine satin finish. A cool neutral
// body, mid roughness for the brushed sheen (never a chrome mirror), and strong
// env reflections that light the edges with bright Fresnel highlights.
const titanium = { color: "#c2beb5", metalness: 1, roughness: 0.3, envMapIntensity: 1.85 } as const;
// The abutment collar — the same alloy, a shade brighter and more polished.
const abutment = { color: "#cdc8bd", metalness: 1, roughness: 0.2, envMapIntensity: 1.9 } as const;
// Polished orthodontic steel for brackets + archwire — clean, high-end,
// clearly metal without tipping into mirror.
const braceMetal = { color: "#dcd6c8", metalness: 1, roughness: 0.13, envMapIntensity: 1.95 } as const;

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
function Ground({ y = -1.9 }: { y?: number }) {
  return (
    <ContactShadows position={[0, y, 0]} opacity={0.3} scale={8} blur={2.6} far={3.4} resolution={256} color="#6d5a3c" />
  );
}

/* ————— 01 · Invisible Orthodontics — a clear aligner seats over the smile ————— */

export function AlignerScene(_: { quality: number }) {
  const group = useRef<THREE.Group>(null);
  const shell = useRef<THREE.Group>(null);
  const enamel = useMemo(() => makeEnamel(), []);
  const glass = useMemo(() => makeGlass(0.34), []);

  useFrame((_, dt) => {
    const p = craftProgress.aligner;
    if (group.current) group.current.rotation.y = damp(group.current.rotation.y, -0.25 + p * 0.5, 3, dt);
    const seat = smooth(p, 0.12, 0.85);
    if (shell.current) {
      shell.current.position.y = lerp(2.4, 0.0, seat);
      shell.current.visible = p > 0.05;
      glass.opacity = 0.34 * smooth(p, 0.08, 0.4);
    }
  });

  return (
    <group position={[0, 0.1, 0]}>
      <group ref={group}>
        <Dentition target={3.4} rotation={ARCH_ROT} enamel={enamel} />
        {/* the clear aligner — a glass shell of the same arch, descending on */}
        <group ref={shell}>
          <Dentition target={3.56} rotation={ARCH_ROT} enamel={glass} teethOnly />
        </group>
      </group>
      <Ground />
    </group>
  );
}

/* ————— 02 · Implantology — a real implant restoration, built procedurally —————
   Everything here is generated in Three.js — a tapered titanium fixture with a
   real helical thread, a machined abutment with an anatomic emergence profile,
   and a lathed ceramic crown shaped like a maxillary central incisor. The
   fixture is already installed and the abutment torqued onto it; the crown
   begins above, descends the implant axis, and seats onto the abutment margin
   with zero gap — finishing with a subtle locking settle. It reads immediately
   as a tooth being installed onto an implant, no caption required. */

// datum: fixture platform + abutment base at y = 0. The abutment finish line
// (where the crown margin closes onto metal) sits here — the crown's cervical
// origin rests exactly on it, so "seated" is truly flush with no gap.
const ABUT_MARGIN_Y = 0.14;

export function ImplantScene(_: { quality: number }) {
  const root = useRef<THREE.Group>(null);
  const crown = useRef<THREE.Group>(null);

  // materials: brushed titanium fixture, brighter machined abutment, and a
  // wet-looking dental ceramic for the crown
  const titaniumMat = useMemo(
    () => new THREE.MeshStandardMaterial({ ...titanium }),
    []
  );
  const ceramic = useMemo(() => makeCeramic(), []);

  // procedural geometry — built once, disposed by R3F on unmount
  const fixture = useMemo(() => makeImplantFixture(1.25, 0.19, titaniumMat), [titaniumMat]);
  const abutGeom = useMemo(() => makeAbutment(0.6, 0.17), []);
  const crownGeom = useMemo(() => makeCrown(1.05, 0.21), []);

  useFrame((state, dt) => {
    const p = craftProgress.implant;

    // one slow, engineered quarter-turn across the whole vignette + gentle cursor
    // lean, so the seat is seen from a subtly shifting angle (never a full spin)
    if (root.current)
      root.current.rotation.y = damp(root.current.rotation.y, -0.5 + p * 0.5 + state.pointer.x * 0.05, 3, dt);

    if (crown.current) {
      // approach (0.1 → 0.72): the crown descends from above the abutment and
      // closes the gap completely — easing out so it decelerates into the seat
      // exactly like a component being placed by hand.
      const approach = smooth(p, 0.1, 0.72);
      let y = lerp(ABUT_MARGIN_Y + 1.15, ABUT_MARGIN_Y, approach);

      // locking settle (0.78 → 1): one tiny downward press-and-rest that reads
      // as the crown clicking fully home. It never lifts back above the seat.
      const lock = smooth(p, 0.78, 1);
      y -= Math.sin(lock * Math.PI) * 0.02;

      crown.current.position.y = y;
    }
  });

  return (
    <group ref={root} position={[0, -0.25, 0]}>
      {/* the ceramic crown — the only travelling part, seats onto the margin */}
      <group ref={crown} position={[0, ABUT_MARGIN_Y, 0]}>
        <mesh geometry={crownGeom} material={ceramic} castShadow />
      </group>

      {/* the abutment — already torqued onto the fixture, waiting for the crown */}
      <mesh geometry={abutGeom} position={[0, 0, 0]}>
        <meshStandardMaterial {...abutment} />
      </mesh>

      {/* the titanium fixture — platform at y=0, thread + apex descending */}
      <primitive object={fixture} />

      <Ground y={-1.55} />
    </group>
  );
}

/* ————— 03 · Veneers — a thin ceramic shell seats onto the front face ————— */

export function VeneerScene(_: { quality: number }) {
  const root = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const shell = useRef<THREE.Group>(null);
  const light = useRef<THREE.SpotLight>(null);
  const sweep = useRef<THREE.PointLight>(null);
  const enamel = useMemo(() => makeEnamel("#e4d4b6"), []);
  const ceramic = useMemo(() => makeCeramic(), []);
  const dull = useMemo(() => new THREE.Color("#e4d4b6"), []);
  const bright = useMemo(() => new THREE.Color("#f6f0e4"), []);

  useFrame((state, dt) => {
    const p = craftProgress.veneer;
    const t = state.clock.elapsedTime;

    // The piece is held COMPLETELY STILL — no turntable spin, no cursor lean, no
    // idle drift. Elegance and realism over movement: the tooth simply rests in
    // the studio light while the veneer is placed (scroll-driven) and the polish
    // highlight travels across it (a lighting change only).

    // the thin ceramic shell appears, then glides onto the labial face and
    // conforms exactly — decelerating into contact (easeOut) so it kisses the
    // enamel with no floating gap, like a leaf being laid onto the tooth
    const seat = smooth(p, 0.14, 0.66);
    if (shell.current) {
      // final resting z sits the shell flush on the labial face (no gap)
      shell.current.position.z = lerp(1.9, 0.045, seat);
      shell.current.visible = p > 0.05;
    }
    // the tooth warms to a natural brightness as the veneer seats
    const heal = smooth(p, 0.5, 0.88);
    enamel.color.copy(dull).lerp(bright, heal);
    if (light.current) light.current.intensity = 8 + seat * 18;

    // one clean polish highlight travels across the ceramic once it is seated —
    // the final buff catching the studio light, then holding to a bright glaze
    if (sweep.current) {
      const on = smooth(p, 0.62, 0.8);
      sweep.current.position.x = Math.sin(t * 0.7) * 1.5;
      sweep.current.position.y = 0.45 + Math.cos(t * 0.7) * 0.28;
      sweep.current.intensity = on * 4.6;
    }
  });

  return (
    <group ref={root} position={[0, -0.12, 0]}>
      <spotLight ref={light} position={[0, 2.6, 3]} angle={0.5} penumbra={1} color="#fff0d8" intensity={10} />
      {/* the travelling polish highlight — a small warm light gliding in front */}
      <pointLight ref={sweep} position={[0, 0.4, 2.2]} intensity={0} color="#fff6e6" distance={6} />
      <group ref={spin}>
        <SingleTooth target={2.0} rotation={TOOTH_ROT} enamel={enamel} />
        {/* the veneer — a thin ceramic shell (a flattened copy of the tooth's
            front) gliding onto the labial surface */}
        <group ref={shell}>
          <group scale={[1.04, 1.04, 0.26]}>
            <SingleTooth target={2.05} rotation={TOOTH_ROT} enamel={ceramic} />
          </group>
        </group>
      </group>
      <Ground y={-1.7} />
    </group>
  );
}

/* ————— 04 · Digital Smile Design — a cinematic, emotional reveal —————
   Not another turntable: the smile is held almost frontal and simply *revealed*.
   A slow camera-like push, a lighting transition from soft shadow into full
   studio glow, a faint atmosphere of settling points — harmony and beauty over
   mechanism. */

const SCAN_POINTS = 640;

export function ScanScene(_: { quality: number }) {
  const root = useRef<THREE.Group>(null);
  const push = useRef<THREE.Group>(null);
  const disc = useRef<THREE.Mesh>(null);
  const pts = useRef<THREE.Points>(null);
  const key = useRef<THREE.SpotLight>(null);
  const rim = useRef<THREE.PointLight>(null);
  const enamel = useMemo(() => makeEnamel(), []);

  // a soft haze of points that hangs around the smile, then settles and clears
  const cloud = useMemo(() => {
    const a = new Float32Array(SCAN_POINTS * 3);
    for (let i = 0; i < SCAN_POINTS; i++) {
      const t = Math.sin(i * 12.9898) * 43758.5453;
      const r1 = t - Math.floor(t);
      const r2 = (Math.sin(i * 78.233) * 43758.5453) % 1;
      const ang = r1 * Math.PI - Math.PI / 2;
      a.set([Math.sin(ang) * 1.7, (r2 - 0.5) * 1.5, Math.cos(ang) * 1.2 - 0.1], i * 3);
    }
    return a;
  }, []);

  useFrame((state, dt) => {
    const p = craftProgress.scan;
    const t = state.clock.elapsedTime;

    // held almost frontal — only a whisper of cursor lean and a slow breathing
    // drift; never a full rotation
    if (root.current) {
      root.current.rotation.y = damp(root.current.rotation.y, state.pointer.x * 0.09 + Math.sin(t * 0.12) * 0.05, 3, dt);
      root.current.rotation.x = damp(root.current.rotation.x, -state.pointer.y * 0.05, 3, dt);
    }

    // a slow, emotional cinematic push-in as the smile is revealed (camera-like)
    // — a long gentle move that decelerates into a held, balanced frame, plus a
    // barely-there breathing float so the shot feels alive, never mechanical
    const reveal = smooth(p, 0.06, 0.78);
    if (push.current) {
      const s = lerp(0.9, 1.07, reveal) + Math.sin(t * 0.4) * 0.0035;
      push.current.scale.setScalar(s);
      push.current.position.y = lerp(0.18, 0.0, reveal) + Math.sin(t * 0.4) * 0.006;
    }

    // lighting transition: out of soft shadow into full, warm studio glow —
    // the luxury of the reveal lives here, in the light rather than the motion
    enamel.envMapIntensity = lerp(0.62, 2.05, reveal);
    if (key.current) key.current.intensity = lerp(1.6, 17, reveal);
    if (rim.current) {
      // a warm rim that sweeps slowly behind, giving the enamel premium studio
      // reflections that glide across the smile as it settles
      rim.current.position.x = Math.sin(t * 0.24) * 2.6;
      rim.current.intensity = reveal * 6.4;
    }

    // the floor glow deepens for atmosphere and depth
    if (disc.current) (disc.current.material as THREE.MeshBasicMaterial).opacity = 0.03 + reveal * 0.1;

    // a soft atmospheric haze that hangs gently, then clears as the smile
    // resolves — depth and mood, not a technical scan grid (kept faint + slow)
    if (pts.current) {
      pts.current.rotation.y = t * 0.035;
      (pts.current.material as THREE.PointsMaterial).opacity = smooth(p, 0.04, 0.35) * (1 - smooth(p, 0.5, 0.85)) * 0.5;
    }
  });

  return (
    <group ref={root} position={[0, 0.1, 0]}>
      {/* the cinematic key + warm rim that bring the smile out of shadow */}
      <spotLight ref={key} position={[0.6, 3, 4]} angle={0.7} penumbra={1} color="#fff2dc" intensity={2} />
      <pointLight ref={rim} position={[0, 1, -3]} intensity={0} color="#e9d0a2" distance={9} />

      <group ref={push}>
        <Dentition target={3.4} rotation={ARCH_ROT} enamel={enamel} />
      </group>

      {/* a soft floor glow — depth and atmosphere beneath the smile */}
      <mesh ref={disc} position={[0, -1.85, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.4, 48]} />
        <meshBasicMaterial color="#e7cf9f" transparent opacity={0.03} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* the settling atmosphere of scan points */}
      <points ref={pts}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[cloud, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.018} color={GOLD} transparent opacity={0} sizeAttenuation depthWrite={false} />
      </points>
      <Ground />
    </group>
  );
}

/* ————— 05 · Orthodontics — a fully procedural clinical appliance —————
   Rebuilt from scratch in Three.js, no GLB. A real upper dental arch of
   individual anatomical teeth (centrals · laterals · canines · premolars ·
   molars) is laid out along a parabolic arch curve at clinically plausible
   widths and spacing. Each tooth carries a realistic twin bracket bonded to its
   OWN labial face — the bracket is a child of the tooth, so it can never float
   or detach — and a polished metal archwire threads through every bracket slot,
   naturally following the curvature of the arch. */

// A tooth's place on the arch: its half-mouth index, crown size and type.
type ArchTooth = {
  kind: "anterior" | "posterior";
  w: number; // mesio-distal crown width
  h: number; // crown height
  d: number; // labio-lingual depth
};

// Half-arch tooth sequence from the midline out: central, lateral, canine,
// 1st & 2nd premolar, 1st molar. Mirrored to the other side. Widths/heights are
// scaled from real average crown dimensions so proportions and spacing read as
// a genuine dentition.
const HALF_ARCH: ArchTooth[] = [
  { kind: "anterior", w: 0.42, h: 0.6, d: 0.32 },  // central incisor
  { kind: "anterior", w: 0.32, h: 0.52, d: 0.3 },  // lateral incisor
  { kind: "anterior", w: 0.38, h: 0.64, d: 0.34 }, // canine (tallest)
  { kind: "posterior", w: 0.36, h: 0.46, d: 0.36 }, // 1st premolar
  { kind: "posterior", w: 0.36, h: 0.44, d: 0.36 }, // 2nd premolar
  { kind: "posterior", w: 0.46, h: 0.44, d: 0.42 }, // 1st molar
];

// A full upper arch, midline-symmetric. Each entry gets an along-arch arc-length
// position (its centre), so teeth sit edge-to-edge with realistic contact.
function buildArch() {
  const seq: ArchTooth[] = [
    ...[...HALF_ARCH].reverse(),
    ...HALF_ARCH,
  ];
  // cumulative arc-length centres (contact point to contact point)
  const gap = 0.012; // a hair of interproximal space
  const centres: number[] = [];
  let s = 0;
  for (let i = 0; i < seq.length; i++) {
    if (i === 0) s = seq[i].w / 2;
    else s += seq[i - 1].w / 2 + gap + seq[i].w / 2;
    centres.push(s);
  }
  const total = centres[centres.length - 1] + seq[seq.length - 1].w / 2;
  // centre the whole run around 0
  const mid = total / 2;
  return { seq, centres: centres.map((c) => c - mid), span: total };
}

// Map an arc-length position `u` (centred, −span/2..span/2) to a point + outward
// normal on a parabolic dental arch. The parabola opens toward the viewer (+Z),
// so the labial faces point outward and slightly forward, like a real arch.
function archPoint(u: number, span: number) {
  // normalised across the arch, −1..1
  const t = (u / (span / 2));
  const x = t * 1.75;                    // half-width of the arch in scene units
  const z = 1.15 - Math.pow(t, 2) * 1.7; // parabola: front teeth forward (+z)
  // outward normal = derivative-perpendicular of the parabola, pointing out/front
  const dz = -2 * t * 1.7 / (span / 2);  // dz/du
  const dx = 1.75 / (span / 2);          // dx/du
  const n = new THREE.Vector3(dz, 0, -dx).normalize(); // rotate tangent −90° → outward
  if (n.z < 0) n.negate();
  return { pos: new THREE.Vector3(x, 0, z), normal: n };
}

export function OrthoScene(_: { quality: number }) {
  const root = useRef<THREE.Group>(null);
  const arch = useRef<THREE.Group>(null);
  const teethRefs = useRef<(THREE.Group | null)[]>([]);

  // realistic translucent enamel + polished bracket/wire steel
  const enamel = useMemo(() => makeRealisticEnamel("#f1e9d9"), []);
  const bracketMat = useMemo(() => new THREE.MeshStandardMaterial({ ...braceMetal }), []);

  // the arch layout + per-tooth anatomical geometry (built once)
  const { seq, centres, span } = useMemo(() => buildArch(), []);
  const teeth = useMemo(
    () =>
      seq.map((t, i) => {
        const geom = makeAnatomicTooth(t.kind, t.w, t.h, t.d);
        const { pos, normal } = archPoint(centres[i], span);
        // seat the tooth on the arch, its labial face along the outward normal
        const quat = new THREE.Quaternion().setFromRotationMatrix(
          new THREE.Matrix4().makeBasis(
            new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), normal).normalize(),
            new THREE.Vector3(0, 1, 0),
            normal.clone()
          )
        );
        // the labial surface sits at +depth/2 along the normal from the tooth
        // centre; the bracket bonds there, the slot a touch further out
        const bracketLocalZ = t.d / 2; // tooth is centred; front face at +z locally
        return { geom, pos, quat, normal, w: t.w, h: t.h, bracketLocalZ };
      }),
    [seq, centres, span]
  );

  // one realistic twin bracket, cloned per tooth (shared geometry + material)
  const bracketProto = useMemo(() => makeBracket(bracketMat), [bracketMat]);
  const bracketInstances = useMemo(
    () => teeth.map(() => bracketProto.clone()),
    [teeth, bracketProto]
  );

  // a small per-tooth malocclusion (offset + tilt) that eases to a perfect arch
  const jitter = useMemo(
    () =>
      teeth.map((_, i) => {
        const r = (n: number) => {
          const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
          return x - Math.floor(x);
        };
        return {
          dz: (r(1) - 0.5) * 0.1,
          dx: (r(2) - 0.5) * 0.08,
          dy: (r(3) - 0.5) * 0.05,
          rot: (r(4) - 0.5) * 0.2,
        };
      }),
    [teeth]
  );

  // The archwire is a real, updatable tube: we build its topology ONCE, then
  // rewrite its vertex positions each frame so it always threads through the
  // live bracket slots — following the arch exactly as the teeth settle, with
  // zero per-frame allocation. Each bracket is a CHILD of its tooth, so it is
  // physically bonded and can never float; the wire simply tracks the slots.
  const WIRE_SEGS = 180;
  const WIRE_RADIAL = 10;
  const wire = useMemo(() => {
    // a straight seed tube; positions are overwritten every frame
    const seed = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(1, 0, 0),
    ]);
    const geom = new THREE.TubeGeometry(seed, WIRE_SEGS, 0.008, WIRE_RADIAL, false);
    return geom;
  }, []);
  const wireRef = useRef<THREE.Mesh>(null);

  // scratch objects reused each frame (no allocation in the loop)
  const scratch = useMemo(
    () => ({
      slots: teeth.map(() => new THREE.Vector3()),
      local: new THREE.Vector3(),
      curve: new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3()], false, "catmullrom", 0.5),
      p0: new THREE.Vector3(),
      tan: new THREE.Vector3(),
      nrm: new THREE.Vector3(),
      bnm: new THREE.Vector3(),
      up: new THREE.Vector3(0, 1, 0),
    }),
    [teeth]
  );

  // per-bracket refs so the "bond on" scale can pop each bracket in
  const bracketRefs = useRef<(THREE.Group | null)[]>([]);

  useFrame((_, dt) => {
    const p = craftProgress.ortho;
    if (root.current) root.current.rotation.y = damp(root.current.rotation.y, -0.2 + p * 0.34, 3, dt);

    // ——— the correction story ———
    // brackets bond on early; then a per-tooth malocclusion resolves to a
    // perfectly even arch. Each bracket is a CHILD of its tooth, so it stays
    // bonded to the enamel and rides every movement — nothing ever floats.
    const on = smooth(p, 0.08, 0.32);
    const corrected = smooth(p, 0.3, 0.95); // 0 = crooked · 1 = aligned
    const off = 1 - corrected;

    // apply the resolving malocclusion to each tooth; its bonded bracket + the
    // live slot point ride along automatically
    teeth.forEach((t, i) => {
      const g = teethRefs.current[i];
      if (!g) return;
      const j = jitter[i];
      g.position.copy(t.pos).addScaledVector(t.normal, j.dz * off);
      g.position.x += j.dx * off;
      g.position.y += j.dy * off;
      // roll the tooth a touch off-true, easing to a clean arch
      g.quaternion.copy(t.quat);
      g.rotateZ(j.rot * off);

      // bond the bracket on (scale-in), staying attached to the tooth's face
      const b = bracketRefs.current[i];
      if (b) {
        b.scale.setScalar(on);
        b.visible = p > 0.04;
      }

      // the tooth's live labial slot point, in the tooth's own frame projected
      // to the arch frame — where the wire must pass
      scratch.local.set(0, BRACKET_SLOT_Y + 0.02, t.bracketLocalZ + BRACKET_SLOT_Z);
      scratch.slots[i].copy(scratch.local).applyQuaternion(g.quaternion).add(g.position);
    });

    // rewrite the wire tube through the live slot points, in place
    if (wireRef.current) {
      const show = p > 0.06;
      wireRef.current.visible = show;
      if (show) updateTube(wire, scratch.slots, WIRE_SEGS, WIRE_RADIAL, 0.008, scratch);
    }
  });

  return (
    <group ref={root} position={[0, 0.05, 0]}>
      <group ref={arch}>
        {/* the procedural dentition — individual anatomical teeth on the arch,
            each carrying its own bonded bracket as a direct child */}
        {teeth.map((t, i) => (
          <group
            key={i}
            ref={(el) => void (teethRefs.current[i] = el)}
            position={t.pos}
            quaternion={t.quat}
          >
            <mesh geometry={t.geom} material={enamel} />
            {/* the bracket bonded to THIS tooth's labial face (+Z) — a child of
                the tooth group, so it is physically attached and never floats */}
            <group
              ref={(el) => void (bracketRefs.current[i] = el)}
              position={[0, 0, t.bracketLocalZ]}
            >
              <primitive object={bracketInstances[i]} />
              <mesh position={[0, BRACKET_SLOT_Y, BRACKET_SLOT_Z]}>
                <boxGeometry args={[0.03, 0.01, 0.012]} />
                <meshStandardMaterial color={GOLD} metalness={1} roughness={0.28} envMapIntensity={1.7} />
              </mesh>
            </group>
          </group>
        ))}

        {/* the archwire — one continuous polished tube, rewritten each frame to
            thread every live bracket slot, so it always follows the arch */}
        <mesh ref={wireRef} geometry={wire} visible={false}>
          <meshStandardMaterial {...braceMetal} />
        </mesh>
      </group>
      <Ground y={-1.2} />
    </group>
  );
}

/** Rewrite a tube geometry's vertices in place to follow a poly-line of points
    (a Catmull-Rom through them), with a fixed radius. No allocation per call. */
function updateTube(
  geom: THREE.TubeGeometry,
  points: THREE.Vector3[],
  segs: number,
  radial: number,
  radius: number,
  s: { curve: THREE.CatmullRomCurve3; p0: THREE.Vector3; tan: THREE.Vector3; nrm: THREE.Vector3; bnm: THREE.Vector3; up: THREE.Vector3 }
) {
  s.curve.points = points;
  const pos = geom.attributes.position as THREE.BufferAttribute;
  const nor = geom.attributes.normal as THREE.BufferAttribute;
  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    s.curve.getPoint(u, s.p0);
    s.curve.getTangent(u, s.tan).normalize();
    // a stable frame: normal = up × tangent, binormal = tangent × normal
    s.nrm.crossVectors(s.up, s.tan);
    if (s.nrm.lengthSq() < 1e-6) s.nrm.set(1, 0, 0);
    s.nrm.normalize();
    s.bnm.crossVectors(s.tan, s.nrm).normalize();
    for (let j = 0; j <= radial; j++) {
      const v = (j / radial) * Math.PI * 2;
      const cx = Math.cos(v);
      const sy = Math.sin(v);
      const idx = i * (radial + 1) + j;
      const nx = cx * s.nrm.x + sy * s.bnm.x;
      const ny = cx * s.nrm.y + sy * s.bnm.y;
      const nz = cx * s.nrm.z + sy * s.bnm.z;
      pos.setXYZ(idx, s.p0.x + nx * radius, s.p0.y + ny * radius, s.p0.z + nz * radius);
      nor.setXYZ(idx, nx, ny, nz);
    }
  }
  pos.needsUpdate = true;
  nor.needsUpdate = true;
  geom.computeBoundingSphere();
}

/* ————— 06 · Whitening — enamel brightens, naturally ————— */

export function WhiteningScene(_: { quality: number }) {
  const root = useRef<THREE.Group>(null);
  const bar = useRef<THREE.Mesh>(null);
  const barLight = useRef<THREE.PointLight>(null);
  const enamel = useMemo(() => makeEnamel("#e0cfad"), []);
  const warm = useMemo(() => new THREE.Color("#e0cfad"), []);
  const bright = useMemo(() => new THREE.Color("#f4efe2"), []);

  useFrame((state, dt) => {
    const p = craftProgress.whitening;
    if (root.current) root.current.rotation.y = damp(root.current.rotation.y, 0.15 + p * 0.3 + state.pointer.x * 0.08, 3, dt);
    // brighten naturally — never over-white
    const glow = smooth(p, 0.12, 0.85);
    enamel.color.copy(warm).lerp(bright, glow);
    const sweep = Math.sin(state.clock.elapsedTime * 0.7);
    if (bar.current) {
      bar.current.position.x = sweep * 1.5;
      (bar.current.material as THREE.MeshBasicMaterial).opacity = 0.3 + glow * 0.55;
    }
    if (barLight.current) {
      barLight.current.position.x = sweep * 1.5;
      barLight.current.intensity = 1.2 + glow * 3.4;
    }
  });

  return (
    <group ref={root} position={[0, -0.1, 0]}>
      <SingleTooth target={2.05} rotation={TOOTH_ROT} enamel={enamel} />
      {/* the whitening light passing across */}
      <mesh ref={bar} position={[0, 0.1, 1.2]}>
        <boxGeometry args={[0.05, 2.1, 0.05]} />
        <meshBasicMaterial color="#ffe9c2" transparent opacity={0.4} />
      </mesh>
      <pointLight ref={barLight} position={[0, 0.1, 1.3]} intensity={2} color="#fff3dd" distance={5} />
      <Ground y={-1.7} />
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
