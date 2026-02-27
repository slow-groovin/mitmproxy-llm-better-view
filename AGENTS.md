# 项目概述
vite-plugin-monkey@7.x + vue3 (making 外挂式辅助页面 for mitmweb(react spa) 网站)
功能: 大模型请求/响应的可视化
1. openai/gemini/claude 三种api格式
2. 响应包括普通/SSE

# TASK
## current task
openai新出了 新型API:  /v1/response  api
> 背景知识, /api/v1/chat/completions 是第一代API(现有的src/components/llm/openai/*  就是它的渲染), /api/v1/response 是第二代API, 被称为Response API

已经添加实例 ./sample/openai-response
现在为request生成新的: types和RequestView渲染(页面和组件)



# 质量要求
1. 需要完全满足的单一职责原则
2. edit和新增代码时, 必须带有简短且合理的注释

# 注意!
- 严格遵循用户指令的任务要求!
- ./src/old/ 下的文件仅供参考, 不要再进行更新!!!!
- 不要运行 `npm run dev`, 那样会让你一直卡住!!!!
- reasoning = thinking, 是不同standard中相同东西的不同name

# 任务路线
1. 三种api厂商标准, 的请求/响应的typescript类型声明(共计6种)  以及SSE响应时的wrapper类型声明(3种), 总共9种  (type创建在 ./src/types目录下) ✅Done
2. 三种SSE的解析转换函数 ✅Done
3. 为每种标准的api的requst/response生成可视化页面组件 (进行中)
   1. 数据传输方式: 通过prop制定具体类型的对象
   2. request: 
      1. 使用模型, temperature, top_p, id 等基本信息
      2. 其它非重要单项信息,以可折叠table(table原生元素)的方式列举
      3. messages不同类型
      4. tools不同类型
      5. 系统提示词(如果有非messagess单独的呈现的)
   3. response: 要求同request
   4. sse: 转换为response并和response同样方式展示, 额外增加一个sse event数量
   5. 尽量组件化, 特别是messages, tools的Item, 必须组件化, 可折叠(和old一样)也是单独组件化
   6. message, tools的Item组件, 需要有 id prop (用作后续功能), 尽量通过原数据中的id, 如果没有,使用hash id
   7. 未来必然有很多修改, 整体代码逻辑需要清晰化, 可变更化

4. 交互流程
## 进行中的任务3
OpenaiRequestView.vue以及 OpenaiResponseView.vue 以及子组件, Claude相关的页面和组件 已经是成熟的,  经过人工调整的显示组件:
1. 类型专用, 符合Openai Request types, 而不是通用组件接受各种不同标准的data, 耗费无尽的工作在适配上还不好
2. 无字段损失/胡适
3. tool-messages 根据tool id进行跳转
4. 折叠 展开 并记忆状态, 通用的用localStorage, 详细的用sessionStorage



后续:
1. 增加openai response api的类型
# 过程描述
## 原来过程
大致为: 监听route变动 -> 在打开 <uuid>/request或response时 -> GET访问flow api获取完整数据 -> 渲染出数据可视化 -> 插入到页面内位置显示

## 原有文件结构
```text
./src/old/
├── templates/
│   ├── css.ts (样式定义：包含 LLM 预览页面的布局和视觉 CSS)
│   ├── openai-req.ts (请求模板：渲染 OpenAI API 请求的主体内容)
│   ├── openai-res-sse.ts (SSE 响应模板：渲染处理后的流式事件响应数据)
│   ├── openai-res.ts (JSON 响应模板：渲染标准的 OpenAI API JSON 响应)
│   └── utils.ts (渲染工具：Markdown 解析、JSON/XML 格式化等辅助函数)
├── index.ts (主入口：监听路由、获取 Flow 数据并控制整体渲染流程)
├── sse.ts (SSE 处理：聚合增量事件，合并重建完整的响应内容)
├── types.ts (类型定义：定义流量对象及 API 操作的 TypeScript 接口)
└── utils.ts (通用工具：LRU 缓存实现及对象操作辅助函数)
```


## 新的整体流程架构变动(pipeline.ts)
监听route变动 -> 在打开 <uuid>/request或response时 -> GET访问flow api获取完整数据 -> **hook函数执行, 接受type和data, 返回一个document node**  -> 插入node到页面内位置显示



## 新增: 可手动切换
> 目的,程序无法识别所有的情况
用户可以手动切换, 进行不同llm格式的预览
                                                                           


# samples
`./samples/`下存放各种请求/响应的实例

# files-functional-introduction-tree
```text
.
├── AGENTS.md (协作约束、任务背景、开发注意事项)
├── README.md (项目说明与基础使用)
├── docs/
│   ├── README_CN.md (中文文档与说明)
│   └── *.png (功能截图与流程示意图)
├── samples/ (用于调试与回归的输入输出样本)
│   ├── openai/ (OpenAI request/response/sse 示例)
│   ├── gemini/ (Gemini request/response/sse 示例)
│   ├── gemini-internal/request.jsonc (Gemini /v1internal wrapper 请求示例)
│   └── claude/ (Claude request/response/sse 示例)
├── src/
│   ├── main.ts (Vue 应用启动入口)
│   ├── entry.ts (外挂注入入口，连接 mitmweb 页面与渲染流水线)
│   ├── App.vue (应用根组件)
│   ├── style.css (全局基础样式)
│   ├── old/ (历史实现，仅参考，禁止继续修改)
│   ├── lib/
│   │   ├── pipeline.ts (核心流程: 路由监听 -> 拉取 flow -> hook 渲染 -> 注入节点)
│   │   ├── page-injector.ts (页面 DOM 挂载/替换逻辑)
│   │   ├── constant.ts (流程与渲染相关常量定义)
│   │   ├── judge.ts (LLM 厂商/类型识别与分流判断)
│   │   ├── logtape.ts (调试日志收集与输出封装)
│   │   └── transfer/
│   │       ├── types.ts (统一转换层类型定义)
│   │       ├── unified.ts (统一转换入口与调度)
│   │       ├── openai-transfer-service.ts (OpenAI 数据转换实现)
│   │       ├── gemini-transfer-service.ts (Gemini 数据转换实现)
│   │       ├── claude-transfer-service.ts (Claude 数据转换实现)
│   │       └── gemini-request-adapter.ts (Gemini request 结构适配, 含 internal wrapper 处理点)
│   ├── types/ (协议级类型定义与测试)
│   │   ├── flow.ts (mitm flow 结构类型)
│   │   ├── openai/ (chat request/response/sse/common 类型与测试)
│   │   ├── gemini/ (request/response/sse/common 类型与测试)
│   │   └── claude/ (request/response/sse 类型与测试)
│   ├── components/
│   │   ├── llm/
│   │   │   ├── ViewDashboardProxy.vue (总览视图代理与入口容器)
│   │   │   ├── openai/ (OpenAI 请求/响应及子项展示组件)
│   │   │   ├── gemini/ (Gemini 请求/响应及子项展示组件)
│   │   │   ├── claude/ (Claude 请求/响应及子项展示组件)
│   │   │   ├── MessageItem.vue / SubMessageItem.vue (通用消息块展示)
│   │   │   ├── ToolItem.vue / ToolArgs.vue / ToolParameters.vue (工具调用展示)
│   │   │   └── RoleBadge.vue (角色标识 UI)
│   │   ├── container/ (可折叠区块、tabs 等容器组件)
│   │   ├── content/ (JSON/XML/Raw/Prose/图片等内容渲染组件)
│   │   ├── common/ (复制、展开、格式切换等通用按钮组件)
│   │   └── debug/ (调试页面辅助组件)
│   ├── pages/
│   │   ├── Dashboard.vue (主面板页面)
│   │   └── debug/ (调试路由页面集合)
│   ├── store/
│   │   ├── llm.ts (LLM 展示状态存储)
│   │   └── debug.ts (调试状态存储)
│   ├── utils/
│   │   ├── format/ (时间、JSON、内容格式化工具)
│   │   ├── id/hashId.ts (稳定 hash id 生成工具)
│   │   └── scroll.ts (滚动与定位辅助)
│   ├── styles/llm-common.css (LLM 视图共用样式)
│   └── assets/ (图标与静态资源)
└── sample-vue-init-repo/ (初始化模板仓库副本，仅作参考)
```
