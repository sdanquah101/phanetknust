import { Outfit, Pacifico } from "next/font/google";

export const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit",
  display: "swap",
});

export const pacifico = Pacifico({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pacifico",
  display: "swap",
});

/** Put on <html> so both font variables are available everywhere. */
export const fontClassName = `${outfit.variable} ${pacifico.variable}`;
