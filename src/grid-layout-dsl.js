// grid-layout-dsl.js
// Compact grid layout DSL parser
// Input: layout string + optional child count
// Output: CSS grid properties ready to apply

let tokenizeSizes = (s) => {
	let tokens = [], buf = "";
	let flush = () => { if (buf) { tokens.push(buf); buf = ""; } };
	for (let i = 0; i < s.length; i++) {
		let ch = s[i];
		if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") flush();
		else if (ch === "~") buf += ch;
		else if (ch === "*") { flush(); tokens.push("*"); }
		else if (ch === "." || ch === "#") {
			let prevTilde = buf.endsWith("~");
			let nextTilde = i + 1 < s.length && s[i + 1] === "~";
			if (prevTilde || nextTilde) buf += ch;
			else { flush(); tokens.push(ch); }
		} else buf += ch;
	}
	flush();
	return tokens;
};

let normSizeAtom = (s) => {
	if (s === ".") return "auto";
	if (s === "#") return "1fr";
	if (/^\d+(\.\d+)?$/.test(s)) return s + "px";
	return s;
};

let normSize = (s) => {
	if (s.includes("~")) {
		let [min, max] = s.split("~");
		return `minmax(${normSizeAtom(min)}, ${normSizeAtom(max)})`;
	}
	return normSizeAtom(s);
};

// --- fill sizes to target count: trailing * = cycle pattern, otherwise pad with defaultSize ---
let fillSizes = (sizeStr, count, defaultSize = "1fr") => {
	if (!sizeStr) return Array(count).fill(defaultSize);
	let tokens = tokenizeSizes(sizeStr);
	let repeat = tokens[tokens.length - 1] === "*";
	if (repeat) tokens = tokens.slice(0, -1);
	let normed = tokens.map(normSize);
	if (normed.length === 0) return Array(count).fill(defaultSize);
	if (repeat) return Array.from({ length: count }, (_, i) => normed[i % normed.length]);
	let fill = count - normed.length;
	return fill > 0 ? [...normed, ...Array(fill).fill(defaultSize)] : normed.slice(0, count);
};

// --- detect and strip auto-fill/auto-fit from a col/row-sizes string ---
// leading * on the sizes segment = auto-fill
// leading * + trailing * = auto-fit
// returns { sizeStr, repeat: null | "auto-fill" | "auto-fit" }
let parseSizeRepeat = (sizeStr) => {
	if (!sizeStr) return { sizeStr: null, repeat: null };
	let s = sizeStr.trim();
	let tokens = tokenizeSizes(s);
	if (tokens.length === 0 || tokens[0] !== "*") return { sizeStr: s, repeat: null };
	// leading * found — strip it
	tokens = tokens.slice(1);
	let trailing = tokens.length > 0 && tokens[tokens.length - 1] === "*";
	if (trailing) tokens = tokens.slice(0, -1);
	let mode = trailing ? "auto-fit" : "auto-fill";
	// normalize sizes and produce the repeat() CSS value directly
	let normed = tokens.map(normSize);
	return { sizeStr: null, repeat: mode, sizes: normed };
};

// --- build repeat() CSS string from parsed sizes ---
let buildRepeatSizes = (repeatMode, sizes) =>
	"repeat(" + repeatMode + ", " + sizes.join(" ") + ")";

// --- ? flags: secbag/SECBAG + w/h ---
let JustifyMap = { s: "start", e: "end", c: "center", b: "space-between", a: "space-around", g: "space-evenly" };
let AlignMap = { S: "start", E: "end", C: "center", B: "space-between", A: "space-around", G: "space-evenly" };

let parseFlags = (str) => {
	let f = { fullWidth: false, fullHeight: false, flowReverse: false, flowDense: false, justifyContent: null, alignContent: null };
	for (let ch of str) {
		if (ch === "w") f.fullWidth = true;
		else if (ch === "h") f.fullHeight = true;
		else if (ch === "f") f.flowReverse = true;
		else if (ch === "F") f.flowDense = true;
		else if (JustifyMap[ch]) f.justifyContent = JustifyMap[ch];
		else if (AlignMap[ch]) f.alignContent = AlignMap[ch];
	}
	return f;
};

// --- legend parser: a(eC)B(s)c ---
let SelfJMap = { s: "start", e: "end", c: "center", l: "baseline" };
let SelfAMap = { S: "start", E: "end", C: "center", L: "baseline" };

let parseLegend = (legend) => {
	let areas = [], growAreas = new Set(), areaAlign = {};
	let i = 0;
	while (i < legend.length) {
		let ch = legend[i];
		if (!/[a-zA-Z]/.test(ch)) return { error: `invalid legend char "${ch}"` };
		let areaLetter = ch.toLowerCase();
		if (ch !== ch.toLowerCase()) growAreas.add(areaLetter);
		let justifySelf = null, alignSelf = null;
		if (i + 1 < legend.length && legend[i + 1] === "(") {
			let close = legend.indexOf(")", i + 2);
			if (close === -1) return { error: `unclosed '(' after "${ch}"` };
			let mods = legend.substring(i + 2, close);
			for (let m of mods) {
				if (SelfJMap[m]) justifySelf = SelfJMap[m];
				else if (SelfAMap[m]) alignSelf = SelfAMap[m];
				else return { error: `unknown modifier "${m}" in "${ch}(${mods})"` };
			}
			i = close + 1;
		} else i++;
		areas.push(areaLetter);
		if (justifySelf || alignSelf) areaAlign[areaLetter] = { justifySelf, alignSelf };
	}
	return { areas, growAreas, areaAlign };
};

// --- expand char-count shorthand: h12 -> hhhhhhhhhhhh, s3 -> sss, a2b -> aab ---
let expandCharCounts = (s) => {
	let result = "";
	let i = 0;
	while (i < s.length) {
		let ch = s[i];
		if (/[a-zA-Z.]/.test(ch)) {
			// check for trailing number
			let numStr = "";
			let j = i + 1;
			while (j < s.length && /\d/.test(s[j])) { numStr += s[j]; j++; }
			let count = numStr ? parseInt(numStr) : 1;
			result += ch.repeat(count);
			i = j;
		} else { result += ch; i++; }
	}
	return result;
};

// --- parse placement override: letter[col,row] or letter[col,row,z] ---
// also handles letter(mods)[col,row] where mods are alignment modifiers
// returns { area, col, row, z, grow, align } or null if not a placement token
let parsePlacementToken = (token) => {
	let m = token.match(/^([a-zA-Z])(?:\(([^)]*)\))?\[([^\]]+)\]$/);
	if (!m) return null;
	let area = m[1].toLowerCase();
	let grow = m[1] !== m[1].toLowerCase();
	let mods = m[2] || null;
	let parts = m[3].split(",");
	if (parts.length < 2 || parts.length > 3) return null;
	let col = parts[0].trim();
	let row = parts[1].trim();
	let z = parts.length === 3 ? parts[2].trim() : null;
	let toCSS = s => {
		if (s.includes(":")) return s.split(":").join(" / ");
		return s;
	};
	// parse alignment modifiers
	let align = null;
	if (mods) {
		let justifySelf = null, alignSelf = null;
		for (let ch of mods) {
			if (SelfJMap[ch]) justifySelf = SelfJMap[ch];
			else if (SelfAMap[ch]) alignSelf = SelfAMap[ch];
		}
		if (justifySelf || alignSelf) align = { justifySelf, alignSelf };
	}
	return { area, grow, col: toCSS(col), row: toCSS(row), z: z != null ? parseInt(z) : null, align };
};

// --- extract placement overrides from segments ---
// scans all segments for letter[...] or letter(...)[...] tokens, removes them, returns { cleaned, overrides }
let extractPlacements = (segments) => {
	let overrides = {};
	let cleaned = [];
	for (let seg of segments) {
		let remaining = "";
		let i = 0;
		while (i < seg.length) {
			// check for letter[ or letter(...)[ at current position
			if (/[a-zA-Z]/.test(seg[i])) {
				let j = i + 1;
				// skip optional (...) alignment group
				if (j < seg.length && seg[j] === "(") {
					let close = seg.indexOf(")", j + 1);
					if (close !== -1) j = close + 1;
				}
				// now check for [
				if (j < seg.length && seg[j] === "[") {
					let close = seg.indexOf("]", j + 1);
					if (close !== -1) {
						let token = seg.substring(i, close + 1);
						let parsed = parsePlacementToken(token);
						if (parsed) {
							overrides[parsed.area] = parsed;
							i = close + 1;
							continue;
						}
					}
				}
			}
			remaining += seg[i];
			i++;
		}
		if (remaining) cleaned.push(remaining);
	}
	return { cleaned, overrides };
};

// --- + layer merging: split segments on "+", pad layers, overlay into [] cells ---
// each layer is a set of map-row segments (no legend — legend is shared from first layer or separate)
// returns merged map rows with [xy] cells where layers overlap
let mergeLayers = (mapRows) => {
	// split into layers on "+"
	let layers = [], current = [];
	for (let row of mapRows) {
		if (row === "+") {
			if (current.length > 0) layers.push(current);
			current = [];
		} else current.push(row);
	}
	if (current.length > 0) layers.push(current);
	if (layers.length <= 1) return mapRows.filter(r => r !== "+"); // no + found

	// expand char-counts and parse each layer into a 2D char grid
	let grids = layers.map(layer => {
		let rows = layer.map(r => {
			let suffix = r.endsWith("*") ? "*" : "";
			let body = suffix ? r.slice(0, -1) : r;
			return expandCharCounts(body) + suffix;
		});
		// parse rows into cell arrays, handling [xy] cells as multi-char tokens
		return rows.map(parseMapRowCells);
	});

	// find max dimensions
	let maxCols = 0, maxRows = 0;
	for (let grid of grids) {
		if (grid.length > maxRows) maxRows = grid.length;
		for (let row of grid) if (row.length > maxCols) maxCols = row.length;
	}

	// pad each grid to maxCols × maxRows with "." cells
	for (let grid of grids) {
		while (grid.length < maxRows) grid.push([]);
		for (let row of grid) while (row.length < maxCols) row.push(".");
	}

	// overlay: stack layers, collect area names per cell
	let merged = [];
	for (let r = 0; r < maxRows; r++) {
		let row = [];
		for (let c = 0; c < maxCols; c++) {
			let names = new Set();
			for (let grid of grids) {
				let cell = grid[r][c];
				if (cell === ".") continue;
				// cell could be a single char or already a [xy] group
				if (cell.startsWith("[") && cell.endsWith("]")) {
					for (let ch of cell.slice(1, -1)) if (ch !== ".") names.add(ch);
				} else {
					for (let ch of cell) if (ch !== ".") names.add(ch);
				}
			}
			if (names.size === 0) row.push(".");
			else if (names.size === 1) row.push([...names][0]);
			else row.push("[" + [...names].join("") + "]");
		}
		merged.push(row);
	}

	// serialize back to strings — cells are single chars or [xy] groups
	return merged.map(row => row.join(""));
};

// --- parse a map row string into cell tokens, handling [xy] bracket groups ---
// "i[iq]q" -> ["i", "[iq]", "q"]
// "ab.c" -> ["a", "b", ".", "c"]
let parseMapRowCells = (row) => {
	let cells = [], i = 0;
	while (i < row.length) {
		if (row[i] === "[") {
			let close = row.indexOf("]", i + 1);
			if (close !== -1) {
				cells.push(row.substring(i, close + 1));
				i = close + 1;
			} else { cells.push(row[i]); i++; }
		} else { cells.push(row[i]); i++; }
	}
	return cells;
};

// --- resolve [] bracket cells in map rows -> placement overrides ---
// scans parsed map cells for [xy] groups, determines bounding rects for each overlapping area,
// converts to placementOverrides, and replaces those areas with "." in the map
// returns { cleanedRows: string[], overrides: {}, overlapAreas: Set }
let resolveBracketCells = (mapRows) => {
	// parse all rows into cell arrays
	let grid = mapRows.map(parseMapRowCells);
	let maxCols = Math.max(...grid.map(r => r.length));
	// pad to uniform width
	for (let row of grid) while (row.length < maxCols) row.push(".");

	// find all areas that appear in any [] cell
	let overlapAreas = new Set();
	for (let r = 0; r < grid.length; r++) {
		for (let c = 0; c < grid[r].length; c++) {
			let cell = grid[r][c];
			if (cell.startsWith("[") && cell.endsWith("]")) {
				for (let ch of cell.slice(1, -1)) if (ch !== ".") overlapAreas.add(ch.toLowerCase());
			}
		}
	}

	if (overlapAreas.size === 0) return { cleanedRows: mapRows, overrides: {}, overlapAreas };

	// build bounding rect for each overlap area across ALL cells (normal + bracket)
	let bounds = {}; // area -> { minR, maxR, minC, maxC }
	for (let r = 0; r < grid.length; r++) {
		for (let c = 0; c < grid[r].length; c++) {
			let cell = grid[r][c];
			let chars = cell.startsWith("[") && cell.endsWith("]")
				? [...cell.slice(1, -1)]
				: [cell];
			for (let ch of chars) {
				let lower = ch.toLowerCase();
				if (ch === "." || !overlapAreas.has(lower)) continue;
				if (!bounds[lower]) bounds[lower] = { minR: r, maxR: r, minC: c, maxC: c };
				else {
					if (r < bounds[lower].minR) bounds[lower].minR = r;
					if (r > bounds[lower].maxR) bounds[lower].maxR = r;
					if (c < bounds[lower].minC) bounds[lower].minC = c;
					if (c > bounds[lower].maxC) bounds[lower].maxC = c;
				}
			}
		}
	}

	// validate rectangularity for overlap areas
	for (let [area, b] of Object.entries(bounds)) {
		for (let r = b.minR; r <= b.maxR; r++) {
			for (let c = b.minC; c <= b.maxC; c++) {
				let cell = grid[r][c];
				let chars = cell.startsWith("[") && cell.endsWith("]")
					? [...cell.slice(1, -1)].map(ch => ch.toLowerCase())
					: [cell.toLowerCase()];
				if (!chars.includes(area) && !chars.includes("."))
					return { error: `overlap area "${area}" not rectangular (row ${r + 1}, col ${c + 1})` };
				// "." inside bounding rect is ok — it's a gap that the area spans over
			}
		}
	}

	// convert bounds to placement overrides (1-based CSS grid lines)
	let overrides = {};
	for (let [area, b] of Object.entries(bounds)) {
		overrides[area] = {
			area,
			grow: false, // will be updated from legend later
			col: `${b.minC + 1} / ${b.maxC + 2}`,
			row: `${b.minR + 1} / ${b.maxR + 2}`,
			z: null,
			align: null,
		};
	}

	// clean the map: remove overlap areas from all cells
	let cleanedGrid = grid.map(row =>
		row.map(cell => {
			if (cell.startsWith("[") && cell.endsWith("]")) {
				let remaining = [...cell.slice(1, -1)].filter(ch => !overlapAreas.has(ch.toLowerCase()));
				if (remaining.length === 0) return ".";
				if (remaining.length === 1) return remaining[0];
				return "[" + remaining.join("") + "]"; // still overlapping after removal
			}
			if (overlapAreas.has(cell.toLowerCase())) return ".";
			return cell;
		})
	);

	let cleanedRows = cleanedGrid.map(row => row.join(""));
	return { cleanedRows, overrides, overlapAreas };
};

// --- parse auto-flow span pattern: *s3c6a3 -> { colCount: 12, spans: [{area:"s",span:3},{area:"c",span:6},{area:"a",span:3}] } ---
let parseAutoFlowPattern = (pat) => {
	// pat is everything after the leading * e.g. "s3c6a3" or "w2*2" or "12" or ""
	let spans = [];
	let i = 0;
	let totalCols = 0;
	while (i < pat.length) {
		let ch = pat[i];
		if (ch === "*") {
			// *N means N unnamed single-span columns
			let numStr = "";
			let j = i + 1;
			while (j < pat.length && /\d/.test(pat[j])) { numStr += pat[j]; j++; }
			let count = numStr ? parseInt(numStr) : 1;
			for (let k = 0; k < count; k++) { spans.push({ area: null, span: 1 }); totalCols++; }
			i = j;
		} else if (/[a-zA-Z]/.test(ch)) {
			let area = ch.toLowerCase();
			let numStr = "";
			let j = i + 1;
			while (j < pat.length && /\d/.test(pat[j])) { numStr += pat[j]; j++; }
			let span = numStr ? parseInt(numStr) : 1;
			spans.push({ area, span });
			totalCols += span;
			i = j;
		} else if (/\d/.test(ch)) {
			// plain number = N unnamed columns (same as *N shorthand for compat)
			let numStr = "";
			let j = i;
			while (j < pat.length && /\d/.test(pat[j])) { numStr += pat[j]; j++; }
			let count = parseInt(numStr);
			for (let k = 0; k < count; k++) { spans.push({ area: null, span: 1 }); totalCols++; }
			i = j;
		} else i++;
	}
	return { colCount: totalCols, spans };
};

// --- main parser ---
let parseGridLayout = (input, childCount) => {
	input = (input || "").trim();
	if (!input && childCount > 0) input = "*";

	let transpose = false;
	if (input.startsWith("|")) {
		transpose = true;
		input = input.substring(1).trim();
		if (!input && childCount > 0) input = "*";
	}
	if (!input) return { error: "empty layout" };

	let pipeParts = input.split("|").map(s => s.trim());
	let mainPart = pipeParts[0];
	let colSizesRaw = pipeParts[1] || null, rowSizesRaw = pipeParts[2] || null;
	let colParsed = parseSizeRepeat(colSizesRaw);
	let rowParsed = parseSizeRepeat(rowSizesRaw);
	let colSizes = colParsed.sizeStr, rowSizes = rowParsed.sizeStr;
	let colRepeat = colParsed.repeat || null, rowRepeat = rowParsed.repeat || null;
	let colRepeatSizes = colParsed.sizes || null, rowRepeatSizes = rowParsed.sizes || null;

	// tokenize main part, preserving parenthesized and bracketed groups
	let segments = [], buf = "", depth = 0;
	for (let ch of mainPart) {
		if (ch === "(" || ch === "[") { depth++; buf += ch; }
		else if (ch === ")" || ch === "]") { depth--; buf += ch; }
		else if (depth === 0 && (ch === " " || ch === "\t" || ch === "\n" || ch === "\r" || ch === ",")) {
			if (buf) { segments.push(buf); buf = ""; }
		} else buf += ch;
	}
	if (buf) segments.push(buf);

	// extract ? flags (floating position)
	let flags = { fullWidth: false, fullHeight: false, flowReverse: false, flowDense: false, justifyContent: null, alignContent: null };
	let remaining = [];
	for (let seg of segments) {
		if (seg.startsWith("?")) {
			let f = parseFlags(seg.substring(1));
			if (f.fullWidth) flags.fullWidth = true;
			if (f.fullHeight) flags.fullHeight = true;
			if (f.flowReverse) flags.flowReverse = true;
			if (f.flowDense) flags.flowDense = true;
			if (f.justifyContent) flags.justifyContent = f.justifyContent;
			if (f.alignContent) flags.alignContent = f.alignContent;
		} else remaining.push(seg);
	}
	segments = remaining;

	// extract placement overrides: letter[col,row] or letter[col,row,z]
	let { cleaned: cleanedSegs, overrides: placementOverrides } = extractPlacements(segments);
	segments = cleanedSegs;

	// all-numeric = gap only, prepend *
	if (segments.length > 0 && segments.every(s => /^\d+(\.\d+)?$/.test(s))) {
		if (childCount > 0) segments.unshift("*");
		else return { error: "gap without layout" };
	}
	if (segments.length < 1) {
		// check if we have placement overrides — pure placement layout
		let poKeys = Object.keys(placementOverrides);
		if (poKeys.length > 0) {
			// derive grid dimensions from max line numbers in placements
			let maxCol = 0, maxRow = 0;
			for (let po of Object.values(placementOverrides)) {
				let colNums = po.col.split("/").map(s => parseInt(s.trim())).filter(n => n > 0);
				let rowNums = po.row.split("/").map(s => parseInt(s.trim())).filter(n => n > 0);
				for (let n of colNums) if (n > maxCol) maxCol = n;
				for (let n of rowNums) if (n > maxRow) maxRow = n;
			}
			// line N means N-1 tracks
			let colCount = Math.max(1, maxCol - 1);
			let rowCount = Math.max(1, maxRow - 1);
			let areas = poKeys;
			let growAreas = poKeys.filter(k => placementOverrides[k].grow);
			let areaAlign = {};
			for (let [name, po] of Object.entries(placementOverrides)) {
				if (po.align) areaAlign[name] = po.align;
			}
			let colDefault = "1fr", rowDefault = "1fr";
			let colSizeList = fillSizes(colSizes, colCount, colDefault);
			let rowSizeList = fillSizes(rowSizes, rowCount, rowDefault);
			return {
				areas, growAreas, areaAlign,
				templateAreas: null,
				colSizes: colSizeList, rowSizes: rowSizeList,
				colCount, rowCount,
				gapH: null, gapV: null, transpose, expanded: false, flags,
				explicitSizes: { cols: !!colSizes, rows: !!rowSizes },
				colRepeat: null, rowRepeat: null, colRepeatSizes: null, rowRepeatSizes: null,
				placementOverrides,
			};
		}
		if (childCount > 0) segments = ["*"];
		else return { error: "need at least a legend or *" };
	}

	// --- detect auto-flow: segment starting with * ---
	let expanded = false;
	let autoFlow = 0;

	// check for auto-flow segments (segments starting with * that aren't row-repeat)
	// *  *N  *s3c6a3  *w2*2  — these are all auto-flow patterns in the first segment
	// but also: "h12 *s3c6a3" — auto-flow pattern in a non-first segment
	// strategy: find segments starting with * and parse them

	// first, check if first segment is a * pattern
	if (segments[0].startsWith("*")) {
		let pat = segments[0].substring(1); // strip leading *

		// extract trailing gap(s) from remaining segments
		let localGapH = null, localGapV = null;
		let gEndIdx = segments.length;
		if (gEndIdx > 1 && /^\d+(\.\d+)?$/.test(segments[gEndIdx - 1])) {
			if (gEndIdx > 2 && /^\d+(\.\d+)?$/.test(segments[gEndIdx - 2])) {
				localGapH = parseFloat(segments[gEndIdx - 2]);
				localGapV = parseFloat(segments[gEndIdx - 1]);
			} else {
				localGapH = parseFloat(segments[gEndIdx - 1]);
				localGapV = localGapH;
			}
		}

		if (!childCount || childCount < 1) return { error: "* requires children > 0" };

		if (pat === "" || /^\d+$/.test(pat)) {
			// plain * or *N — simple auto-flow, all children span 1
			let colNum = pat ? parseInt(pat) : childCount;
			autoFlow = colNum;

			let colDefault = flags.justifyContent ? "auto" : "1fr";
			let rowDefault = flags.alignContent ? "auto" : "1fr";
			let colSizeList = fillSizes(colSizes, colNum, colDefault);

			let rowNum = Math.ceil(childCount / colNum);
			let rowSizeList = fillSizes(rowSizes, rowNum, rowDefault);

			// no grid-template-areas, use auto-placement
			let areas = Array.from({ length: childCount }, (_, i) => "c" + i);

			if (transpose) {
				let t = colSizeList; colSizeList = rowSizeList; rowSizeList = t;
				let tr = colNum; colNum = rowNum; rowNum = tr;
				let tg = localGapH; localGapH = localGapV; localGapV = tg;
				let tcr = colRepeat; colRepeat = rowRepeat; rowRepeat = tcr;
				let tcs = colRepeatSizes; colRepeatSizes = rowRepeatSizes; rowRepeatSizes = tcs;
			}

			return {
				areas, growAreas: [], areaAlign: {},
				templateAreas: null, // signal: no grid-template-areas
				colSizes: colSizeList, rowSizes: rowSizeList,
				colCount: colNum, rowCount: rowNum,
				gapH: localGapH, gapV: localGapV, transpose, expanded: true, flags,
				autoFlow: colNum,
				colRepeat, rowRepeat, colRepeatSizes, rowRepeatSizes,
				placementOverrides,
			};
		}

		// pattern auto-flow: *s3c6a3, *w2*2, etc.
		let { colCount: patCols, spans } = parseAutoFlowPattern(pat);
		autoFlow = patCols;

		// also parse non-first segments as static rows with their own span patterns
		// e.g. "h12 *s3c6a3" — h12 is a static row
		let staticRows = [];
		let autoFlowSegIdx = 0;
		for (let si = 1; si < segments.length; si++) {
			let seg = segments[si];
			if (/^\d+(\.\d+)?$/.test(seg)) break; // gap
			if (seg.startsWith("?")) continue; // flag (already extracted)
			// it's a static row with char-count spans
			// but wait — in this branch segments[0] is the *, so segments[1..] are either gaps or other patterns
			// actually "h12 *s3c6a3" would have segments = ["h12", "*s3c6a3"] or ["*s3c6a3"] if h12 is part of the first segment
			// hmm — let me handle this in the map-row path instead
		}

		// compute max col count across all rows
		// for now, just use the pattern's col count
		let colNum = patCols;

		let colDefault = flags.justifyContent ? "auto" : "1fr";
		let rowDefault = flags.alignContent ? "auto" : "1fr";
		let colSizeList = fillSizes(colSizes, colNum, colDefault);

		// build span info for children: cycle through the pattern
		let childSpans = [];
		for (let ci = 0; ci < childCount; ci++) {
			let spanInfo = spans[ci % spans.length];
			childSpans.push(spanInfo);
		}

		let rowNum = 0;
		let colAccum = 0;
		for (let cs of childSpans) { colAccum += cs.span; if (colAccum > colNum || colAccum === colNum) { rowNum++; colAccum = colAccum > colNum ? cs.span : 0; } }
		if (colAccum > 0) rowNum++;

		let rowSizeList = fillSizes(rowSizes, rowNum, rowDefault);

		let areas = childSpans.map((s, i) => s.area || ("c" + i));

		return {
			areas, growAreas: [], areaAlign: {},
			templateAreas: null,
			colSizes: colSizeList, rowSizes: rowSizeList,
			colCount: colNum, rowCount: rowNum,
			gapH: localGapH, gapV: localGapV, transpose, expanded: true, flags,
			autoFlow: colNum, childSpans,
			colRepeat, rowRepeat, colRepeatSizes, rowRepeatSizes,
			placementOverrides,
		};
	}

	// --- also handle non-first segments with * for auto-flow rows ---
	// e.g. "h12 *s3c6a3" — first segment is static, second is auto-flow
	// detect: any segment (not first) starting with *
	let autoFlowIdx = -1;
	let autoFlowPat = null;
	for (let si = 0; si < segments.length; si++) {
		if (si > 0 && segments[si].startsWith("*") && !segments[si].endsWith("*")) {
			autoFlowIdx = si;
			autoFlowPat = segments[si].substring(1);
			break;
		}
	}

	if (autoFlowIdx >= 0) {
		// mixed mode: static rows before, auto-flow pattern for remaining children
		// parse static rows with char-count expansion
		let staticSegments = segments.slice(0, autoFlowIdx);
		let { colCount: patCols, spans } = parseAutoFlowPattern(autoFlowPat);

		// parse static row segments for their spans
		let staticSpans = [];
		let maxCols = patCols;
		for (let seg of staticSegments) {
			if (/^\d+(\.\d+)?$/.test(seg)) continue; // gap
			let expanded = expandCharCounts(seg);
			if (expanded.length > maxCols) maxCols = expanded.length;
			// each char in expanded row = one cell, count per unique char = span
			let rowSpans = [];
			let i = 0;
			while (i < expanded.length) {
				let ch = expanded[i];
				let count = 0;
				while (i < expanded.length && expanded[i] === ch) { count++; i++; }
				rowSpans.push({ area: ch.toLowerCase(), span: count });
			}
			staticSpans.push(rowSpans);
		}

		// extract gaps
		let localGapH = null, localGapV = null;
		let gEndIdx = segments.length;
		if (gEndIdx > autoFlowIdx + 1 && /^\d+(\.\d+)?$/.test(segments[gEndIdx - 1])) {
			if (gEndIdx > autoFlowIdx + 2 && /^\d+(\.\d+)?$/.test(segments[gEndIdx - 2])) {
				localGapH = parseFloat(segments[gEndIdx - 2]);
				localGapV = parseFloat(segments[gEndIdx - 1]);
			} else {
				localGapH = parseFloat(segments[gEndIdx - 1]);
				localGapV = localGapH;
				}
			}

		let colNum = maxCols;
		let colDefault = flags.justifyContent ? "auto" : "1fr";
		let rowDefault = flags.alignContent ? "auto" : "1fr";
		let colSizeList = fillSizes(colSizes, colNum, colDefault);

		// static children count
		let staticChildCount = staticSpans.reduce((sum, row) => sum + row.length, 0);
		let dynamicChildCount = (childCount || 0) - staticChildCount;

		// build all child spans: static rows first, then cycling pattern
		let allSpans = [];
		for (let row of staticSpans) for (let s of row) allSpans.push(s);
		if (dynamicChildCount > 0) {
			for (let ci = 0; ci < dynamicChildCount; ci++) {
				allSpans.push(spans[ci % spans.length]);
			}
		}

		let areas = allSpans.map((s, i) => s.area || ("c" + i));

		// count rows
		let rowNum = staticSpans.length;
		let colAccum = 0;
		for (let ci = staticChildCount; ci < allSpans.length; ci++) {
			colAccum += allSpans[ci].span;
			if (colAccum >= colNum) { rowNum++; colAccum = colAccum > colNum ? allSpans[ci].span : 0; }
		}
		if (colAccum > 0) rowNum++;

		let rowSizeList = fillSizes(rowSizes, rowNum, rowDefault);

		return {
			areas, growAreas: [], areaAlign: {},
			templateAreas: null,
			colSizes: colSizeList, rowSizes: rowSizeList,
			colCount: colNum, rowCount: rowNum,
			gapH: localGapH, gapV: localGapV, transpose, expanded: true, flags,
			autoFlow: colNum, childSpans: allSpans,
			colRepeat, rowRepeat, colRepeatSizes, rowRepeatSizes,
			placementOverrides,
		};
	}

	if (/^\d+(\.\d+)?$/.test(segments[0]))
		return { error: `"${segments[0]}" looks like a number, not a legend` };

	// --- area-based path (existing) ---
	// expand char-counts in legend and map rows
	// legend: parse normally (parseLegend handles letters + parens)
	// map rows: expand char-counts before processing
	let legendResult = parseLegend(segments[0]);
	if (legendResult.error) return legendResult;
	let { areas, growAreas, areaAlign } = legendResult;

	// inject placement-only areas that aren't already in the legend
	for (let [name, po] of Object.entries(placementOverrides)) {
		if (!areas.includes(name)) {
			areas.push(name);
			if (po.grow) growAreas.add(name);
		}
		if (po.align) areaAlign[name] = po.align;
	}

	// extract trailing gap(s)
	let gapH = null, gapV = null, endIdx = segments.length;
	if (endIdx > 1 && /^\d+(\.\d+)?$/.test(segments[endIdx - 1])) {
		if (endIdx > 2 && /^\d+(\.\d+)?$/.test(segments[endIdx - 2])) {
			gapH = parseFloat(segments[endIdx - 2]);
			gapV = parseFloat(segments[endIdx - 1]);
			endIdx -= 2;
		} else {
			gapH = parseFloat(segments[endIdx - 1]);
			gapV = gapH;
			endIdx -= 1;
		}
	}

	let mapRows = segments.slice(1, endIdx);
	if (mapRows.length == 0) mapRows = [areas.join("")];

	// expand char-counts in map rows: s3 -> sss, h12 -> hhhhhhhhhhhh
	mapRows = mapRows.map(row => {
		// preserve trailing * for repeat detection
		let suffix = row.endsWith("*") ? "*" : "";
		let body = suffix ? row.slice(0, -1) : row;
		return expandCharCounts(body) + suffix;
	});

	// --- + layer merging: split on "+", pad, overlay into [] cells ---
	if (mapRows.includes("+"))
		mapRows = mergeLayers(mapRows);

	// --- [] bracket cell resolution: convert overlap cells to placement overrides ---
	if (mapRows.some(r => r.includes("["))) {
		let resolved = resolveBracketCells(mapRows);
		if (resolved.error) return resolved;
		mapRows = resolved.cleanedRows;
		// merge bracket-derived overrides into placementOverrides
		for (let [name, po] of Object.entries(resolved.overrides)) {
			if (growAreas.has(name)) po.grow = true;
			placementOverrides[name] = { ...po, ...(placementOverrides[name] || {}) };
		}
		// ensure overlap areas are in the areas list
		for (let name of resolved.overlapAreas) {
			if (!areas.includes(name)) areas.push(name);
		}
	}

	// --- detect repeat row (ends with *) ---
	let repeatIdx = -1;
	let repeatRowRaw = null;
	let repeatRow = null;
	let repeatAreas = new Set();
	let pinnedAreas = new Set();
	for (let i = 0; i < mapRows.length; i++) {
		if (mapRows[i].endsWith("*")) {
			if (repeatIdx !== -1) return { error: "only one repeat row (*) allowed" };
			repeatIdx = i;
			repeatRowRaw = mapRows[i].slice(0, -1);
			repeatRow = repeatRowRaw.toLowerCase();
			for (let j = 0; j < repeatRowRaw.length; j++) {
				let ch = repeatRowRaw[j];
				if (ch === ".") continue;
				let lower = ch.toLowerCase();
				if (ch !== lower) pinnedAreas.add(lower);
				else repeatAreas.add(lower);
			}
			for (let p of pinnedAreas) repeatAreas.delete(p);
		}
	}

	let staticAreas = areas.filter(a => !repeatAreas.has(a));
	let repeatAreaList = areas.filter(a => repeatAreas.has(a));

	// --- repeat expansion ---
	if (repeatIdx !== -1) {
		if (!childCount || childCount < 1) return { error: "repeat row (*) requires children > 0" };

		let dynamicChildren = childCount - staticAreas.length;
		if (dynamicChildren < 0) return { error: `need at least ${staticAreas.length} children for static areas` };
		let areasPerRow = repeatAreas.size;
		if (areasPerRow === 0) return { error: "repeat row has no areas to repeat" };
		let repeatCount = Math.max(1, Math.ceil(dynamicChildren / areasPerRow));

		let expandedAreas = [...staticAreas];
		let expandedAlign = { ...areaAlign };
		let expandedGrow = new Set(growAreas);

		for (let n = 1; n <= repeatCount; n++) {
			for (let ch of repeatRow) {
				if (ch === "." || pinnedAreas.has(ch)) continue;
				let name = ch + n;
				if (!expandedAreas.includes(name)) {
					expandedAreas.push(name);
					if (areaAlign[ch]) expandedAlign[name] = areaAlign[ch];
					if (growAreas.has(ch)) expandedGrow.add(name);
				}
			}
		}

		let tokenRows = [];
		for (let i = 0; i < mapRows.length; i++) {
			if (i === repeatIdx) {
				for (let n = 1; n <= repeatCount; n++) {
					let tokens = [];
					for (let ch of repeatRow) {
						if (ch === ".") tokens.push(".");
						else if (pinnedAreas.has(ch)) tokens.push(ch);
						else tokens.push(ch + n);
					}
					tokenRows.push(tokens);
				}
			} else {
				tokenRows.push([...mapRows[i]].map(ch => ch === "." ? "." : ch));
			}
		}

		let colCount = tokenRows[0].length;
		for (let row of tokenRows) {
			if (row.length !== colCount) return { error: `row has ${row.length} cols, expected ${colCount}` };
		}

		let templateAreas = tokenRows.map(row => '"' + row.join(" ") + '"');

		let colSizeList = colSizes
			? fillSizes(colSizes, colCount, "auto")
			: Array.from({ length: colCount }, (_, c) => {
				for (let row of tokenRows) {
					let name = row[c];
					let base = name.replace(/\d+$/, "");
					if (expandedGrow.has(name) || expandedGrow.has(base)) return "1fr";
				}
				return "auto";
			});

		let totalRowCount = tokenRows.length;
		let rowSizeList = [];
		if (rowSizes) {
			let sizeTokens = tokenizeSizes(rowSizes);
			let repeat = sizeTokens[sizeTokens.length - 1] === "*";
			if (repeat) sizeTokens = sizeTokens.slice(0, -1);
			let normed = sizeTokens.map(normSize);
			if (repeat) {
				// cycle over all expanded rows
				rowSizeList = Array.from({ length: totalRowCount }, (_, i) => normed[i % normed.length]);
			} else {
				// original behavior: sizes map to pre-expansion rows, repeat-row size fills all copies
				for (let i = 0; i < mapRows.length; i++) {
					if (i === repeatIdx) {
						let sz = i < normed.length ? normed[i] : "auto";
						for (let n = 0; n < repeatCount; n++) rowSizeList.push(sz);
					} else rowSizeList.push(i < normed.length ? normed[i] : "auto");
				}
			}
		} else {
			for (let row of tokenRows) {
				let hasGrow = false;
				for (let name of row) {
					let base = name.replace(/\d+$/, "");
					if (expandedGrow.has(name) || expandedGrow.has(base)) hasGrow = true;
				}
				rowSizeList.push(hasGrow ? "1fr" : "auto");
			}
		}

		if (transpose) {
			let newRows = [];
			for (let c = 0; c < colCount; c++) {
				let row = [];
				for (let r = 0; r < tokenRows.length; r++) row.push(tokenRows[r][c]);
				newRows.push(row);
			}
			templateAreas = newRows.map(row => '"' + row.join(" ") + '"');
			let tmp = colSizeList; colSizeList = rowSizeList; rowSizeList = tmp;
			// swap justify/align axes
			let swapped = {};
			for (let [k, v] of Object.entries(expandedAlign)) {
				swapped[k] = { justifySelf: v.alignSelf, alignSelf: v.justifySelf };
			}
			expandedAlign = swapped;
			flags = { ...flags, justifyContent: flags.alignContent, alignContent: flags.justifyContent };
			let tmpG = gapH; gapH = gapV; gapV = tmpG;
		}

		let rowCount = transpose ? colCount : tokenRows.length;
		let finalColCount = transpose ? tokenRows.length : colCount;

		let ec = !!colSizes, er = !!rowSizes;
		if (transpose) { let t = ec; ec = er; er = t; }

		return {
			areas: expandedAreas, growAreas: [...expandedGrow], areaAlign: expandedAlign,
			templateAreas, colSizes: colSizeList, rowSizes: rowSizeList,
			colCount: finalColCount, rowCount,
			gapH, gapV, transpose, expanded, flags,
			explicitSizes: { cols: ec, rows: er },
			repeatInfo: { pattern: repeatAreaList, pinned: [...pinnedAreas], count: repeatCount, staticAreas },
			colRepeat: null, rowRepeat: null, colRepeatSizes: null, rowRepeatSizes: null,
			placementOverrides,
		};
	}

	// --- non-repeat path ---
	let seen = new Set();
	for (let ch of areas) {
		if (seen.has(ch)) return { error: `duplicate area "${ch}" in legend` };
		seen.add(ch);
	}

	let colCount = mapRows[0].length;
	for (let row of mapRows) {
		if (row.length !== colCount)
			return { error: `row "${row}" has ${row.length} cols, expected ${colCount}` };
		for (let ch of row) {
			if (ch !== "." && !areas.includes(ch))
				return { error: `unknown area "${ch}" in row "${row}"` };
		}
	}

	for (let area of areas) {
		let minR = Infinity, maxR = -1, minC = Infinity, maxC = -1;
		for (let r = 0; r < mapRows.length; r++) {
			for (let c = 0; c < colCount; c++) {
				if (mapRows[r][c] === area) {
					minR = Math.min(minR, r); maxR = Math.max(maxR, r);
					minC = Math.min(minC, c); maxC = Math.max(maxC, c);
				}
			}
		}
		if (minR > maxR) continue;
		for (let r = minR; r <= maxR; r++) {
			for (let c = minC; c <= maxC; c++) {
				if (mapRows[r][c] !== area)
					return { error: `area "${area}" not rectangular (row ${r + 1}, col ${c + 1})` };
			}
		}
	}

	let templateAreas = mapRows.map(row =>
		'"' + [...row].map(ch => ch === "." ? "." : ch).join(" ") + '"'
	);

	let proportional = false;
	if (!colSizes) {
		// if any area repeats in this column's row, treat as proportional -> 1fr
		for (let row of mapRows) {
			// check if this char appears more than once in any row (proportional)
			if (row.match(/([a-z])\1/))
				proportional = true;
		}
	}
	let colSizeList = colSizes
		? fillSizes(colSizes, colCount, proportional ? "1fr" : "auto")
		: Array.from({ length: colCount }, (_, c) => {
			// if any area repeats in this column's row, treat as proportional -> 1fr
			for (let row of mapRows) {
				if (growAreas.has(row[c])) return "1fr";
			}
			return proportional ? "1fr" : "auto";
		});

	let rowSizeList = rowSizes
		? fillSizes(rowSizes, mapRows.length, "auto")
		: mapRows.map(row => {
			for (let ch of row) { if (growAreas.has(ch)) return "1fr"; }
			return "auto";
		});

	if (transpose) {
		let newRows = [];
		for (let c = 0; c < colCount; c++) {
			let row = "";
			for (let r = 0; r < mapRows.length; r++) row += mapRows[r][c];
			newRows.push(row);
		}
		templateAreas = newRows.map(row => '"' + [...row].join(" ") + '"');
		let tmp = colSizeList; colSizeList = rowSizeList; rowSizeList = tmp;
		// swap justify/align axes
		let swapped = {};
		for (let [k, v] of Object.entries(areaAlign)) {
			swapped[k] = { justifySelf: v.alignSelf, alignSelf: v.justifySelf };
		}
		areaAlign = swapped;
		flags = { ...flags, justifyContent: flags.alignContent, alignContent: flags.justifyContent };
		let tmpG = gapH; gapH = gapV; gapV = tmpG;
	}

	let rowCount = transpose ? colCount : mapRows.length;
	let finalColCount = transpose ? mapRows.length : colCount;

	let ec = !!colSizes, er = !!rowSizes;
	if (transpose) { let t = ec; ec = er; er = t; }

	return {
		areas, growAreas: [...growAreas], areaAlign, templateAreas,
		colSizes: colSizeList, rowSizes: rowSizeList,
		colCount: finalColCount, rowCount,
		gapH, gapV, transpose, expanded, flags,
		explicitSizes: { cols: ec, rows: er },
		colRepeat: null, rowRepeat: null, colRepeatSizes: null, rowRepeatSizes: null,
		placementOverrides,
	};
};

// --- helper: convert parsed result to CSS style object for the grid container ---
let toGridStyle = (parsed) => {
	if (parsed.error) return null;

	// explicit fr in user-written pipe sizes should imply full width/height
	// but auto-inferred 1fr (from proportional areas or grow letters) should not
	let es = parsed.explicitSizes || {};
	let explicitFrCols = es.cols && parsed.colSizes.some(s => s.includes("fr"));
	let explicitFrRows = es.rows && parsed.rowSizes.some(s => s.includes("fr"));
	// grow areas generate 1fr tracks — those need container size to distribute into
	let growFrCols = /*parsed.colSizes.some(s => s.includes("fr")) &&*/ parsed.growAreas.length > 0;
	let growFrRows = /*parsed.rowSizes.some(s => s.includes("fr")) &&*/ parsed.growAreas.length > 0;

	let style = { display: "grid" };

	if (parsed.templateAreas) {
		// area-based mode
		style.gridTemplateAreas = parsed.templateAreas.join(" ");
	} else {
		// auto-flow mode — default is row, transpose flips to column, ?f reverses, ?F adds dense
		let base = parsed.transpose ? "column" : "row";
		if (parsed.flags.flowReverse) base = base === "row" ? "column" : "row";
		style.gridAutoFlow = base + (parsed.flags.flowDense ? " dense" : "");
	}

	style.gridTemplateColumns = parsed.colRepeat
		? buildRepeatSizes(parsed.colRepeat, parsed.colRepeatSizes)
		: parsed.colSizes.join(" ");
	style.gridTemplateRows = parsed.rowRepeat
		? buildRepeatSizes(parsed.rowRepeat, parsed.rowRepeatSizes)
		: parsed.rowSizes.join(" ");

	// auto-fill/auto-fit implies full width (or height when transposed)
	let autoRepeatCols = !!parsed.colRepeat;
	let autoRepeatRows = !!parsed.rowRepeat;
	if (growFrCols || explicitFrCols || parsed.flags.fullWidth || autoRepeatCols) style.width = "100%"; else style.width = "fit-content";
	if (growFrRows || explicitFrRows || parsed.flags.fullHeight || autoRepeatRows) style.height = "100%"; else style.height = "fit-content";

	if (parsed.gapH != null) {
		style.gap = parsed.gapH === parsed.gapV
			? parsed.gapH + "px"
			: parsed.gapH + "px " + parsed.gapV + "px";
	}

	if (parsed.flags.justifyContent) style.justifyContent = parsed.flags.justifyContent;
	if (parsed.flags.alignContent) style.alignContent = parsed.flags.alignContent;
	style.overflow = "hidden";

	return style;
};

// --- helper: get style for a specific area ---
let toAreaStyle = (parsed, areaName, childIdx) => {
	let style = {};
	let po = parsed.placementOverrides && parsed.placementOverrides[areaName];

	if (po) {
		// explicit line-based placement — overrides grid-area
		style.gridColumn = po.col;
		style.gridRow = po.row;
		if (po.z != null) style.zIndex = po.z;
	} else if (parsed.templateAreas) {
		// area-based mode
		style.gridArea = areaName;
	} else if (parsed.childSpans && childIdx != null && childIdx < parsed.childSpans.length) {
		// auto-flow mode with spans
		let span = parsed.childSpans[childIdx].span;
		if (span > 1) style.gridColumn = `span ${span}`;
	}
	// else: auto-flow without spans, no style needed (auto-placement)

	let align = parsed.areaAlign[areaName];
	if (align) {
		if (align.justifySelf) style.justifySelf = align.justifySelf;
		if (align.alignSelf) style.alignSelf = align.alignSelf;
	}
	if (parsed.flags.fullHeight)
		style.minHeight = "0px";
	return style;
};

export { parseGridLayout, toGridStyle, toAreaStyle };
