/**
 * 个人版的设置、评估校验与准入（gate）。
 *
 * 与原型（dsh-superagent-prototype 的 src/policy.ts）相比，团队版的白名单、准入表、bot 列表和白名单同步都去掉了，
 * 换成「只有我」：每个来源上哪些身份是我（`policy.owner`），本地来源（`local`）上的人类消息一律算我。
 * 规则、accept 模式（off / observe / auto）和 Mandate 的重新校验保持原型的语义。
 */
import { z } from 'zod'
import { key, type ActorRef, type AssessmentOutcome, type GateResult, type Mandate, type Policy, type PolicyEffect, type SourceScope,
  type Strength, type Thread, type Ticket, type Trigger } from './core/index.ts'

/** 本地来源：在面板或对话里由我直接提交的请求，它上面的人类消息一律算我。 */
export const LOCAL_SOURCE = 'local'
/** 设置里各项的取值范围。 */
export const LIMITS = {
  ruleName: 80,
  ruleInstruction: 4000,
  evalTimeoutSeconds: { min: 30, max: 900 },
  maxWorkers: { min: 1, max: 4 },
  prepareCommand: 4000,
  ownerIds: 20,
} as const

export const RuleIdSchema = z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/)
export const RuleMatchSchema = z.object({ rule_id: RuleIdSchema, reason: z.string().trim().min(1).max(500) }).strict()
export type RuleMatch = z.infer<typeof RuleMatchSchema>
export const RuleAssessmentSchema = RuleMatchSchema.extend({ matched: z.boolean() }).strict()
export type RuleAssessment = z.infer<typeof RuleAssessmentSchema>
export const AdmissionDirectionSchema = z.object({
  implementation_requested: z.boolean(),
  target_basis: z.enum(['specified', 'existing-standard', 'undetermined']),
  requires_design_decision: z.boolean(),
  evidence: z.string().trim().min(1).max(700),
}).strict()
export type AdmissionDirection = z.infer<typeof AdmissionDirectionSchema>
/** Check whether an assessment established implementation intent and a settled target without open design decisions. */
export function directionAllowed(value: unknown): value is AdmissionDirection {
  const result = AdmissionDirectionSchema.safeParse(value)
  return result.success && result.data.implementation_requested && result.data.target_basis !== 'undetermined' && !result.data.requires_design_decision
}
export interface Assessment {
  decision: 'accept' | 'ignore' | 'unavailable'; rule_assessments: RuleAssessment[]; direction: unknown
  title: string; scope: string; reason: string; intent_evidence?: string | null; acknowledgement?: string | null; worktree_name?: string
}
/**
 * Validate an assessment against enabled rules and convert it into an engine `AssessmentOutcome` (unchanged from the prototype).
 * Acceptance requires a settled direction, at least one matched enabled rule, and `intent_evidence`, and accepts an
 * inferred candidate only in `auto` mode (otherwise recording it as `would_accept`).
 * @throws when `rule_assessments` does not cover every enabled rule exactly once, or an accept omits `intent_evidence`.
 */
export function assessmentOutcome(assessment: Assessment, settings: Pick<Settings, 'policy' | 'eval'>, strength: Strength): AssessmentOutcome {
  const enabled = settings.policy.rules.filter(rule => rule.enabled)
  const judged = assessment.rule_assessments
  const ids = new Set(judged.map(item => item.rule_id))
  if (judged.length !== enabled.length || ids.size !== judged.length || enabled.some(rule => !ids.has(rule.id))) {
    throw new Error('Exactly one assessment for every enabled rule is required; disabled, unknown or missing rule IDs are not allowed')
  }
  const matches = judged.filter(item => item.matched).map(({ rule_id, reason }) => ({ rule_id, reason }))
  const evidence = assessment.intent_evidence ? { intent_evidence: assessment.intent_evidence } : {}
  const audit = { matches, rule_assessments: judged, direction: assessment.direction, ...evidence }
  if (assessment.decision !== 'accept') return { kind: assessment.decision, reason: assessment.reason, audit }
  if (!directionAllowed(assessment.direction)) return { kind: 'ignore', audit, reason: { code: 'directionUnsettled' } }
  if (!matches.length) return { kind: 'ignore', audit, reason: { code: 'noRuleMatched' } }
  if (!assessment.intent_evidence) throw new Error('Acceptance requires intent_evidence')
  const { title, scope, worktree_name: name } = assessment
  if (strength === 'inferred' && settings.eval.mode !== 'auto') {
    const proposal = { title, scope, worktree_name: name }
    return { kind: 'ignore', audit: { ...audit, would_accept: true, proposal }, reason: { code: 'observed', values: { text: assessment.reason } } }
  }
  return { kind: 'accept', title, scope, reason: assessment.reason, ...(assessment.acknowledgement ? { acknowledgement: assessment.acknowledgement } : {}),
    rules: matches.map(match => match.rule_id), audit, ...(name ? { name } : {}) }
}

/** A proactive-work rule; with none enabled, only my explicit requests start work. */
export const RuleSchema = z.object({ id: RuleIdSchema, name: z.string().trim().min(1).max(LIMITS.ruleName), enabled: z.boolean(),
  instruction: z.string().trim().min(1).max(LIMITS.ruleInstruction) }).strict()
export type Rule = z.infer<typeof RuleSchema>
export const RoleModelSchema = z.object({ provider: z.string().trim().min(1), model: z.string().trim().min(1), reasoningEffort: z.string().trim().min(1).optional() }).strict()
export type RoleModel = z.infer<typeof RoleModelSchema>
const SourceIdSchema = z.string().regex(/^[a-z][a-z0-9-]*$/)

export const PolicyConfigSchema = z.object({
  /** My identities on each Source, such as my GitHub login; the local Source needs none. */
  owner: z.record(SourceIdSchema, z.array(z.string().trim().min(1).max(200)).max(LIMITS.ownerIds)).default({}),
  rules: z.array(RuleSchema).refine(rules => new Set(rules.map(rule => rule.id)).size === rules.length, 'Duplicate rule IDs').default([]),
}).strict()
export const EvalConfigSchema = z.object({
  mode: z.enum(['off', 'observe', 'auto']).default('observe'),
  timeoutSeconds: z.number().int().min(LIMITS.evalTimeoutSeconds.min).max(LIMITS.evalTimeoutSeconds.max).default(120),
  model: RoleModelSchema.nullable().default(null),
}).strict()
const CommandNameSchema = z.string().regex(/^[A-Za-z0-9._-]+$/).refine(name => name !== '.' && name !== '..', 'Not a command name')
/** Executor settings: worker model, concurrency (one by default on a personal machine), ticket directory root, `prepare` command, blocked commands. */
export const ExecutorConfigSchema = z.object({
  model: RoleModelSchema.nullable().default(null),
  maxWorkers: z.number().int().min(LIMITS.maxWorkers.min).max(LIMITS.maxWorkers.max).default(1),
  directory: z.string().trim().refine(path => path === '' || path.startsWith('/'), 'An absolute path, or empty for <stateDir>/work').default(''),
  prepare: z.string().max(LIMITS.prepareCommand).default(''),
  blockedCommands: z.array(CommandNameSchema).default([]),
}).strict()
export const SourceInstanceSchema = z.object({ enabled: z.boolean().default(true), config: z.record(z.string(), z.unknown()).default({}) }).strict()
export const SettingsSchema = z.object({
  paused: z.boolean().default(false),
  sources: z.record(SourceIdSchema, SourceInstanceSchema).default({}),
  policy: PolicyConfigSchema.default(() => PolicyConfigSchema.parse({})),
  eval: EvalConfigSchema.default(() => EvalConfigSchema.parse({})),
  executor: ExecutorConfigSchema.default(() => ExecutorConfigSchema.parse({})),
}).strict()
export type Settings = z.infer<typeof SettingsSchema>
export type SettingsBlock = 'policy' | 'eval' | 'executor' | `source:${string}`
export type SettingsSave = SettingsBlock | 'pause'
export type SettingsOrigin = 'panel' | 'tool'

export const POLICY_REVISION = 'personal-v1'
/** Version hash of what authorizes work: rules, accept mode and my identities. Models, concurrency and pause do not change it. */
export function policyVersion(settings: Settings): string {
  return key(POLICY_REVISION, JSON.stringify({ rules: settings.policy.rules, mode: settings.eval.mode, owner: settings.policy.owner }))
}
/** Whether `actor` is me: anyone on the local Source, or one of my identities on its Source (case-insensitive). */
export function isOwner(settings: Settings, actor: ActorRef): boolean {
  if (actor.source === LOCAL_SOURCE) return true
  const id = actor.id.toLowerCase()
  return (settings.policy.owner[actor.source] ?? []).some(entry => entry.toLowerCase() === id)
}
const ME = 'me'

/** Check whether a thread has tickets of its own (excluding context-only subscriptions). */
const participating = (thread: Thread, tickets: Ticket[]): boolean =>
  [...thread.subscriptions, ...tickets.map(ticket => ticket.id)].some(id => !thread.context?.includes(id))
const listened = (sources: SourceScope, source: string, meta: Record<string, unknown>) => sources.scope({ source, meta })

/** Compute how a settings change from `old` to `now` affects the authorization or matched rules of each open ticket. */
export function policyEffects(tickets: readonly Ticket[], old: Settings, now: Settings, scope: (settings: Settings) => SourceScope):
  Map<string, PolicyEffect> {
  const before = settingsPolicy(old, scope(old)), after = settingsPolicy(now, scope(now))
  const effects = new Map<string, PolicyEffect>()
  for (const ticket of tickets) {
    const rules = (ticket.mandate.basis.rules ?? []).flatMap((id): NonNullable<PolicyEffect['rules']> => {
      const was = old.policy.rules.find(rule => rule.id === id), is = now.policy.rules.find(rule => rule.id === id)
      if (!is?.enabled) return was?.enabled ? [{ id, name: was.name, change: 'disabled' }] : []
      return JSON.stringify(was) === JSON.stringify(is) ? [] : [{ id, name: is.name, change: 'changed', instruction: is.instruction }]
    })
    const effect: PolicyEffect = rules.length ? { rules } : {}
    if (before.revalidate(ticket.mandate) && !after.revalidate(ticket.mandate)) {
      if (isOwner(old, ticket.mandate.actor) && !isOwner(now, ticket.mandate.actor)) {
        Object.assign(effect, { requesterAllowed: false, requester: ticket.mandate.actor })
      } else if (ticket.mandate.strength === 'inferred' && old.eval.mode === 'auto' && now.eval.mode !== 'auto') effect.proactive = false
    }
    if (Object.keys(effect).length) effects.set(ticket.id, effect)
  }
  return effects
}

/**
 * Build the active Policy. Who may originate work:
 * - I address the agent: explicit;
 * - I follow up on a Thread with tickets: explicit;
 * - someone else follows up on a Thread with tickets (not a direct message): inferred, unless the mode is `off`;
 * - I write without addressing the agent where the Source receives every message, or a senderless event (such as CI) arrives
 *   there: inferred, unless the mode is `off`;
 * - everything else, including every bot: not admitted.
 */
export function settingsPolicy(settings: Settings, sources: SourceScope): Policy {
  const version = policyVersion(settings)
  const mode = settings.eval.mode
  const rulesOn = (rules: readonly string[] | undefined) => (rules ?? []).every(id => settings.policy.rules.some(rule => rule.enabled && rule.id === id))
  return {
    version, paused: settings.paused, evalTimeoutMs: settings.eval.timeoutSeconds * 1000,
    gate(trigger: Trigger, thread, tickets): GateResult {
      const scope = listened(sources, trigger.source, trigger.meta)
      const recorded = { source: trigger.source, scope: trigger.meta, ...scope.listened && scope.row !== undefined ? { row: scope.row } : {} }
      const observed = scope.listened && scope.observed
      if (!trigger.human) {
        if (trigger.actor.id || !observed || mode === 'off') return { admissible: false, reason: 'not_human' }
        return { admissible: true, strength: 'inferred', basis: { ...recorded, via: 'admission', cell: 'unlistedUnaddressed', observation: { mode } } }
      }
      const owner = isOwner(settings, trigger.actor)
      if (owner && trigger.addressed) return { admissible: true, strength: 'explicit', basis: { ...recorded, sender: ME, via: 'addressed', addressed: trigger.addressed } }
      if (participating(thread, tickets)) {
        if (owner) return { admissible: true, strength: 'explicit', basis: { ...recorded, sender: ME, via: 'followup' } }
        // A direct-message thread belongs to its one sender, and inferred follow-ups need an accept mode other than off.
        if (trigger.addressed !== 'direct' && mode !== 'off') return { admissible: true, strength: 'inferred', basis: { ...recorded, via: 'followup' } }
      }
      if (!owner) return { admissible: false, reason: 'not_a_member' }
      if (!observed) return { admissible: false, reason: 'no_mention' }
      if (mode === 'off') return { admissible: false, reason: 'admission_ignored' }
      return { admissible: true, strength: 'inferred', basis: { ...recorded, sender: ME, via: 'admission', cell: 'listedUnaddressed', observation: { mode } } }
    },
    admitsInferred: rules => mode === 'auto' && rules.length > 0 && rulesOn(rules),
    revalidate(mandate: Mandate) {
      const { basis } = mandate
      const current = basis.source && basis.scope ? listened(sources, basis.source, basis.scope) : undefined
      if (current && !current.listened) return false
      switch (basis.via) {
        // My follow-ups stay valid; someone else's inferred follow-up needs auto mode and enabled matched rules.
        case 'followup': return mandate.strength === 'explicit' || (mode === 'auto' && rulesOn(basis.rules))
        case 'addressed': return isOwner(settings, mandate.actor)
        case 'admission':
          if (basis.cell === 'listedUnaddressed' && !isOwner(settings, mandate.actor)) return false
          return mode === 'auto' && rulesOn(basis.rules)
        case 'listed': return isOwner(settings, mandate.actor)
        // The personal edition keeps no bot list.
        case 'bot': return false
      }
    },
  }
}
