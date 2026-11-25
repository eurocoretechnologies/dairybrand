import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";
import { DEFAULT_PALETTE, PALETTES, PALETTE_KEYS, paletteCss, resolvePaletteKey } from "./palettes";

// Pairs used for normal-size text anywhere on the site. WCAG AA = 4.5:1.
const TEXT_PAIRS = [
  ["ink", "ground"],
  ["ink", "surface"],
  ["muted", "ground"],
  ["muted", "surface"],
  ["onPrimary", "primary"],
  ["onAccent", "accent"],
  ["primary", "ground"],
] as const;

describe("palettes", () => {
  for (const key of PALETTE_KEYS) {
    describe(PALETTES[key].name, () => {
      for (const [fg, bg] of TEXT_PAIRS) {
        it(`${fg} on ${bg} meets WCAG AA (4.5:1)`, () => {
          const { colors } = PALETTES[key];
          expect(contrastRatio(colors[fg], colors[bg])).toBeGreaterThanOrEqual(4.5);
        });
      }
    });
  }

  it("uses Peacock & Brass by default", () => {
    expect(DEFAULT_PALETTE).toBe("peacock-brass");
  });

  it("falls back to the default for unknown keys", () => {
    expect(resolvePaletteKey("not-a-palette")).toBe(DEFAULT_PALETTE);
    expect(resolvePaletteKey(undefined)).toBe(DEFAULT_PALETTE);
    expect(resolvePaletteKey("kesar-pista")).toBe("kesar-pista");
  });

  it("emits one CSS rule per palette", () => {
    const css = paletteCss();
    for (const key of PALETTE_KEYS) {
      expect(css).toContain(`:root[data-palette="${key}"]`);
    }
    expect(css).toContain("--brand-primary:#0F4C4C;");
  });
});
