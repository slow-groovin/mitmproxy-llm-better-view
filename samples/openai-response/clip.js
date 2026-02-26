import fs from 'fs';
import path from 'path';

const DIR = './samples/openai-response/';
const MAX_VALUE_LEN = 200; // 裁剪阈值

// 递归裁剪对象中的长字符串
function trimLongValues(obj, max = MAX_VALUE_LEN) {
  if (typeof obj === 'string') {
    return obj.length > max ? obj.slice(0, max) + `...[truncated ${obj.length} chars]` : obj;
  }
  if (Array.isArray(obj)) return obj.map(item => trimLongValues(item, max));
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, trimLongValues(v, max)])
    );
  }
  return obj;
}

function processJsonc(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(content);
  const trimmed = trimLongValues(parsed);
  fs.writeFileSync(filePath, JSON.stringify(trimmed, null, 2), 'utf-8');
  console.log(`✅ jsonc: ${filePath}`);
}

function processNdjson(filePath) {
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
  const result = lines.map(line => {
    if (!line.startsWith('data: ')) return line;
    const jsonStr = line.slice(6); // 去掉 "data: "
    try {
      const parsed = JSON.parse(jsonStr);
      const trimmed = trimLongValues(parsed);
      return 'data: ' + JSON.stringify(trimmed);
    } catch {
      return line; // 解析失败原样返回
    }
  });
  fs.writeFileSync(filePath, result.join('\n'), 'utf-8');
  console.log(`✅ ndjson: ${filePath}`);
}

const files = fs.readdirSync(DIR);
for (const file of files) {
  const filePath = path.join(DIR, file);
  if (!fs.statSync(filePath).isFile()) continue;

  try {
    if (file.endsWith('.jsonc') || file.endsWith('.json')) {
      processJsonc(filePath);
    } else if (file.endsWith('.ndjson') || file.endsWith('.jsonl')) {
      processNdjson(filePath);
    } else {
      // 未知扩展名：尝试检测内容格式
      const head = fs.readFileSync(filePath, 'utf-8').slice(0, 100).trimStart();
      if (head.startsWith('event:') || head.startsWith('data:')) {
        processNdjson(filePath);
      } else {
        processJsonc(filePath);
      }
    }
  } catch (e) {
    console.warn(`⚠️ 跳过 ${file}: ${e.message}`);
  }
}