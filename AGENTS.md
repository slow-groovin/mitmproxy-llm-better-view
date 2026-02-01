# 项目概述
vite-plugin-monkey@7.x + vue3
making 外挂式辅助页面 for mitmweb(react spa) 网站


# 质量要求
1. 需要完全满足的单一职责原则
2. 生成的代码带有合理的关键步骤注释, 和简要合理的函数功能注释

# 过程描述
## 原来过程
大致为: 监听route变动 -> 在打开 <uuid>/request或response时 -> GET访问flow api获取完整数据 -> 渲染出数据可视化 -> 插入到页面内位置显示

## 改造方案
监听route变动 -> 在打开 <uuid>/request或response时 -> GET访问flow api获取完整数据 -> **hook函数执行, 接受type和data, 返回一个document node**  -> 插入node到页面内位置显示
整个过程比较固定, 使用一个 pipeline.ts 中定义 export function initRouteListener(hook: Func)
                                                                           



# 项目升级 (已经完成)
当前项目:
- vite-plugin-monkey@5.x +lit

想要升级为 vite-plugin-monkey@7.x + vue


./sample-vue-init-repo 是一个使用create命令初始化的项目, 请参考
./src/old/ 存放老的业务逻辑代码, 仍能运行, 入口是 ./src/old/index.ts (老项目的代码写的一坨屎, 后续在实现新项目时, 老项目可以参考, 但是一定要主要代码质量)
./src/ 存放新的业务逻辑代码 (除了old目录之外)
升级注意:
1. 需要保证功能的完整性, 因此先不要移除旧代码, 待新代码正常工作后, 再进行清理

