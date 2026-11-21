/**
 * Site copy that does not change often enough to live in the database.
 * Text in [square brackets] is a placeholder waiting for the client's real
 * details (see the PRD's open questions). Search for "[" before launch.
 */

import type { ProductCategory } from "@/types/database";

export const BRAND = {
  name: "Ksheera",
  nameHi: "क्षीर",
  monogram: "क्षी",
  tagline: "A2 Gir cow dairy",
  legalName: "[Legal business name]",
  foundedYear: "[Year]",
};

export const NAV_LINKS = [
  { href: "/#shop", label: "Shop" },
  { href: "/#process", label: "How it's made" },
  { href: "/#story", label: "Our gaushala" },
  { href: "/#reviews", label: "Reviews" },
  { href: "/#faq", label: "FAQ" },
] as const;

export const CATEGORIES: { key: ProductCategory; label: string; hindi: string }[] = [
  { key: "ghee", label: "Ghee", hindi: "घी" },
  { key: "milk", label: "Milk", hindi: "दूध" },
  { key: "paneer", label: "Paneer", hindi: "पनीर" },
  { key: "dahi", label: "Dahi", hindi: "दही" },
  { key: "makhan", label: "Makhan", hindi: "मक्खन" },
];

export const HERO = {
  eyebrow: "A2 Gir cow · Bilona method",
  titleLines: ["Slow-churned.", "Never rushed."],
  body: "Ghee, milk and fresh dairy from free-grazing Gir cows — curd set overnight in clay, churned by hand, and slow-heated over a wood fire. The way it was always done.",
  trustPoints: ["Small batches", "Glass jars, no plastic", "No preservatives"],
};

export const PROCESS_STEPS = [
  {
    title: "Free grazing",
    hindi: "चराई",
    body: "Our Gir cows graze outdoors and are milked by hand, after their calves have fed.",
  },
  {
    title: "Curd set overnight",
    hindi: "दही जमाना",
    body: "Whole milk is boiled, cooled and set into curd in clay pots overnight.",
  },
  {
    title: "Hand churned",
    hindi: "बिलोना",
    body: "The curd is churned both ways with a wooden bilona to separate the makhan.",
  },
  {
    title: "Slow-heated",
    hindi: "धीमी आँच",
    body: "Makhan is simmered over a low wood fire until it turns golden and grainy.",
  },
];

export const STORY = {
  eyebrow: "Our gaushala",
  title: ["A small herd,", "looked after properly."],
  body: "Our cows live at [farm name], [village], [district]. They graze outdoors, calves feed first, and we only take what's left. That's why our quantities are limited — and why we'd rather take your order in advance than keep stock on a shelf.",
  quote: "[A line from the founder about why they started the dairy.]",
  quoteBy: "[Founder name], founder",
};

export const COMPARISON = {
  title: "What makes bilona ghee different",
  ours: "Ksheera bilona",
  theirs: "Typical commercial ghee",
  rows: [
    { label: "Starts from", ours: "Whole-milk curd", theirs: "Machine-separated cream" },
    { label: "Churning", ours: "Hand-churned wooden bilona", theirs: "Industrial centrifuge" },
    { label: "Heating", ours: "Low wood fire, small batch", theirs: "Steam boilers, bulk" },
    { label: "Texture", ours: "Grainy (danedar), aromatic", theirs: "Smooth, mild" },
    { label: "Packaging", ours: "Glass jar", theirs: "Plastic tub or pouch" },
  ],
};

export const ORDERING_STEPS = [
  { title: "Choose your products", body: "Pick sizes and quantities. No account needed." },
  {
    title: "Share your details",
    body: "Name, phone and delivery address. Takes under a minute.",
  },
  {
    title: "We confirm on WhatsApp",
    body: "We message you to confirm the order, delivery date and payment — UPI or cash on delivery.",
  },
];

export const FAQS = [
  {
    q: "Where do you deliver?",
    a: "Check your pincode on any product page. If we don't deliver there yet, you can still send a request and we'll let you know.",
  },
  {
    q: "How do I pay?",
    a: "You pay after we confirm your order — by UPI or cash on delivery. Nothing is charged when you send the request.",
  },
  {
    q: "How long does ghee keep?",
    a: "Stored airtight and away from moisture, ghee keeps for months at room temperature. Always use a dry spoon.",
  },
  {
    q: "Why is your ghee grainy?",
    a: "Grainy, or danedar, texture is a sign of slow heating in small batches. It is completely normal and prized.",
  },
  {
    q: "Can I change or cancel an order?",
    a: "Yes — reply to our WhatsApp confirmation any time before dispatch and we will update it.",
  },
];

/** Shown in every product's details, after the product's own rows. */
export const DELIVERY_DETAIL = {
  title: "Delivery & returns",
  body: "We confirm every order on WhatsApp before dispatch, including the delivery date. [Delivery timelines and return policy to be added.]",
};

export const POLICIES = {
  shipping: {
    title: "Shipping policy",
    summary: "Where and how we deliver, and what it costs.",
  },
  refunds: {
    title: "Refund & cancellation policy",
    summary: "Changing, cancelling or returning an order.",
  },
  privacy: {
    title: "Privacy policy",
    summary: "What we collect when you order, why, and your rights.",
  },
  terms: {
    title: "Terms of use",
    summary: "The terms for using this website and placing an order request.",
  },
} as const;

export type PolicySlug = keyof typeof POLICIES;
