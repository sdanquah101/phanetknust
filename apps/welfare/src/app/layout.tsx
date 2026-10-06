import type { Metadata } from "next";
import { fontClassName } from "@phanet/ui/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "PHANET Welfare", template: "%s · PHANET WELFARE" },
  description: "PHANET WELFARE — Let No Man Despise Thy Youth (1 Timothy 4:12).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontClassName}>
      <body>{children}</body>
    </html>
  );
}
