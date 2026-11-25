const rupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

/** Formats an amount in paise as Indian rupees, e.g. 145000 → "₹1,450". */
export function formatPaise(paise: number): string {
  if (!Number.isInteger(paise)) {
    throw new Error(`Amounts are stored in whole paise, got ${paise}`);
  }
  return rupees.format(paise / 100);
}
