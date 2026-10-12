import * as React from "react";
import { KenteCloth, KenteGround } from "./kente";

/** Dark woven ground for a `.ground-blue` section: kente cloth under a soft shade. */
export function Fluid({ seed = 0 }: { seed?: number }) {
  return <KenteGround seed={61 + seed} />;
}

/** Full-width band of kente, used where the flyer design had its orange "stage" disc. */
export function StageDisc({ className = "" }: { className?: string }) {
  return <KenteCloth seed={7} stripWidth={72} className={`kente-band ${className}`} />;
}
