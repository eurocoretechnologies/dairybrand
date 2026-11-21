import type { ProductCategory } from "@/types/database";

/**
 * Product illustrations from the design canvas, drawn in palette tokens so
 * they follow the active palette. Used until real product photography is
 * uploaded, and in banners.
 */

export type ArtKind = "ghee" | "ghee-light" | "butter" | "milk" | "paneer" | "dahi" | "gift";

const mix = (token: string, pct: number, other = "var(--brand-ground)") =>
  `color-mix(in oklab, var(${token}) ${pct}%, ${other})`;

const FILLS: Record<"ghee" | "ghee-light" | "butter", string> = {
  ghee: "var(--brand-accent)",
  "ghee-light": mix("--brand-accent", 45),
  butter: mix("--brand-accent", 14),
};

export function artFor(product: { category: ProductCategory; slug: string }): ArtKind {
  switch (product.category) {
    case "ghee":
      return product.slug.includes("buffalo") ? "ghee-light" : "ghee";
    case "makhan":
      return "butter";
    case "milk":
      return "milk";
    case "paneer":
      return "paneer";
    case "dahi":
      return "dahi";
  }
}

type Props = {
  kind: ArtKind;
  className?: string;
  /** Text shown on the jar label (large hero renders only). */
  label?: string;
  /** Draw for a dark background (lighter glass and shadow). */
  onDark?: boolean;
  title?: string;
};

export function ProductArt({ kind, className, label, onDark = false, title }: Props) {
  const a11y = title
    ? ({ role: "img", "aria-label": title } as const)
    : ({ "aria-hidden": true } as const);

  if (kind === "milk") {
    return (
      <svg viewBox="0 0 140 180" className={className} {...a11y}>
        <ellipse cx="70" cy="175" rx="44" ry="4" fill="var(--brand-ink)" opacity="0.12" />
        <rect x="55" y="4" width="30" height="14" rx="3" fill="var(--brand-primary)" />
        <path
          d="M57 18h26v20q32 14 32 44v80q0 12-12 12H37q-12 0-12-12V82q0-30 32-44z"
          style={{ fill: mix("--brand-ground", 70, "white") }}
          stroke="var(--brand-ink)"
          strokeOpacity="0.18"
        />
        <rect x="25" y="100" width="90" height="40" fill="var(--brand-primary)" />
        {label ? (
          <text
            x="70"
            y="124"
            textAnchor="middle"
            fontSize="12"
            fill="var(--brand-on-primary)"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {label}
          </text>
        ) : (
          <rect x="45" y="112" width="50" height="5" rx="2.5" fill="var(--brand-accent)" />
        )}
        <rect x="32" y="62" width="5" height="96" rx="2.5" fill="var(--brand-line)" />
      </svg>
    );
  }

  if (kind === "dahi") {
    const clay = mix("--brand-metal", 65, "var(--brand-primary)");
    return (
      <svg viewBox="0 0 140 180" className={className} {...a11y}>
        <ellipse cx="70" cy="174" rx="48" ry="4" fill="var(--brand-ink)" opacity="0.12" />
        <path
          d="M70 44c40 0 56 32 56 64 0 38-26 62-56 62s-56-24-56-62c0-32 16-64 56-64z"
          style={{ fill: clay }}
        />
        <path
          d="M24 96q46 14 92 0"
          stroke="var(--brand-ground)"
          strokeWidth="3"
          fill="none"
          opacity="0.7"
        />
        <path
          d="M22 108q48 14 96 0"
          stroke="var(--brand-ground)"
          strokeWidth="1.5"
          fill="none"
          opacity="0.5"
          strokeDasharray="3 5"
        />
        <ellipse
          cx="70"
          cy="44"
          rx="36"
          ry="10"
          style={{ fill: mix("--brand-metal", 45, "var(--brand-primary)") }}
        />
        <ellipse
          cx="70"
          cy="44"
          rx="29"
          ry="6.5"
          style={{ fill: mix("--brand-ground", 80, "white") }}
        />
      </svg>
    );
  }

  if (kind === "paneer") {
    const leaf = mix("--brand-primary", 55, "var(--brand-accent)");
    return (
      <svg viewBox="0 0 140 180" className={className} {...a11y}>
        <path d="M8 128c30-30 94-30 124 0-30 30-94 30-124 0z" style={{ fill: leaf }} />
        <path d="M14 128h112" stroke="var(--brand-primary)" strokeOpacity="0.5" strokeWidth="1.5" />
        <path
          d="M30 70l40-16 40 16v44l-40 16-40-16z"
          style={{ fill: mix("--brand-ground", 75, "white") }}
          stroke="var(--brand-ink)"
          strokeOpacity="0.15"
        />
        <path
          d="M30 70l40 16 40-16M70 86v44"
          fill="none"
          stroke="var(--brand-ink)"
          strokeOpacity="0.15"
        />
        {[
          [50, 96],
          [58, 108],
          [86, 100],
          [94, 112],
          [70, 70],
        ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.5" fill="var(--brand-line)" />
        ))}
      </svg>
    );
  }

  if (kind === "gift") {
    const wood = mix("--brand-metal", 70, "var(--brand-ground)");
    return (
      <svg viewBox="0 0 220 200" className={className} {...a11y}>
        <ellipse cx="110" cy="190" rx="92" ry="7" fill="var(--brand-ink)" opacity="0.2" />
        <rect x="24" y="78" width="172" height="108" rx="6" style={{ fill: wood }} />
        <path
          d="M24 98h172M24 120h172M24 142h172M24 164h172"
          stroke="var(--brand-metal)"
          strokeWidth="1.2"
        />
        <rect
          x="16"
          y="60"
          width="188"
          height="28"
          rx="5"
          style={{ fill: mix("--brand-metal", 50, "var(--brand-ground)") }}
        />
        <rect x="98" y="60" width="24" height="126" fill="var(--brand-primary)" />
        <path
          d="M110 60c-22-34-58-26-44-6 8 10 30 8 44 6zM110 60c22-34 58-26 44-6-8 10-30 8-44 6z"
          fill="var(--brand-primary)"
          stroke="var(--brand-on-primary)"
          strokeOpacity="0.4"
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  // Jars: ghee, light ghee, white makhan.
  return (
    <svg viewBox="0 0 140 180" className={className} {...a11y}>
      <ellipse
        cx="70"
        cy="175"
        rx="56"
        ry="4.5"
        fill={onDark ? "black" : "var(--brand-ink)"}
        opacity={onDark ? 0.25 : 0.12}
      />
      <rect x="32" y="6" width="76" height="24" rx="6" fill="var(--brand-metal)" />
      <rect
        x="36"
        y="28"
        width="68"
        height="5"
        style={{ fill: mix("--brand-metal", 70, "black") }}
      />
      <path
        d="M38 33h64v8q22 6 22 30v86q0 16-16 16H32q-16 0-16-16V71q0-24 22-30z"
        fill="white"
        fillOpacity={onDark ? 0.18 : 0.55}
        stroke={onDark ? "white" : "var(--brand-ink)"}
        strokeOpacity={onDark ? 0.35 : 0.18}
      />
      <path d="M19 80h102v76q0 14-14 14H33q-14 0-14-14z" style={{ fill: FILLS[kind] }} />
      <rect x="28" y="98" width="84" height="46" rx="4" fill="var(--brand-ground)" />
      {label ? (
        <>
          <text
            x="70"
            y="118"
            textAnchor="middle"
            fontSize="11"
            fill="var(--brand-primary)"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {label}
          </text>
          <text
            x="70"
            y="132"
            textAnchor="middle"
            fontSize="6"
            letterSpacing="1.2"
            fill="var(--brand-muted)"
          >
            A2 BILONA GHEE
          </text>
        </>
      ) : (
        <>
          <rect x="46" y="110" width="48" height="5" rx="2.5" fill="var(--brand-primary)" />
          <rect
            x="54"
            y="122"
            width="32"
            height="3"
            rx="1.5"
            fill="var(--brand-primary)"
            opacity="0.4"
          />
        </>
      )}
      <rect
        x="24"
        y="50"
        width="5"
        height="96"
        rx="2.5"
        fill="white"
        opacity={onDark ? 0.4 : 0.6}
      />
    </svg>
  );
}
