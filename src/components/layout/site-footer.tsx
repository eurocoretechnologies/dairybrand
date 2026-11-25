import { cacheLife } from "next/cache";
import Link from "next/link";
import { WhatsAppIcon } from "@/components/icons";
import { buttonStyles } from "@/components/ui";
import { BRAND, CATEGORIES, POLICIES } from "@/content/site";
import type { PublicSettings } from "@/lib/data/settings";
import { whatsappLink } from "@/lib/whatsapp";

async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function SiteFooter({ settings }: { settings: PublicSettings }) {
  const { whatsappNumber, contact, fssaiLicence } = settings;
  const year = await currentYear();
  return (
    <footer className="bg-primary text-on-primary">
      <div className="mx-auto max-w-[1240px] px-4 pt-16 pb-8 sm:px-10 sm:pt-24">
        <div className="flex flex-wrap justify-between gap-12">
          <div className="max-w-md flex-[1_1_22rem]">
            <p className="font-display text-[clamp(2rem,3.4vw,2.75rem)] leading-tight">
              Hear when the next batch is churned.
            </p>
            {whatsappNumber && (
              <a
                href={whatsappLink(
                  whatsappNumber,
                  `Hi ${BRAND.name}, please add me to your batch updates.`,
                )}
                className={`${buttonStyles.accent} mt-7`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon />
                Get batch updates on WhatsApp
              </a>
            )}
          </div>
          <div className="flex flex-wrap gap-14 text-[15px]">
            <FooterColumn title="Shop">
              {CATEGORIES.map((c) => (
                <Link key={c.key} href="/#shop" className="hover:underline">
                  {c.label}
                </Link>
              ))}
            </FooterColumn>
            <FooterColumn title="Help">
              <Link href="/#faq" className="hover:underline">
                FAQ
              </Link>
              {Object.entries(POLICIES).map(([slug, policy]) => (
                <Link key={slug} href={`/policies/${slug}`} className="hover:underline">
                  {policy.title.replace(" policy", "")}
                </Link>
              ))}
            </FooterColumn>
            <FooterColumn title="Contact">
              <Link href="/contact" className="hover:underline">
                Contact us
              </Link>
              {contact.phone && (
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`}>{contact.phone}</a>
              )}
              {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
              {contact.address && <span className="max-w-56">{contact.address}</span>}
            </FooterColumn>
          </div>
        </div>
        <div className="mt-16 flex flex-wrap justify-between gap-3 border-t border-on-primary/15 pt-6 text-[13px] text-on-primary/80">
          <span>
            © {year} {BRAND.legalName}. All rights reserved.
          </span>
          <span>FSSAI Lic. No. {fssaiLicence ?? "[to be added]"}</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">{title}</p>
      {children}
    </div>
  );
}
