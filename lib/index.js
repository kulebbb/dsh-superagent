// src/index.ts
const name = "dsh-superagent";
const inject = [];
/** 面板与日志共用的版本标识，测试会核对它与 package.json 一致。 */
const VERSION = "0.0.1";
function apply(ctx) {
	ctx.logger.info("%s %s 已加载；在侧边栏打开 Superagent 面板", name, VERSION);
}
export { VERSION, apply, inject, name };
