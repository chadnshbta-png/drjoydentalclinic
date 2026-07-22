import { loadServices } from "@/lib/services";
import CraftShowcase from "@/components/craft/CraftShowcase";

/**
 * Chapter III · The Craft.
 *
 * Server component: reads every service folder in public/services at
 * request/build time (data-driven, no hardcoding) and hands the aligned
 * before/after pairs to the client showcase, which owns the signature
 * hover-reveal interaction.
 */
export default function Craft() {
  const services = loadServices();
  return <CraftShowcase services={services} />;
}
