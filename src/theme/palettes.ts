/**
 * Brand colour palettes. This file is the only place hex colours may appear
 * (enforced by ESLint). Components use the semantic tokens through Tailwind
 * classes such as `bg-primary`, `text-on-primary`, `border-line`.
 *
 * To add a palette: add an entry here. To switch the live palette: set the
 * `palette` row in the `settings` table (or DEFAULT_PALETTE as a fallback).
 */

export const PALETTE_KEYS = [
  "peacock-brass",
  "pasture-ghee",
  "indigo-saffron",
  "terracotta-malai",
  "midnight-malai",
  "kesar-pista",
] as const;

export type PaletteKey = (typeof PALETTE_KEYS)[number];

export const DEFAULT_PALETTE: PaletteKey = "peacock-brass";

export type PaletteColors = {
  /** Brand colour: dark sections, primary buttons, headings. */
  primary: string;
  /** Text and icons placed on `primary`. */
  onPrimary: string;
  /** Highlight colour: offers, badges, ghee in illustrations. */
  accent: string;
  /** Text and icons placed on `accent`. */
  onAccent: string;
  /** Page background. */
  ground: string;
  /** Raised or alternate sections and cards. */
  surface: string;
  /** Lids, rules and small metallic details. Decorative only. */
  metal: string;
  /** Body text on `ground` and `surface`. */
  ink: string;
  /** Secondary text on `ground` and `surface`. */
  muted: string;
  /** Hairlines and borders. Decorative only. */
  line: string;
};

export type Palette = {
  key: PaletteKey;
  name: string;
  colors: PaletteColors;
};

export const PALETTES: Record<PaletteKey, Palette> = {
  "peacock-brass": {
    key: "peacock-brass",
    name: "Peacock & Brass",
    colors: {
      primary: "#0F4C4C",
      onPrimary: "#FAF7F0",
      accent: "#C9A45C",
      onAccent: "#0F2E2E",
      ground: "#FAF7F0",
      surface: "#EDE4D3",
      metal: "#9C7A3A",
      ink: "#1F2A28",
      muted: "#55605D",
      line: "#DDD3BF",
    },
  },
  "pasture-ghee": {
    key: "pasture-ghee",
    name: "Pasture & Ghee",
    colors: {
      primary: "#1E3B2F",
      onPrimary: "#FAF6EE",
      accent: "#D9A441",
      onAccent: "#1E3B2F",
      ground: "#FAF6EE",
      surface: "#F1EADB",
      metal: "#B8862E",
      ink: "#2A2A24",
      muted: "#625D50",
      line: "#E2D8C3",
    },
  },
  "indigo-saffron": {
    key: "indigo-saffron",
    name: "Indigo & Saffron",
    colors: {
      primary: "#1F2A4A",
      onPrimary: "#FBF7F0",
      accent: "#E39A3B",
      onAccent: "#1F2A4A",
      ground: "#FBF7F0",
      surface: "#EFE8DA",
      metal: "#B07A2A",
      ink: "#22263A",
      muted: "#5E5A55",
      line: "#E0D8C8",
    },
  },
  "terracotta-malai": {
    key: "terracotta-malai",
    name: "Terracotta & Malai",
    colors: {
      primary: "#7A3B22",
      onPrimary: "#F8F1E6",
      accent: "#E0B04A",
      onAccent: "#3B2418",
      ground: "#F8F1E6",
      surface: "#EEDFCB",
      metal: "#A9772E",
      ink: "#2E2018",
      muted: "#6A5546",
      line: "#E3D3BC",
    },
  },
  "midnight-malai": {
    key: "midnight-malai",
    name: "Midnight & Malai",
    colors: {
      primary: "#141C18",
      onPrimary: "#F3E9D2",
      accent: "#C9A45C",
      onAccent: "#141C18",
      ground: "#F3E9D2",
      surface: "#E6D8B8",
      metal: "#8F7337",
      ink: "#141C18",
      muted: "#5D5646",
      line: "#D9CBA8",
    },
  },
  "kesar-pista": {
    key: "kesar-pista",
    name: "Kesar & Pista",
    colors: {
      primary: "#34401F",
      onPrimary: "#F7F6EC",
      accent: "#E07B39",
      onAccent: "#22290F",
      ground: "#F7F6EC",
      surface: "#E5EAD6",
      metal: "#B5652A",
      ink: "#22290F",
      muted: "#5B5F4C",
      line: "#D8DCC6",
    },
  },
};

export function isPaletteKey(value: unknown): value is PaletteKey {
  return typeof value === "string" && (PALETTE_KEYS as readonly string[]).includes(value);
}

/** Returns the palette for `value`, or the default palette when unknown. */
export function resolvePaletteKey(value: unknown): PaletteKey {
  return isPaletteKey(value) ? value : DEFAULT_PALETTE;
}

const TOKEN_NAMES: Record<keyof PaletteColors, string> = {
  primary: "--brand-primary",
  onPrimary: "--brand-on-primary",
  accent: "--brand-accent",
  onAccent: "--brand-on-accent",
  ground: "--brand-ground",
  surface: "--brand-surface",
  metal: "--brand-metal",
  ink: "--brand-ink",
  muted: "--brand-muted",
  line: "--brand-line",
};

/**
 * CSS for every palette, one rule per `data-palette` value on <html>.
 * Rendered once in the root layout so switching palettes (including the
 * preview switcher) needs no extra network request.
 */
export function paletteCss(): string {
  return PALETTE_KEYS.map((key) => {
    const { colors } = PALETTES[key];
    const vars = (Object.keys(TOKEN_NAMES) as (keyof PaletteColors)[])
      .map((name) => `${TOKEN_NAMES[name]}:${colors[name]};`)
      .join("");
    return `:root[data-palette="${key}"]{${vars}}`;
  }).join("\n");
}
