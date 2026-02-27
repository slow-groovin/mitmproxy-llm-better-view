import { ApiStandard, DataType } from "@/types/flow";
import { TransferResult } from "./types";
import { openaiTransferService } from "./openai-transfer-service";
import { openaiResponsesTransferService } from "./openai-responses-transfer-service";
import { claudeTransferService } from "./claude-transfer-service";
import { geminiTransferService } from "./gemini-transfer-service";
import { adaptGeminiRequestBody, adaptGeminiResponseBody } from "./gemini-request-adapter";
import { logger } from "../logtape";

/**
 * 统一的 transfer 数据转换函数
 * 根据传入的条件调用对应的 transfer-service
 * @param standard API 标准类型
 * @param dataType 数据类型
 * @param dataAsText 原始文本数据
 * @returns TransferResult 转换结果
 */
export function unifiedTransferData(
  standard: ApiStandard,
  dataType: DataType,
  dataAsText: string
): TransferResult {
  // 如果是 sse 类型，使用 transfer 方法处理
  if (dataType === "sse") {
    // 仅 SSE 需要 transfer service，request/response 直接按 JSON 解析。
    const service = getTransferService(standard);
    return service.transfer(dataAsText);
  }

  // 对于 request 和 response，数据应该是 JSON 格式，直接解析返回
  try {
    const parsedData = JSON.parse(dataAsText);
    let normalizedData = parsedData;

    // Gemini request 支持 /v1internal 的 request 包装体适配。
    if (standard === "gemini" && dataType === "request") {
      const { adaptedBody, adapted } = adaptGeminiRequestBody(parsedData);
      normalizedData = adaptedBody;
      if (adapted) {
        logger.info("Detected Gemini /v1internal wrapper. Request body adapted.");
      }
    }

    // Gemini response 支持内部 response 包装体适配。
    if (standard === "gemini" && dataType === "response") {
      const { adaptedBody, adapted } = adaptGeminiResponseBody(parsedData);
      normalizedData = adaptedBody;
      if (adapted) {
        logger.info("Detected Gemini internal wrapper. Response body adapted.");
      }
    }

    return {
      success: true,
      data: normalizedData,
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      rawSSE: dataAsText,
      timestamp: Date.now(),
    };
  }
}

/**
 * 根据 API 标准获取对应的 transfer service
 * @param standard API 标准类型
 * @returns ITransferService 对应的 service 实例
 */
function getTransferService(standard: ApiStandard) {
  switch (standard) {
    case "openai":
      return openaiTransferService;
    case "openai-response":
      // Responses API SSE 采用专用聚合逻辑。
      return openaiResponsesTransferService;
    case "claude":
      return claudeTransferService;
    case "gemini":
      return geminiTransferService;
    default:
      throw new Error(`Unsupported API standard: ${standard}`);
  }
}
