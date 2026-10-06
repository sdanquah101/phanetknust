import { Script } from "@phanet/ui";

/** CSS rendition of the theme flyer: used as hero artwork until the real artwork is uploaded as /public/flyer.png */
export function ThemePoster({ year, reference, className = "" }: { year: string; reference: string; className?: string }) {
  return (
    <div className={`relative isolate overflow-hidden rounded-[36px] bg-gradient-to-b from-[#2B6BFF] via-royal to-deep shadow-card-blue aspect-[4/5] ${className}`}>
      <div className="blob blob-sky" style={{ width: 300, height: 300, top: -80, right: -80, opacity: 0.8 }} />
      <div className="blob blob-deep" style={{ width: 260, height: 260, bottom: 120, left: -90 }} />
      <div className="absolute inset-x-0 top-0 p-6 md:p-8 text-center text-white">
        <div className="wordmark text-[11px] text-white/90">PHANET KNUST</div>
        <div className="mt-3 text-[15px] font-extrabold tracking-wide uppercase text-peach">{year} Theme of the Year</div>
        <div className="mt-5 h3d text-[32px] md:text-[38px] leading-[0.95]">Let No Man</div>
        <div className="h3d text-[38px] md:text-[46px] leading-[1.05]"><Script>Despise Thy</Script></div>
        <div className="h3d text-[48px] md:text-[58px] leading-[0.95] -mt-1"><Script>Youth</Script></div>
        <div className="mt-4 md:mt-6 inline-flex verse-badge text-[11px]">{reference}</div>
      </div>
      {/* the stage */}
      <div className="absolute -bottom-[18%] -left-[15%] -right-[15%] h-[40%] rounded-[50%]" style={{ background: "radial-gradient(60% 80% at 50% 30%, #FFC98F 0%, #FF8A1F 50%, #FF4D00 100%)", boxShadow: "inset 0 14px 0 rgba(255,255,255,.5), 0 -30px 80px rgba(255,77,0,.5)" }} />
      <div className="absolute bottom-[8%] left-0 right-0 flex justify-center gap-3">
        {["#FFB36B", "#FFFFFF", "#7FB2FF"].map((c, i) => (
          <span key={i} className="block w-[13%] aspect-[7/12] rounded-[22px]" style={{ background: c, opacity: 0.9, transform: `translateY(${i === 1 ? -10 : 0}px)` }} />
        ))}
      </div>
    </div>
  );
}
