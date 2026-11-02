# 第三方代码声明

以下文件来自 [deepseek-ai/dsh-superagent-prototype](https://github.com/deepseek-ai/dsh-superagent-prototype)，按 MIT 许可证使用，部分有改动：

- `src/core/`（原样复制）及其测试 `tests/core-engine.spec.ts`、`tests/stage.spec.ts`
- `src/app/effects.ts`、`src/app/versions.ts`、`src/app/store-read.ts`、`src/infra/health.ts`（原样或仅去掉对团队版模块的依赖）及 `tests/effects.spec.ts`、`tests/fixtures/async.ts`
- `src/app/store.ts`、`src/kv.ts`、`tests/store.spec.ts`（去掉迁移链和团队版的键）
- `src/policy.ts`（改写为个人版准入，保留评估校验）

原许可证全文：

```
MIT License

Copyright (c) 2026 DeepSeek Harness Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
