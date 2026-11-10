import type { Metadata, Viewport } from "next";
import { Poppins, Yatra_One, Anton, Mukta } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { LanguageProvider } from "@/lib/i18n";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

// Painted Board world (public site): Yatra One — brush-painted Devanagari
// display; Anton — wood-type Latin caps; Mukta — Devanagari body face.
const yatra = Yatra_One({
  variable: "--font-yatra",
  subsets: ["latin", "devanagari"],
  display: "swap",
  weight: ["400"],
});
const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
});
const mukta = Mukta({
  variable: "--font-mukta",
  subsets: ["latin", "devanagari"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  // The site has its own हिंदी/English toggle; stop Chrome's
  // translate-this-page prompt from appearing on every refresh.
  other: { google: "notranslate" },
  applicationName: "Patidar Stone Crusher",
  title: {
    default: "Patidar Stone Crusher — Orders",
    template: "%s",
  },
  description: "Simple order book for the crusher plant",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ea580c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="hi"
      className={cn("h-full antialiased", poppins.variable, yatra.variable, anton.variable, mukta.variable, "font-sans")}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
