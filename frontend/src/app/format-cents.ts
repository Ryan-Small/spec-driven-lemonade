/** Formats a non-negative whole number of cents as dollars, for example 2000 -> "$20.00". */
export function formatCents(cents: number): string {
  const dollars = Math.floor(cents / 100);
  const remainder = String(cents % 100).padStart(2, '0');
  return `$${dollars}.${remainder}`;
}
