/**
 * Format a Unix timestamp to a localized date string
 */
export function formatDate(timestamp: number | string | undefined): string {
  if (!timestamp) return '';
  const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) : timestamp);
  if (isNaN(date.getTime())) return String(timestamp);
  return date.toLocaleString();
}

/**
 * Format a timestamp to ISO string
 */
export function formatIsoDate(timestamp: number | string | undefined): string {
  if (!timestamp) return '';
  const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) : timestamp);
  if (isNaN(date.getTime())) return String(timestamp);
  return date.toISOString();
}

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(2)}m`;
  return `${(ms / 3600000).toFixed(2)}h`;
}
