# dsh-superagent-desktop

个人版 superagent：参考 [dsh-superagent-prototype](https://github.com/deepseek-ai/dsh-superagent-prototype) 的概念，为 DeepSeek Harness（DSH）桌面端做的插件。目标用户是个人开发者，在自己的电脑上使用。

当前进度：

- **阶段 0（骨架）已在 DSH 桌面端 0.2.1-rc.5 上验收**：侧边栏出现 Superagent 入口，面板显示「插件骨架已加载」。
- **阶段 1（领域核心）已完成代码与测试**：原型的领域核心、SQLite Store、Effects 持久队列，以及个人版 Policy。它们还没有接到插件入口上，接线放在阶段 2。

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
| 0 骨架 | 工程、bundle 清单、服务端插件、侧边栏空面板（已完成） |
| 1 领域核心 | 搬入原型的 `src/core`、Store、Effects；Policy 简化为「只有我」（已完成） |
| 2 下单与执行 | 本地来源 + 每工单一个执行器 Session 和 `git worktree` 目录 |
| 3 面板与通知 | Overview / Execution，待回答、待评审、失败时发系统通知 |
| 4 GitHub 来源 | 用本机 `gh` 监听 @提及和 PR 评审 |
| 5 主动工作 | 本地仓库与定时来源，规则默认 observe 模式 |

## 目录

| 路径 | 内容 |
| --- | --- |
| `src/index.ts` | 服务端 cordis 插件入口 |
| `src/core/` | 领域核心（原样取自原型）：Engine、模型、工单阶段、理由码，无 I/O |
| `src/policy.ts` | 个人版设置与准入：只有我、规则、accept 模式（off / observe / auto） |
| `src/app/store.ts` | SQLite 存储（`node:sqlite`），实现领域仓储、设置版本与发件箱回执 |
| `src/app/effects.ts` | 持久副作用队列：事务内入队、提交后执行、失败指数退避 |
| `src/client/` | 客户端插件：侧边栏图标、主面板、中英文案 |
| `cordis.patch.yml` | bundle 层，把插件插入 profile |
| `tests/` | vitest：bundle 清单与客户端注册 |

## 个人版准入规则（`src/policy.ts`）

| 情况 | 结果 |
| --- | --- |
| 我向智能体提请求（@ 提及、私信、本地来源） | 明确请求，任何模式都生效 |
| 我在已有工单的线程上追问 | 明确跟进 |
| 别人在已有工单的线程上追问（非私信） | 推断候选，`off` 模式下不接 |
| 我没 @ 智能体，但来源接收全部消息 | 推断候选，`off` 模式下不接 |
| 无发送者的事件（如 CI），且来源接收全部消息 | 推断候选，`off` 模式下不接 |
| 其他人直接 @ 智能体、任何 bot | 不接 |

推断候选只有在 `auto` 模式且命中已启用的规则时才会开工；默认 `observe` 只记录「本来会接单」。

部分代码取自原型（MIT），见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
