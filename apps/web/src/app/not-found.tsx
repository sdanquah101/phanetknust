import Link from "next/link";
import { Blobs, Logo, Script } from "@phanet/ui";

export default function NotFound() {
  return (
    <main className="ground-blue min-h-dvh grid place-items-center">
      <Blobs />
      <div className="text-center flex flex-col items-center gap-6 px-6">
        <Logo />
        <h1 className="h3d t-h1">Lost, but <Script peach>found</Script></h1>
        <p className="text-white max-w-sm">That page isn't here. Let's get you back to the altar.</p>
        <Link href="/" className="btn btn-white">Go home</Link>
      </div>
    </main>
  );
}
