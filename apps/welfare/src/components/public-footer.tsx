import { Footer } from "@phanet/ui";
import { BRAND } from "@/lib/brand";

export function WelfareFooter() {
  return (
    <Footer
      brand={BRAND}
      links={[
        { href: "/", label: "Shop" },
        { href: "/track", label: "Track a request" },
        { href: "/team", label: "Team login" },
      ]}
      note="Take what you need — no questions asked."
    />
  );
}
