import { WhatsAppIcon } from "@/components/icons";
import { BRAND } from "@/content/site";
import { whatsappLink } from "@/lib/whatsapp";

export function WhatsAppFab({ number }: { number: string }) {
  return (
    <a
      href={whatsappLink(number, `Hi ${BRAND.name}, I have a question about an order.`)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      data-whatsapp-fab
      className="fixed right-4 bottom-4 z-30 flex size-14 items-center justify-center rounded-full bg-accent text-on-accent shadow-lg transition hover:scale-105 sm:right-6 sm:bottom-6"
    >
      <WhatsAppIcon size={26} />
    </a>
  );
}
