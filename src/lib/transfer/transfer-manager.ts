import type { LLMProvider, Flow, TransferResult, ITransferService } from './types';
import { openaiTransferService } from './openai-service';

/**
 * Transfer Manager
 * 管理所有 LLM 提供商的 transfer service，提供统一的入口
 */
export class TransferManager {
  private services: Map<LLMProvider, ITransferService> = new Map();

  constructor() {
    // 注册 OpenAI service
    this.register(openaiTransferService);

    // TODO: 未来添加 Claude 和 Gemini 服务
    // this.register(claudeTransferService);
    // this.register(geminiTransferService);
  }

  /**
   * 注册 transfer service
   */
  register(service: ITransferService): void {
    this.services.set(service.provider, service);
  }

  /**
   * 根据提供商获取 service
   */
  getService(provider: LLMProvider): ITransferService | undefined {
    return this.services.get(provider);
  }

  /**
   * 自动检测并处理 Flow
   */
  async autoTransfer(flow: Flow): Promise<TransferResult> {
    // 遍历所有 service，找到能处理的
    for (const service of this.services.values()) {
      if (service.canHandle(flow)) {
        try {
          const sseContent = await service.getSSEContent(flow);
          return service.transfer(sseContent);
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            timestamp: Date.now(),
          };
        }
      }
    }

    return {
      success: false,
      error: 'No transfer service can handle this flow',
      timestamp: Date.now(),
    };
  }

  /**
   * 使用指定提供商处理 Flow
   */
  async transferWithProvider(
    provider: LLMProvider,
    flow: Flow
  ): Promise<TransferResult> {
    const service = this.getService(provider);

    if (!service) {
      return {
        success: false,
        error: `No transfer service found for provider: ${provider}`,
        timestamp: Date.now(),
      };
    }

    try {
      const sseContent = await service.getSSEContent(flow);
      return service.transfer(sseContent);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 获取所有支持的提供商
   */
  getProviders(): LLMProvider[] {
    return Array.from(this.services.keys());
  }
}

/**
 * 单例实例
 */
export const transferManager = new TransferManager();
