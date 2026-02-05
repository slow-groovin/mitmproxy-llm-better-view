/**
 * Generate a stable hash ID from a string
 * Uses a simple DJB2 hash algorithm to create deterministic IDs
 */
export function hashId(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) + input.charCodeAt(i);
  }
  return `h${Math.abs(hash).toString(36)}`;
}

/**
 * Generate a sequential ID with a prefix
 * Uses a counter to generate unique IDs
 */
let sequenceCounter = 0;
export function sequenceId(prefix = 'seq'): string {
  return `${prefix}${sequenceCounter++}`;
}

/**
 * Combine multiple parts into a single ID
 * Uses hyphen separator to join ID parts
 */
export function combineId(...parts: (string | number | undefined | null)[]): string {
  return parts.filter(Boolean).join('-');
}
