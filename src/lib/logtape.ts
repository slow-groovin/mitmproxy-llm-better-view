import { configure, getConsoleSink } from "@logtape/logtape";

await configure({
  sinks: {
    console: getConsoleSink()
  },
  loggers: [
    {
      category: "llm-better-view",
      lowestLevel: "debug",
      sinks: ["console"]
    }
  ]
});

import { getLogger } from "@logtape/logtape";

export const logger = getLogger(["llm-better-view"]);
