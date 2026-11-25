/** Indian PIN codes are six digits and never start with 0. */
export const PINCODE_PATTERN = /^[1-9][0-9]{5}$/;

export function normalizePincode(input: string): string {
  return input.replace(/\s+/g, "");
}

export function isValidPincode(input: string): boolean {
  return PINCODE_PATTERN.test(normalizePincode(input));
}
