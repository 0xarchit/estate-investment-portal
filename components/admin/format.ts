/**
 * Indian Rupee and formatting helpers for Admin Module
 * Complies with the global format contract:
 * - All monetary inputs are in integer paise (₹1 = 100 paise)
 * - Returns formatted INR strings using Indian number grouping (lakhs & crores)
 */

export function formatINR(paise: number): string {
  if (typeof paise !== 'number' || isNaN(paise)) return '₹0';
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees);
}

export function formatCompactINR(paise: number): string {
  if (typeof paise !== 'number' || isNaN(paise)) return '₹0';
  const rupees = paise / 100;

  if (Math.abs(rupees) >= 10000000) {
    // Crores (1 Cr = 1,00,00,000)
    const cr = rupees / 10000000;
    return `₹${cr.toFixed(cr >= 10 ? 1 : 2).replace(/\.00$/, '').replace(/(\.[1-9])0$/, '$1')} Cr`;
  }
  if (Math.abs(rupees) >= 100000) {
    // Lakhs (1 L = 1,00,000)
    const lk = rupees / 100000;
    return `₹${lk.toFixed(lk >= 10 ? 1 : 2).replace(/\.00$/, '').replace(/(\.[1-9])0$/, '$1')} L`;
  }
  if (Math.abs(rupees) >= 1000) {
    // Thousands
    const k = rupees / 1000;
    return `₹${k.toFixed(1).replace(/\.0$/, '')}k`;
  }

  return formatINR(paise);
}

export function formatPct(n: number, dp: number = 1): string {
  if (typeof n !== 'number' || isNaN(n)) return '0.0%';
  return `${n.toFixed(dp)}%`;
}

export function formatDate(isoDate: string | Date | undefined): string {
  if (!isoDate) return '—';
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return '—';
  }
}
