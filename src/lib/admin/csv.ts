/**
 * CSV for spreadsheet apps. Quotes every cell and neutralises values that
 * a spreadsheet would run as a formula (=, +, -, @, tab, carriage return).
 */
export function csvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '""';
  let text = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(header: string[], rows: (string | number | boolean | null | undefined)[][]) {
  // A byte order mark makes Excel read the file as UTF-8 (₹, Hindi names).
  return "﻿" + [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}
