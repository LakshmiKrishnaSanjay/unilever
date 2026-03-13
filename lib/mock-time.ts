// Deterministic date helper to avoid hydration errors
// Returns consistent dates on both server and client

const BASE_DATE = new Date('2024-01-15T10:00:00Z');

export function getMockDate(offsetDays = 0, offsetHours = 0): Date {
  return new Date(BASE_DATE.getTime() + offsetDays * 24 * 60 * 60 * 1000 + offsetHours * 60 * 60 * 1000);
}

export function getMockTimestamp(offsetDays = 0, offsetHours = 0): number {
  return getMockDate(offsetDays, offsetHours).getTime();
}

// Fixed base timestamp for consistent IDs
export function getMockId(prefix: string): string {
  return `${prefix}-${BASE_DATE.getTime()}`;
}
