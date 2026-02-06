/**
 * Content type detection and formatting
 */

export type ContentFormat = 'markdown' | 'xml' | 'json' | 'text';

/**
 * Detect the format of a content string
 */
export function detectContentFormat(content: string): ContentFormat {
  if (!content || typeof content !== 'string') return 'text';

  const trimmed = content.trim();

  // Check for JSON
  if (isJson(trimmed)) return 'json';

  // Check for XML
  if (isXml(trimmed) && !isMarkdown(trimmed)) return 'xml';

  // Check for Markdown
  if (isMarkdown(trimmed)) return 'markdown';

  return 'text';
}

/**
 * Check if a string is valid JSON
 */
function isJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a string contains Markdown patterns
 */
function isMarkdown(str: string): boolean {
  return (
    str.startsWith('#') ||
    str.includes('\n```') ||
    str.includes('\n# ') ||
    str.includes('\n## ') ||
    str.includes('\n### ') ||
    str.includes('\n1. ') ||
    str.includes('\n- ')
  );
}

/**
 * Check if a string is XML
 */
function isXml(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (trimmed.length === 0) return false;

  // Must have angle brackets
  if (!trimmed.includes('<') || !trimmed.includes('>')) return false;

  // Check for XML declaration or tag start
  const startsWithXml = /^\s*(<\?xml|<[a-zA-Z][a-zA-Z0-9:_.-]*[\s/>])/i.test(trimmed);

  // Check for balanced tags
  const hasBalancedTags = (s: string): boolean => {
    const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9:_.-]*)[^>]*>/g;
    const matches = [...s.matchAll(tagPattern)];
    if (matches.length === 0) return false;

    const openTags: string[] = [];
    for (const match of matches) {
      const fullTag = match[0];
      const tagName = match[1];

      if (fullTag.endsWith('/>')) continue;
      if (fullTag.startsWith('</')) {
        if (openTags.length === 0 || openTags.pop() !== tagName) return false;
      } else {
        openTags.push(tagName);
      }
    }
    return true;
  };

  // Check for XML features
  const hasXmlFeatures = (
    /\s+[a-zA-Z][a-zA-Z0-9:_.-]*\s*=\s*(['"]).*?\1/.test(str) ||
    /<[^>]+\/\s*>/.test(str) ||
    /<!\[CDATA\[.*?\]\]>/.test(str) ||
    /<!--.*?-->/.test(str) ||
    /&[a-zA-Z0-9#]+;/.test(str)
  );

  return startsWithXml || (hasBalancedTags(trimmed) && hasXmlFeatures);
}

/**
 * Format content for display based on detected format
 */
export function formatContent(content: string, format?: ContentFormat): string {
  const detectedFormat = format || detectContentFormat(content);

  if (detectedFormat === 'json') {
    try {
      return JSON.stringify(JSON.parse(content), null, 2);
    } catch {
      return content;
    }
  }

  return content;
}

/**
 * Check if content should be rendered as prose
 */
export function isProseContent(content: string): boolean {
  const format = detectContentFormat(content);
  return format === 'markdown' || format === 'text';
}
