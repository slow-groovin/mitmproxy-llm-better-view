/**
 * 快速哈希：重点采样 前/中/后 各 20 个字符
 * 性能 O(1)，最大处理 60 个字符
 */
export function hashId(input: string): string {
  const len = input.length;
  let hash = len ^ 0x9e3779b9; // 一个常用扰动种子

  if (len === 0) return "0";

  const chunk = 20;

  // 前 20
  const headEnd = Math.min(chunk, len);
  for (let i = 0; i < headEnd; i++) {
    hash = (hash ^ input.charCodeAt(i)) * 16777619;
  }

  // 中间 20
  if (len > chunk) {
    const midStart = Math.max(0, (len >> 1) - (chunk >> 1));
    const midEnd = Math.min(len, midStart + chunk);
    for (let i = midStart; i < midEnd; i++) {
      hash = (hash ^ input.charCodeAt(i)) * 16777619;
    }
  }

  // 尾 20
  if (len > chunk * 2) {
    const tailStart = Math.max(chunk, len - chunk);
    for (let i = tailStart; i < len; i++) {
      hash = (hash ^ input.charCodeAt(i)) * 16777619;
    }
  }

  return (hash >>> 0).toString(36);
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
