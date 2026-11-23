import type { ReactNode } from "react";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { getPublicSettings } from "@/lib/data/settings";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { WhatsAppFab } from "./whatsapp-fab";

/** Header, footer, cart and WhatsApp button around every public page. */
export async function SiteChrome({ children }: { children: ReactNode }) {
  const settings = await getPublicSettings();
  return (
    <>
      <SiteHeader announcement={settings.announcement} />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <SiteFooter settings={settings} />
      <CartDrawer />
      {settings.whatsappNumber && <WhatsAppFab number={settings.whatsappNumber} />}
    </>
  );
}
