import type { Metadata } from "next";
import { Manrope, Tiro_Devanagari_Hindi, Young_Serif } from "next/font/google";
import { PalettePreview } from "@/components/palette-preview";
import { getPublicSettings } from "@/lib/data/settings";
import { publicEnv } from "@/lib/env";
import { paletteCss } from "@/theme/palettes";
import "./globals.css";

const youngSerif = Young_Serif({
  variable: "--font-young-serif",
  weight: "400",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const tiroDeva = Tiro_Devanagari_Hindi({
  variable: "--font-tiro-deva",
  weight: "400",
  subsets: ["devanagari", "latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_SITE_URL),
  title: {
    default: "Ksheera — A2 Gir cow ghee and fresh dairy",
    template: "%s · Ksheera",
  },
  description:
    "Hand-churned bilona ghee, fresh A2 milk, paneer and dahi from free-grazing Gir cows. Order online and we confirm on WhatsApp.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { palette } = await getPublicSettings();

  return (
    <html
      lang="en-IN"
      data-palette={palette}
      className={`${youngSerif.variable} ${manrope.variable} ${tiroDeva.variable} h-full antialiased`}
    >
      <head>
        {/* All palettes ship together so switching needs no extra request. */}
        <style>{paletteCss()}</style>
      </head>
      <body className="flex min-h-full flex-col bg-ground text-ink">
        {children}
        {publicEnv.NEXT_PUBLIC_ALLOW_PALETTE_PREVIEW && <PalettePreview livePalette={palette} />}
      </body>
    </html>
  );
}
