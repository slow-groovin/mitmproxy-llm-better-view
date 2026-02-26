/**
 * 尝试将 /v1internal 的 Gemini 请求体适配为标准 Gemini 请求体。
 * 仅在存在 request 包装且不存在 content 字段时进行解包。
 */
export function adaptGeminiRequestBody(rawBody: unknown): {
  adaptedBody: unknown;
  adapted: boolean;
} {
  // 只处理对象类型，其他类型直接返回。
  if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
    return { adaptedBody: rawBody, adapted: false };
  }

  const body = rawBody as Record<string, unknown>;
  const shouldTryAdapt = "request" in body && !("content" in body);
  if (!shouldTryAdapt) {
    return { adaptedBody: rawBody, adapted: false };
  }

  // request 包装体不是对象时，不做转换。
  const wrappedRequest = body.request;
  if (!wrappedRequest || typeof wrappedRequest !== "object" || Array.isArray(wrappedRequest)) {
    return { adaptedBody: rawBody, adapted: false };
  }

  return {
    adaptedBody: wrappedRequest,
    adapted: true,
  };
}

/**
 * 尝试将内部 Gemini 响应包装体适配为标准 Gemini 响应体。
 * 仅在存在 response 包装且顶层不存在 candidates 字段时进行解包。
 */
export function adaptGeminiResponseBody(rawBody: unknown): {
  adaptedBody: unknown;
  adapted: boolean;
} {
  // 只处理对象类型，其他类型直接返回。
  if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
    return { adaptedBody: rawBody, adapted: false };
  }

  const body = rawBody as Record<string, unknown>;
  const shouldTryAdapt = "response" in body && !("candidates" in body);
  if (!shouldTryAdapt) {
    return { adaptedBody: rawBody, adapted: false };
  }

  // response 包装体不是对象时，不做转换。
  const wrappedResponse = body.response;
  if (!wrappedResponse || typeof wrappedResponse !== "object" || Array.isArray(wrappedResponse)) {
    return { adaptedBody: rawBody, adapted: false };
  }

  return {
    adaptedBody: wrappedResponse,
    adapted: true,
  };
}
