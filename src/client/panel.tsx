/** 主面板。阶段 0 只展示加载状态；阶段 3 起改为「等我处理的工单」概览。 */
import { VERSION } from '../index.ts'

export type T = (key: 'title' | 'loaded' | 'next' | 'version', params?: Record<string, string>) => string

export function Panel({ t }: { t: T }) {
  return <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
    <h2 style={{ margin: 0 }}>{t('title')}</h2>
    <p style={{ margin: 0 }}>{t('loaded')}</p>
    <p style={{ margin: 0, opacity: 0.7 }}>{t('next')}</p>
    <small style={{ opacity: 0.5 }}>{t('version', { version: VERSION })}</small>
  </div>
}
