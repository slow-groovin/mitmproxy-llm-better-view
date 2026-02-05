# 项目概述
vite-plugin-monkey@7.x + vue3 (making 外挂式辅助页面 for mitmweb(react spa) 网站)
功能: 大模型请求/响应的可视化
1. openai/gemini/claude 三种api格式
2. 响应包括普通/SSE


# 质量要求
1. 需要完全满足的单一职责原则
2. edit和新增代码时, 必须带有简短且合理的注释

# 注意!
- 严格遵循用户指令的任务要求!
- ./src/old/ 下的文件仅供参考, 不要再进行更新!!!!

# 任务路线
1. 三种api厂商标准, 的请求/响应的typescript类型声明(共计6种)  以及SSE响应时的wrapper类型声明(3种), 总共9种  (type创建在 ./src/types目录下) ✅Done
2. 三种SSE的解析转换函数
3. 为每种标准的api的requst/response生成组件
4. 交互流程

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