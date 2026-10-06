import { ButtonLink, EmptyState, PageHeader } from "@phanet/ui";

export default function NotFound() {
  return (
    <>
      <PageHeader eyebrow="Hmm" title="Not" script="found" />
      <EmptyState title="That page isn't here" body="It may belong to another leader, or the link is old." action={<ButtonLink href="/" size="sm">Back home</ButtonLink>} />
    </>
  );
}
