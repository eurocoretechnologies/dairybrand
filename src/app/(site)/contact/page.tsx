import type { Metadata } from "next";
import { WhatsAppIcon } from "@/components/icons";
import { Container, buttonStyles } from "@/components/ui";
import { BRAND } from "@/content/site";
import { getPublicSettings } from "@/lib/data/settings";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contact us",
  description: `Get in touch with ${BRAND.name} about orders, delivery or bulk and gifting enquiries.`,
};

export default async function ContactPage() {
  const { whatsappNumber, contact, fssaiLicence } = await getPublicSettings();

  const rows = [
    contact.phone && {
      label: "Phone",
      value: contact.phone,
      href: `tel:${contact.phone.replace(/\s/g, "")}`,
    },
    contact.email && { label: "Email", value: contact.email, href: `mailto:${contact.email}` },
    contact.address && { label: "Address", value: contact.address },
    fssaiLicence && { label: "FSSAI licence", value: fssaiLicence },
  ].filter((row): row is { label: string; value: string; href?: string } => Boolean(row));

  return (
    <Container className="max-w-3xl py-[clamp(48px,6vw,96px)]">
      <h1 className="font-display text-[clamp(2.25rem,4vw,3.25rem)] leading-tight text-primary">
        Contact us
      </h1>
      <p className="mt-4 text-lg leading-relaxed">
        The quickest way to reach us is WhatsApp — about an order, delivery, or bulk and gifting
        enquiries.
      </p>
      {whatsappNumber && (
        <a
          href={whatsappLink(whatsappNumber, `Hi ${BRAND.name}, I have a question.`)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonStyles.accent} mt-8`}
        >
          <WhatsAppIcon /> Message us on WhatsApp
        </a>
      )}
      {rows.length > 0 ? (
        <dl className="mt-12 divide-y divide-line border-y border-line">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-wrap gap-x-8 gap-y-1 py-4">
              <dt className="w-36 font-semibold">{row.label}</dt>
              <dd>
                {row.href ? (
                  <a href={row.href} className="text-primary underline">
                    {row.value}
                  </a>
                ) : (
                  row.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-12 text-muted">[Phone, email and address to be added.]</p>
      )}
    </Container>
  );
}
