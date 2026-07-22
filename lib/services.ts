import fs from "node:fs";
import path from "node:path";

/**
 * Data-driven service loader for Chapter III · The Craft.
 *
 * Scans `public/services/` at request/build time and returns one entry per
 * folder that contains a before/after image pair. Filenames are resolved by
 * PATTERN, not hardcoded, because the source folders are inconsistent
 * (`befor (1).webp`, `after.webp`, `after (1).webp`, …). Any future folder
 * dropped into `public/services/` appears automatically with no code change.
 *
 * Editorial copy (title/description/cta) is looked up from an optional map by
 * folder name; unknown folders fall back to a sensible default so the section
 * never breaks when a new service is added.
 */

export type Service = {
  /** folder name, used as stable key + fallback title */
  slug: string;
  title: string;
  description: string;
  cta: string;
  /** public URLs (encoded) for the aligned image layers */
  before: string;
  after: string;
};

// Premium, minimal editorial copy per known folder. Anything not listed here
// still renders, using the folder name as the title.
const COPY: Record<
  string,
  { title: string; description: string; cta: string }
> = {
  "Invisible Orthodontics": {
    title: "Invisible Orthodontics",
    description:
      "Clear aligners, engineered digitally — a discreet path to a naturally even smile.",
    cta: "Explore aligners",
  },
  Implantology: {
    title: "Implantology",
    description:
      "Titanium foundations placed with surgical precision, restoring a tooth as if it were never lost.",
    cta: "Explore implants",
  },
  "Veneers & Smile Design": {
    title: "Veneers & Smile Design",
    description:
      "Hand-layered porcelain, designed to your face — light, proportion and character in perfect balance.",
    cta: "Design a smile",
  },
  "Digital Dentistry": {
    title: "Digital Dentistry",
    description:
      "Every treatment planned in a precise digital twin before it ever begins.",
    cta: "See the process",
  },
  Orthodontics: {
    title: "Orthodontics",
    description:
      "Considered tooth movement that brings the whole bite into lasting harmony.",
    cta: "Explore orthodontics",
  },
};

function titleCaseFromSlug(slug: string) {
  return slug;
}

/** Pick the file in `files` whose name matches any of `patterns` (first wins). */
function pick(files: string[], patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const hit = files.find((f) => re.test(f));
    if (hit) return hit;
  }
  return null;
}

const IMAGE_RE = /\.(webp|png|jpe?g|avif)$/i;

// Curated, editorially sensible order; unknown folders fall after, alphabetical.
const ORDER = [
  "Invisible Orthodontics",
  "Implantology",
  "Veneers & Smile Design",
  "Digital Dentistry",
  "Orthodontics",
];

/**
 * Scan one public sub-directory of before/after treatment folders and return an
 * aligned Service[] . Shared by the Services showcase and the Personal
 * Consultation section, which use the same on-disk layout under different
 * folders — so the pattern-matching/encoding logic lives in exactly one place.
 *
 * @param dirName folder under /public (e.g. "services")
 */
export function loadPairs(dirName: string): Service[] {
  const dir = path.join(process.cwd(), "public", dirName);
  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const services: Service[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const slug = entry.name;
    const folder = path.join(dir, slug);

    let files: string[] = [];
    try {
      files = fs.readdirSync(folder).filter((f) => IMAGE_RE.test(f));
    } catch {
      continue;
    }
    if (!files.length) continue;

    // Resolve by pattern: "befor..." = before, "after..." = after.
    const beforeFile = pick(files, [/^befor/i, /before/i]);
    const afterFile = pick(files, [/^after/i, /after/i]);

    // Need a genuine pair to build the reveal.
    if (!beforeFile || !afterFile || beforeFile === afterFile) continue;

    const copy = COPY[slug] ?? {
      title: titleCaseFromSlug(slug),
      description: "A signature treatment, crafted at Dr Joy.",
      cta: "Discover",
    };

    // Encode each path segment so spaces/parentheses in filenames are valid URLs.
    const enc = (file: string) =>
      `/${dirName.split("/").map(encodeURIComponent).join("/")}/${encodeURIComponent(
        slug
      )}/${encodeURIComponent(file)}`;

    services.push({
      slug,
      title: copy.title,
      description: copy.description,
      cta: copy.cta,
      before: enc(beforeFile),
      after: enc(afterFile),
    });
  }

  services.sort((a, b) => {
    const ia = ORDER.indexOf(a.slug);
    const ib = ORDER.indexOf(b.slug);
    if (ia === -1 && ib === -1) return a.slug.localeCompare(b.slug);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  return services;
}

/** Chapter III · The Craft — the public/services showcase pairs. */
export function loadServices(): Service[] {
  return loadPairs("services");
}

/**
 * Personal Consultation pairs (public/A Personal Consultation), keyed by slug so
 * the section can look one up instantly by the selected treatment.
 */
export function loadConsultationPairs(): Record<string, Service> {
  const map: Record<string, Service> = {};
  for (const s of loadPairs("A Personal Consultation")) map[s.slug] = s;
  return map;
}
