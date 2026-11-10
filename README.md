# dsh-superagent

个人版 superagent：参考 [dsh-superagent-prototype](https://github.com/deepseek-ai/dsh-superagent-prototype) 的概念，为 DeepSeek Harness（DSH）桌面端做的插件。目标用户是个人开发者，在自己的电脑上使用。这不是 DeepSeek 官方插件。

npm 包名是 `dsh-superagent`。npm 上已有的 `dsh-superagent-desktop` 是其他人发布的另一个包，不要安装那个名字。

当前进度：

- **阶段 0（骨架）已在 DSH 桌面端 0.2.1-rc.5 上验收**：侧边栏出现 Superagent 入口，面板显示「插件骨架已加载」。
- **阶段 1（领域核心）已完成代码与测试**：原型的领域核心、SQLite Store、Effects 持久队列，以及个人版 Policy。它们还没有接到插件入口上，接线放在阶段 2。

## 环境

- DSH 0.2.1-rc.5（`engines.dsh` 为 `^0.2.1-rc.5`，依赖锁定在这个版本）
- Node.js 22.19+ 或 24+，pnpm 11

## 安装到 DSH

仓库里已经提交构建产物 `lib/`。从 Git 安装不会执行 `build`，也不需要在 profile 的 `pnpm-workspace.yaml` 里为这个包打开 `allowBuilds`。

桌面端请用 DSH Desktop 自带的 `dsh`。npm 上的 `@deepseek-ai/dsh` 不能管理名为 `desktop` 的 profile。

```sh
dsh plugin --profile desktop add github:kulebbb/dsh-superagent
```

建议钉住一次提交，避免之后的推送换掉已经装上的代码。把 `<commit>` 换成完整的 40 位 SHA：

```sh
dsh plugin --profile desktop add github:kulebbb/dsh-superagent#<commit>
```

装到命令行 Web profile 时，把 `desktop` 换成 `web`。安装后启用该 bundle；若提示 `restart-required`，完全退出并重启 DSH。侧边栏出现 Superagent 图标，点开显示「插件骨架已加载」。阶段 1 的领域核心还没有接到这个入口上。

本包还没有发布到 npm。

## 本地开发

```sh
pnpm install
pnpm check   # 类型检查 + 构建 + 测试，产物在 lib/
```

改 `src/` 之后重新执行 `pnpm build`，并把新的 `lib/` 一起提交。Git 安装用的是仓库里的 `lib/`，不会在用户机器上编译。

本机目录安装（开发时）：

```sh
dsh plugin --profile desktop add /absolute/path/to/dsh-superagent
```

开发安装之后若提示 `restart-required`，重启 DSH。

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

部分代码取自原型（MIT），见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。本仓库本身使用 MIT 许可证，版权人 Liang Zhao，见 [LICENSE](LICENSE)。
