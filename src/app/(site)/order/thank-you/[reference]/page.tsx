import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckIcon, WhatsAppIcon } from "@/components/icons";
import { Container, Hindi, buttonStyles } from "@/components/ui";
import { BRAND } from "@/content/site";
import { getPublicSettings } from "@/lib/data/settings";
import { whatsappLink } from "@/lib/whatsapp";

const REFERENCE = /^KS-(\d{5,9}|DEMO)$/;

export const metadata: Metadata = {
  title: "Thank you",
  robots: { index: false },
};

/** Cache Components needs one sample param; other references render on request. */
export function generateStaticParams() {
  return [{ reference: "KS-10001" }];
}

/**
 * Shown after an order request is saved. It shows only the reference from
 * the URL, never order or customer details, so guessing a URL reveals nothing.
 */
export default async function ThankYouPage({ params }: PageProps<"/order/thank-you/[reference]">) {
  const { reference } = await params;
  const ref = decodeURIComponent(reference);
  if (!REFERENCE.test(ref)) notFound();
  const { whatsappNumber } = await getPublicSettings();

  const steps = [
    { title: "Received", body: "Your request is with us." },
    { title: "Confirmed on WhatsApp", body: "Usually within a few hours." },
    { title: "Delivered fresh", body: "In the time slot you chose." },
  ];

  return (
    <Container className="max-w-[720px] py-[clamp(56px,8vw,112px)] text-center">
      <div
        aria-hidden
        className="mx-auto flex h-[140px] w-[120px] items-center justify-center rounded-[50%_50%_16px_16px/42%_42%_16px_16px] bg-primary text-accent"
      >
        <CheckIcon size={52} strokeWidth={2} />
      </div>
      <Hindi className="mt-8 block text-[22px] text-muted">धन्यवाद</Hindi>
      <h1 className="mt-1.5 font-display text-[clamp(2.5rem,5vw,3.75rem)] leading-[1.08] text-primary">
        Your order request is in.
      </h1>
      <p className="mx-auto mt-5 max-w-[520px] text-lg leading-relaxed">
        We&apos;ll message you shortly to confirm availability, your delivery date and payment.
        Nothing has been charged.
      </p>
      <div className="mt-8 inline-flex flex-col gap-1 rounded-2xl border border-dashed border-metal px-8 py-4.5">
        <span className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
          Order reference
        </span>
        <span className="font-display text-[28px] text-primary">{ref}</span>
      </div>
      <ol className="mt-12 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
        {steps.map((step, i) => (
          <li key={step.title} className="rounded-[18px] border border-line bg-ground p-5">
            <span className="text-sm text-muted">Step {i + 1}</span>
            <span className="mt-1 block font-bold text-primary">{step.title}</span>
            <span className="mt-1 block text-sm text-muted">{step.body}</span>
          </li>
        ))}
      </ol>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        {whatsappNumber && (
          <a
            href={whatsappLink(whatsappNumber, `Hi ${BRAND.name}, I just placed order ${ref}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles.accent}
          >
            <WhatsAppIcon /> Message us about {ref}
          </a>
        )}
        <Link href="/" className={buttonStyles.outline}>
          Back to home
        </Link>
      </div>
    </Container>
  );
}
