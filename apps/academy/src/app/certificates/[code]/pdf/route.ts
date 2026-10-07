import { NextResponse, type NextRequest } from "next/server";
import { verifyCertificate } from "@/lib/queries";
import { renderCertificatePdf } from "@/lib/certificate-pdf";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const cert = await verifyCertificate(decodeURIComponent(code));
  if (!cert) return new NextResponse("Certificate not found", { status: 404 });

  const bytes = await renderCertificatePdf(cert, { origin: req.nextUrl.origin });
  const safe = cert.code.replace(/[^A-Za-z0-9-]/g, "");
  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="PHANET-Academy-${safe}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
