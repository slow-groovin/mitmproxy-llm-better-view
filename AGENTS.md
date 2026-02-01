# 项目概述
vite-plugin-monkey@7.x + vue3
making 外挂式辅助页面 for mitmweb(react spa) 网站

# 项目升级
当前项目:
- vite-plugin-monkey@5.x +lit

想要升级为 vite-plugin-monkey@7.x + vue


./sample-vue-init-repo 是一个使用create命令初始化的项目, 请参考
./src/old/ 存放老的业务逻辑代码, 仍能运行, 入口是 ./src/old/index.ts
./src/ 存放新的业务逻辑代码 (除了old目录之外)
升级注意:
1. 需要保证功能的完整性, 因此先不要移除旧代码, 待新代码正常工作后, 再进行清理

