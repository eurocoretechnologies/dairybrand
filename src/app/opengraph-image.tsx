import { ImageResponse } from "next/og";
import { BRAND, HERO } from "@/content/site";
import { getPublicSettings } from "@/lib/data/settings";
import { PALETTES } from "@/theme/palettes";

export const alt = `${BRAND.name} — ${HERO.titleLines.join(" ")}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Share image in the live palette's colours. */
export default async function OpenGraphImage() {
  const { palette } = await getPublicSettings();
  const c = PALETTES[palette].colors;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: c.primary,
        color: c.onPrimary,
      }}
    >
      <div style={{ fontSize: 40, letterSpacing: 2 }}>{BRAND.name}</div>
      <div style={{ display: "flex", flexDirection: "column", fontSize: 96, lineHeight: 1.02 }}>
        <span>{HERO.titleLines[0]}</span>
        <span>{HERO.titleLines[1]}</span>
      </div>
      <div style={{ display: "flex", fontSize: 30, color: c.accent }}>{HERO.eyebrow}</div>
    </div>,
    size,
  );
}
