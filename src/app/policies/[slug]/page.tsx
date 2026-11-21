import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui";
import { POLICIES, type PolicySlug } from "@/content/site";

function isPolicySlug(slug: string): slug is PolicySlug {
  return Object.hasOwn(POLICIES, slug);
}

export function generateStaticParams() {
  return Object.keys(POLICIES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/policies/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  if (!isPolicySlug(slug)) return { title: "Not found" };
  return { title: POLICIES[slug].title, description: POLICIES[slug].summary };
}

/**
 * Policy pages. The wording is still to be supplied or approved by the
 * client (PRD open question), so each page shows a clear placeholder.
 */
export default async function PolicyPage({ params }: PageProps<"/policies/[slug]">) {
  const { slug } = await params;
  if (!isPolicySlug(slug)) notFound();
  const policy = POLICIES[slug];

  return (
    <Container className="max-w-3xl py-[clamp(48px,6vw,96px)]">
      <h1 className="font-display text-[clamp(2.25rem,4vw,3.25rem)] leading-tight text-primary">
        {policy.title}
      </h1>
      <p className="mt-4 text-lg">{policy.summary}</p>
      <div className="mt-10 rounded-3xl border border-line bg-surface p-7">
        <p className="font-semibold text-primary">This policy is being finalised.</p>
        <p className="mt-2 leading-relaxed">
          [Policy text to be provided before launch.] Until then, message us on WhatsApp or see the{" "}
          <Link href="/contact" className="text-primary underline">
            contact page
          </Link>{" "}
          with any questions.
        </p>
      </div>
      <nav aria-label="Other policies" className="mt-12">
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {Object.entries(POLICIES)
            .filter(([key]) => key !== slug)
            .map(([key, p]) => (
              <li key={key}>
                <Link href={`/policies/${key}`} className="text-primary underline">
                  {p.title}
                </Link>
              </li>
            ))}
        </ul>
      </nav>
    </Container>
  );
}
