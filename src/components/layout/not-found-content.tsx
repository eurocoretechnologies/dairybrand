import { Container, Hindi, buttonStyles } from "@/components/ui";
import Link from "next/link";

export function NotFoundContent() {
  return (
    <Container className="flex flex-col items-start py-[clamp(64px,10vw,140px)]">
      <Hindi className="text-6xl text-accent">खाली</Hindi>
      <h1 className="mt-4 font-display text-[clamp(2.25rem,4vw,3.25rem)] text-primary">
        This page is empty.
      </h1>
      <p className="mt-3 text-lg">The page you were looking for doesn&apos;t exist or has moved.</p>
      <Link href="/#shop" className={`${buttonStyles.primary} mt-8`}>
        Browse products
      </Link>
    </Container>
  );
}
