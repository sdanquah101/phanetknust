import { getSocials } from "@/lib/queries";

export async function SiteFooter() {
  const socials = await getSocials();
  const links: { href: string; label: string }[] = [
    { href: "https://phaneteers.com", label: "phaneteers.com" },
    ...(socials.instagram ? [{ href: socials.instagram, label: "Instagram" }] : []),
    ...(socials.youtube ? [{ href: socials.youtube, label: "YouTube" }] : []),
  ];
  return (
    <footer className="container-page relative z-10 mt-auto">
      <div className="py-8 flex flex-wrap items-center justify-between gap-4 text-xs text-white/85 border-t border-white/15">
        <a href="https://phaneteers.com" className="inline-flex items-center gap-3 no-underline">
          <span className="dot-orange" aria-hidden />
          <span className="wordmark text-white">PHANET KNUST</span>
        </a>
        <nav className="flex flex-wrap gap-5" aria-label="Links">
          {links.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="hover:text-white">
              {l.label}
            </a>
          ))}
        </nav>
        <span>Kumasi, Ghana · {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
