"use client";

import { useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { craftProgress } from "./progress";
import {
  Dentition,
  SingleTooth,
  useDentition,
  makeEnamel,
  makeGlass,
  makeCeramic,
} from "./dentalModels";

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

/* ————— 02 · Implantology — a real single-tooth implant restoration seats —————
   Not an exploded diagram: the titanium fixture is already placed in the bone
   and the abutment is already torqued onto it — one fixed, assembled base. The
   ceramic crown begins a little above the abutment, then travels straight down
   the implant axis and seats precisely onto it, closing every gap, and finishes
   with a tiny locking settle. The viewer reads it immediately as "the tooth was
   installed onto the implant." No floating parts, no intersections, no crown
   left hovering. */

export function ImplantScene(_: { quality: number }) {
  const root = useRef<THREE.Group>(null);
  const crown = useRef<THREE.Group>(null);
  const enamel = useMemo(() => makeEnamel(), []);

  // Fine, evenly-pitched threads down a tapered fixture body — reads as a real
  // implant screw rather than a stack of primitives.
  const threads = useMemo(
    () => Array.from({ length: 7 }, (_, i) => ({ y: 0.12 - i * 0.088, r: lerp(0.125, 0.052, i / 6) })),
    []
  );

  // ——— the seating axis, in fixed local units ———
  // The abutment sits atop the fixture; its collar top (where the crown's inner
  // margin meets metal) is at CROWN_SEAT. The crown's own model origin sits a
  // little below its base, so the seated crown group rests at CROWN_SEAT and the
  // ceramic wraps down over the abutment with no visible gap.
  // 0.62 is the crown-group Y at which the ceramic base already meets the
  // abutment collar with no gap — the exact seated position the assembled view
  // resolved to. We keep that as the target so "seated" means truly flush.
  const CROWN_SEAT = 0.62;  // crown group Y when fully, precisely seated
  const CROWN_LIFT = 0.34;  // "slightly above" — a short, believable approach

  useFrame((state, dt) => {
    const p = craftProgress.implant;

    // one slow, engineered quarter-turn across the whole vignette + gentle cursor
    // lean, so the seat is seen from a subtly shifting angle (never a full spin)
    if (root.current)
      root.current.rotation.y = damp(root.current.rotation.y, -0.42 + p * 0.42 + state.pointer.x * 0.05, 3, dt);

    if (crown.current) {
      // approach (0.1 → 0.72): the crown descends from just above the abutment
      // and closes the gap completely — easing out so it decelerates into the
      // seat exactly like a component being placed by hand.
      const approach = smooth(p, 0.1, 0.72);
      let y = lerp(CROWN_SEAT + CROWN_LIFT, CROWN_SEAT, approach);

      // locking settle (0.78 → 1): once seated, one tiny downward press-and-rest
      // — a couple of hundredths of a unit — that reads as the crown clicking
      // fully home onto the abutment. It never lifts back above the seat.
      const lock = smooth(p, 0.78, 1);
      y -= Math.sin(lock * Math.PI) * 0.028;

      crown.current.position.y = y;
    }
  });

  return (
    <group ref={root} position={[0, -0.1, 0]}>
      {/* the ceramic crown — the single tooth itself, the only travelling part */}
      <group ref={crown}>
        <SingleTooth target={1.7} rotation={TOOTH_ROT} enamel={enamel} />
      </group>

      {/* the abutment — already torqued onto the fixture, waiting for the crown */}
      <group position={[0, 0.16, 0]}>
        <mesh>
          <cylinderGeometry args={[0.11, 0.145, 0.3, 32]} />
          <meshStandardMaterial {...abutment} />
        </mesh>
        {/* a subtle chamfer where the crown seats, so the join looks machined */}
        <mesh position={[0, 0.16, 0]}>
          <cylinderGeometry args={[0.075, 0.11, 0.06, 32]} />
          <meshStandardMaterial {...abutment} />
        </mesh>
      </group>

      {/* the titanium fixture — tapered body, smooth apex, fine threads */}
      <group position={[0, -0.28, 0]}>
        {/* tapered screw body */}
        <mesh position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.135, 0.058, 0.62, 32]} />
          <meshStandardMaterial {...titanium} />
        </mesh>
        {/* smooth conical apex — no hard primitive edge at the tip */}
        <mesh position={[0, -0.4, 0]}>
          <coneGeometry args={[0.058, 0.14, 32]} />
          <meshStandardMaterial {...titanium} />
        </mesh>
        {/* the platform the abutment mounts onto */}
        <mesh position={[0, 0.27, 0]}>
          <cylinderGeometry args={[0.13, 0.135, 0.08, 32]} />
          <meshStandardMaterial {...abutment} />
        </mesh>
        {threads.map((t, i) => (
          <mesh key={i} position={[0, t.y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[t.r, 0.02, 12, 48]} />
            <meshStandardMaterial {...titanium} />
          </mesh>
        ))}
      </group>

      <Ground y={-1.6} />
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

    // its own identity — CRAFT & PRECISION: a slow, deliberate turntable
    // presentation of a single hand-made piece. The rotation eases as the shell
    // is placed, so the eye can study the fit — a jeweller turning a stone to
    // set it, not a mechanism demonstrating itself. (cursor adds a whisper only)
    const settle = smooth(p, 0.2, 0.72); // rotation slows as the veneer seats
    if (root.current) root.current.rotation.y = damp(root.current.rotation.y, state.pointer.x * 0.09, 3, dt);
    if (spin.current) spin.current.rotation.y += dt * lerp(0.26, 0.06, settle);

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

/* ————— 05 · Orthodontics — brackets and archwire, bonded onto the smile —————
   The brackets are not placed on a guessed arc — they are raycast onto the
   REAL enamel surface of human_teeth.glb, in the exact centred/scaled frame the
   Dentition renders in. Each bracket sits flush on the labial surface it hit and
   is oriented to that surface's normal, so it follows the individual tooth's
   curvature and angle with no gap. The archwire then threads through the true
   bracket points. */

// One bracket, resolved against the real teeth surface: a seat point on the
// enamel and an orientation whose +Z faces straight out along the surface
// normal (so the bracket body presses flat onto the tooth).
type BracketFit = { pos: THREE.Vector3; quat: THREE.Quaternion; normal: THREE.Vector3 };

function useBracketFits(): BracketFit[] {
  const { teeth, gums } = useDentition();
  return useMemo(() => {
    // Reproduce EXACTLY the transform <Dentition target={3.4} rotation={ARCH_ROT}>
    // applies, so our raycast frame matches what the viewer sees.
    teeth.computeBoundingBox();
    gums.computeBoundingBox();
    const box = teeth.boundingBox!.clone().union(gums.boundingBox!);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const scale = 3.4 / (Math.max(size.x, size.y, size.z) || 1);

    // Build the teeth mesh in the final normalised frame: outer group holds
    // rotation(ARCH_ROT)+scale, inner group holds the centring offset.
    const inner = new THREE.Group();
    inner.position.copy(center).multiplyScalar(-1);
    const mesh = new THREE.Mesh(teeth);
    inner.add(mesh);
    const outer = new THREE.Group();
    outer.rotation.set(ARCH_ROT[0], ARCH_ROT[1], ARCH_ROT[2]);
    outer.scale.setScalar(scale);
    outer.add(inner);
    outer.updateMatrixWorld(true);

    // The arch, now normalised, spans ~[-1.7, 1.7] in X. Fan rays across the
    // upper front teeth and shoot each one horizontally at the arch centre; the
    // first hit is the labial (front) enamel of whichever tooth is there.
    const ray = new THREE.Raycaster();
    const n = 12;
    const fits: BracketFit[] = [];
    const up = new THREE.Vector3(0, 1, 0);
    const halfWidth = 1.34; // how wide across the arch to place brackets
    // mid-labial band: try a couple of heights per angle and take the first that
    // actually lands on a crown, so no bracket is dropped near the arch edges
    const bandY = [0.34, 0.14, 0.5];

    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const x = lerp(-halfWidth, halfWidth, t);

      let hit: THREE.Intersection | undefined;
      for (const y of bandY) {
        // origin well in front of the arch at this x/height, aimed at the arch
        // centre-line so the ray meets the front face close to perpendicular
        const origin = new THREE.Vector3(x, y, 3.2);
        const target = new THREE.Vector3(x * 0.25, y, -0.4);
        const dir = target.clone().sub(origin).normalize();
        ray.set(origin, dir);
        // default raycaster returns hits sorted nearest-first, so hits[0] is the
        // labial enamel surface we want (no BVH acceleration needed for one bake)
        const hits = ray.intersectObject(mesh, false);
        if (hits.length) {
          hit = hits[0];
          break;
        }
      }
      if (!hit) continue;

      const pos = hit.point.clone();
      // surface normal in world (normalised) space; fall back to facing forward
      let normal = new THREE.Vector3(0, 0, 1);
      if (hit.face) {
        normal = hit.face.normal
          .clone()
          .applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld))
          .normalize();
      }
      // guard against a back-face or grazing hit — keep the bracket facing out
      if (normal.z < 0.05) normal.set(pos.x, 0, pos.z + 0.3).normalize();

      // orient the bracket so its +Z axis lies along the surface normal (body
      // presses flat to the enamel), keeping world-up as the reference
      const zAxis = normal.clone();
      const xAxis = new THREE.Vector3().crossVectors(up, zAxis).normalize();
      const yAxis = new THREE.Vector3().crossVectors(zAxis, xAxis).normalize();
      const m = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
      const quat = new THREE.Quaternion().setFromRotationMatrix(m);

      fits.push({ pos, quat, normal });
    }
    return fits;
  }, [teeth, gums]);
}

export function OrthoScene(_: { quality: number }) {
  const root = useRef<THREE.Group>(null);
  const arch = useRef<THREE.Group>(null);
  const braces = useRef<THREE.Group>(null);
  const enamel = useMemo(() => makeEnamel(), []);

  // brackets bonded to the true enamel surface (raycast), one per fanned angle
  const brackets = useBracketFits();

  useFrame((_, dt) => {
    const p = craftProgress.ortho;
    if (root.current) root.current.rotation.y = damp(root.current.rotation.y, -0.2 + p * 0.34, 3, dt);

    // ——— the correction story ———
    // braces bond on early; then, across the scroll, a slight imperfection in
    // the arch resolves to a perfectly even, symmetrical smile. Because the
    // brackets live INSIDE the same <arch> group as the teeth, they move,
    // tilt and settle WITH the teeth — never detaching.
    const on = smooth(p, 0.08, 0.32);
    const corrected = smooth(p, 0.3, 0.95); // 0 = crooked · 1 = aligned
    const off = 1 - corrected;

    if (braces.current) {
      braces.current.scale.setScalar(on);
      braces.current.visible = p > 0.04;
    }
    if (arch.current) {
      // a small overall irregularity that eases straight: a faint tilt + yaw,
      // reading as teeth settling into an even arch (the GLB is one mesh, so the
      // correction is told through the whole arch resolving to true)
      arch.current.rotation.z = off * 0.045;
      arch.current.rotation.y = off * 0.04;
      arch.current.position.x = off * 0.03;
    }
  });

  // archwire — a thin polished tube threading through every bracket slot,
  // sitting just proud of the enamel (each point pushed out along its own
  // surface normal) so it follows the natural curve of the dental arch
  const wireGeom = useMemo(() => {
    if (brackets.length < 2) return null;
    const pts = brackets.map((b) => b.pos.clone().addScaledVector(b.normal, 0.03));
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, 140, 0.006, 10, false);
  }, [brackets]);

  return (
    <group ref={root} position={[0, 0.1, 0]}>
      <group ref={arch}>
        <Dentition target={3.4} rotation={ARCH_ROT} enamel={enamel} />
        {/* brackets + wire live INSIDE the arch group so they inherit the same
            normalised frame the raycast used and move with the teeth exactly */}
        <group ref={braces}>
          {brackets.map((b, i) => (
            <group
              key={i}
              position={b.pos}
              quaternion={b.quat}
            >
              {/* the bracket body pressed flat onto the enamel — its +Z (thickness)
                  runs along the surface normal, so its back face bonds to the tooth */}
              <mesh position={[0, 0, 0.016]}>
                <boxGeometry args={[0.055, 0.062, 0.032]} />
                <meshStandardMaterial {...braceMetal} />
              </mesh>
              {/* a faint gold tie slot for a high-end finish */}
              <mesh position={[0, 0, 0.034]}>
                <boxGeometry args={[0.034, 0.012, 0.01]} />
                <meshStandardMaterial color={GOLD} metalness={1} roughness={0.28} envMapIntensity={1.7} />
              </mesh>
            </group>
          ))}
          {wireGeom && (
            <mesh geometry={wireGeom}>
              <meshStandardMaterial {...braceMetal} />
            </mesh>
          )}
        </group>
      </group>
      <Ground />
    </group>
  );
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
