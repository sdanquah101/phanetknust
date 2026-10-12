import { Bricolage_Grotesque } from "next/font/google";

/** Bricolage Grotesque, variable in weight, optical size and width (display type is set narrow). */
export const bricolage = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz", "wdth"],
  variable: "--font-bricolage",
  display: "swap",
});

/** Put on <html> so the font variable is available everywhere. */
export const fontClassName = bricolage.variable;
