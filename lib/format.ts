/**
 * Deterministic date/time formatting helpers to prevent SSR/client hydration mismatches
 * All formatters use explicit timezone (UTC) and locale (en-GB for dates, en-US for numbers)
 */

/**
 * Format date as DD/MM/YYYY
 * @param iso ISO 8601 date string or Date object
 * @returns Formatted date string or "—" if invalid
 */
export function formatDate(iso: string | Date | undefined | null): string {
  if (!iso) return '—';
  try {
    const date = typeof iso === 'string' ? new Date(iso) : iso;
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'UTC',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return '—';
  }
}

/**
 * Format date and time as DD/MM/YYYY, HH:mm:ss
 * @param iso ISO 8601 date string or Date object
 * @returns Formatted datetime string or "—" if invalid
 */
export function formatDateTime(iso: string | Date | undefined | null): string {
  if (!iso) return '—';
  try {
    const date = typeof iso === 'string' ? new Date(iso) : iso;
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'UTC',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return '—';
  }
}

/**
 * Format time as HH:mm:ss
 * @param iso ISO 8601 date string or Date object
 * @returns Formatted time string or "—" if invalid
 */
export function formatTime(iso: string | Date | undefined | null): string {
  if (!iso) return '—';
  try {
    const date = typeof iso === 'string' ? new Date(iso) : iso;
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return '—';
  }
}

/**
 * Format number with thousands separator
 * @param n Number to format
 * @returns Formatted number string or "—" if invalid
 */
export function formatNumber(n: number | undefined | null): string {
  if (n === undefined || n === null || isNaN(n)) return '—';
  try {
    return new Intl.NumberFormat('en-US').format(n);
  } catch {
    return '—';
  }
}
