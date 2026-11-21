import type { NextConfig } from "next";

/** Product and banner images are served from Supabase Storage. */
function supabaseImagePattern(): URL[] {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return [];
  return [new URL("/storage/v1/object/public/**", url)];
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: supabaseImagePattern(),
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
