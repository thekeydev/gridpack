import React from "react";
import { Grid, debug, splitPane, collapsible, accordion, scrollable, animate,
	tabs, multiColumn, masonry, overlay, fisheye } from "../src/Grid.jsx";
import { parseGridLayout, toGridStyle } from "../src/grid-layout-dsl.js";
import { encodeState as encodeStateUrlParam, decodeState as decodeStateUrlParam,
	encodeFragment, decodeFragment } from "./urldsl.js";

// --- child generators ---

let Box = ({ c = 0, children, style }) =>
	<div className={`demo-box c${c % 8}`} style={style}>{children}</div>;

let GENERATORS = {
	boxes: {
		label: "Colored Boxes",
		opts: [
			{ key: "count", label: "count", type: "number", def: 4, min: 1, max: 24 },
			{ key: "labels", label: "labels", type: "text", def: "A,B,C,D", note: "comma-sep" },
		],
		build: ({ count, labels }) => {
			let arr = (labels || "").split(",").map(s => s.trim());
			return Array.from({ length: count }, (_, i) =>
				<Box key={i} c={i}>{arr[i] || String.fromCharCode(65 + i % 26)}</Box>
			);
		},
	},
	lorem: {
		label: "Lorem Rows",
		opts: [
			{ key: "count", label: "count", type: "number", def: 10, min: 1, max: 60 },
			{ key: "pad", label: "padding", type: "number", def: 8, min: 0, max: 32 },
		],
		build: ({ count, pad = 8 }) =>
			Array.from({ length: count }, (_, i) =>
				<div key={i} style={{ padding: `${pad / 2}px ${pad}px`, borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 12, color: "#888" }}>
					{`Item ${i + 1} — Lorem ipsum dolor sit amet consectetur`}
				</div>
			),
	},
	cards: {
		label: "Cards",
		opts: [
			{ key: "count", label: "count", type: "number", def: 4, min: 1, max: 24 },
			{ key: "height", label: "height px", type: "number", def: 80, min: 30, max: 400 },
		],
		build: ({ count, height = 80 }) =>
			Array.from({ length: count }, (_, i) =>
				<div key={i} style={{ background: "#16213e", border: "1px solid #2a2a4a", borderRadius: 6, padding: "10px 14px", fontSize: 12, height, overflow: "hidden", display: "flex", flexDirection: "column", gap: 4 }}>
					<div style={{ color: "#7fdbca", fontWeight: 600, fontSize: 11 }}>Card {i + 1}</div>
					<div style={{ color: "#999", fontSize: 10, lineHeight: 1.5 }}>Some content here</div>
				</div>
			),
	},
	tiles: {
		label: "Aspect Tiles",
		opts: [
			{ key: "count", label: "count", type: "number", def: 6, min: 1, max: 24 },
			{ key: "ratio", label: "ratio", type: "text", def: "4/3", note: "w/h" },
		],
		build: ({ count, ratio = "4/3" }) =>
			Array.from({ length: count }, (_, i) => {
				let h = `hsl(${(i * 53) % 360},35%,22%)`;
				let c = `hsl(${(i * 53) % 360},60%,65%)`;
				return <div key={i} style={{ aspectRatio: ratio.replace("/", " / "), background: h, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: c, fontWeight: 600 }}>{i + 1}</div>;
			}),
	},
	numbered: {
		label: "Numbered",
		opts: [
			{ key: "count", label: "count", type: "number", def: 4, min: 1, max: 24 },
			{ key: "minH", label: "min-height", type: "number", def: 40, min: 0, max: 300 },
		],
		build: ({ count, minH = 40 }) =>
			Array.from({ length: count }, (_, i) =>
				<div key={i} style={{ minHeight: minH, background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#999" }}>
					{i + 1}
				</div>
			),
	},
	empty: {
		label: "Empty Divs",
		opts: [
			{ key: "count", label: "count", type: "number", def: 3, min: 1, max: 24 },
		],
		build: ({ count }) =>
			Array.from({ length: count }, (_, i) => <div key={i} />),
	},
};

// --- extension schemas ---

let EXT_SCHEMAS = {
	splitPane: {
		label: "splitPane",
		fields: [
			{ key: "var", label: "var", type: "text", def: "w" },
			{ key: "edge", label: "edge", type: "text", def: "a:r", note: "area:l/r/t/b  (uppercase=inverted)" },
			{ key: "min", label: "min", type: "number", def: 0 },
			{ key: "max", label: "max", type: "number", def: 9999 },
			{ key: "handleSize", label: "handle px", type: "number", def: 6 },
		],
	},
	collapsible: {
		label: "collapsible",
		fields: [
			{ key: "var", label: "var", type: "text", def: "w" },
			{ key: "area", label: "area", type: "text", def: "a" },
			{ key: "expanded", label: "expanded", type: "number", def: 200 },
			{ key: "collapsed", label: "collapsed", type: "number", def: 0 },
			{ key: "handle", label: "handle", type: "select", options: ["start", "end", "top", "bottom"], def: "end" },
		],
	},
	animate: {
		label: "animate",
		fields: [
			{ key: "duration", label: "duration", type: "text", def: "0.3s" },
			{ key: "easing", label: "easing", type: "text", def: "ease" },
		],
	},
	scrollable: {
		label: "scrollable",
		fields: [
			{ key: "area", label: "area(s)", type: "text", def: "a", note: "comma-sep" },
			{ key: "axis", label: "axis", type: "select", options: ["both", "x", "y"], def: "both" },
		],
	},
	accordion: {
		label: "accordion",
		fields: [
			{ key: "var", label: "var", type: "text", def: "active" },
			{ key: "collapsed", label: "collapsed val", type: "text", def: "." },
			{ key: "items", label: "items", type: "text", def: "a:200,b:200,c:200", note: "area:expanded, comma-sep" },
		],
	},
	tabs: {
		label: "tabs",
		fields: [
			{ key: "var", label: "var", type: "text", def: "tab" },
			{ key: "items", label: "items", type: "text", def: "Tab1:a,Tab2:b", note: "label:area, comma-sep" },
			{ key: "position", label: "position", type: "select", options: ["top", "bottom"], def: "top" },
		],
	},
	fisheye: {
		label: "fisheye",
		fields: [
			{ key: "axis", label: "axis", type: "select", options: ["x", "y", "both"], def: "x" },
			{ key: "intensity", label: "intensity", type: "text", def: "0.6" },
			{ key: "min", label: "min fr", type: "text", def: "0.15" },
			{ key: "sticky", label: "sticky", type: "boolean", def: false },
		],
	},
	masonry: {
		label: "masonry",
		fields: [
			{ key: "balanced", label: "balanced", type: "boolean", def: false },
		],
	},
	multiColumn: {
		label: "multiColumn",
		fields: [
			{ key: "area", label: "area", type: "text", def: "a" },
			{ key: "fill", label: "column-fill", type: "select", options: ["auto", "balance"], def: "auto" },
		],
	},
	overlay: {
		label: "overlay",
		fields: [
			{ key: "area", label: "area", type: "text", def: "o" },
			{ key: "over", label: "over area", type: "text", def: "a" },
		],
	},
	debug: {
		label: "debug",
		fields: [
			{ key: "color", label: "color", type: "text", def: "rgba(255,255,255,0.25)" },
		],
	},
};

// --- build extension from serializable config ---

let buildExt = ({ type, opts }) => {
	try {
		switch (type) {
			case "splitPane":
				return splitPane({ ...opts, min: +opts.min || 0, max: +opts.max || 9999, handleSize: +opts.handleSize || 6 });
			case "collapsible":
				return collapsible({ ...opts, expanded: +opts.expanded || 200, collapsed: +opts.collapsed || 0 });
			case "animate":
				return animate({ duration: opts.duration || "0.3s", easing: opts.easing || "ease" });
			case "scrollable": {
				let areas = (opts.area || "a").split(",").map(s => s.trim()).filter(Boolean);
				return scrollable({ area: areas.length === 1 ? areas[0] : areas, axis: opts.axis || "both" });
			}
			case "accordion": {
				let items = (opts.items || "").split(",").map(s => {
					let [area, exp] = s.trim().split(":");
					area = (area || "").trim();
					return { area, sizeVar: area, expanded: +exp || 200 };
				}).filter(it => it.area);
				return accordion({ var: opts.var || "active", collapsed: opts.collapsed || ".", items });
			}
			case "tabs": {
				let items = (opts.items || "").split(",").map(s => {
					let [label, area] = s.trim().split(":");
					return { label: (label || "").trim(), area: (area || label || "").trim() };
				}).filter(it => it.area);
				return tabs({ var: opts.var || "tab", items, position: opts.position || "top" });
			}
			case "fisheye":
				return fisheye({ axis: opts.axis || "x", intensity: +opts.intensity || 0.6, min: +opts.min || 0.15, sticky: !!opts.sticky });
			case "masonry":
				return masonry({ balanced: !!opts.balanced });
			case "multiColumn":
				return multiColumn({ area: opts.area || "a", fill: opts.fill || "auto" });
			case "overlay":
				return overlay({ area: opts.area || "o", over: opts.over || "a" });
			case "debug":
				return debug({ color: opts.color || "rgba(255,255,255,0.25)" });
			default:
				return null;
		}
	} catch {
		return null;
	}
};

// --- URL state helpers ---
// state lives in the hash query: "#playground?gp=<fragment-encoded ;-DSL>".
// gp values are gently encoded (commas/colons/pipes stay raw) for readability.

// pull the "gp" value out of a raw hash query string (e.g. "gp=sC+|+..." )
let gpFromQuery = (query) => {
	if (!query) return null;
	let m = query.match(/(?:^|&)gp=([^&]*)/);
	return m ? m[1] : null;
};
// decode a (possibly fragment-encoded) gp value into a state object
let parseGp = (gp) => {
	if (!gp) return null;
	try { return decodeStateUrlParam(decodeFragment(gp)); }
	catch { return null; }
};
let readUrlState = () => {
	let query = window.location.hash.includes("?")
		? window.location.hash.slice(window.location.hash.indexOf("?") + 1) : "";
	return parseGp(gpFromQuery(query));
};
let writeUrlState = state => {
	let gp = encodeFragment(encodeStateUrlParam(state));
	let hash = `#playground?gp=${gp}`;
	if (window.location.hash !== hash)
		window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
};

// --- default state ---

let DEFAULT = {
	layout: "sC | {w}#",
	vars: { w: 200 },
	extConfigs: [{ id: "e1", type: "splitPane", opts: { var: "w", edge: "s:r", min: 80, max: 400, handleSize: 6 } }],
	childConfig: { type: "boxes", opts: { count: 2, labels: "Sidebar,Content" } },
	breakpoints: { xs: "", sm: "", md: "", lg: "", xl: "" },
	showOverlay: true,
};

let nextId = () => Math.random().toString(36).slice(2, 8);

// --- field renderer (shared) ---

let FieldInput = ({ f, val, onChange }) => {
	if (f.type === "boolean")
		return <input type="checkbox" checked={!!val} onChange={e => onChange(e.target.checked)} style={{ accentColor: "#7fdbca" }} />;
	if (f.type === "select")
		return <select className="gp-select" value={val ?? f.def ?? ""} onChange={e => onChange(e.target.value)}>
			{(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
		</select>;
	if (f.type === "number")
		return <input className="gp-input gp-input-sm" type="number" min={f.min} max={f.max}
			value={val ?? f.def ?? ""} onChange={e => onChange(+e.target.value)} style={{ width: 72 }} />;
	return <input className="gp-input gp-input-sm" type="text"
		value={val ?? f.def ?? ""} onChange={e => onChange(e.target.value)} style={{ flex: 1, minWidth: 0 }} />;
};

// --- VarsEditor ---

let VarsEditor = ({ vars, setVars }) => {
	let entries = Object.entries(vars);

	let updateVal = (k, v) => {
		let num = +v;
		setVars({ ...vars, [k]: v === "" ? "" : (!isNaN(num) && v !== "" ? num : v) });
	};
	let updateKey = (oldK, newK) => {
		let next = {};
		for (let [k, v] of Object.entries(vars)) next[k === oldK ? newK : k] = v;
		setVars(next);
	};
	let remove = k => { let { [k]: _, ...rest } = vars; setVars(rest); };
	let add = () => setVars({ ...vars, [`v${entries.length + 1}`]: 0 });

	return <div className="gp-section">
		<div className="gp-section-hd">
			<span>Vars</span>
			<button className="gp-add-btn" onClick={add}>+ add</button>
		</div>
		{entries.map(([k, v]) =>
			<div key={k} className="gp-kv-row">
				<input className="gp-input gp-input-sm" value={k}
					onChange={e => updateKey(k, e.target.value)} style={{ width: 56 }} />
				<span className="gp-eq">=</span>
				<input className="gp-input gp-input-sm" value={String(v)}
					onChange={e => updateVal(k, e.target.value)} style={{ flex: 1, minWidth: 0 }} />
				<button className="gp-del-btn" onClick={() => remove(k)}>×</button>
			</div>
		)}
		{!entries.length && <div className="gp-empty">no vars defined</div>}
	</div>;
};

// --- ChildConfigPanel ---

let ChildConfigPanel = ({ config, setConfig }) => {
	let { type, opts } = config;
	let schema = GENERATORS[type];
	let setOpt = (key, val) => setConfig({ ...config, opts: { ...opts, [key]: val } });

	return <div className="gp-section">
		<div className="gp-section-hd">Children</div>
		<div className="gp-row">
			<label>type</label>
			<select className="gp-select" value={type}
				onChange={e => setConfig({ type: e.target.value, opts: {} })}>
				{Object.entries(GENERATORS).map(([k, g]) =>
					<option key={k} value={k}>{g.label}</option>
				)}
			</select>
		</div>
		{(schema?.opts || []).map(f =>
			<div key={f.key} className="gp-row">
				<label>{f.label}{f.note && <span className="gp-note"> ({f.note})</span>}</label>
				<FieldInput f={f} val={opts?.[f.key]} onChange={v => setOpt(f.key, v)} />
			</div>
		)}
	</div>;
};

// --- ExtRow ---

let ExtRow = ({ config, onChange, onRemove }) => {
	let { type, opts } = config;
	let schema = EXT_SCHEMAS[type];
	let [open, setOpen] = React.useState(true);
	let setOpt = (key, val) => onChange({ ...config, opts: { ...opts, [key]: val } });

	return <div className="gp-ext-row">
		<div className="gp-ext-hd" onClick={() => setOpen(!open)}>
			<span className="gp-ext-arrow">{open ? "▾" : "▸"}</span>
			<span className="gp-ext-name">{schema?.label || type}</span>
			<button className="gp-del-btn" onClick={e => { e.stopPropagation(); onRemove(); }}>×</button>
		</div>
		{open && (schema?.fields || []).map(f =>
			<div key={f.key} className="gp-row gp-row-ind">
				<label>{f.label}{f.note && <span className="gp-note"> ({f.note})</span>}</label>
				<FieldInput f={f} val={opts?.[f.key]} onChange={v => setOpt(f.key, v)} />
			</div>
		)}
	</div>;
};

// --- ExtConfigPanel ---

let ExtConfigPanel = ({ configs, setConfigs }) => {
	let [addType, setAddType] = React.useState("splitPane");

	let add = () => {
		let schema = EXT_SCHEMAS[addType];
		let opts = {};
		(schema?.fields || []).forEach(f => { if (f.def != null) opts[f.key] = f.def; });
		setConfigs([...configs, { id: nextId(), type: addType, opts }]);
	};
	let update = (id, cfg) => setConfigs(configs.map(c => c.id === id ? cfg : c));
	let remove = id => setConfigs(configs.filter(c => c.id !== id));

	return <div className="gp-section">
		<div className="gp-section-hd">Extensions</div>
		{configs.map(cfg =>
			<ExtRow key={cfg.id} config={cfg}
				onChange={c => update(cfg.id, c)} onRemove={() => remove(cfg.id)} />
		)}
		{!configs.length && <div className="gp-empty">no extensions</div>}
		<div className="gp-add-row">
			<select className="gp-select" style={{ flex: 1 }} value={addType}
				onChange={e => setAddType(e.target.value)}>
				{Object.keys(EXT_SCHEMAS).map(k => <option key={k} value={k}>{k}</option>)}
			</select>
			<button className="gp-add-btn" onClick={add}>+ add</button>
		</div>
	</div>;
};

// --- BreakpointsEditor ---

let BreakpointsEditor = ({ bps, setBps }) => {
	let [open, setOpen] = React.useState(false);
	let hasBps = Object.values(bps).some(Boolean);

	return <div className="gp-section">
		<div className="gp-section-hd gp-collapsible-hd" onClick={() => setOpen(!open)}>
			<span className="gp-ext-arrow">{open ? "▾" : "▸"}</span>
			<span>Breakpoints{hasBps ? <span className="gp-active-badge"> ●</span> : null}</span>
		</div>
		{open && ["xs", "sm", "md", "lg", "xl"].map(bp =>
			<div key={bp} className="gp-row">
				<label className="gp-bp-label">{bp}</label>
				<input className="gp-input gp-input-sm" type="text" placeholder="layout string"
					value={bps[bp] || ""} onChange={e => setBps({ ...bps, [bp]: e.target.value })}
					style={{ flex: 1, minWidth: 0 }} />
			</div>
		)}
	</div>;
};

// --- DebugPanel ---

let DebugPanel = ({ parsed, layout, vars }) => {
	if (parsed.error) return <div className="gp-dbg-err">Error: {parsed.error}</div>;

	let gs = toGridStyle(parsed);
	let cssStr = gs ? Object.entries(gs).map(([k, v]) => {
		let prop = k.replace(/([A-Z])/g, "-$1").toLowerCase();
		return `  ${prop}: ${v};`;
	}).join("\n") : "";

	return <div className="gp-debug">
		{parsed.templateAreas && <div className="gp-dbg-row"><span className="k">areas:</span><span className="v">{parsed.templateAreas.join(" ")}</span></div>}
		<div className="gp-dbg-row"><span className="k">cols:</span><span className="v">{parsed.colSizes.join(" | ")}</span></div>
		<div className="gp-dbg-row"><span className="k">rows:</span><span className="v">{parsed.rowSizes.join(" | ")}</span></div>
		{parsed.gapH != null && <div className="gp-dbg-row"><span className="k">gap:</span><span className="v">{parsed.gapH === parsed.gapV ? `${parsed.gapH}px` : `${parsed.gapH}px ${parsed.gapV}px`}</span></div>}
		{parsed.mode && <div className="gp-dbg-row"><span className="k">mode:</span><span className="v">{parsed.mode}</span></div>}
		{Object.keys(vars).length > 0 && <div className="gp-dbg-row"><span className="k">vars:</span><span className="v">{JSON.stringify(vars)}</span></div>}
		{cssStr && <pre className="gp-dbg-css">{".grid {\n" + cssStr + "\n}"}</pre>}
	</div>;
};

// --- GenericPlayground ---

let GenericPlayground = ({ urlState = null } = {}) => {
	// initial state: prefer the gp passed down by the router, else read the hash
	let init = (urlState ? parseGp(gpFromQuery(urlState)) : null) || readUrlState() || DEFAULT;

	let [layout, setLayout] = React.useState(init.layout);
	let [vars, setVars] = React.useState(init.vars || {});
	let [extConfigs, setExtConfigs] = React.useState(init.extConfigs || []);
	let [childConfig, setChildConfig] = React.useState(init.childConfig || DEFAULT.childConfig);
	let [bps, setBps] = React.useState(init.breakpoints || DEFAULT.breakpoints);
	let [showOverlay, setShowOverlay] = React.useState(init.showOverlay ?? true);
	let [copied, setCopied] = React.useState(false);
	// debug panel is collapsible; default collapsed on small screens where vertical
	// space is scarce, expanded on desktop (matches the app's 640px mobile boundary)
	let [debugOpen, setDebugOpen] = React.useState(
		typeof window === "undefined" || window.innerWidth >= 640);

	// when the router pushes a new gp (e.g. clicking another docs example while
	// the playground is already mounted), apply it. ignore the very first run.
	let firstUrlState = React.useRef(true);
	React.useEffect(() => {
		if (firstUrlState.current) { firstUrlState.current = false; return; }
		let s = parseGp(gpFromQuery(urlState));
		if (!s) return;
		setLayout(s.layout);
		setVars(s.vars || {});
		setExtConfigs(s.extConfigs || []);
		setChildConfig(s.childConfig || DEFAULT.childConfig);
		setBps(s.breakpoints || DEFAULT.breakpoints);
		setShowOverlay(s.showOverlay ?? true);
	}, [urlState]);

	// outer shell vars — same roles as MobilePlayground:
	//   nw = controls sidebar width (md), w = empty right panel, h = preview height
	let [v, setV] = React.useState({ nw: 280, w: 20, h: 280 });

	// sync URL (debounced)
	React.useEffect(() => {
		let t = setTimeout(() => {
			writeUrlState({ layout, vars, extConfigs, childConfig, breakpoints: bps, showOverlay });
		}, 600);
		return () => clearTimeout(t);
	}, [layout, vars, extConfigs, childConfig, bps, showOverlay]);

	// build extensions
	let extensions = React.useMemo(() => {
		let exts = extConfigs.map(buildExt).filter(Boolean);
		if (showOverlay) exts = [...exts, debug()];
		return exts;
	}, [extConfigs, showOverlay]);

	// generate children
	let children = React.useMemo(() => {
		let gen = GENERATORS[childConfig.type];
		if (!gen) return [];
		let opts = {};
		(gen.opts || []).forEach(f => { opts[f.key] = childConfig.opts?.[f.key] ?? f.def; });
		return gen.build(opts);
	}, [childConfig]);

	// parse for debug
	let childCount = Array.isArray(children) ? children.length : 0;
	let resolvedLayout = layout.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
	let parsed = parseGridLayout(resolvedLayout, childCount);

	// build responsive props
	let responsiveProps = {};
	for (let [bp, val] of Object.entries(bps)) if (val) responsiveProps[bp] = val;

	let copyLink = () => {
		navigator.clipboard?.writeText(window.location.href).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		});
	};

	let reset = () => {
		setLayout(DEFAULT.layout);
		setVars(DEFAULT.vars);
		setExtConfigs(DEFAULT.extConfigs);
		setChildConfig(DEFAULT.childConfig);
		setBps(DEFAULT.breakpoints);
		setShowOverlay(true);
	};

	// --- outer shell: mirrors MobilePlayground layout exactly ---
	// areas: R=preview, p=empty right panel, B=debug, n=empty top, l=controls
	// mobile: nn(empty top) | rp(preview+empty) | bb(debug) | ll(controls)
	// md:     lnn(controls sidebar | empty top) | lrp(controls | preview | empty) | lbb(controls | debug)
	return <div className="gp-root">
		<style>{GP_CSS}</style>
		<Grid
			layout="RpBnl nn rp bb ll ?wh | #{w} | . {h}"
			md="RpBnl lnn lrp lbb ?wh | {nw}#{w} | . {h} #"
			vars={v}
			onVarsChange={setV}
			extensions={[
				splitPane({ var: "nw", edge: "l:r", min: 160, handleSize: 20 }),
				splitPane({ var: "w", edge: "p:L", min: 0, max: 9999, handleSize: 20, handleClass: "gp-handle-x" }),
				splitPane({ var: "h", edge: "r:b", min: 80, handleSize: 18, handleClass: "gp-drag-handle" }),
				scrollable({ area: ["r", "b", "l"] }),
			]}
		>
			{/* child 1: area R/r — preview */}
			<div style={{ padding: 12, paddingBottom: 16, width: "100%", height: "100%", overflow: "auto", position: "relative" }}>
				<Grid layout={layout} vars={vars} onVarsChange={setVars}
					extensions={extensions} {...responsiveProps}>
					{children}
				</Grid>
				{parsed.error && <div style={{ position: "absolute", bottom: 10, left: 10, right: 10, color: "#ff5370", fontSize: 10, background: "#1a0a0a", padding: "2px 6px", borderRadius: 3 }}>Error: {parsed.error}</div>}
			</div>

			{/* child 2: area p — empty right panel ({w} wide, collapsed by default) */}
			<div />

			{/* child 3: area B/b — debug (full width at bottom), collapsible */}
			<div>
				<div className="gp-section-hd gp-sticky-hd gp-collapsible-hd" onClick={() => setDebugOpen(o => !o)}>
					<span className="gp-ext-arrow">{debugOpen ? "▾" : "▸"}</span>
					<span>Debug</span>
				</div>
				{debugOpen && <DebugPanel parsed={parsed} layout={layout} vars={vars} />}
			</div>

			{/* child 4: area n — empty top strip */}
			<div />

			{/* child 5: area l — controls (full width at mobile, left sidebar at md) */}
			<div>
				<div className="gp-ctrl-hd gp-sticky-hd">
					<span className="gp-ctrl-title">Generic Playground</span>
					<button className="gp-link-btn" onClick={copyLink}>{copied ? "✓ copied" : "⎘ share"}</button>
					<button className="gp-reset-btn" onClick={reset}>reset</button>
				</div>
				<div className="gp-ctrl-body">
					<div className="gp-section">
						<div className="gp-section-hd">Layout</div>
						<div style={{ padding: "0 10px 6px" }}>
							<textarea className="gp-input gp-input-full" rows={3} spellCheck={false}
								value={layout} onChange={e => setLayout(e.target.value)} />
						</div>
						<div className="gp-row" style={{ paddingBottom: 4 }}>
							<label className="gp-chk">
								<input type="checkbox" checked={showOverlay} onChange={e => setShowOverlay(e.target.checked)} />
								grid overlay
							</label>
						</div>
						{parsed.error && <div className="gp-row" style={{ color: "#ff5370", fontSize: 10 }}>{parsed.error}</div>}
					</div>
					<VarsEditor vars={vars} setVars={setVars} />
					<ChildConfigPanel config={childConfig} setConfig={setChildConfig} />
					<ExtConfigPanel configs={extConfigs} setConfigs={setExtConfigs} />
					<BreakpointsEditor bps={bps} setBps={setBps} />
				</div>
			</div>
		</Grid>
	</div>;
};

// --- styles ---

let GP_CSS = `
.gp-root {
	height: 100%;
	overflow: hidden;
	font-family: var(--font-mono, "SF Mono", "Fira Code", monospace);
	font-size: 12px;
	background: #13131f;
	color: #ccc;
}

/* --- drag handles (matching MobilePlayground pattern) --- */
.gp-drag-handle {
	height: 18px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: ns-resize;
	background: #0f0f1a;
	border-top: 1px solid #686880;
	flex-shrink: 0;
	touch-action: none;
}
.gp-drag-handle::after {
	content: "";
	display: block;
	width: 32px;
	height: 3px;
	border-radius: 2px;
	background: #2a2a5a;
	transition: background 0.15s;
}
.gp-drag-handle:hover::after, .gp-drag-handle:active::after { background: #7fdbca60; }
.gp-handle-x {
	position: absolute;
	top: 0; bottom: 0; left: -9px;
	width: 18px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: col-resize;
	z-index: 300;
	touch-action: none;
}
.gp-handle-x::after {
	content: "";
	display: block;
	width: 3px;
	height: 32px;
	border-radius: 2px;
	background: #2a2a5a;
	transition: background 0.15s;
}
.gp-handle-x:hover::after, .gp-handle-x:active::after { background: #7fdbca60; }

/* --- controls (area l — sidebar at md, full-width strip at mobile) --- */
.gp-ctrl-hd {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 6px 10px;
	border-bottom: 1px solid #686880;
	background: #13131f;
}
.gp-ctrl-title {
	font-size: 11px;
	font-weight: 600;
	color: #7fdbca;
	flex: 1;
}
.gp-ctrl-body {
	display: flex;
	flex-wrap: wrap;
	align-items: start;
}
.gp-ctrl-body > .gp-section {
	min-width: 220px;
	flex: 1;
}
/* sticky header for scrollable areas (debug, controls) */
.gp-sticky-hd {
	position: sticky;
	top: 0;
	background: #13131f;
	z-index: 2;
}
.gp-link-btn, .gp-reset-btn {
	background: none;
	border: 1px solid #686880;
	border-radius: 3px;
	font-family: inherit;
	font-size: 10px;
	padding: 2px 7px;
	cursor: pointer;
	transition: all 0.1s;
}
.gp-link-btn { color: #7fdbca; }
.gp-link-btn:hover { background: #7fdbca18; }
.gp-reset-btn { color: #999; }
.gp-reset-btn:hover { color: #f78c6c; border-color: #f78c6c60; background: #f78c6c10; }

/* --- sections --- */
.gp-root .gp-section {
	border-bottom: 1px solid #1a1a2e;
	padding: 0;
	padding-bottom: 6px;
}
.gp-section-hd {
	display: flex;
	align-items: center;
	font-size: 10px;
	text-transform: uppercase;
	letter-spacing: 1px;
	color: #fff;
	padding: 6px 10px 4px;
	gap: 4px;
}
.gp-collapsible-hd { cursor: pointer; user-select: none; }
.gp-collapsible-hd:hover { color: #7fdbca; }
.gp-active-badge { color: #7fdbca; font-size: 9px; }

/* --- rows / inputs --- */
.gp-row {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 2px 10px;
}
.gp-row-ind { padding-left: 24px; }
.gp-row label {
	font-size: 11px;
	color: #9cc;
	min-width: 56px;
	flex-shrink: 0;
}
.gp-kv-row {
	display: flex;
	align-items: center;
	gap: 4px;
	padding: 2px 10px;
}
.gp-eq { color: #999; font-size: 11px; }
.gp-note { color: #999; font-size: 10px; }
.gp-bp-label {
	font-size: 11px;
	color: #c792ea;
	min-width: 24px;
	flex-shrink: 0;
}
.gp-input {
	background: #0f0f23;
	border: 1px solid #559;
	border-radius: 3px;
	color: #c3e88d;
	font-family: inherit;
	font-size: 12px;
	padding: 5px 8px;
	outline: none;
	resize: none;
	box-sizing: border-box;
}
.gp-input:focus { border-color: #7fdbca; }
.gp-input-sm { font-size: 11px; padding: 3px 6px; }
.gp-input-full { width: 100%; display: block; }
.gp-select {
	background: #0f0f23;
	border: 1px solid #559;
	border-radius: 3px;
	color: #c3e88d;
	font-family: inherit;
	font-size: 11px;
	padding: 3px 6px;
	outline: none;
	cursor: pointer;
}
.gp-select:focus { border-color: #7fdbca; }
.gp-chk {
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: 11px;
	color: #9cc;
	cursor: pointer;
}
.gp-chk input { accent-color: #7fdbca; }
.gp-add-btn {
	background: none;
	border: 1px solid #686880;
	border-radius: 3px;
	color: #7fdbca;
	font-family: inherit;
	font-size: 10px;
	padding: 2px 8px;
	cursor: pointer;
	transition: all 0.1s;
	white-space: nowrap;
}
.gp-add-btn:hover { background: #7fdbca18; }
.gp-del-btn {
	background: none;
	border: none;
	color: #999;
	font-family: inherit;
	font-size: 15px;
	padding: 0 3px;
	cursor: pointer;
	line-height: 1;
	transition: color 0.1s;
	flex-shrink: 0;
}
.gp-del-btn:hover { color: #ff5370; }
.gp-add-row {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 5px 10px 2px;
}
.gp-empty {
	font-size: 11px;
	color: #999;
	padding: 2px 10px 4px;
}

/* --- extension rows --- */
.gp-ext-row {
	margin: 3px 10px;
	border: 1px solid #686880;
	border-radius: 3px;
	overflow: hidden;
}
.gp-ext-hd {
	display: flex;
	align-items: center;
	gap: 5px;
	padding: 4px 8px;
	cursor: pointer;
	user-select: none;
}
.gp-ext-hd:hover { background: #ffffff06; }
.gp-ext-arrow { font-size: 16px; color: #999; width: 10px; flex-shrink: 0; }
.gp-ext-name { font-size: 11px; color: #c792ea; flex: 1; }

/* --- debug panel (area p) --- */
.gp-debug { padding: 4px 12px 8px; font-size: 11px; line-height: 1.7; }
.gp-dbg-row { display: flex; gap: 8px; flex-wrap: wrap; }
.gp-dbg-row .k { color: #c792ea; flex-shrink: 0; }
.gp-dbg-row .v { color: #c3e88d; }
.gp-dbg-err { color: #ff5370; font-size: 11px; padding: 6px 12px; }
.gp-dbg-css {
	margin-top: 6px;
	color: #999;
	font-size: 10px;
	white-space: pre;
	font-family: inherit;
	line-height: 1.5;
}
`;

export default GenericPlayground;
