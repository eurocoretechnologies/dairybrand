import type { PublicSettings } from "./settings";
import type { Banner, Product, Review } from "./types";

/**
 * Demo content mirroring supabase/seed.sql, used only when Supabase is not
 * configured and DEMO_CONTENT=true (local development and design review).
 * Never used when a Supabase project is connected.
 */

export function isDemoContentEnabled(): boolean {
  return process.env.DEMO_CONTENT === "true";
}

const v = (id: string, label: string, rupees: number, isDefault = false) => ({
  id,
  label,
  pricePaise: rupees * 100,
  mrpPaise: null,
  inStock: true,
  isDefault,
});

export const DEMO_PRODUCTS: Product[] = [
  {
    id: "demo-ghee",
    slug: "a2-gir-cow-ghee",
    name: "A2 Gir Cow Ghee",
    nameHi: "गिर गाय का बिलोना घी",
    category: "ghee",
    shortDesc: "Hand-churned bilona ghee from A2 Gir cow milk.",
    description:
      "Hand-churned from whole-milk curd and slow-heated over a wood fire. Grainy, golden and deeply aromatic.",
    highlights: [
      { title: "A2", body: "Gir cow milk" },
      { title: "Bilona", body: "Hand-churned" },
      { title: "Glass", body: "No plastic" },
    ],
    details: [
      { title: "Ingredients", body: "100% A2 Gir cow milk ghee. Nothing added." },
      {
        title: "How it is made",
        body: "Whole milk is set into curd overnight, hand-churned with a wooden bilona into makhan, then slow-heated over a wood fire until golden.",
      },
      {
        title: "Storage",
        body: "Keep the lid closed, away from sunlight and moisture. Always use a clean, dry spoon. No refrigeration needed.",
      },
    ],
    badge: "Bestseller",
    variants: [
      v("demo-ghee-250", "250 ml", 780),
      v("demo-ghee-500", "500 ml", 1450, true),
      v("demo-ghee-1000", "1 L", 2750),
    ],
    images: [],
  },
  {
    id: "demo-milk",
    slug: "a2-fresh-milk",
    name: "A2 Fresh Milk",
    nameHi: "ताज़ा दूध",
    category: "milk",
    shortDesc: "Fresh A2 milk in a returnable glass bottle.",
    description: null,
    highlights: [],
    details: [],
    badge: null,
    variants: [v("demo-milk-1000", "1 L glass", 110, true)],
    images: [],
  },
  {
    id: "demo-paneer",
    slug: "malai-paneer",
    name: "Malai Paneer",
    nameHi: "मलाई पनीर",
    category: "paneer",
    shortDesc: "Soft paneer made fresh every day.",
    description: null,
    highlights: [],
    details: [],
    badge: "Made daily",
    variants: [v("demo-paneer-200", "200 g", 140, true)],
    images: [],
  },
  {
    id: "demo-buffalo-ghee",
    slug: "buffalo-ghee",
    name: "Buffalo Ghee",
    nameHi: "भैंस का घी",
    category: "ghee",
    shortDesc: "Rich, white buffalo ghee.",
    description: null,
    highlights: [],
    details: [],
    badge: null,
    variants: [v("demo-buffalo-500", "500 ml", 850, true)],
    images: [],
  },
  {
    id: "demo-dahi",
    slug: "matka-dahi",
    name: "Matka Dahi",
    nameHi: "मटका दही",
    category: "dahi",
    shortDesc: "Thick curd set in a clay pot.",
    description: null,
    highlights: [],
    details: [],
    badge: null,
    variants: [v("demo-dahi-400", "400 g", 90, true)],
    images: [],
  },
  {
    id: "demo-makhan",
    slug: "white-makhan",
    name: "White Makhan",
    nameHi: "सफ़ेद मक्खन",
    category: "makhan",
    shortDesc: "Fresh hand-churned white butter.",
    description: null,
    highlights: [],
    details: [],
    badge: null,
    variants: [v("demo-makhan-200", "200 g", 220, true)],
    images: [],
  },
];

export const DEMO_BANNERS: Banner[] = [
  {
    id: "demo-banner-1",
    eyebrow: "Winter ghee festival",
    title: "Flat [10]% off every 1 L jar.",
    body: "The season's first bilona batches are here. Use code [WINTER10] when you order.",
    ctaLabel: "Shop ghee",
    ctaHref: "/products/a2-gir-cow-ghee",
    variant: "primary",
    imageUrl: null,
  },
  {
    id: "demo-banner-2",
    eyebrow: "Coming soon",
    title: "Fresh A2 milk, every morning.",
    body: "Daily or alternate-day subscriptions in returnable glass bottles.",
    ctaLabel: "Join the waitlist",
    ctaHref: "/order",
    variant: "surface",
    imageUrl: null,
  },
  {
    id: "demo-banner-3",
    eyebrow: "Festive gifting",
    title: "Gift a jar of gold.",
    body: "Bilona ghee and white makhan in a handmade wooden box.",
    ctaLabel: "Order a gift box",
    ctaHref: "/order",
    variant: "accent",
    imageUrl: null,
  },
];

const SAMPLE_REVIEW = "Sample review. Replace with a real customer review shared with permission.";

export const DEMO_REVIEWS: Review[] = [
  {
    id: "demo-review-1",
    customerName: "[Customer name]",
    city: "Ahmedabad",
    productName: "A2 Gir Cow Ghee",
    rating: 5,
    body: SAMPLE_REVIEW,
    isFeatured: true,
  },
  {
    id: "demo-review-2",
    customerName: "[Customer name]",
    city: "Pune",
    productName: "Malai Paneer",
    rating: 5,
    body: SAMPLE_REVIEW,
    isFeatured: false,
  },
  {
    id: "demo-review-3",
    customerName: "[Customer name]",
    city: "Mumbai",
    productName: "A2 Fresh Milk",
    rating: 5,
    body: SAMPLE_REVIEW,
    isFeatured: false,
  },
];

export const DEMO_SERVICEABLE_PINCODES = ["411001", "411045"];

export const DEMO_SETTINGS: Omit<PublicSettings, "palette"> = {
  announcement:
    "Now taking orders — every order is confirmed personally on WhatsApp before dispatch.",
  whatsappNumber: "910000000000",
  batch: { number: "014", churnedOn: null },
  contact: { phone: null, email: null, address: null },
  fssaiLicence: null,
};
