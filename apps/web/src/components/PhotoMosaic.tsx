import Image from "next/image";
import Link from "next/link";
import { Label } from "@phanet/ui";
import { photo } from "@/content/photos";

/** Home-page photo block: one large group shot and four moments around it. */
export function PhotoMosaic() {
  const big = photo("group-indoor");
  // focal point per tile so faces stay in frame when the photo is cropped
  const small = [
    { ...photo("worship"), pos: "50% 30%" },
    { ...photo("minister-mic"), pos: "50% 35%" },
    { ...photo("friends-five"), pos: "50% 72%" },
    { ...photo("question-mic"), pos: "50% 55%" },
  ];
  return (
    <section className="ground-ice section !pt-0">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <Label tone="orange" className="mb-3">Life at PHANET</Label>
            <h2 className="t-h2 text-deep">Come as you are. Leave as family.</h2>
          </div>
          <Link href="/gallery" className="btn btn-outline-blue btn-sm">See the gallery</Link>
        </div>
        <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4 md:grid-rows-2 md:h-[560px]">
          <figure className="photo-bw col-span-2 md:row-span-2 relative rounded-[28px] aspect-[4/3] md:aspect-auto">
            <Image src={big.src} alt={big.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" priority={false} />
          </figure>
          {small.map((p) => (
            <figure key={p.src} className="photo-bw relative rounded-[22px] aspect-square md:aspect-auto">
              <Image src={p.src} alt={p.alt} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover" style={{ objectPosition: p.pos }} />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
