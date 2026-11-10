window.__ModuleLoader__.load({
	id: "@kulebbb/dsh-superagent",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		// src/client/locales.ts
		/** 面板文案，`[中文, English]` 成对维护。 */
		const TEXT = {
			panel: ["Superagent", "Superagent"],
			title: ["Superagent 个人版", "Superagent Personal"],
			loaded: ["插件骨架已加载。", "The plugin skeleton is loaded."],
			next: ["下一阶段会在这里显示等你处理的工单。", "Tickets waiting for you will appear here in the next stage."],
			version: ["版本 {version}", "Version {version}"]
		};
		const language = (index) => Object.fromEntries(Object.entries(TEXT).map(([key, pair]) => [key, pair[index]]));
		const zh = language(0);
		const en = language(1);
		// src/index.ts
		/** 面板与日志共用的版本标识，测试会核对它与 package.json 一致。 */
		const VERSION = "0.0.1";
		// src/client/panel.tsx
		/** 主面板。阶段 0 只展示加载状态；阶段 3 起改为「等我处理的工单」概览。 */
		function Panel({ t }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					padding: 24,
					display: "flex",
					flexDirection: "column",
					gap: 8
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
						style: { margin: 0 },
						children: t("title")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						style: { margin: 0 },
						children: t("loaded")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						style: {
							margin: 0,
							opacity: .7
						},
						children: t("next")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", {
						style: { opacity: .5 },
						children: t("version", { version: VERSION })
					})
				]
			});
		}
		// src/client/index.tsx
		const NS = "dshSuperagentDesktop";
		const PANEL_ID = "dsh-superagent-desktop";
		function AgentIcon({ size }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 24 24",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: 1.8,
				strokeLinecap: "round",
				strokeLinejoin: "round",
				"aria-hidden": true,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
						x: "4",
						y: "7",
						width: "16",
						height: "12",
						rx: "3"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 3v4" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "9",
						cy: "13",
						r: "1.2"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "15",
						cy: "13",
						r: "1.2"
					})
				]
			});
		}
		const inject = ["slots", "locale"];
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "dsh-superagent-desktop: dictionaries");
			const t = ctx.locale.bind(NS);
			ctx.slots.inject("main", () => ctx.slots.register({
				name: "main",
				key: PANEL_ID,
				locale: NS,
				inject: () => ({})
			}, (props) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Panel, { t: props.t })));
			ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({
				name: "sidebar.panellist",
				id: PANEL_ID,
				order: 20,
				label: () => t("panel"),
				locale: NS
			}, AgentIcon));
		}
		exports.NS = NS;
		exports.PANEL_ID = PANEL_ID;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
