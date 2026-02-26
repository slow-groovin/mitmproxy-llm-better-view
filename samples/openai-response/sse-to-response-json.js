#!/usr/bin/env node

import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

function usageAndExit() {
  console.error(
    "Usage: node sse-to-response-json.js <input.ndjson> [output.json] [--meta]\n" +
      "       node sse-to-response-json.js --all\n" +
      "Example: node sse-to-response-json.js response1.ndjson response1.full.json --meta"
  );
  process.exit(1);
}

function ensureArrayAt(arr, index, defaultValueFactory) {
  while (arr.length <= index) arr.push(undefined);
  if (arr[index] === undefined) arr[index] = defaultValueFactory();
  return arr[index];
}

function mergeItem(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (key === "content" && Array.isArray(value)) {
      if (!Array.isArray(target.content)) target.content = [];
      for (let i = 0; i < value.length; i += 1) {
        if (value[i] !== undefined) target.content[i] = value[i];
      }
      continue;
    }
    if (key === "summary" && Array.isArray(value)) {
      if (!Array.isArray(target.summary)) target.summary = [];
      for (let i = 0; i < value.length; i += 1) {
        if (value[i] !== undefined) target.summary[i] = value[i];
      }
      continue;
    }
    target[key] = value;
  }
}

function createState() {
  return {
    response: null,
    outputByIndex: new Map(),
    outputIndexByItemId: new Map(),
    eventCount: 0,
    parseErrorCount: 0,
    unknownEventTypes: new Set(),
  };
}

function ensureItem(state, outputIndex, itemId) {
  let item = state.outputByIndex.get(outputIndex);
  if (!item) {
    item = { id: itemId || `item_${outputIndex}` };
    state.outputByIndex.set(outputIndex, item);
  }

  if (itemId && !item.id) item.id = itemId;
  if (item.id) state.outputIndexByItemId.set(item.id, outputIndex);

  return item;
}

function findOrCreateItemById(state, itemId, hintedOutputIndex) {
  let index = hintedOutputIndex;
  if (index === undefined || index === null) {
    index = state.outputIndexByItemId.get(itemId);
  }
  if (index === undefined) {
    index = state.outputByIndex.size;
  }
  return ensureItem(state, index, itemId);
}

function applyEvent(state, eventName, payload) {
  const type = eventName || payload?.type;
  if (!type) return;
  state.eventCount += 1;

  if (
    type === "response.created" ||
    type === "response.in_progress" ||
    type === "response.completed"
  ) {
    if (payload && typeof payload.response === "object" && payload.response !== null) {
      state.response = payload.response;
    }
    return;
  }

  if (type === "response.output_item.added" || type === "response.output_item.done") {
    const index = payload?.output_index;
    const incomingItem = payload?.item;
    if (!incomingItem || typeof incomingItem !== "object") return;
    const item = ensureItem(state, index ?? state.outputByIndex.size, incomingItem.id);
    mergeItem(item, incomingItem);
    return;
  }

  if (type === "response.content_part.added" || type === "response.content_part.done") {
    const itemId = payload?.item_id;
    const contentIndex = payload?.content_index;
    if (!itemId || typeof contentIndex !== "number") return;

    const item = findOrCreateItemById(state, itemId, payload?.output_index);
    if (!Array.isArray(item.content)) item.content = [];

    if (type === "response.content_part.done") {
      ensureArrayAt(item.content, contentIndex, () => ({}));
      item.content[contentIndex] = payload.part || {};
      return;
    }

    ensureArrayAt(item.content, contentIndex, () => ({}));
    mergeItem(item.content[contentIndex], payload.part || {});
    return;
  }

  if (type === "response.output_text.delta" || type === "response.output_text.done") {
    const itemId = payload?.item_id;
    const contentIndex = payload?.content_index;
    if (!itemId || typeof contentIndex !== "number") return;

    const item = findOrCreateItemById(state, itemId, payload?.output_index);
    if (!Array.isArray(item.content)) item.content = [];
    const part = ensureArrayAt(item.content, contentIndex, () => ({
      type: "output_text",
      text: "",
      annotations: [],
      logprobs: [],
    }));

    if (type === "response.output_text.delta") {
      part.text = `${part.text || ""}${payload?.delta || ""}`;
      return;
    }

    part.text = payload?.text || "";
    if (Array.isArray(payload?.logprobs)) part.logprobs = payload.logprobs;
    return;
  }

  if (
    type === "response.function_call_arguments.delta" ||
    type === "response.function_call_arguments.done"
  ) {
    const itemId = payload?.item_id;
    if (!itemId) return;
    const item = findOrCreateItemById(state, itemId, payload?.output_index);

    if (type === "response.function_call_arguments.delta") {
      item.arguments = `${item.arguments || ""}${payload?.delta || ""}`;
      return;
    }

    item.arguments = payload?.arguments || "";
    return;
  }

  if (
    type === "response.reasoning_summary_part.added" ||
    type === "response.reasoning_summary_part.done" ||
    type === "response.reasoning_summary_text.delta" ||
    type === "response.reasoning_summary_text.done"
  ) {
    const itemId = payload?.item_id;
    const summaryIndex = payload?.summary_index;
    if (!itemId || typeof summaryIndex !== "number") return;

    const item = findOrCreateItemById(state, itemId, payload?.output_index);
    if (!Array.isArray(item.summary)) item.summary = [];
    const summaryPart = ensureArrayAt(item.summary, summaryIndex, () => ({
      type: "summary_text",
      text: "",
    }));

    if (type === "response.reasoning_summary_part.done") {
      item.summary[summaryIndex] = payload.part || summaryPart;
      return;
    }
    if (type === "response.reasoning_summary_part.added") {
      mergeItem(summaryPart, payload.part || {});
      return;
    }
    if (type === "response.reasoning_summary_text.delta") {
      summaryPart.text = `${summaryPart.text || ""}${payload?.delta || ""}`;
      return;
    }

    summaryPart.text = payload?.text || "";
    return;
  }

  state.unknownEventTypes.add(type);
}

async function parseSSEFileToResponse(inputPath) {
  const state = createState();
  const stream = fs.createReadStream(inputPath, { encoding: "utf8" });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let currentEvent = null;
  let currentDataLines = [];

  const flushCurrentEvent = () => {
    if (!currentEvent && currentDataLines.length === 0) return;
    const dataText = currentDataLines.join("\n").trim();
    currentEvent = currentEvent || null;
    currentDataLines = [];

    if (!dataText || dataText === "[DONE]") {
      currentEvent = null;
      return;
    }

    try {
      const payload = JSON.parse(dataText);
      applyEvent(state, currentEvent, payload);
    } catch (error) {
      state.parseErrorCount += 1;
    }

    currentEvent = null;
  };

  for await (const rawLine of rl) {
    const line = rawLine.replace(/\r$/, "");

    // Blank line means current SSE event block is complete.
    if (line.trim() === "") {
      flushCurrentEvent();
      continue;
    }

    if (line.startsWith("event:")) {
      // Some dumps have no blank line between events, so flush first.
      if (currentEvent || currentDataLines.length > 0) flushCurrentEvent();
      currentEvent = line.slice("event:".length).trim();
      continue;
    }

    if (line.startsWith("data:")) {
      currentDataLines.push(line.slice("data:".length).trimStart());
      continue;
    }
  }

  flushCurrentEvent();

  const output = [...state.outputByIndex.entries()]
    .sort((a, b) => a[0] - b[0])
    .map((entry) => entry[1]);

  const response = state.response && typeof state.response === "object" ? state.response : {};
  if (output.length > 0) {
    response.output = output;
  } else if (!Array.isArray(response.output)) {
    response.output = [];
  }

  return {
    response,
    meta: {
      event_count: state.eventCount,
      parse_error_count: state.parseErrorCount,
      unknown_event_types: [...state.unknownEventTypes].sort(),
    },
  };
}

async function convertAllResponseNdjsonInDir(targetDir) {
  const entries = fs.readdirSync(targetDir, { withFileTypes: true });
  // Only convert response*.ndjson and skip already parsed snapshots.
  const inputFiles = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => /^response.*\.ndjson$/i.test(name))
    .sort();

  for (const inputFileName of inputFiles) {
    const inputPath = path.join(targetDir, inputFileName);
    const outputFileName = inputFileName.replace(/\.ndjson$/i, "-parsed.jsonc");
    const outputPath = path.join(targetDir, outputFileName);

    const result = await parseSSEFileToResponse(inputPath);
    const jsonText = `${JSON.stringify(result.response, null, 2)}\n`;
    fs.writeFileSync(outputPath, jsonText, "utf8");
    console.error(`Wrote: ${outputPath}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const runAll = args.includes("--all");
  const withMeta = args.includes("--meta");
  const positionalArgs = args.filter((arg) => arg !== "--meta" && arg !== "--all");
  if (runAll) {
    // Resolve to the samples/openai-response directory regardless of cwd.
    const samplesDir = path.dirname(fileURLToPath(import.meta.url));
    await convertAllResponseNdjsonInDir(samplesDir);
    return;
  }

  const inputArg = positionalArgs[0];
  const outputArg = positionalArgs[1];
  if (!inputArg) usageAndExit();

  const inputPath = path.resolve(process.cwd(), inputArg);
  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const result = await parseSSEFileToResponse(inputPath);
  // Default output is the reconstructed full response body.
  const outputPayload = withMeta ? result : result.response;
  const jsonText = `${JSON.stringify(outputPayload, null, 2)}\n`;

  if (outputArg) {
    const outputPath = path.resolve(process.cwd(), outputArg);
    fs.writeFileSync(outputPath, jsonText, "utf8");
    console.error(`Wrote: ${outputPath}`);
  } else {
    process.stdout.write(jsonText);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

//  node samples/openai-response/sse-to-response-json.js samples/openai-response/response1.ndjson

// node samples/openai-response/sse-to-response-json.js samples/openai-response/response1.ndjson output.json --meta
