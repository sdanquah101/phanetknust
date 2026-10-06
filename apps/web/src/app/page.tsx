import { Blobs, Button, Logo, Script } from "@phanet/ui";
import { getSession } from "@phanet/supabase/server";

export default async function Home() {
  const session = await getSession();
  return (
    <main className="ground-blue min-h-dvh">
      <Blobs />
      <div className="container-page py-10">
        <Logo />
        <h1 className="h3d text-6xl mt-10">Let No Man <Script peach>Youth</Script></h1>
        <Button className="mt-6">Join a prayer cell</Button>
        <p>{session ? "in" : "out"}</p>
      </div>
    </main>
  );
}
