import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { ACADEMY_URL } from "./brand";

export type CertificateData = { code: string; recipient_name: string; course_title: string; issued_at: string };

const ROYAL = rgb(0x1f / 255, 0x5e / 255, 0xff / 255);
const DEEP = rgb(0x0b / 255, 0x3b / 255, 0xd1 / 255);
const TANGERINE = rgb(0xff / 255, 0x7a / 255, 0x00 / 255);
const PEACH = rgb(0xff / 255, 0xb3 / 255, 0x6b / 255);
const ICE = rgb(0xea / 255, 0xf1 / 255, 0xff / 255);
const MUTED = rgb(0x4a / 255, 0x5a / 255, 0x86 / 255);
const WHITE = rgb(1, 1, 1);

function centered(page: PDFPage, text: string, y: number, font: PDFFont, size: number, color = DEEP) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (page.getWidth() - w) / 2, y, size, font, color });
}

/** Shrink the font until the text fits the available width. */
function fitSize(text: string, font: PDFFont, max: number, maxWidth: number, min = 18) {
  let s = max;
  while (s > min && font.widthOfTextAtSize(text, s) > maxWidth) s -= 1;
  return s;
}

/** A4 landscape certificate: royal frame and band, tangerine accents, verification code + URL. */
export async function renderCertificatePdf(cert: CertificateData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`PHANET Academy certificate ${cert.code}`);
  pdf.setAuthor("PHANET KNUST");
  const page = pdf.addPage([841.89, 595.28]); // A4 landscape
  const W = page.getWidth();
  const H = page.getHeight();
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);

  // Royal blue frame + inner ice sheet
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: ROYAL });
  page.drawRectangle({ x: 22, y: 22, width: W - 44, height: H - 44, color: WHITE });
  page.drawRectangle({ x: 22, y: 22, width: W - 44, height: H - 44, borderColor: DEEP, borderWidth: 1.5 });

  // Top band with wordmark
  const bandH = 72;
  page.drawRectangle({ x: 22, y: H - 22 - bandH, width: W - 44, height: bandH, color: DEEP });
  page.drawCircle({ x: 64, y: H - 22 - bandH / 2, size: 11, color: TANGERINE });
  page.drawText("PHANET  ACADEMY", { x: 86, y: H - 22 - bandH / 2 - 6, size: 16, font: bold, color: WHITE });
  const theme = "LET NO MAN DESPISE THY YOUTH  ·  1 TIM 4:12";
  page.drawText(theme, { x: W - 22 - 28 - regular.widthOfTextAtSize(theme, 9), y: H - 22 - bandH / 2 - 3, size: 9, font: bold, color: PEACH });

  // Tangerine accent bar under the band
  page.drawRectangle({ x: 22, y: H - 22 - bandH - 8, width: W - 44, height: 8, color: TANGERINE });

  // Title block
  let y = H - 22 - bandH - 8 - 64;
  centered(page, "CERTIFICATE OF COMPLETION", y, bold, 14, TANGERINE);
  y -= 34;
  centered(page, "This certifies that", y, italic, 13, MUTED);

  // Recipient name
  y -= 62;
  const nameSize = fitSize(cert.recipient_name, bold, 44, W - 160);
  centered(page, cert.recipient_name, y, bold, nameSize, DEEP);
  const nameW = bold.widthOfTextAtSize(cert.recipient_name, nameSize);
  page.drawLine({ start: { x: (W - nameW) / 2, y: y - 12 }, end: { x: (W + nameW) / 2, y: y - 12 }, thickness: 2, color: PEACH });

  // Course
  y -= 54;
  centered(page, "has successfully completed the PHANET Academy course", y, regular, 13, MUTED);
  y -= 40;
  const courseSize = fitSize(cert.course_title, bold, 26, W - 160, 14);
  centered(page, cert.course_title, y, bold, courseSize, ROYAL);

  // Footer row: date / seal / code
  const footY = 92;
  const issued = new Date(cert.issued_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  page.drawText("ISSUED", { x: 80, y: footY + 26, size: 9, font: bold, color: MUTED });
  page.drawText(issued, { x: 80, y: footY + 8, size: 13, font: bold, color: DEEP });
  page.drawText("Kumasi, Ghana · PHANET KNUST", { x: 80, y: footY - 10, size: 9, font: regular, color: MUTED });

  // Seal
  page.drawCircle({ x: W / 2, y: footY + 14, size: 30, color: ICE });
  page.drawCircle({ x: W / 2, y: footY + 14, size: 24, color: TANGERINE });
  page.drawCircle({ x: W / 2, y: footY + 14, size: 16, color: PEACH, opacity: 0.6 });
  const seal = "PA";
  page.drawText(seal, { x: W / 2 - bold.widthOfTextAtSize(seal, 12) / 2, y: footY + 14 - 4, size: 12, font: bold, color: WHITE });

  // Verification
  const url = `${ACADEMY_URL}/certificates/${cert.code}`;
  const codeLabel = "VERIFICATION CODE";
  const rightX = W - 80;
  page.drawText(codeLabel, { x: rightX - bold.widthOfTextAtSize(codeLabel, 9), y: footY + 26, size: 9, font: bold, color: MUTED });
  page.drawText(cert.code, { x: rightX - bold.widthOfTextAtSize(cert.code, 13), y: footY + 8, size: 13, font: bold, color: DEEP });
  page.drawText(url, { x: rightX - regular.widthOfTextAtSize(url, 8.5), y: footY - 10, size: 8.5, font: regular, color: ROYAL });

  // Bottom accent
  page.drawRectangle({ x: 22, y: 22, width: W - 44, height: 10, color: TANGERINE });

  return pdf.save();
}
