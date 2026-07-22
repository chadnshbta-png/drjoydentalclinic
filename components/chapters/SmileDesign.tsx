import { loadConsultationPairs } from "@/lib/services";
import SmileDesignClient from "./SmileDesignClient";

/**
 * "A Personal Consultation" chapter.
 *
 * Server component: reads the before/after treatment pairs from
 * public/A Personal Consultation at request/build time (same data-driven loader
 * as the Services showcase) and hands them to the client consultation UI, which
 * owns the guided steps and the Before→After crossfade.
 */
export default function SmileDesign() {
  const pairs = loadConsultationPairs();
  return <SmileDesignClient pairs={pairs} />;
}
