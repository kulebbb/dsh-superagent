# Security Policy / 安全策略

## Supported Versions / 支持的版本

本项目目前处于早期开发阶段，只有 `main` 分支的最新代码会接收安全修复。
The project is in early development. Only the latest code on `main` receives security fixes.

| Version | Supported |
| ------- | --------- |
| `main` (latest) | ✅ |
| older commits / releases | ❌ |

## Reporting a Vulnerability / 报告漏洞

**请不要通过公开的 Issue、Discussion 或 Pull Request 报告安全漏洞。**
**Please do not report security vulnerabilities through public issues, discussions, or pull requests.**

请使用 GitHub 的私密漏洞报告功能：
Use GitHub private vulnerability reporting instead:

1. 打开仓库的 **Security** 标签页 / Open the repository's **Security** tab
2. 点击 **Report a vulnerability** / Click **Report a vulnerability**
3. 填写表单 / Fill in the advisory form

直达链接 / Direct link: <https://github.com/kulebbb/dsh-superagent/security/advisories/new>

报告中请尽量包含 / Please include, where possible:

- 漏洞类型（例如：命令注入、凭据泄露、路径穿越、提示词注入导致的越权操作等）
  Vulnerability type (e.g. command injection, credential leak, path traversal, prompt-injection-driven privilege escalation)
- 受影响的文件路径、分支或提交 / Affected file paths, branch, or commit
- 复现步骤或 PoC / Steps to reproduce or a proof of concept
- 影响评估 / Impact assessment

## Response Process / 处理流程

- 我们会在 **3 个工作日内** 确认收到报告 / We aim to acknowledge reports within **3 business days**.
- 确认漏洞后，会在私密 Security Advisory 中与报告者协作修复 / Confirmed issues are fixed collaboratively in a private security advisory.
- 修复发布后公开披露，并在报告者同意的情况下致谢 / We disclose publicly after a fix is released and credit reporters who wish to be credited.

## Scope Notes / 范围说明

本项目是一个 AI Agent / 插件类项目。以下问题尤其欢迎报告：
This is an AI agent / plugin project. Reports in these areas are especially welcome:

- API Key、Token 等凭据被记录、泄露或上传 / API keys or tokens being logged, leaked, or uploaded
- Agent 在未经用户确认的情况下执行命令、读写文件或访问网络 / The agent running commands, touching files, or reaching the network without user confirmation
- 通过外部内容（网页、文件、工具返回值）进行的提示词注入，导致越权操作 / Prompt injection via external content that leads to unauthorized actions
- 依赖项或构建流水线中的供应链风险 / Supply-chain risks in dependencies or the build pipeline
