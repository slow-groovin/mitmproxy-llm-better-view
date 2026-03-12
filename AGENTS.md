# 项目概述
vite-plugin-monkey@7.x + Vue 3，用于给 mitmweb（React SPA）注入外挂式 LLM 请求/响应可视化页面。

当前支持与规划中的标准：
1. OpenAI Chat Completions
2. OpenAI Responses API
3. Gemini
4. Claude
5. 普通 JSON 响应与 SSE 响应




# TASK


# 质量要求
1. 必须尽量满足单一职责原则
2. edit 和新增代码时，必须带有简短且合理的注释
3. 优先做“类型专用组件”，不要为了兼容所有厂商而把组件抽象得过度复杂
4. 不允许字段丢失、胡乱映射、或者为了展示方便篡改语义
5. 整体结构必须清晰，方便未来频繁调整


# 注意事项
- 严格遵循用户指令的任务要求
- `./src/old/` 下的文件仅供参考，不要再进行更新
- 不要运行 `npm run dev`，那样会卡住
- `reasoning = thinking`，是在不同 standard 中对同一概念的不同命名
- 如果做的是现有代码库内任务，应优先做“外科手术式修改”，不要顺手重构无关部分



# 页面要求参考
## 数据传输方式
通过 prop 传入“已确定类型”的对象，不走模糊的 any 通用适配。

## request 页面要求
1. 展示 model、temperature、top_p、id 等基础信息
2. 其它非重要单项信息，使用可折叠 table（原生 `table`）列举
3. `input/messages` 不同类型要分别清晰展示
4. `tools` 不同类型要分别清晰展示
5. 如果存在独立系统提示词（例如 `instructions`），要单独展示

## response 页面要求
1. 要求与 request 同等完整
2. 不丢字段
3. 重点展示 output item、tool call、usage、status、error 等信息

## sse 页面要求
1. 先转换为 response
2. 再与 response 使用同样的展示方式
3. 额外展示 SSE event 数量，以及必要的 SSE meta 信息

## 组件化要求
1. 尽量组件化
2. 尤其是 `messages/input items`、`tools` 的 Item，必须拆成独立组件
3. 可折叠能力也要组件化，不要每个页面自己重复拼装
4. 未来一定会继续修改，所以结构必须清晰、低耦合、可替换

## id 要求
1. message / tool item 组件必须有 `id` prop
2. 优先使用原始数据中的 `id`
3. 若没有，则使用稳定 hash id

## 交互要求
1. `tool-messages` 需要支持根据 tool id 做跳转
2. 折叠 / 展开要能记忆状态
3. 通用折叠状态优先 `localStorage`
4. 详情级折叠状态优先 `sessionStorage`


# 当前实现认知
## 已确认的接入点
1. `ViewDashboardProxy.vue`
   - 已能根据 standard + dataType 分发到不同 LLM 视图
   - `openai-response` 已有独立 request / response 视图入口
2. `unified.ts`
   - 普通 request / response 直接 JSON.parse
   - SSE 通过各自 transfer service 转换
   - `openai-response` 已使用专用 SSE 聚合服务
3. `openai-responses-transfer-service.ts`
   - 已能把 Responses API SSE 聚合成 response wrapper
4. `src/components/llm/openai-response/`
   - 已存在 request / response 页面
   - 已存在 input item / tool item 子组件

## 这意味着
后续工作应以“补齐细节、修正展示、完善结构”为主，而不是重复造轮子。


# 原有与当前流程
## 原来流程
监听 route 变动 -> 打开 `<uuid>/request` 或 `<uuid>/response` -> GET flow api 获取完整数据 -> 渲染数据可视化 -> 插入页面

## 当前流程（pipeline）
监听 route 变动 -> 打开 `<uuid>/request` 或 `<uuid>/response` -> GET flow api 获取完整数据 -> hook 函数执行，接收 type 和 data，返回 `document node` -> 插入页面


# 新增能力
## 可手动切换标准
目的：程序无法识别所有情况，因此允许用户手动切换不同 LLM 格式的预览。


# samples
`./samples/` 下存放各种请求 / 响应实例，用于开发调试与回归检查。


# 目录认知（按当前仓库实际）
```text
.
├── AGENTS.md
├── README.md
├── docs/
├── samples/
│   ├── openai/
│   ├── openai-response/
│   ├── gemini/
│   ├── gemini-internal/
│   └── claude/
├── src/
│   ├── main.ts
│   ├── entry.ts
│   ├── App.vue
│   ├── style.css
│   ├── old/                        (历史实现，仅参考，禁止修改)
│   ├── lib/
│   │   ├── pipeline.ts
│   │   ├── page-injector.ts
│   │   ├── constant.ts
│   │   ├── logtape.ts
│   │   └── transfer/
│   │       ├── types.ts
│   │       ├── unified.ts
│   │       ├── openai-transfer-service.ts
│   │       ├── openai-responses-transfer-service.ts
│   │       ├── gemini-transfer-service.ts
│   │       ├── claude-transfer-service.ts
│   │       └── gemini-request-adapter.ts
│   ├── llm/
│   │   └── judge.ts
│   ├── types/
│   │   ├── flow.ts
│   │   ├── openai/
│   │   ├── openai-response/
│   │   ├── gemini/
│   │   └── claude/
│   ├── components/
│   │   ├── llm/
│   │   │   ├── ViewDashboardProxy.vue
│   │   │   ├── openai/
│   │   │   ├── openai-response/
│   │   │   ├── gemini/
│   │   │   ├── claude/
│   │   │   └── 通用消息 / 工具子组件
│   │   ├── container/
│   │   ├── content/
│   │   ├── common/
│   │   └── debug/
│   ├── pages/
│   ├── store/
│   ├── utils/
│   ├── styles/
│   └── assets/
└── sample-vue-init-repo/
```


# 工作方式要求
1. 修改前先判断是否已有专用组件或现成结构可复用
2. 优先延续现有成熟页面风格（尤其 OpenAI / Claude）
3. 不要把厂商专用页面硬抽象成一个超级通用组件
4. 如果只是新增某一标准的支持，应尽量只改该标准相关文件与接入层
5. 非必要不要扩大修改范围


# 一句话决策原则
如果在“更通用”和“更符合当前标准、字段完整、后续好改”之间冲突，优先后者。
