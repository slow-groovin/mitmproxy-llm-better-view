/**
 * Format a value as JSON string
 */
export function formatJson(value: unknown, space = 2): string {
  return JSON.stringify(value, null, space);
}

/**
 * Format a value as compact JSON (single line)
 */
export function formatJsonCompact(value: unknown): string {
  return JSON.stringify(value);
}

/**
 * Try to parse a string as JSON, return original if fails
 */
export function tryParseJson<T = unknown>(str: string): T | string {
  try {
    return JSON.parse(str) as T;
  } catch {
    return str;
  }
}

/**
 * Check if a string is valid JSON
 */
export function isJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Truncate a JSON string to a maximum length
 */
export function truncateJson(str: string, maxLength = 1000): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}
