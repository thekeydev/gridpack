import React from "react";
import { Grid, Flex, Layout, debug, splitPane, scrollable, animate, } from "../src/Grid.jsx";
import { parseGridLayout, toGridStyle } from "../src/grid-layout-dsl.js";
import GenericPlayground from "./Playground";

let Style = ({ children }) => <style>{children}</style>
Style.__notAComponent = true;

// ============================================================
// --- presets ---
// ============================================================

import gridBasics from "./presets/grid-basics.jsx";
import extensions from "./presets/extensions.jsx";
import gridAdvanced from "./presets/grid-advanced.jsx";
import flexMode from "./presets/flex-mode.jsx";

let presets = [
	...gridBasics,
	...extensions,
	...gridAdvanced,
	...flexMode,
];

// ============================================================
// --- playground ---
// ============================================================

let categories = [...new Set(presets.map(p => p.cat))];

// --- shared state hook ---
let usePlaygroundState = () => {
	let [presetIdx, setPresetIdx] = React.useState(0);
	let preset = presets[presetIdx];
	let [layout, setLayout] = React.useState(preset.layout);
	let [vars, setVars] = React.useState(preset.vars || {});
	let [params, setParams] = React.useState(() => {
		let d = {}; (preset.params || []).forEach(p => { if (p.def != null) d[p.key] = p.def; }); return d;
	});
	let [showGrid, setShowGrid] = React.useState(true);
	let [panel, setPanel] = React.useState("guide");

	let applyPreset = (idx, p) => {
		setPresetIdx(idx);
		setLayout(p.layout);
		setVars(p.vars ? { ...p.vars } : {});
		let d = {}; (p.params || []).forEach(pm => { if (pm.def != null) d[pm.key] = pm.def; }); setParams(d);
	};
	let selectPreset = idx => applyPreset(idx, presets[idx]);
	let resetPreset = () => applyPreset(presetIdx, preset);
	let prevPreset = () => selectPreset((presetIdx - 1 + presets.length) % presets.length);
	let nextPreset = () => selectPreset((presetIdx + 1) % presets.length);

	let extensions = preset.ext ? preset.ext(vars, params) : [];
	if (showGrid) extensions = [...extensions, debug()];

	let allVars = { ...vars, ...params };
	let children = preset.children ? preset.children(allVars, params) : [];
	let childCount = Array.isArray(children) ? children.length : 0;

	let resolved = layout.replace(/\{(\w+)\}/g, (_, k) => allVars[k] ?? "");
	let parsed = parseGridLayout(resolved, childCount);

	// generated CSS
	let cssLines = [];
	if (!parsed.error) {
		let gs = toGridStyle(parsed);
		if (gs) cssLines = Object.entries(gs).map(([k, v]) => {
			let prop = k.replace(/([A-Z])/g, "-$1").toLowerCase();
			return `  ${prop}: ${v};`;
		});
	}

	// extension summary
	let extSummary = extensions.filter(e => e.name !== "debug").map(e => e.name).join(", ") || "none";

	// responsive props
	let responsiveProps = {};
	["xs","sm","md","lg","xl"].forEach(bp => { if (preset[bp]) responsiveProps[bp] = preset[bp]; });

	let isDirty = layout !== preset.layout;

	return {
		presetIdx, preset, layout, setLayout, vars, setVars, params, setParams,
		showGrid, setShowGrid, panel, setPanel,
		selectPreset, resetPreset, prevPreset, nextPreset,
		extensions, allVars, children, parsed, cssLines, extSummary, responsiveProps, isDirty,
	};
};

// --- shared sub-components ---

let GuidePanel = ({ preset, parsed, cssLines, extSummary, responsiveProps, panel, setPanel }) => {
	let isMobile = useIsMobile();
	let tabs = [["guide", "Guide"], ["debug", "Debug"]];
	if (isMobile)
		tabs.push(["source", "Source"]);
	let source = <div style={{ marginTop: 8, flex: 1 }}>
		{preset.src
			? <pre style={{ background: "#0a0a18", border: "1px solid #686880", borderRadius: 4, padding: 12, color: "#b8b8d0", fontSize: 11, lineHeight: 1.7, margin: 0, whiteSpace: "pre", wordBreak: "break-word", tabSize: 4 }}>{preset.src}</pre>
			: <div style={{ color: "#999", fontSize: 12, padding: 8 }}>No source example for this preset.</div>
		}
		{Object.keys(responsiveProps).length > 0 && <div style={{ marginTop: 8 }}>
			<div style={{ fontSize: 10, color: "#c792ea", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Responsive breakpoints</div>
			{Object.entries(responsiveProps).map(([bp, val]) =>
				<div key={bp} style={{ fontSize: 11, marginBottom: 2 }}>
					<span style={{ color: "#f78c6c" }}>{bp}</span>
					<span style={{ color: "#999" }}>{" = "}</span>
					<span style={{ color: "#c3e88d" }}>"{val}"</span>
				</div>
			)}
		</div>}
	</div>
	return <>
		<div className="pg-tabs">
			{tabs.map(([id, label]) =>
				<button key={id} className={`pg-tab ${panel==id ? "act" : ""}`}
					onClick={() => setPanel(id)}>{label}</button>
			)}
		</div>
		<div style={{ flex: 1, padding: "0 12px 12px", overflow: "auto" }}>
			{panel == "guide" && <div style={{ display: "flex", gap: 16 }}>
				<div className="pg-guide">
					{(preset.guide || "").split("\n\n").map((p, i) =>
						<p key={i} dangerouslySetInnerHTML={{ __html: p
							.replace(/</g, "&lt;")
							.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
							.replace(/`(.+?)`/g, "<code>$1</code>")
						}} />
					)}
					{preset.tryThis && <div className="pg-try">
						<div className="pg-try-title">Try this</div>
						<ul style={{ margin: 0, padding: 0 }}>
							{preset.tryThis.map((hint, i) =>
								<li key={i} dangerouslySetInnerHTML={{ __html: hint
									.replace(/</g, "&lt;")
									.replace(/`(.+?)`/g, "<code>$1</code>")
								}} />
							)}
						</ul>
					</div>}
				</div>
				{!isMobile && source}
			</div>}
			{panel == "debug" && <div className="pg-dbg" style={{ marginTop: 8 }}>
				{parsed.error
					? <div style={{ color: "#ff5370" }}>Error: {parsed.error}</div>
					: <>
						{parsed.expanded && <div><span className="k">expanded: </span><span className="v">{parsed.areas.join(" ")}</span></div>}
						{parsed.repeatInfo && <div><span className="k">repeat: </span><span className="v">[{parsed.repeatInfo.pattern}] ×{parsed.repeatInfo.count}{parsed.repeatInfo.pinned?.length ? ` pinned [${parsed.repeatInfo.pinned}]` : ""}</span></div>}
						{parsed.templateAreas && <div><span className="k">areas: </span><span className="v">{parsed.templateAreas.join(" ")}</span></div>}
						<div><span className="k">cols: </span><span className="v">{parsed.colSizes.join(" ")}</span></div>
						<div><span className="k">rows: </span><span className="v">{parsed.rowSizes.join(" ")}</span></div>
						{parsed.gapH != null && <div><span className="k">gap: </span><span className="v">{parsed.gapH === parsed.gapV ? parsed.gapH + "px" : parsed.gapH + "px " + parsed.gapV + "px"}</span></div>}
						{parsed.flags?.justifyContent && <div><span className="k">justify: </span><span className="v">{parsed.flags.justifyContent}</span></div>}
						{parsed.flags?.alignContent && <div><span className="k">align: </span><span className="v">{parsed.flags.alignContent}</span></div>}
						<div><span className="k">extensions: </span><span className="v">{extSummary}</span></div>
						{Object.keys(parsed.vars || {}).length > 0 && <div><span className="k">vars: </span><span className="v">{JSON.stringify(parsed.vars)}</span></div>}
						<div style={{ borderTop: "1px solid #686880", margin: "6px 0 4px", paddingTop: 4 }}><span className="k">css:</span></div>
						<pre style={{ color: "#888", fontSize: 10, margin: 0, whiteSpace: "pre" }}>{"." + (preset.name.toLowerCase().replace(/\s+/g, "-")) + " {\n" + cssLines.join("\n") + "\n}"}</pre>
					</>
				}
			</div>}
			{panel == "source" && source}
		</div>
	</>
}

let ParamControls = ({ preset, params, setParams, vars, setVars }) => {
	if (!(preset.params || []).length) return null;
	return <div style={{ padding: "2px 10px 4px" }}>
		{preset.params.map(pm => <div key={pm.key} className="pg-row">
			<label>{pm.label}</label>
			{pm.type === "range" && <>
				<input type="range" min={pm.min} max={pm.max} value={params[pm.key] ?? pm.def ?? pm.min} onChange={e => {
					let val = +e.target.value;
					setParams({ ...params, [pm.key]: val });
					if (vars[pm.key] != null) setVars({ ...vars, [pm.key]: val });
				}} style={{ flex: 1 }} />
				<span style={{ fontSize: 10, color: "#9cc", minWidth: 20 }}>{params[pm.key] ?? pm.def}</span>
			</>}
			{pm.type === "toggle" && <label className="pg-chk">
				<input type="checkbox" checked={params[pm.key]==pm.on} onChange={e => {
					let val = e.target.checked ? pm.on : pm.off;
					setParams({ ...params, [pm.key]: val });
					if (typeof pm.on === "number" && vars[pm.key] != null) setVars({ ...vars, [pm.key]: val });
				}} />
				{String(params[pm.key] ?? pm.off)}
			</label>}
		</div>)}
	</div>;
};

let PresetNav = ({ presetIdx, selectPreset, prevPreset, nextPreset }) =>
	<div className="pg-preset-nav">
		<button className="pg-nav-btn" onClick={prevPreset} title="Previous preset">◀</button>
		<div className="pg-nav-center">
			<span className="pg-nav-cat">{presets[presetIdx].cat}</span>
			<span className="pg-nav-name">{presets[presetIdx].name}</span>
			<span className="pg-nav-count">{presetIdx + 1} / {presets.length}</span>
		</div>
		<button className="pg-nav-btn" onClick={nextPreset} title="Next preset">▶</button>
	</div>;

let PresetList = ({ presetIdx, selectPreset }) =>
	<div style={{ flex: 1, overflowY: "auto", padding: "0 10px 10px" }}>
		{categories.map(cat => <div key={cat}>
			<div className="pg-cat">{cat}</div>
			{presets.map((p, i) => p.cat !== cat ? null :
				<button key={i} className={`pg-pre ${i === presetIdx ? "act" : ""}`}
					onClick={() => selectPreset(i)}>{p.name}</button>
			)}
		</div>)}
	</div>;

// --- shared styles injected once ---
let PlaygroundStyles = () =>
	<Style>{`
		.pg-input { width: 100%; background: #0f0f23; border: 1px solid #557; border-radius: 4px; color: #c3e88d; font-family: inherit; font-size: 13px; padding: 8px 10px; resize: none; outline: none; line-height: 1.5; }
		.pg-input:focus { border-color: #7fdbca; }
		.pg-h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #fff; padding: 8px 10px 4px; }
		.pg-cat { font-size: 9px; color: #fff; text-transform: uppercase; letter-spacing: 1px; padding: 6px 8px 2px; }
		.pg-pre { display: block; width: 100%; text-align: left; background: none; border: 1px solid transparent; border-radius: 3px; color: #999; font-family: inherit; font-size: 11px; padding: 3px 8px; margin-bottom: 1px; cursor: pointer; transition: all 0.1s; }
		.pg-pre:hover { color: #ccc; background: #ffffff08; }
		.pg-pre.act { color: #7fdbca; border-color: #7fdbca40; background: #7fdbca10; }
		.pg-row { display: flex; align-items: center; gap: 6px; margin-bottom: 5px; }
		.pg-row label { font-size: 12px; color: #9cc; min-width: 55px; }
		.pg-chk { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #9cc; cursor: pointer; }
		.pg-chk input { accent-color: #7fdbca; }
		.pg-dbg { background: #0f0f23; border: 1px solid #686880; border-radius: 4px; padding: 8px; font-size: 11px; line-height: 1.6; overflow: auto; }
		.pg-dbg .k { color: #c792ea; } .pg-dbg .v { color: #c3e88d; }
		.pg-tabs { display: flex; gap: 0; border-bottom: 1px solid #686880; margin: 0 12px; }
		.pg-tab { background: none; border: none; border-bottom: 2px solid transparent; color: #999; font-family: inherit; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; padding: 6px 10px; cursor: pointer; transition: all 0.15s; }
		.pg-tab:hover { color: #999; }
		.pg-tab.act { color: #7fdbca; border-bottom-color: #7fdbca; }
		.pg-guide { padding: 10px 0; font-size: 12px; line-height: 1.7; color: #999; }
		.pg-guide p { margin: 0 0 8px; }
		.pg-guide strong, .pg-guide b { color: #ccc; font-weight: 600; }
		.pg-guide code { color: #c3e88d; background: #0f0f23; padding: 1px 5px; border-radius: 3px; font-size: 11px; tab-size: 4; }
		.pg-try { margin-top: 8px; padding: 8px 10px; background: rgba(127,219,202,0.04); border: 1px solid rgba(127,219,202,0.1); border-radius: 4px; }
		.pg-try-title { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #7fdbca; margin-bottom: 6px; }
		.pg-try li { font-size: 11px; color: #888; line-height: 1.6; margin-bottom: 2px; list-style: none; padding-left: 12px; position: relative; }
		.pg-try li::before { content: "?"; position: absolute; left: 0; color: #7fdbca60; }
		.pg-try li code { color: #c3e88d; background: #0f0f23; padding: 1px 4px; border-radius: 2px; font-size: 10px; }

		/* --- preset nav --- */
		.pg-preset-nav { display: flex; align-items: center; gap: 0; border-top: 1px solid #686880; background: #0f0f1a; flex-shrink: 0; }
		.pg-nav-btn { background: none; border: none; color: #7fdbca; font-family: inherit; font-size: 16px; padding: 8px 14px; cursor: pointer; flex-shrink: 0; transition: background 0.1s; line-height: 1; }
		.pg-nav-btn:hover { background: #7fdbca18; }
		.pg-nav-btn:active { background: #7fdbca28; }
		.pg-nav-center { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 6px 0; overflow: hidden; }
		.pg-nav-cat { font-size: 9px; color: #999; text-transform: uppercase; letter-spacing: 1px; }
		.pg-nav-name { font-size: 12px; color: #ccc; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
		.pg-nav-count { font-size: 9px; color: #999; }

		/* --- reset btn --- */
		.pg-reset { background: none; border: 1px solid #686880; border-radius: 3px; color: #999; font-family: inherit; font-size: 10px; padding: 2px 7px; cursor: pointer; transition: all 0.1s; line-height: 1.6; }
		.pg-reset:hover { color: #f78c6c; border-color: #f78c6c60; background: #f78c6c10; }
		.pg-reset.dirty { color: #f78c6c; border-color: #f78c6c60; }
	`}</Style>;

let MobilePlayground = () => {
	let s = usePlaygroundState();
	let [v, setV] = React.useState({ nw: 200, w: 20, h: 400 });

	return <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
		<PlaygroundStyles />
		<Style>{`
			.pg-mobile-scroll { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; }
			.pg-drag-handle { height: 18px; display: flex; align-items: center; justify-content: center; cursor: ns-resize; background: #0f0f1a; border-top: 1px solid #686880; flex-shrink: 0; touch-action: none; }
			.pg-drag-handle::after { content: ""; display: block; width: 32px; height: 3px; border-radius: 2px; background: #2a2a5a; }
			.pg-drag-handle:hover::after, .pg-drag-handle:active::after { background: #7fdbca60; }
			.pg-mobile-section { padding: 0 10px; border-bottom: 1px solid #1a1a2e; }
			.pg-mobile-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #999; padding: 8px 0 4px; }
		`}</Style>
		<style>{css}</style>
		<Grid
			layout="RpBnl nn rp bb ll ?wh | #{w} | .{h}. 0~#"
			md="RpBnl lnn lrp lbb ?wh | {nw}#{w} | .{h}#"
			vars={v}
			onVarsChange={setV}
			extensions={[
				splitPane({ var: "nw", edge: "n:r", min: 200, handleSize: 20 }),
				splitPane({ var: "w", edge: "p:L", min: 20, handleSize: 20, handleClass: "rp-handle-x" }),
				splitPane({ var: "h", edge: "r:b", min: 80, handleSize: 20, handleClass: "pg-drag-handle" }),
				scrollable({ area: ["r","n","b","l"] }),
			]}
		>

			{/* --- preview (fixed height, draggable) --- */}
			<div style={{ padding: 12, paddingBottom: 16, width: "100%", height: "100%", overflow: "auto", position: "relative" }}>
				<Grid layout={s.layout} vars={s.allVars} onVarsChange={s.setVars} extensions={s.extensions}
					style={{ ...(s.preset.gridStyle || {}) }} //nodivs
					{...s.responsiveProps}>
					{s.children}
				</Grid>
				{s.parsed.error && <div style={{ position: "absolute", bottom: 10, left: 10, right: 10, color: "#ff5370", fontSize: 10, background: "#1a0a0a", padding: "2px 6px", borderRadius: 3 }}>Error: {s.parsed.error}</div>}
			</div>

			<div></div>

			{/* --- scrollable content below --- */}
			<div className="pg-mobile-scroll">

				{/* layout input */}
				<div className="pg-mobile-section" style={{ paddingTop: 16, paddingBottom: 8 }}>
					<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
						<div className="pg-mobile-label" style={{ padding: 0 }}>Layout string</div>
						<div style={{ display: "flex", gap: 6, alignItems: "center" }}>
							<label className="pg-chk" style={{ fontSize: 10 }}><input type="checkbox" checked={s.showGrid} onChange={e => s.setShowGrid(e.target.checked)} /> overlay</label>
							<button className={`pg-reset ${s.isDirty ? "dirty" : ""}`} onClick={s.resetPreset}>reset</button>
						</div>
					</div>
					<textarea className="pg-input" rows={2} spellCheck={false} value={s.layout} onChange={e => s.setLayout(e.target.value)} style={{ fontSize: 12 }} />
					{s.preset.info && <div style={{ fontSize: 10, color: "#f78c6c", marginTop: 3 }}>{s.preset.info}</div>}
				</div>

				{/* params */}
				{(s.preset.params || []).length > 0 && <div className="pg-mobile-section" style={{ paddingTop: 4, paddingBottom: 6 }}>
					<ParamControls preset={s.preset} params={s.params} setParams={s.setParams} vars={s.vars} setVars={s.setVars} />
				</div>}

				{/* guide */}
				<div className="pg-mobile-section" style={{ paddingBottom: 8 }}>
					<GuidePanel preset={s.preset} parsed={s.parsed} cssLines={s.cssLines} extSummary={s.extSummary}
						responsiveProps={s.responsiveProps} panel={s.panel} setPanel={s.setPanel} />
				</div>
			</div>

			<div style={{ paddingBottom: 0 }}>
				<PresetNav presetIdx={s.presetIdx} selectPreset={s.selectPreset} prevPreset={s.prevPreset} nextPreset={s.nextPreset} />
			</div>

			<div style={{ paddingBottom: 16 }}>
				<PresetList presetIdx={s.presetIdx} selectPreset={s.selectPreset} />
			</div>
		</Grid>
	</div>;
};

let css = `
.rp-handle-x {
	position: absolute;
	top: 0;
	bottom: 0;
	right: -9px;
	width: 18px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: col-resize;
	z-index: 300;
	flex-shrink: 0;
	touch-action: none;
}
.rp-handle-x::after {
	content: "";
	display: block;
	width: 3px;
	height: 32px;
	border-radius: 2px;
	background: #2a2a5a;
	transition: background 0.15s;
}
.rp-handle-x:hover::after,
.rp-handle-x:active::after {
	background: #7fdbca60;
}
.rp-handle-y {
	position: absolute;
	left: 0;
	right: 0;
	top: -9px;
	height: 18px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: ns-resize;
	z-index: 300;
	flex-shrink: 0;
	touch-action: none;
}
.rp-handle-y::after {
	content: "";
	display: block;
	width: 32px;
	height: 3px;
	border-radius: 2px;
	background: #2a2a5a;
	transition: background 0.15s;
}
.rp-handle-y:hover::after,
.rp-handle-y:active::after {
	background: #7fdbca60;
}
`;

// --- responsive switcher ---
let useIsMobile = () => {
	let [mobile, setMobile] = React.useState(() => window.innerWidth < 640);
	React.useEffect(() => {
		let fn = () => setMobile(window.innerWidth < 640);
		window.addEventListener("resize", fn);
		return () => window.removeEventListener("resize", fn);
	}, []);
	return mobile;
};

// ============================================================
// --- app ---
// ============================================================

import LandingPage from "./LandingPage";
import Reference from "./Reference";
import Docs from "./Docs";
import OgImage from "./OgImage";

export default function App() {
	let tabList = [["Welcome","landing"], ["Examples","examples"], ["Playground","playground"], ["Guide","docs"], ["Reference","reference"]];
	let tabIds = tabList.map(t => t[1]);

	// "area-maps" -> "Area Maps" for history/tab titles
	let deslug = (s) => s.split("-").map(w => w ? w[0].toUpperCase() + w.slice(1) : w).join(" ");

	// --- hash router ---
	// hash format: "#<tab>" or "#<tab>?<query>" (e.g. "#playground?gp=sC+|+{w}%23;...").
	// an unrecognized hash is treated as a Docs section slug (e.g. "#flex-mode"),
	// so in-guide cross-references and shared deep links land in the guide.
	let parseHash = () => {
		let h = window.location.hash.replace(/^#/, "");
		if (h === "og:image") return { tab: "ogimage", query: "", docSection: null };
		let qi = h.indexOf("?");
		let tab = qi >= 0 ? h.slice(0, qi) : h;
		let query = qi >= 0 ? h.slice(qi + 1) : "";
		if (tab === "") return { tab: "landing", query: "", docSection: null };
		if (!tabIds.includes(tab)) return { tab: "docs", query: "", docSection: tab };
		return { tab, query, docSection: null };
	};

	let [route, setRoute] = React.useState(parseHash);
	let [mounted, setMounted] = React.useState(() => ({ [route.tab]: true }));
	let [pgState, setPgState] = React.useState(() =>
		route.tab === "playground" && route.query ? route.query : null);
	// bumped on every route change so downstream scroll effects re-fire even when
	// the target is unchanged (e.g. landing on the same section twice)
	let [navSeq, setNavSeq] = React.useState(0);
	// mobile nav drawer + guide TOC reported up from Docs (so the drawer can host it)
	let [drawerOpen, setDrawerOpen] = React.useState(false);
	let [tocState, setTocState] = React.useState({ toc: [], activeSlug: null, activeParent: null });

	// each history entry gets a unique key (in history.state) so views can save
	// and restore per-entry scroll positions on back/forward
	let keyCounter = React.useRef(0);
	let ensureKey = () => {
		if (window.history.state?.k == null)
			window.history.replaceState({ k: ++keyCounter.current }, "");
		else
			keyCounter.current = Math.max(keyCounter.current, window.history.state.k);
		return window.history.state.k;
	};

	let tab = route.tab;

	// navType: "push" for a fresh click navigation, "pop" for browser back/forward.
	// views use it to decide between going to a target vs. restoring saved scroll.
	let applyRoute = (r, navType, histKey) => {
		setRoute({ ...r, navType, histKey });
		setNavSeq(n => n + 1);
		setDrawerOpen(false);
		if (r.tab === "playground" && r.query) setPgState(r.query);
	};

	// navigate: update state + push hash (so back/forward works). query is raw
	// (already fragment-encoded by the caller, e.g. "gp=...").
	let navigate = (nextTab, query = "") => {
		let hash = "#" + nextTab + (query ? "?" + query : "");
		window.history.pushState({ k: ++keyCounter.current }, "", hash);
		applyRoute({ tab: nextTab, query, docSection: null }, "push", keyCounter.current);
	};

	// navigateDoc: jump to a guide section. pushes "#<slug>" as a real history
	// entry so the back button returns to where the reader came from.
	let navigateDoc = (slug) => {
		window.history.pushState({ k: ++keyCounter.current }, "", "#" + slug);
		applyRoute({ tab: "docs", query: "", docSection: slug }, "push", keyCounter.current);
	};

	// respond to browser back/forward. only popstate — we drive all programmatic
	// changes through applyRoute, so listening to hashchange too would double-fire.
	React.useEffect(() => {
		let onPop = () => applyRoute(parseHash(), "pop", ensureKey());
		window.addEventListener("popstate", onPop);
		return () => window.removeEventListener("popstate", onPop);
	}, []);

	// keep visited tabs mounted (preserves scroll + state when switching away)
	React.useEffect(() => {
		if (!mounted[tab]) setMounted(m => ({ ...m, [tab]: true }));
	}, [tab]);

	// on first load, stamp the initial history entry with a key and reflect the tab
	React.useEffect(() => {
		let k = ensureKey();
		if (!window.location.hash && tab !== "landing")
			window.history.replaceState({ k }, "", "#" + tab);
		setRoute(r => ({ ...r, histKey: k, navType: "push" }));
	}, []);

	// browser-history / tab title — makes entries distinguishable in the back menu
	React.useEffect(() => {
		let label;
		if (route.docSection) label = "Guide: " + deslug(route.docSection);
		else label = ({ landing: "Welcome", examples: "Examples", playground: "Playground",
			docs: "Guide", reference: "Reference", ogimage: "OG Image" })[route.tab] || "gridpack";
		document.title = "gridpack — " + label;
	}, [route.tab, route.docSection]);

	let show = (id) => ({ display: tab == id ? "block" : "none", height: "100%", overflow: "hidden" });

	return <>
	<Grid layout="|?wh|.#" style={{height:"100%",position:"fixed"}} className="app">
		<Style>{`
			/*
			@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;700&display=swap');
			*/

			* { margin: 0; padding: 0; box-sizing: border-box; }
			body {
				--font-body: "DM Sans", sans-serif;
				--font-mono: "SF Mono", "Fira Code", monospace;
				/*--font-mono: "JetBrains Mono", monospace;*/
				font-family: var(--font-mono);

				background: #13131f; color: #ccc;
			}
			.app > * { min-width: 0; }
			.demo-box { border-radius: 6px; padding: 8px 16px; font-size: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; min-height: 0px;
			/*
			*/
			height: 100%; width: 100%;
			}
			.c0 { background: #1e3a5f; color: #7fdbca; border: 1px solid rgba(255,255,255,0.25); }
			.c1 { background: #3a1e5f; color: #c792ea; border: 1px solid rgba(255,255,255,0.25); }
			.c2 { background: #1e5f3a; color: #c3e88d; border: 1px solid rgba(255,255,255,0.25); }
			.c3 { background: #5f3a1e; color: #ff9e80; border: 1px solid rgba(255,255,255,0.25); }
			.c4 { background: #5f1e3a; color: #ff7385; border: 1px solid rgba(255,255,255,0.25); }
			.c5 { background: #3a5f1e; color: #dcedc8; border: 1px solid rgba(255,255,255,0.25); }
			.c6 { background: #1e5f5f; color: #9edcd6; border: 1px solid rgba(255,255,255,0.25); }
			.c7 { background: #5f5f1e; color: #ffeb3b; border: 1px solid rgba(255,255,255,0.25); }

			/* --- top nav + mobile drawer --- */
			.hamburger { display: none; background: none; border: none; cursor: pointer; padding: 4px;
				margin-right: 2px; align-items: center; }
			.topnav { display: flex; align-items: center; gap: 4px; }
			.drawer-scrim { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 90; }
			.drawer { position: fixed; top: 0; left: 0; bottom: 0; width: 260px; max-width: 80vw;
				background: #16213e; border-right: 1px solid #2a2a4a; z-index: 100; overflow-y: auto;
				padding: 16px 10px; transform: translateX(-100%); transition: transform 0.22s ease;
				display: none; }
			.drawer.open { transform: translateX(0); }
			.drawer-nav { display: flex; flex-direction: column; gap: 2px; }
			.drawer-link { display: block; width: 100%; text-align: left; background: none; border: none;
				font-family: inherit; font-size: 15px; color: #9aa; cursor: pointer; padding: 9px 12px;
				border-radius: 6px; border-left: 2px solid transparent; line-height: 1.3; }
			.drawer-link:hover { background: #1a2540; color: #7fdbca; }
			.drawer-link.act { color: #7fdbca; background: #7fdbca12; border-left-color: #7fdbca; font-weight: 600; }
			.drawer-link.sm { font-size: 13px; padding: 6px 12px; }
			.drawer-link.sub { font-size: 12px; padding: 4px 12px 4px 24px; color: #777790; }
			.drawer-link.sub.act { color: #7fdbca; background: #7fdbca10; }
			.drawer-divider { height: 1px; background: #2a2a4a; margin: 12px 6px; }
			.drawer-tochd { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em;
				color: #686880; font-weight: 700; padding: 0 12px; margin-bottom: 6px; }
			.drawer-toc { display: flex; flex-direction: column; gap: 1px; }

			@media (max-width: 640px) {
				.topnav { display: none; }
				.hamburger { display: flex; }
				.drawer { display: block; }
			}
		`}</Style>
		<div className="topbar" style={{ padding: "12px", background: "#16213e", borderBottom: "1px solid #2a2a4a", display: "flex", alignItems: "center", gap: 8 }}>
			<button className="hamburger" aria-label="Menu" onClick={() => setDrawerOpen(o => !o)}>
				<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7fdbca" strokeWidth="2" strokeLinecap="round">
					<path d="M3 6h18M3 12h18M3 18h18" />
				</svg>
			</button>
			<svg width="28" height="28" viewBox="0 0 56 56"><path fill="#7fdbca" d=
				"m41.266 19.117l8.812-5.015c-.352-.352-.774-.633-1.289-.915l-16.523-9.42C30.813 2.946 29.406 2.5 28 2.5s-2.812.445-4.266 1.266L18.977 6.46ZM28 26.641l10.008-5.672l-22.195-12.68l-8.602 4.899c-.516.28-.937.562-1.29.914ZM29.594 53.5c.164-.047.304-.117.469-.21l18.351-10.454c2.18-1.242 3.375-2.508 3.375-5.906V18.672c0-.703-.07-1.266-.187-1.781L29.594 29.453Zm-3.188 0V29.453L4.4 16.891a7.8 7.8 0 0 0-.188 1.78V36.93c0 3.398 1.195 4.664 3.375 5.906l18.352 10.453c.164.094.304.164.468.211"
			/></svg>
			<span style={{ fontSize: 18, fontWeight: 700, color: "#7fdbca", marginRight: 8 }}>gridpack</span>
			<div className="topnav">
				{tabList.map(([name,tabId]) =>
					<button key={name} onClick={() => navigate(tabId)} style={{ background: "none", border: "none", color: tab==tabId ? "#8dc" : "#8aa", fontFamily: "inherit", fontSize: 14, cursor: "pointer", borderBottom: tab==tabId ? "2px solid #7fdbca" : "2px solid transparent", padding: "4px 8px" }}>{name}</button>
				)}
			</div>
		</div>
		<div style={{ overflow: "hidden", height: "100%", minWidth: 0 }}>
			<div style={show("landing")}>{mounted.landing && <LandingPage onNavigate={navigate} />}</div>
			<div style={show("examples")}>{mounted.examples && <MobilePlayground />}</div>
			<div style={show("playground")}>{mounted.playground && <GenericPlayground urlState={pgState} />}</div>
			<div style={show("docs")}>{mounted.docs && <Docs onOpenPlayground={(q) => navigate("playground", q)} onNavigateSection={navigateDoc} onToc={setTocState} scrollTo={route.docSection} navSeq={navSeq} histKey={route.histKey} navType={route.navType} />}</div>
			<div style={show("reference")}>{mounted.reference && <Reference />}</div>
			{tab == "ogimage" && <OgImage />}
		</div>
	</Grid>
	{drawerOpen && <div className="drawer-scrim" onClick={() => setDrawerOpen(false)} />}
	<aside className={`drawer ${drawerOpen ? "open" : ""}`}>
		<div className="drawer-nav">
			{tabList.map(([name,tabId]) =>
				<button key={name} className={`drawer-link ${tab==tabId ? "act" : ""}`}
					onClick={() => navigate(tabId)}>{name}</button>
			)}
		</div>
		{tab === "docs" && tocState.toc.length > 0 && <>
			<div className="drawer-divider" />
			<div className="drawer-tochd">On this page</div>
			<div className="drawer-toc">
				{tocState.toc.map(sec => {
					let open = sec.slug === tocState.activeParent;
					return <div key={sec.slug}>
						<button className={`drawer-link sm ${tocState.activeSlug === sec.slug ? "act" : ""}`}
							onClick={() => navigateDoc(sec.slug)}>{sec.text}</button>
						{open && sec.children.length > 0 && sec.children.map(c =>
							<button key={c.slug} className={`drawer-link sub ${tocState.activeSlug === c.slug ? "act" : ""}`}
								onClick={() => navigateDoc(c.slug)}>{c.text}</button>)}
					</div>;
				})}
			</div>
		</>}
	</aside>
	</>
}
