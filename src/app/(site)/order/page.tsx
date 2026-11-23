import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { OrderForm } from "./order-form";

export const metadata: Metadata = {
  title: "Place your order",
  robots: { index: false },
};

export default function OrderPage() {
  return (
    <Container className="py-[clamp(36px,5vw,64px)]">
      <h1 className="font-display text-[clamp(2.5rem,4.6vw,4rem)] leading-[1.05] text-primary">
        Place your order
      </h1>
      <p className="mt-3.5 max-w-[620px] text-[17px] leading-relaxed">
        No payment now. Share your details and we&apos;ll confirm on WhatsApp with the delivery date
        and payment options.
      </p>
      <OrderForm />
    </Container>
  );
}
