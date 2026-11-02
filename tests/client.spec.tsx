// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'
import { apply, NS, PANEL_ID } from '../src/client/index.tsx'
import { en, zh } from '../src/client/locales.ts'
import { Panel } from '../src/client/panel.tsx'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function fakeContext() {
  const registered: Array<{ spec: Record<string, unknown>; component: unknown }> = []
  const dictionaries: Record<string, unknown> = {}
  const ctx = {
    effect: (run: () => unknown) => { run() },
    locale: {
      register: (ns: string, dicts: unknown) => { dictionaries[ns] = dicts; return () => {} },
      bind: () => (key: string) => (zh as Record<string, string>)[key] ?? key,
    },
    slots: {
      inject: (_name: string, run: () => unknown) => { run() },
      register: (spec: Record<string, unknown>, component: unknown) => { registered.push({ spec, component }); return () => {} },
    },
  }
  return { ctx, registered, dictionaries }
}

describe('client plugin', () => {
  it('registers dictionaries, the main panel and the sidebar icon under one id', () => {
    const { ctx, registered, dictionaries } = fakeContext()
    apply(ctx as never)
    expect(dictionaries[NS]).toEqual({ zh, en })
    expect(registered.map(r => r.spec.name)).toEqual(['main', 'sidebar.panellist'])
    expect(registered[0]!.spec.key).toBe(PANEL_ID)
    expect(registered[1]!.spec.id).toBe(PANEL_ID)
    expect((registered[1]!.spec.label as () => string)()).toBe('Superagent')
  })
  it('keeps both languages complete', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort())
  })
  it('renders the panel with its version', () => {
    const host = document.createElement('div')
    const t = (key: string, params?: Record<string, string>) => (zh as Record<string, string>)[key]!.replace('{version}', params?.version ?? '')
    act(() => { createRoot(host).render(<Panel t={t as never} />) })
    expect(host.textContent).toContain('Superagent 个人版')
    expect(host.textContent).toContain('版本 0.0.1')
  })
})
