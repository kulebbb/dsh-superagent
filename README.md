# dsh-superagent-desktop

个人版 superagent：参考 [dsh-superagent-prototype](https://github.com/deepseek-ai/dsh-superagent-prototype) 的概念，为 DeepSeek Harness（DSH）桌面端做的插件。目标用户是个人开发者，在自己的电脑上使用。

当前处于**阶段 0（骨架）**：插件能安装到 DSH，侧边栏出现 Superagent 入口，打开后是一个空面板。

## 环境

- DSH 0.2.1-rc.5（`engines.dsh` 为 `^0.2.1-rc.5`，依赖锁定在这个版本）
- Node.js 22.19+ 或 24+，pnpm 11

## 构建

```sh
pnpm install
pnpm check   # 类型检查 + 测试 + 构建，产物在 lib/
```

## 安装到 DSH 桌面端

1. 在本目录执行 `pnpm install && pnpm build`。
2. 打开 DSH 的 **Plugins（插件）** 页面，安装来源填本目录的绝对路径（插件管理器会读取它的 `package.json`）。
3. 安装后启用该 bundle；若提示 `restart-required`，重启 DSH。
4. 侧边栏出现 Superagent 图标，点开显示「插件骨架已加载」。

改代码后需要重新 `pnpm build` 并重启 DSH。

## 阶段计划

| 阶段 | 内容 |
| --- | --- |
| 0 骨架 | 工程、bundle 清单、服务端插件、侧边栏空面板（当前） |
| 1 领域核心 | 搬入原型的 `src/core`、Store、Effects；Policy 简化为「只有我」 |
| 2 下单与执行 | 本地来源 + 每工单一个执行器 Session 和 `git worktree` 目录 |
| 3 面板与通知 | Overview / Execution，待回答、待评审、失败时发系统通知 |
| 4 GitHub 来源 | 用本机 `gh` 监听 @提及和 PR 评审 |
| 5 主动工作 | 本地仓库与定时来源，规则默认 observe 模式 |

## 目录

| 路径 | 内容 |
| --- | --- |
| `src/index.ts` | 服务端 cordis 插件入口 |
| `src/client/` | 客户端插件：侧边栏图标、主面板、中英文案 |
| `cordis.patch.yml` | bundle 层，把插件插入 profile |
| `tests/` | vitest：bundle 清单与客户端注册 |
