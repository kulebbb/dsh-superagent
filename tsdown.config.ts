import { defineConfig } from 'tsdown'

// 服务端入口打成 ESM；客户端入口打成浏览器 CJS，并按 DSH 客户端模块加载器的约定包一层（与原型一致）。
export default defineConfig([
  { entry: { index: 'src/index.ts' }, outDir: 'lib', format: 'esm', fixedExtension: false, platform: 'node', target: 'es2024', dts: true, clean: true,
    deps: { neverBundle: [/^@deepseek-ai\//] } },
  { entry: { client: 'src/client/index.tsx' }, outDir: 'lib', format: 'cjs', platform: 'browser', dts: false, clean: false,
    deps: { neverBundle: ['react', 'react/jsx-runtime', 'react-dom', /^@deepseek-ai\//] },
    outputOptions: { entryFileNames: 'client.js',
      banner: 'window.__ModuleLoader__.load({ id: "dsh-superagent-desktop", factory: (require) => {',
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;' } },
])
