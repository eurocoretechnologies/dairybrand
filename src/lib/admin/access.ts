/** True when a verified token's app_metadata marks the user as an owner. */
export function isOwnerClaims(claims: unknown): boolean {
  if (!claims || typeof claims !== "object") return false;
  const meta = (claims as { app_metadata?: { role?: unknown } }).app_metadata;
  return meta?.role === "owner";
}

/** Where to go after sign-in: only dashboard paths on this site, else /admin. */
export function safeNextPath(value: unknown): string {
  const next = typeof value === "string" ? value : "";
  return /^\/admin(?:[/?]|$)/.test(next) && !next.includes("//") && !next.includes("\\")
    ? next
    : "/admin";
}
