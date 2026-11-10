import { Context } from "@deepseek-ai/cordis";
declare const name = "dsh-superagent";
declare const inject: string[];
/** 面板与日志共用的版本标识，测试会核对它与 package.json 一致。 */
declare const VERSION = "0.0.1";
declare function apply(ctx: Context): void;
export { VERSION, apply, inject, name };