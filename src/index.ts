/**
 * 服务端插件入口（cordis）。阶段 0 只做最小的事：挂载时记录一条日志，证明 bundle 已被宿主加载。
 * 后续阶段在这里组装 Runtime：Store、Engine、执行器与来源（见 README 的阶段计划）。
 */
import type { Context } from '@deepseek-ai/cordis'

export const name = 'dsh-superagent'
export const inject: string[] = []

/** 面板与日志共用的版本标识，测试会核对它与 package.json 一致。 */
export const VERSION = '0.0.1'

export function apply(ctx: Context): void {
  ctx.logger.info('%s %s 已加载；在侧边栏打开 Superagent 面板', name, VERSION)
}
