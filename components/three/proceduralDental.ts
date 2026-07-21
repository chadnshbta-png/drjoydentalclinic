"use client";

import * as THREE from "three";

/**
 * Procedural dental hardware — built entirely in Three.js, no external assets.
 *
 * Two families of geometry live here:
 *   • the implant restoration (titanium fixture · abutment · ceramic crown)
 *   • the orthodontic appliance (bracket · archwire helpers)
 *
 * Everything is authored at a realistic relative scale (a real maxillary
 * central incisor implant is ~13 mm fixture + ~10 mm crown), then the scene
 * places the whole assembly. Geometry is returned from pure factory functions
 * so a scene can `useMemo` them once and dispose is handled by R3F on unmount.
 */

const V = (x: number, y: number) => new THREE.Vector2(x, y);

/* ============================================================= *
 *  IMPLANT — realistic root-form fixture, abutment, ceramic crown
 * ============================================================= *
 *  Axis convention: +Y is coronal (up, toward the crown), the apex points
 *  down (−Y). Origin of each part is its own connection datum so the scene can
 *  stack them: fixture platform at y=0, abutment sits on it, crown seats over.
 */

/**
 * Titanium fixture — a tapered root-form screw with a real helical thread
 * wound down the body, a smooth machined collar at the platform, and a rounded
 * apex. The core is a LatheGeometry (the solid body) and the thread is a single
 * TubeGeometry following a tapering helix, so it reads as a genuine implant
 * screw rather than a stack of tori.
 */
export function makeImplantFixture(
  length = 1.3,
  topR = 0.19,
  material?: THREE.Material
) {
  const group = new THREE.Group();
  const mat = material ?? new THREE.MeshStandardMaterial({ color: "#c2beb5", metalness: 1, roughness: 0.3 });

  // — the solid tapered body, as a lathed profile —
  // profile is (radius, y): platform collar → tapered body → rounded apex
  const apexY = -length;
  const bodyR = topR * 0.92;
  const profile: THREE.Vector2[] = [
    V(0.0, 0.02),               // top centre (platform face)
    V(topR * 0.62, 0.02),       // inner platform seat
    V(topR, -0.005),            // platform outer edge (a crisp machined lip)
    V(topR, -0.06),             // straight collar (the smooth, thread-free neck)
    V(bodyR * 0.98, -0.14),
    V(bodyR * 0.86, -length * 0.45),
    V(bodyR * 0.66, -length * 0.78),
    V(bodyR * 0.42, -length * 0.93),
    V(bodyR * 0.2, apexY + 0.03), // rounded apex shoulder
    V(0.0, apexY),               // apex tip on the axis
  ];
  const bodyGeom = new THREE.LatheGeometry(profile, 64);
  bodyGeom.computeVertexNormals();
  group.add(new THREE.Mesh(bodyGeom, mat));

  // — the helical thread —
  // a tapering helix from just below the collar to near the apex; radius tracks
  // the body taper so the thread crest sits proud of the core by a constant bite
  const turns = 9;
  const startY = -0.1;
  const endY = apexY + 0.12;
  const steps = turns * 40;
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= steps; i++) {
    const f = i / steps; // 0 at collar → 1 near apex
    const y = THREE.MathUtils.lerp(startY, endY, f);
    // body radius at this height (matches the lathe taper), plus a thread bite
    const coreR = THREE.MathUtils.lerp(topR * 0.98, bodyR * 0.3, f);
    const r = coreR + 0.028;
    const ang = f * turns * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(ang) * r, y, Math.sin(ang) * r));
  }
  const helix = new THREE.CatmullRomCurve3(pts);
  const threadGeom = new THREE.TubeGeometry(helix, steps, 0.024, 8, false);
  group.add(new THREE.Mesh(threadGeom, mat));

  return group;
}

/**
 * Abutment — the machined titanium connector torqued into the fixture. An
 * anatomic emergence profile (narrow at the gingival margin, flaring to support
 * the crown), a chamfered finish line, and a slightly tapered post the crown
 * cements onto. Origin at its base (seats on the fixture platform at y=0).
 */
export function makeAbutment(height = 0.62, baseR = 0.17) {
  const profile: THREE.Vector2[] = [
    V(0.0, 0.0),
    V(baseR, 0.0),               // base, matching the fixture platform
    V(baseR * 0.96, 0.06),       // a short collar
    V(baseR * 1.02, 0.12),       // emergence flare (widest, the finish line)
    V(baseR * 0.82, 0.16),       // chamfered margin — where the crown edge sits
    V(baseR * 0.64, height * 0.5),
    V(baseR * 0.5, height * 0.82),
    V(baseR * 0.42, height * 0.94),
    V(baseR * 0.28, height),     // rounded top of the prep
    V(0.0, height),
  ];
  const geom = new THREE.LatheGeometry(profile, 48);
  // flatten the prep front-to-back to match the crown's labio-lingual flatten,
  // so the ceramic crown fully envelops the abutment above the finish line and
  // no metal shows through on the Z faces — the join closes with zero gap.
  // Only the coronal part (above the emergence flare) is flattened; the base
  // that meets the round fixture platform stays round.
  const pos = geom.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y > 0.12) {
      const k = THREE.MathUtils.clamp((y - 0.12) / 0.06, 0, 1);
      // flatten a touch MORE than the crown (0.55 vs the crown's 0.62) so the
      // ceramic clears the prep in Z with a little wall thickness to spare — the
      // crown fully envelops the abutment and no metal shows on the Z faces
      const zScale = THREE.MathUtils.lerp(1, 0.55, k);
      pos.setZ(i, pos.getZ(i) * zScale);
    }
  }
  pos.needsUpdate = true;
  geom.computeVertexNormals();
  return geom;
}

/**
 * Ceramic crown — a natural maxillary central-incisor silhouette. Built by
 * lathing an incisor profile (rounded incisal edge, subtle cervical bulge) and
 * then flattening it slightly labio-lingually so it isn't a solid of revolution
 * but reads as a real tooth. The underside is hollow (see makeCrownInner) so it
 * seats over the abutment with zero gap. Origin at the crown's cervical margin
 * (its base), so placing it at the abutment's finish-line Y makes it flush.
 */
export function makeCrown(height = 1.0, r = 0.2, cervicalR = 0.163) {
  // incisor side-profile radius as we go from cervical (base) to incisal (tip).
  // The cervical opening is set to the abutment finish-line radius so the crown
  // margin closes flush onto metal with NO visible gap, then bulges to the
  // fullest contour just above.
  const profile: THREE.Vector2[] = [
    V(cervicalR, 0.0),           // cervical margin (meets the abutment finish line)
    V(Math.max(cervicalR, r * 0.98), 0.12), // cervical bulge (fullest contour)
    V(r * 1.0, 0.3),
    V(r * 0.98, height * 0.55),
    V(r * 0.9, height * 0.78),
    V(r * 0.74, height * 0.92),
    V(r * 0.46, height * 0.99),  // rounded incisal edge
    V(0.0, height),
  ];
  const geom = new THREE.LatheGeometry(profile, 48);
  // flatten front-to-back so it's tooth-shaped, not a bead
  geom.scale(1, 1, 0.62);
  geom.computeVertexNormals();
  return geom;
}

/* ============================================================= *
 *  ORTHODONTICS — realistic bracket + tie wings
 * ============================================================= *
 *  A single bracket returned as a group, authored facing +Z (its bonded base
 *  on the −Z side) so a scene can orient it to a tooth's surface normal. Real
 *  twin brackets: a bonding pad, a body, two pairs of tie wings and a
 *  horizontal archwire slot between them.
 */

export function makeBracket(material?: THREE.Material) {
  const group = new THREE.Group();
  const mat = material ?? new THREE.MeshStandardMaterial({ color: "#dcd6c8", metalness: 1, roughness: 0.13 });

  // bonding pad — a slightly curved thin plate that meshes to the enamel
  const pad = new THREE.BoxGeometry(0.07, 0.078, 0.012);
  const padMesh = new THREE.Mesh(pad, mat);
  padMesh.position.z = 0.006;
  group.add(padMesh);

  // body — the raised block that carries the slot, set just off the pad
  const body = new THREE.BoxGeometry(0.056, 0.06, 0.03);
  const bodyMesh = new THREE.Mesh(body, mat);
  bodyMesh.position.z = 0.027;
  group.add(bodyMesh);

  // four tie wings (twin bracket) — small nibs at the corners
  const wing = new THREE.BoxGeometry(0.016, 0.02, 0.026);
  const wx = 0.026;
  const wy = 0.026;
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const w = new THREE.Mesh(wing, mat);
      w.position.set(sx * wx, sy * wy, 0.03);
      group.add(w);
    }
  }

  return group;
}

/**
 * The horizontal slot depth (Z) where the archwire rides on a bracket, relative
 * to the bracket's local origin. The scene uses this to thread the wire through
 * every bracket at the same relative height.
 */
export const BRACKET_SLOT_Z = 0.03;
export const BRACKET_SLOT_Y = 0.0;
