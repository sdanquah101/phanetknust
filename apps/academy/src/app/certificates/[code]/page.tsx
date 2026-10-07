import { Badge, ButtonLink, Card, EmptyState, Label, Script } from "@phanet/ui";
import { fmtDate } from "@phanet/supabase/format";
import { SiteShell } from "@/components/site-shell";
import { verifyCertificate } from "@/lib/queries";
import { ACADEMY_URL, CERTIFICATE_ISSUER } from "@/lib/brand";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verify certificate" };

export default async function CertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const cert = await verifyCertificate(decodeURIComponent(code));

  return (
    <SiteShell
      heroClassName="py-8 md:py-12"
      hero={
        <div className="max-w-2xl">
          <Label tone="peach">Certificate verification</Label>
          <h1 className="h3d mt-3 t-h2 leading-[1] ">{cert ? <>Verified and <Script peach className="text-[1.15em]">genuine</Script></> : <>Not <Script peach className="text-[1.15em]">found</Script></>}</h1>
        </div>
      }
    >
      <div className="pt-10 max-w-3xl">
        {cert ? (
          <Card className="card-lg p-8 md:p-10 flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="wordmark text-deep">PHANET ACADEMY</span>
              <Badge tone="mint">Valid</Badge>
            </div>
            <div>
              <Label tone="orange">Certificate of completion</Label>
              <div className="mt-2 t-h2 leading-tight">{cert.recipient_name}</div>
              <p className="mt-3 text-muted">completed the course</p>
              <div className="mt-1 text-xl font-extrabold text-royal">{cert.course_title}</div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div><Label>Issued</Label><div className="mt-1 font-bold">{fmtDate(cert.issued_at, { day: "numeric", month: "long", year: "numeric" })}</div></div>
              <div><Label>Code</Label><div className="mt-1 font-bold tracking-wider">{cert.code}</div></div>
              <div><Label>Issued by</Label><div className="mt-1 font-bold">{CERTIFICATE_ISSUER.name}</div><div className="text-xs text-muted">PHANET Academy</div></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={`/certificates/${encodeURIComponent(cert.code)}/pdf`} className="btn btn-orange">Download PDF</a>
              <ButtonLink href="/courses" variant="ice">Browse courses</ButtonLink>
            </div>
            <p className="text-xs text-muted break-all">Anyone can confirm this certificate at {ACADEMY_URL}/certificates/{cert.code}</p>
          </Card>
        ) : (
          <EmptyState
            title="We couldn't find that certificate"
            body={`No certificate matches the code "${decodeURIComponent(code)}". Check the code on the PDF and try again.`}
            action={<ButtonLink href="/courses" variant="blue" size="sm">Browse courses</ButtonLink>}
          />
        )}
      </div>
    </SiteShell>
  );
}
