import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai_Looped, Mali } from "next/font/google";
import "./globals.css";

// Neither family is a variable font, so the weights have to be listed.
const plexLooped = IBM_Plex_Sans_Thai_Looped({
  variable: "--font-plex-looped",
  weight: ["400", "500", "600"],
  subsets: ["thai", "latin"],
});

// Handwritten face for the logo and headings.
const mali = Mali({
  variable: "--font-mali",
  weight: ["500", "600"],
  subsets: ["thai", "latin"],
});

export const metadata: Metadata = {
  title: "AntiLonely",
  description: "ที่คุย ที่เล่า ที่ระบาย โดยไม่มีใครรู้ว่าเป็นคุณ",
};

export default function RootLayout({ children, auth }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${plexLooped.variable} ${mali.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {auth}
      </body>
    </html>
  );
}
