import type { Metadata, Viewport } from "next";
import { Manrope, Tiro_Devanagari_Hindi, Young_Serif } from "next/font/google";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WhatsAppFab } from "@/components/layout/whatsapp-fab";
import { PalettePreview } from "@/components/palette-preview";
import { BRAND } from "@/content/site";
import { getPublicSettings } from "@/lib/data/settings";
import { publicEnv } from "@/lib/env";
import { PALETTES, paletteCss } from "@/theme/palettes";
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

const description =
  "Hand-churned bilona ghee, fresh A2 milk, paneer and dahi from free-grazing Gir cows. Order online and we confirm on WhatsApp.";

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_SITE_URL),
  title: {
    default: `${BRAND.name} — A2 Gir cow ghee and fresh dairy`,
    template: `%s · ${BRAND.name}`,
  },
  description,
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: BRAND.name,
    description,
  },
  twitter: { card: "summary_large_image" },
};

export async function generateViewport(): Promise<Viewport> {
  const { palette } = await getPublicSettings();
  return { themeColor: PALETTES[palette].colors.primary };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getPublicSettings();

  return (
    <html
      lang="en-IN"
      data-palette={settings.palette}
      className={`${youngSerif.variable} ${manrope.variable} ${tiroDeva.variable} h-full scroll-smooth antialiased`}
    >
      <head>
        {/* All palettes ship together so switching needs no extra request. */}
        <style>{paletteCss()}</style>
      </head>
      <body className="flex min-h-full flex-col bg-ground text-ink">
        <SiteHeader announcement={settings.announcement} />
        <main id="main" className="flex flex-1 flex-col">
          {children}
        </main>
        <SiteFooter settings={settings} />
        <CartDrawer />
        {settings.whatsappNumber && <WhatsAppFab number={settings.whatsappNumber} />}
        {publicEnv.NEXT_PUBLIC_ALLOW_PALETTE_PREVIEW && (
          <PalettePreview livePalette={settings.palette} />
        )}
      </body>
    </html>
  );
}
