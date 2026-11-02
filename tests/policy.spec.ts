import { describe, expect, it } from 'vitest'
import type { Mandate, SourceScope, Thread, Ticket, Trigger } from '../src/core/index.ts'
import { assessmentOutcome, isOwner, LOCAL_SOURCE, policyEffects, policyVersion, settingsPolicy, SettingsSchema, type Settings } from '../src/policy.ts'

/** GitHub listens to everything; repository `quiet` is listened to for mentions only; `gone` is not listened to. */
const scope: SourceScope = {
  scope: ({ meta }) => meta.repo === 'gone' ? { listened: false, reason: 'off' } : { listened: true, observed: meta.repo !== 'quiet' },
}
const settings = (patch: { mode?: 'off' | 'observe' | 'auto'; owner?: Record<string, string[]>; rules?: Settings['policy']['rules'] } = {}): Settings =>
  SettingsSchema.parse({ policy: { owner: patch.owner ?? { github: ['Kulebbb'] }, rules: patch.rules ?? [] }, eval: { mode: patch.mode ?? 'observe' } })
const trigger = (fields: Partial<Trigger> = {}): Trigger => ({ id: 't', source: 'github', threads: [{ source: 'github', id: '1' }],
  actor: { source: 'github', id: 'kulebbb' }, human: true, at: '2026-11-02T00:00:00.000Z', text: 'hi', meta: { repo: 'main' }, ...fields })
const thread = (fields: Partial<Thread> = {}): Thread =>
  ({ key: 'github:1', ref: { source: 'github', id: '1' }, createdAt: '', subscriptions: [], correlated: [], pending: [], meta: {}, ...fields })
const withTicket = thread({ subscriptions: ['k1'] })
const gate = (s: Settings, t: Trigger, th = thread()) => settingsPolicy(s, scope).gate(t, th, [])
const rule = { id: 'tests', name: 'Fix red tests', enabled: true, instruction: 'Fix a failing test on the default branch.' }

describe('who is me', () => {
  it('counts anyone on the local Source, and my identities elsewhere regardless of case', () => {
    const s = settings()
    expect(isOwner(s, { source: LOCAL_SOURCE, id: 'anything' })).toBe(true)
    expect(isOwner(s, { source: 'github', id: 'KULEBBB' })).toBe(true)
    expect(isOwner(s, { source: 'github', id: 'someone' })).toBe(false)
    expect(isOwner(s, { source: 'feishu', id: 'kulebbb' })).toBe(false)
  })
})

describe('gate', () => {
  it('makes my request to the agent explicit in every mode', () => {
    for (const mode of ['off', 'observe', 'auto'] as const) {
      expect(gate(settings({ mode }), trigger({ addressed: 'mention' }))).toMatchObject({ admissible: true, strength: 'explicit', basis: { via: 'addressed', sender: 'me' } })
    }
    const local = trigger({ source: LOCAL_SOURCE, actor: { source: LOCAL_SOURCE, id: 'me' }, addressed: 'direct', meta: {} })
    expect(gate(settings(), local)).toMatchObject({ admissible: true, strength: 'explicit' })
  })
  it('makes my follow-up explicit, and someone else\'s inferred unless the mode is off or the thread is a direct message', () => {
    expect(gate(settings(), trigger(), withTicket)).toMatchObject({ admissible: true, strength: 'explicit', basis: { via: 'followup' } })
    const other = trigger({ actor: { source: 'github', id: 'someone' } })
    expect(gate(settings(), other, withTicket)).toMatchObject({ admissible: true, strength: 'inferred', basis: { via: 'followup' } })
    expect(gate(settings({ mode: 'off' }), other, withTicket)).toEqual({ admissible: false, reason: 'not_a_member' })
    expect(gate(settings(), { ...other, addressed: 'direct' }, withTicket)).toEqual({ admissible: false, reason: 'not_a_member' })
  })
  it('does not count a thread followed only for context as having tickets', () => {
    const other = trigger({ actor: { source: 'github', id: 'someone' } })
    expect(gate(settings(), other, thread({ subscriptions: ['k1'], context: ['k1'] }))).toEqual({ admissible: false, reason: 'not_a_member' })
  })
  it('refuses someone else who addresses the agent where no ticket is', () => {
    expect(gate(settings(), trigger({ actor: { source: 'github', id: 'someone' }, addressed: 'mention' }))).toEqual({ admissible: false, reason: 'not_a_member' })
  })
  it('makes my unaddressed message an inferred candidate only where the Source receives every message and the mode is not off', () => {
    expect(gate(settings(), trigger())).toMatchObject({ admissible: true, strength: 'inferred', basis: { via: 'admission', cell: 'listedUnaddressed', observation: { mode: 'observe' } } })
    expect(gate(settings(), trigger({ meta: { repo: 'quiet' } }))).toEqual({ admissible: false, reason: 'no_mention' })
    expect(gate(settings({ mode: 'off' }), trigger())).toEqual({ admissible: false, reason: 'admission_ignored' })
  })
  it('admits a senderless event such as CI as inferred where everything is received, and no bot at all', () => {
    const ci = trigger({ human: false, actor: { source: 'github', id: '' } })
    expect(gate(settings(), ci)).toMatchObject({ admissible: true, strength: 'inferred', basis: { cell: 'unlistedUnaddressed' } })
    expect(gate(settings({ mode: 'off' }), ci)).toEqual({ admissible: false, reason: 'not_human' })
    expect(gate(settings(), trigger({ human: false, actor: { source: 'github', id: 'dependabot[bot]' }, addressed: 'mention' }))).toEqual({ admissible: false, reason: 'not_human' })
  })
})

describe('revalidate', () => {
  const mandate = (fields: Partial<Mandate> & Pick<Mandate, 'basis'>): Mandate =>
    ({ strength: 'explicit', policyVersion: '', actor: { source: 'github', id: 'kulebbb' }, scope: '', ...fields })
  const holds = (s: Settings, m: Mandate) => settingsPolicy(s, scope).revalidate(m)
  it('keeps my explicit work while I stay the owner and the Source still listens', () => {
    const m = mandate({ basis: { via: 'addressed', addressed: 'mention', source: 'github', scope: { repo: 'main' } } })
    expect(holds(settings(), m)).toBe(true)
    expect(holds(settings({ owner: {} }), m)).toBe(false)
    expect(holds(settings(), mandate({ basis: { ...m.basis, scope: { repo: 'gone' } } }))).toBe(false)
    expect(holds(settings({ owner: {} }), mandate({ basis: { via: 'followup' } }))).toBe(true)
  })
  it('keeps inferred work only in auto mode with its matched rules still enabled', () => {
    const m = mandate({ strength: 'inferred', basis: { via: 'admission', cell: 'listedUnaddressed', observation: { mode: 'auto' }, rules: ['tests'] } })
    expect(holds(settings({ mode: 'auto', rules: [rule] }), m)).toBe(true)
    expect(holds(settings({ mode: 'observe', rules: [rule] }), m)).toBe(false)
    expect(holds(settings({ mode: 'auto', rules: [{ ...rule, enabled: false }] }), m)).toBe(false)
    expect(holds(settings({ mode: 'auto', rules: [rule], owner: {} }), m)).toBe(false)
    const followup = mandate({ strength: 'inferred', basis: { via: 'followup', rules: ['tests'] } })
    expect([holds(settings({ mode: 'auto', rules: [rule] }), followup), holds(settings({ rules: [rule] }), followup)]).toEqual([true, false])
  })
  it('admits inferred acceptance only in auto mode on enabled rules', () => {
    expect(settingsPolicy(settings({ mode: 'auto', rules: [rule] }), scope).admitsInferred(['tests'])).toBe(true)
    expect(settingsPolicy(settings({ mode: 'auto', rules: [rule] }), scope).admitsInferred([])).toBe(false)
    expect(settingsPolicy(settings({ rules: [rule] }), scope).admitsInferred(['tests'])).toBe(false)
  })
})

describe('policy version and effects', () => {
  it('changes the version with rules, mode and my identities, and not with concurrency or pause', () => {
    const base = settings()
    expect(policyVersion({ ...base, paused: true, executor: { ...base.executor, maxWorkers: 2 } })).toBe(policyVersion(base))
    expect(policyVersion(settings({ mode: 'auto' }))).not.toBe(policyVersion(base))
    expect(policyVersion(settings({ owner: {} }))).not.toBe(policyVersion(base))
    expect(policyVersion(settings({ rules: [rule] }))).not.toBe(policyVersion(base))
  })
  it('tells a live ticket when its rule changes, when its requester is no longer me, and when proactive work stops', () => {
    const ticket = (id: string, mandate: Mandate) => ({ id, mandate }) as Ticket
    const tickets = [
      ticket('mine', { strength: 'explicit', policyVersion: '', actor: { source: 'github', id: 'kulebbb' }, scope: '', basis: { via: 'addressed', addressed: 'mention' } }),
      ticket('proactive', { strength: 'inferred', policyVersion: '', actor: { source: 'github', id: '' }, scope: '',
        basis: { via: 'admission', cell: 'unlistedUnaddressed', observation: { mode: 'auto' }, rules: ['tests'] } }),
    ]
    const old = settings({ mode: 'auto', rules: [rule] })
    const effects = policyEffects(tickets, old, settings({ mode: 'observe', owner: {}, rules: [{ ...rule, instruction: 'Only unit tests.' }] }), () => scope)
    expect(effects.get('mine')).toEqual({ requesterAllowed: false, requester: { source: 'github', id: 'kulebbb' } })
    expect(effects.get('proactive')).toEqual({ rules: [{ id: 'tests', name: rule.name, change: 'changed', instruction: 'Only unit tests.' }], proactive: false })
    expect(policyEffects(tickets, old, old, () => scope).size).toBe(0)
  })
})

describe('assessment outcome', () => {
  const direction = { implementation_requested: true, target_basis: 'specified', requires_design_decision: false, evidence: 'The test name says what to fix.' }
  const assessment = { decision: 'accept' as const, rule_assessments: [{ rule_id: 'tests', matched: true, reason: 'CI is red' }], direction,
    title: 'Fix the test', scope: 'tests/a.spec.ts', reason: 'CI is red on main', intent_evidence: 'CI failed' }
  it('records an inferred accept as would-accept outside auto mode, and accepts it in auto mode', () => {
    expect(assessmentOutcome(assessment, settings({ rules: [rule] }), 'inferred')).toMatchObject({ kind: 'ignore', audit: { would_accept: true }, reason: { code: 'observed' } })
    expect(assessmentOutcome(assessment, settings({ mode: 'auto', rules: [rule] }), 'inferred')).toMatchObject({ kind: 'accept', rules: ['tests'] })
  })
  it('requires one judgement for every enabled rule', () => {
    expect(() => assessmentOutcome({ ...assessment, rule_assessments: [] }, settings({ rules: [rule] }), 'inferred')).toThrow('Exactly one assessment')
  })
})
