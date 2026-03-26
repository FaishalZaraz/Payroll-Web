export function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num) {
  return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Formats a string/number as a thousands-separated string for inputs
 * e.g., "15000000" -> "15.000.000"
 */
export function formatInputNumber(val) {
  if (!val && val !== 0) return '';
  const stringVal = String(val).replace(/\D/g, '');
  if (!stringVal) return '';
  return new Intl.NumberFormat('id-ID').format(parseInt(stringVal, 10));
}

/**
 * Parses a thousands-separated string back to a number
 * e.g., "15.000.000" -> 15000000
 */
export function parseInputNumber(val) {
  if (!val) return 0;
  return parseInt(String(val).replace(/\./g, ''), 10) || 0;
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatShortDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function getMonthName(month) {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return months[month - 1] || '';
}

export function calculatePercentChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous * 100).toFixed(1);
}
