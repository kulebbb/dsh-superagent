/** 面板文案，`[中文, English]` 成对维护。 */
const TEXT = {
  panel: ['Superagent', 'Superagent'],
  title: ['Superagent 个人版', 'Superagent Personal'],
  loaded: ['插件骨架已加载。', 'The plugin skeleton is loaded.'],
  next: ['下一阶段会在这里显示等你处理的工单。', 'Tickets waiting for you will appear here in the next stage.'],
  version: ['版本 {version}', 'Version {version}'],
} as const

export type PanelKey = keyof typeof TEXT
const language = (index: 0 | 1) => Object.fromEntries(Object.entries(TEXT).map(([key, pair]) => [key, pair[index]])) as Record<PanelKey, string>
export const zh = language(0), en = language(1)

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap { dshSuperagentDesktop: PanelKey }
}
