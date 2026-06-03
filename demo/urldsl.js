/****************************************************
 * Layout URL DSL
 *
 * Format: <layout>;<vars>;<nodes>;<flags>
 * nodes:
 *   sp(w,s:b,80,400)
 *   bx(4,A,B,C,D)
 ****************************************************/

const SEP = ";";
const ARG_SEP = ",";
const KV_SEP = ":";
const NODES = {
	// extensions
	splitPane: {
		id: "sp",
		fields: [
			{ key: "var", def: "w", type: "text" },
			{ key: "edge", def: "a:r", type: "text" },
			{ key: "min", def: 0, type: "number" },
			{ key: "max", def: 9999, type: "number" },
			{ key: "handleSize", def: 6, type: "number" },
		],
	},
	collapsible: {
		id: "cl",
		fields: [
			{ key: "var", def: "w", type: "text" },
			{ key: "area", def: "a", type: "text" },
			{ key: "expanded", def: 200, type: "number" },
			{ key: "collapsed", def: 0, type: "number" },
			{ key: "handle", def: "end", type: "text" },
		],
	},
	animate: {
		id: "an",
		fields: [
			{ key: "duration", def: "0.3s", type: "text" },
			{ key: "easing", def: "ease", type: "text" },
		],
	},
	scrollable: {
		id: "sc",
		fields: [
			{ key: "area", def: "a", type: "text" },
			{ key: "axis", def: "both", type: "text" },
		],
	},
	accordion: {
		id: "ac",
		fields: [
			{ key: "var", def: "active", type: "text" },
			{ key: "collapsed", def: ".", type: "text" },
			{ key: "items", def: "a:200,b:200", type: "text" },
		],
	},
	tabs: {
		id: "tb",
		fields: [
			{ key: "var", def: "tab", type: "text" },
			{ key: "position", def: "top", type: "text" },
			{ key: "items", def: "Tab1:a,Tab2:b", type: "text" },
		],
	},

	// generators
	boxes: {
		id: "bx",
		fields: [
			{ key: "count", def: 4, type: "number" },
			{ key: "labels", def: "A,B,C,D", type: "text" },
		],
	},
	lorem: {
		id: "lo",
		fields: [
			{ key: "count", def: 10, type: "number" },
			{ key: "pad", def: 8, type: "number" },
		],
	},
	cards: {
		id: "cd",
		fields: [
			{ key: "count", def: 4, type: "number" },
			{ key: "height", def: 80, type: "number" },
		],
	},
	tiles: {
		id: "tl",
		fields: [
			{ key: "count", def: 6, type: "number" },
			{ key: "ratio", def: "4/3", type: "text" },
		],
	},
	numbered: {
		id: "nu",
		fields: [
			{ key: "count", def: 4, type: "number" },
			{ key: "minH", def: 40, type: "number" },
		],
	},
	empty: {
		id: "em",
		fields: [
			{ key: "count", def: 3, type: "number" },
		],
	},
};

const ID_TO_TYPE = Object.fromEntries(
	Object.entries(NODES).map(([k, v]) => [v.id, k])
);

/* -----------------------------
 * ENCODE
 * ----------------------------- */

export function encodeState(state) {
	const parts = [];
	for (const [k, v] of Object.entries({o:state.showOverlay})) // playground vars
		if (typeof v=="boolean")
			parts.push(v ? `${k}` : ``);
		else parts.push(`${k}${KV_SEP}${v}`);
	if (state.layout) // layout
		parts.push(encodeLayout(state.layout));
	for (const [k, v] of Object.entries({...state.breakpoints})) // breakpoints
		if (v) parts.push(`${k}${KV_SEP}${v}`);
	for (const n of [state.childConfig, ...state.extConfigs]) // unified nodes
		parts.push(encodeNode(n));
	for (const [k, v] of Object.entries({...state.vars})) // user vars
		parts.push(`${k}${KV_SEP}${v}`);
	return parts.join(SEP);
}
function encodeLayout(layout) {
	if (typeof layout=="object")
		return Object.entries(layout).map(([k, v]) => `${k}:${v}`).join(",");
	return layout;
}
function encodeNode(node) {
	const def = NODES[node.type];
	if (!def) throw new Error("Unknown node: " + node.type);
	const args = def.fields.map(f => {
		const v = node.opts?.[f.key];
		return v === undefined ? null : (""+v).replace(/\s+/g,"");
	});
	// drop only trailing args equal to their default (or missing) — dropping a
	// non-trailing default would shift the positional decoding of later args
	let end = args.length;
	while (end > 0) {
		const f = def.fields[end - 1];
		const v = node.opts?.[f.key];
		if (v === undefined || v === f.def) end--;
		else break;
	}
	const kept = args.slice(0, end).map(a => a == null ? "" : a);
	if (kept.length === 0) return def.id;
	return `${def.id}(${kept.join(ARG_SEP)})`;
}

/* -----------------------------
 * DECODE
 * ----------------------------- */

export function decodeState(str) {
	const parts = str.split(SEP);
	const BP_NAMES = ["xs", "sm", "md", "lg", "xl"];
	const state = {
		layout: "", vars: {}, extConfigs: [], childConfig: {},
		breakpoints: { xs: "", sm: "", md: "", lg: "", xl: "" }, showOverlay: false,
	};
	for (const part of parts) {
		if (!part) continue;
		if (part === "o") { // flag
			state.showOverlay = true;
			continue;
		}
		else if (/^[a-z]{2}\(/.test(part)) { // nodes
			const m = part.match(/^([a-z]+)\((.*)\)$/);
			if (!m) continue;
			const [, id, raw] = m;
			const type = ID_TO_TYPE[id];
			if (!type) continue;
			state.extConfigs.push(decodeNode(type, raw));
		}
		else if (part.includes(KV_SEP) && BP_NAMES.includes(part.slice(0, part.indexOf(KV_SEP)))) { // breakpoints
			const idx = part.indexOf(KV_SEP);
			state.breakpoints[part.slice(0, idx)] = part.slice(idx + 1);
			continue;
		}
		else if (/^[a-zA-Z0-9_]+:/.test(part)) { // vars
			const idx = part.indexOf(KV_SEP);
			const k = part.slice(0, idx), v = part.slice(idx + 1);
			state.vars[k] = isNaN(v) ? v : Number(v);
			continue;
		}
		else if (!part.includes(":") && !part.includes("(")) { // layout
			if (!state.layout) {
				state.layout = decodeLayout(part);
				continue;
			}
		}
	}
	state.childConfig = state.extConfigs.splice(0,1)[0];
	return state;
}
function decodeLayout(str) {
	if (str.includes(":") && str.includes(","))
		return Object.fromEntries(str.split(",").map(s => s.split(":")));
	return str;
}
function decodeNode(type, raw) {
	const def = NODES[type];
	const args = (raw ? raw.split(ARG_SEP) : []).map(a => a.trim());
	const opts = {};
	const last = def.fields.length - 1;
	def.fields.forEach((f, i) => {
		// last field absorbs any extra args, so a trailing comma-list
		// (boxes labels, tabs items, accordion items) needs no escaping
		let v = i === last && args.length > def.fields.length
			? args.slice(i).join(ARG_SEP)
			: args[i];
		if (v === undefined) return;
		if (v === "") v = f.def; // empty slot = default (keeps positional alignment)
		opts[f.key] = f.type === "number" ? Number(v) : v;
	});
	return { type, opts };
}

/* -----------------------------
 * URL-FRAGMENT ENCODING
 *
 * The DSL uses , : | ( ) [ ] { } < > etc. — all valid raw in a URL
 * fragment per RFC 3986. encodeURIComponent over-escapes them into an
 * unreadable %2C/%7C/%3A soup, so we only escape the three characters
 * that would actually break parsing: "%" (the escape char), " " (-> "+"),
 * and "#" (the fragment delimiter). "+" is encoded so it can round-trip
 * back to a literal space.
 */
export function encodeFragment(str) {
	return (str || "")
		.replace(/%/g, "%25")
		.replace(/\+/g, "%2B")
		.replace(/#/g, "%23")
		.replace(/ /g, "+");
}
export function decodeFragment(str) {
	return (str || "")
		.replace(/\+/g, " ")
		.replace(/%2B/gi, "+")
		.replace(/%23/gi, "#")
		.replace(/%25/gi, "%");
}
