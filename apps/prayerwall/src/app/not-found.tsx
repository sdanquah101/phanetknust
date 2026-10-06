import { ButtonLink, EmptyState } from "@phanet/ui";
import { Shell } from "@/components/Shell";

export default function NotFound() {
  return (
    <Shell>
      <section className="max-w-xl mx-auto w-full">
        <EmptyState title="That page isn't on the wall" body="Head back and keep praying with us." action={<ButtonLink href="/">Back to the wall</ButtonLink>} />
      </section>
    </Shell>
  );
}
