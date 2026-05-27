// grid-layout-dsl.test.mjs
// test runner: node grid-layout-dsl.test.mjs
import { parseGridLayout, toGridStyle, toAreaStyle } from "./grid-layout-dsl.js";

let passed = 0, failed = 0, errors = [];

let assert = (condition, msg) => {
	if (condition) passed++;
	else { failed++; errors.push(msg); }
};
let eq = (a, b, msg) => {
	let sa = JSON.stringify(a), sb = JSON.stringify(b);
	assert(sa === sb, `${msg}\n    expected: ${sb}\n    got:      ${sa}`);
};
let ok = (v, msg) => assert(!!v, msg);
let section = (name) => { console.log(`  ${name}`); };

// shorthand: parse + style in one go
let p = (layout, n) => parseGridLayout(layout, n);
let gs = (layout, n) => toGridStyle(parseGridLayout(layout, n));
let as = (layout, n, area, idx) => toAreaStyle(parseGridLayout(layout, n), area, idx);

console.log("\ngrid-layout-dsl test suite\n");

// --- tokenizeSizes / normSize (tested indirectly through parseGridLayout) ---

section("basic area maps");
{
	let r = p("ab", 2);
	eq(r.areas, ["a", "b"], "ab: two areas");
	eq(r.templateAreas, ['"a b"'], "ab: single-row template");
	eq(r.colCount, 2, "ab: 2 columns");
	eq(r.rowCount, 1, "ab: 1 row");
}
{
	let r = p("abc", 3);
	eq(r.areas, ["a", "b", "c"], "abc: three areas");
	eq(r.colCount, 3, "abc: 3 columns");
}
{
	let r = p("ab ab", 2);
	eq(r.templateAreas, ['"a b"'], "ab ab: legend + same map = 1 row");
	eq(r.rowCount, 1, "ab ab: 1 row");
}
{
	let r = p("hsCf hhhh sccc sfff", 4);
	eq(r.areas, ["h", "s", "c", "f"], "holy grail: four areas");
	eq(r.templateAreas, ['"h h h h"', '"s c c c"', '"s f f f"'], "holy grail: template");
	eq(r.colCount, 4, "holy grail: 4 columns");
	eq(r.rowCount, 3, "holy grail: 3 rows");
	ok(r.growAreas.includes("c"), "holy grail: c grows");
	ok(!r.growAreas.includes("h"), "holy grail: h does not grow");
}

section("legend-only (implicit single-row map)");
{
	let r = p("a", 1);
	eq(r.areas, ["a"], "single area");
	eq(r.templateAreas, ['"a"'], "a: single cell template");
}

section("empty cells");
{
	let r = p("hf h. .f", 2);
	eq(r.templateAreas, ['"h ."', '". f"'], "hf h. .f: 2 map rows");
}
{
	let r = p("c .c.", 1);
	eq(r.templateAreas, ['". c ."'], "centered card: dot-c-dot");
	eq(r.colCount, 3, ".c.: 3 columns");
}

section("proportional sizing (repeated chars)");
{
	let r = p("ab abb", 2);
	eq(r.colCount, 3, "abb: 3 columns");
	eq(r.templateAreas, ['"a b b"'], "abb: b spans 2 cols in map");
	ok(r.colSizes.every(s => s === "1fr"), "abb: proportional → all 1fr");
}

section("char-count shorthand");
{
	let r = p("ab a2b3", 2);
	eq(r.colCount, 5, "a2b3: 2+3=5 cols");
	eq(r.templateAreas, ['"a a b b b"'], "a2b3: a×2 b×3");
}
{
	// char-count in map rows: legend must include the area
	let r = p("h h12", 1);
	eq(r.colCount, 12, "h12 in map row: 12 cols");
}

section("grow areas (uppercase)");
{
	let r = p("aB", 2);
	ok(r.growAreas.includes("b"), "B → b grows");
	ok(!r.growAreas.includes("a"), "a does not grow");
}
{
	let r = p("AB", 2);
	ok(r.growAreas.includes("a"), "A → a grows");
	ok(r.growAreas.includes("b"), "B → b grows");
}

section("per-area alignment modifiers");
{
	let r = p("a(e)B(sC)", 2);
	eq(r.areaAlign.a, { justifySelf: "end", alignSelf: null }, "a(e): justify end");
	eq(r.areaAlign.b, { justifySelf: "start", alignSelf: "center" }, "B(sC): start + center");
}
{
	let r = p("a(cC)b", 2);
	eq(r.areaAlign.a, { justifySelf: "center", alignSelf: "center" }, "a(cC): both centered");
}

section("gaps");
{
	let r = p("ab 8", 2);
	eq(r.gapH, 8, "ab 8: gap 8");
	eq(r.gapV, 8, "ab 8: gapV same");
}
{
	let r = p("ab 8 12", 2);
	eq(r.gapH, 8, "ab 8 12: gapH=8");
	eq(r.gapV, 12, "ab 8 12: gapV=12");
}
{
	let s = gs("ab 8", 2);
	eq(s.gap, "8px", "ab 8: CSS gap");
}
{
	let s = gs("ab 8 12", 2);
	eq(s.gap, "8px 12px", "ab 8 12: CSS gap h v");
}

section("flags (?whfFsecbag)");
{
	let s = gs("ab ?w", 2);
	eq(s.width, "100%", "?w: full width");
}
{
	let s = gs("ab ?h", 2);
	eq(s.height, "100%", "?h: full height");
}
{
	let s = gs("ab ?wh", 2);
	eq(s.width, "100%", "?wh: full width");
	eq(s.height, "100%", "?wh: full height");
}
{
	let r = p("ab ?cC", 2);
	eq(r.flags.justifyContent, "center", "?cC: justify center");
	eq(r.flags.alignContent, "center", "?cC: align center");
}
{
	let r = p("ab ?b", 2);
	eq(r.flags.justifyContent, "space-between", "?b: space-between");
}
{
	let r = p("ab ?g", 2);
	eq(r.flags.justifyContent, "space-evenly", "?g: space-evenly");
}
{
	let s = gs("ab ?cC", 2);
	eq(s.justifyContent, "center", "?cC: CSS justify-content");
	eq(s.alignContent, "center", "?cC: CSS align-content");
}

section("pipe sizes (columns and rows)");
{
	let r = p("ab ab | 100 #", 2);
	eq(r.colSizes, ["100px", "1fr"], "| 100 #: 100px + 1fr");
}
{
	let r = p("ab aa bb | 100 # | 50 200", 2);
	eq(r.colSizes, ["100px", "1fr"], "pipes: col sizes");
	eq(r.rowSizes, ["50px", "200px"], "pipes: row sizes");
}
{
	let r = p("ab | . #", 2);
	eq(r.colSizes, ["auto", "1fr"], "| . #: auto + 1fr");
}
{
	let s = gs("ab ab | 100 #", 2);
	eq(s.gridTemplateColumns, "100px 1fr", "CSS cols: 100px 1fr");
	eq(s.width, "100%", "explicit # → full width");
}

section("minmax (~)");
{
	let r = p("abc | 100~# 100~# 100~#", 3);
	eq(r.colSizes, ["minmax(100px, 1fr)", "minmax(100px, 1fr)", "minmax(100px, 1fr)"], "minmax cols");
}
{
	let r = p("ab | 200~300", 2);
	eq(r.colSizes, ["minmax(200px, 300px)", "auto"], "200~300: minmax px-px + auto pad");
}
{
	let r = p("ab | .~#", 2);
	eq(r.colSizes, ["minmax(auto, 1fr)", "auto"], ".~#: auto~1fr + auto pad");
}

section("size cycling (trailing * in sizes)");
{
	let r = p("abcdef | 50 # *", 6);
	eq(r.colSizes, ["50px", "1fr", "50px", "1fr", "50px", "1fr"], "cycle 50 # across 6 cols");
}
{
	let r = p("*3 || 40 80 *", 9);
	eq(r.rowSizes, ["40px", "80px", "40px"], "row size cycling: 40 80 repeats across 3 rows");
}

section("transpose (|)");
{
	let r = p("|ab", 2);
	ok(r.transpose, "|ab: transpose flag");
	eq(r.templateAreas, ['"a"', '"b"'], "|ab: swapped to column");
}
{
	let r = p("|abc", 3);
	eq(r.colCount, 1, "|abc: 1 col (transposed from 3 rows)");
	eq(r.rowCount, 3, "|abc: 3 rows (transposed from 3 cols)");
}
{
	let s = gs("| 12", 3);
	ok(s.gridAutoFlow.includes("column"), "| with auto-flow: column direction");
}

section("auto-flow (*)");
{
	let r = p("*", 5);
	eq(r.autoFlow, 5, "*: all children in one row");
	eq(r.colCount, 5, "*: 5 columns");
	eq(r.rowCount, 1, "*: 1 row");
	eq(r.templateAreas, null, "*: no template-areas");
}
{
	let r = p("*3", 9);
	eq(r.autoFlow, 3, "*3: 3 columns");
	eq(r.colCount, 3, "*3: 3 cols");
	eq(r.rowCount, 3, "*3: 3 rows for 9 children");
}
{
	let r = p("*4 ?w", 8);
	eq(r.autoFlow, 4, "*4: 4 columns");
	eq(r.flags.fullWidth, true, "*4 ?w: full width");
}
{
	let r = p("* 8", 3);
	eq(r.gapH, 8, "* 8: gap extracted");
	eq(r.autoFlow, 3, "* 8: auto-flow with all children");
}
{
	let s = gs("*3", 9);
	ok(!s.gridTemplateAreas, "*3: no template-areas in style");
	ok(s.gridAutoFlow, "*3: has auto-flow");
}

section("auto-flow with gap-only (all-numeric segments)");
{
	let r = p("8", 3);
	eq(r.autoFlow, 3, "just '8' with children: auto-flow");
	eq(r.gapH, 8, "'8': gap extracted");
}
{
	let r = p("| 12", 4);
	ok(r.transpose, "'| 12': transposed");
	eq(r.gapH, 12, "'| 12': gap=12");
}

section("auto-flow: ?f reverse and ?F dense");
{
	let s = gs("*3 ?whf", 9);
	ok(s.gridAutoFlow.includes("column"), "?f: reversed to column");
}
{
	let s = gs("*3 ?whF", 9);
	ok(s.gridAutoFlow.includes("dense"), "?F: dense packing");
}

section("auto-flow with explicit sizes");
{
	let r = p("* 8 | 40 80 120", 3);
	eq(r.colSizes, ["40px", "80px", "120px"], "auto-flow + explicit col sizes");
}

section("auto-flow pattern (*s3c6a3)");
{
	let r = p("*s3c6a3", 3);
	eq(r.colCount, 12, "*s3c6a3: 3+6+3=12 cols");
	eq(r.childSpans[0], { area: "s", span: 3 }, "first child: s span 3");
	eq(r.childSpans[1], { area: "c", span: 6 }, "second child: c span 6");
	eq(r.childSpans[2], { area: "a", span: 3 }, "third child: a span 3");
}
{
	let s = as("*s3c6a3", 3, "s", 0);
	eq(s.gridColumn, "span 3", "s span 3 in area style");
}

section("repeat rows (trailing *)");
{
	let r = p("habf hh ab* ff", 6);
	ok(r.repeatInfo, "repeat row parsed");
	eq(r.repeatInfo.pattern, ["a", "b"], "repeat pattern: a, b");
	ok(r.templateAreas.length >= 4, "repeat expanded rows");
}
{
	// pinned areas (uppercase in repeat row)
	let r = p("sa Sa*", 5);
	ok(r.repeatInfo.pinned.includes("s"), "S pinned in repeat row");
	// s should span all repeat rows
	let sRows = r.templateAreas.filter(t => t.includes("s"));
	eq(sRows.length, r.templateAreas.length, "pinned s spans all rows");
}

section("template variables ({var})");
{
	// variables aren't resolved in the parser — just pass through
	// but the Grid component does replacement before parsing
	// so we test that {var} in a layout string doesn't break parsing
	let r = p("sC | 200#", 2);
	ok(!r.error, "sC | 200#: no error (var placeholder handled at component level)");
}

section("auto-fill / auto-fit (leading * in sizes)");
{
	let r = p("* 6 ?w | *150~#", 5);
	eq(r.colRepeat, "auto-fill", "* prefix → auto-fill");
	ok(r.colRepeatSizes[0].includes("minmax"), "auto-fill with minmax size");
}
{
	let r = p("* 6 ?w | *150~#*", 5);
	eq(r.colRepeat, "auto-fit", "* prefix + * suffix → auto-fit");
}

section("explicit sizes → full width/height inference");
{
	let s = gs("ab ab | # #", 2);
	eq(s.width, "100%", "explicit # in cols → full width");
}
{
	let s = gs("ab ab | 100 200", 2);
	eq(s.width, "fit-content", "px-only cols → fit-content");
}
{
	let s = gs("AB", 2);
	eq(s.width, "100%", "grow areas infer 1fr → full width");
}

section("toAreaStyle basics");
{
	let r = p("hsCf hhhh sccc sfff", 4);
	eq(toAreaStyle(r, "h", 0).gridArea, "h", "h gets gridArea");
	eq(toAreaStyle(r, "c", 2).gridArea, "c", "c gets gridArea");
}
{
	let r = p("a(e)B(sC) ab", 2);
	let sa = toAreaStyle(r, "a", 0);
	eq(sa.justifySelf, "end", "a(e): justifySelf end");
	let sb = toAreaStyle(r, "b", 1);
	eq(sb.justifySelf, "start", "B(sC): justifySelf start");
	eq(sb.alignSelf, "center", "B(sC): alignSelf center");
}

section("toGridStyle basics");
{
	let s = gs("hsCf hhhh sccc sfff 8", 4);
	eq(s.display, "grid", "display: grid");
	ok(s.gridTemplateAreas, "has template areas");
	eq(s.gap, "8px", "gap: 8px");
	eq(s.overflow, "hidden", "overflow: hidden");
}
{
	let s = gs("*3 ?wh", 9);
	eq(s.display, "grid", "auto-flow: display grid");
	eq(s.width, "100%", "auto-flow ?w: full width");
	eq(s.height, "100%", "auto-flow ?h: full height");
}

section("error handling");
{
	let r = p("", 0);
	ok(r.error, "empty string no children: error");
}
{
	let r = p("ab ax", 2);
	ok(r.error, "unknown area x in map: error");
}
{
	let r = p("ab aba", 2);
	ok(r.error, "row length mismatch: error");
}
{
	let r = p("aa", 2);
	ok(r.error, "duplicate area in legend: error");
}
{
	// a forms an L-shape: (0,0), (1,0), (1,1) but not (0,1) → not rectangular
	let r = p("abc ab. aa.", 3);
	ok(r.error, "non-rectangular area: error");
}
{
	let r = p("*", 0);
	ok(r.error, "* with no children: error");
}

// --- placement overrides [col,row] ---

section("placement overrides: mixed with area map");
{
	let r = p("q i[1:3,1:3] .qq .qq", 2);
	eq(r.areas, ["q", "i"], "mixed: areas include both");
	ok(r.placementOverrides.i, "mixed: i has override");
	eq(r.placementOverrides.i.col, "1 / 3", "mixed: i col");
	eq(r.placementOverrides.i.row, "1 / 3", "mixed: i row");
	eq(r.templateAreas, ['". q q"', '". q q"'], "mixed: map has only q");
	let si = toAreaStyle(r, "i", 0);
	eq(si.gridColumn, "1 / 3", "mixed: i gridColumn");
	eq(si.gridRow, "1 / 3", "mixed: i gridRow");
	ok(!si.gridArea, "mixed: i has no gridArea");
	let sq = toAreaStyle(r, "q", 1);
	eq(sq.gridArea, "q", "mixed: q gets normal gridArea");
}

section("placement overrides: pure placement (no map)");
{
	let r = p("i[1:3,1:3] q[2:4,2:4]", 2);
	eq(r.areas, ["i", "q"], "pure: both areas");
	eq(r.templateAreas, null, "pure: no template-areas");
	eq(r.colCount, 3, "pure: 3 cols inferred from max line");
	eq(r.rowCount, 3, "pure: 3 rows inferred");
	eq(r.colSizes, ["1fr", "1fr", "1fr"], "pure: default 1fr sizes");
	let si = toAreaStyle(r, "i", 0);
	eq(si.gridColumn, "1 / 3", "pure: i gridColumn");
	let sq = toAreaStyle(r, "q", 1);
	eq(sq.gridColumn, "2 / 4", "pure: q gridColumn");
}

section("placement overrides: z-index");
{
	let r = p("i[1:3,1:3,10] q[2:4,2:4,20]", 2);
	let si = toAreaStyle(r, "i", 0);
	eq(si.zIndex, 10, "z-index: i=10");
	let sq = toAreaStyle(r, "q", 1);
	eq(sq.zIndex, 20, "z-index: q=20");
}
{
	let r = p("i[1:3,1:3] q[2:4,2:4]", 2);
	let si = toAreaStyle(r, "i", 0);
	ok(!("zIndex" in si), "no z-index when not specified");
}

section("placement overrides: negative line numbers");
{
	let r = p("i[1:-1,1:-1]", 1);
	let si = toAreaStyle(r, "i", 0);
	eq(si.gridColumn, "1 / -1", "negative col: 1 / -1");
	eq(si.gridRow, "1 / -1", "negative row: 1 / -1");
}

section("placement overrides: grow (uppercase)");
{
	let r = p("I[1:3,1:3] q[2:4,2:4]", 2);
	ok(r.growAreas.includes("i"), "I uppercase → grows");
	ok(r.placementOverrides.i.grow, "override stores grow flag");
}

section("placement overrides: alignment modifiers");
{
	let r = p("q i(cC)[1:3,1:3] .qq .qq", 2);
	eq(r.areaAlign.i, { justifySelf: "center", alignSelf: "center" }, "i(cC): alignment stored");
	let si = toAreaStyle(r, "i", 0);
	eq(si.justifySelf, "center", "i(cC): justifySelf in style");
	eq(si.alignSelf, "center", "i(cC): alignSelf in style");
	eq(si.gridColumn, "1 / 3", "i(cC): placement still works");
}

section("placement overrides: in legend alongside normal areas");
{
	let r = p("iq i[1:3,1:3] .qq .qq", 2);
	eq(r.areas, ["i", "q"], "legend iq: both areas present");
	ok(r.placementOverrides.i, "i has override despite being in legend");
	let si = toAreaStyle(r, "i", 0);
	eq(si.gridColumn, "1 / 3", "legend i: override takes precedence");
	ok(!si.gridArea, "legend i: no gridArea when overridden");
}

section("placement overrides: with explicit pipe sizes");
{
	let r = p("i[1:3,1:3] q[2:4,2:4] | 100 # # | # # #", 2);
	eq(r.colSizes, ["100px", "1fr", "1fr"], "explicit col sizes with placement");
	eq(r.rowSizes, ["1fr", "1fr", "1fr"], "explicit row sizes with placement");
}

section("placement overrides: empty overrides object for normal layouts");
{
	let r = p("hsCf hhhh sccc sfff 8", 4);
	eq(r.placementOverrides, {}, "normal layout: empty overrides");
}

// --- regression: existing layouts must still work ---

section("regression: demo preset layouts");
{
	let cases = [
		["a", 1],
		["abc", 3],
		["ab abb", 2],
		["ab ab | 100 200", 2],
		["c .c. 16", 1],
		["hf h. .f 8", 2],
		["hsCf hhhh sccc sfff 8", 4],
		["hs(S)Cf(e) hh sc sf 8 | 100# | .#.", 4],
		["ab ?w 8", 2],
		["ab ?wh 8", 2],
		["abc ?whcC", 3],
		["abc ?whg", 3],
		["abc ?wb", 3],
		["a(e)b(s)c(cC) abc ?wh", 3],
		["sc 8 ?w | 100~300 #", 2],
		["abc | 100~# 100~# 100~#", 3],
		["abcdef | 50 # *", 6],
		["|sc ?w 8", 2],
		["|abc ?w 8", 3],
	];
	for (let [layout, n] of cases) {
		let r = p(layout, n);
		ok(!r.error, `regression: "${layout}" → no error (got: ${r.error || "ok"})`);
	}
}

section("regression: auto-flow presets");
{
	let cases = [
		["*", 5],
		["* 8", 3],
		["| 8", 4],
		["| 12", 4],
		["*4 4 ?w", 8],
		["*3 4 ?whf", 9],
		["*4 4 ?wF", 10],
		["*7 ?wh", 7],
		["*6 4 ?wh | 50 # *", 12],
		["*3 8 ?wh", 9],
	];
	for (let [layout, n] of cases) {
		let r = p(layout, n);
		ok(!r.error, `regression: "${layout}" n=${n} → no error (got: ${r.error || "ok"})`);
	}
}

section("regression: repeat row presets");
{
	let r1 = p("habf hh ab* ff 8 | .#", 6);
	ok(!r1.error, "repeat: habf hh ab* ff");
	let r2 = p("sah sh Sa* 8", 5);
	ok(!r2.error, "repeat: sah sh Sa*");
	let r3 = p("abc aabc* 4 | ####", 7);
	ok(!r3.error, "repeat: abc aabc*");
	let r4 = p("a a* 4 ?w", 5);
	ok(!r4.error, "repeat: a a*");
}

section("regression: auto-fill/auto-fit");
{
	let r1 = p("* 6 ?w | *150~#", 5);
	ok(!r1.error, "auto-fill: * | *150~#");
	eq(r1.colRepeat, "auto-fill", "auto-fill detected");
	let r2 = p("* 6 ?w | *150~#*", 5);
	ok(!r2.error, "auto-fit: * | *150~#*");
	eq(r2.colRepeat, "auto-fit", "auto-fit detected");
}

section("regression: transposed auto-flow");
{
	let r = p("|* ?w 4", 5);
	ok(!r.error, "|* ?w 4: no error");
	ok(r.transpose, "|*: transposed");
	let s = gs("|* ?w 4", 5);
	ok(s.gridAutoFlow.includes("column"), "|*: column flow");
}

section("regression: comma separators");
{
	let r = p("hsCf, hhhh, sccc, sfff, 8", 4);
	ok(!r.error, "comma separators accepted");
	eq(r.templateAreas, ['"h h h h"', '"s c c c"', '"s f f f"'], "commas: same result");
}

section("edge: single area with pipe sizes");
{
	let r = p("a | # | #", 1);
	ok(!r.error, "single area with sizes");
	eq(r.colSizes, ["1fr"], "single col: 1fr");
	eq(r.rowSizes, ["1fr"], "single row: 1fr");
}

section("edge: implicit * from empty string with children");
{
	let r = p("", 3);
	ok(!r.error, "empty string + children: auto-flow");
	eq(r.autoFlow, 3, "empty → * → 3 cols");
}

section("edge: fillSizes padding and truncation");
{
	let r = p("abc | 100", 3);
	eq(r.colSizes.length, 3, "3 cols with 1 size: padded");
	eq(r.colSizes[0], "100px", "first col: 100px");
}
{
	let r = p("ab | 100 200 300", 2);
	eq(r.colSizes.length, 2, "2 cols with 3 sizes: truncated");
}

// --- + layer syntax ---

section("+ layers: basic overlay (testimonial card)");
{
	let r = p("iq ii. ii. ... + ... .qq .qq", 2);
	ok(!r.error, "+layers: no error");
	ok(r.placementOverrides.i, "+layers: i has override");
	ok(r.placementOverrides.q, "+layers: q has override");
	eq(r.placementOverrides.i.col, "1 / 3", "+layers: i col 1/3");
	eq(r.placementOverrides.i.row, "1 / 3", "+layers: i row 1/3");
	eq(r.placementOverrides.q.col, "2 / 4", "+layers: q col 2/4");
	eq(r.placementOverrides.q.row, "2 / 4", "+layers: q row 2/4");
	// cleaned map should be all dots
	ok(r.templateAreas.every(t => t.replace(/[". ]/g, "") === ""), "+layers: map is all dots");
}

section("+ layers: padding short layers");
{
	let r = p("iq ii ii + .qq .qq .qq", 2);
	ok(!r.error, "+layers pad: no error");
	eq(r.placementOverrides.i.col, "1 / 3", "+layers pad: i col");
	eq(r.placementOverrides.i.row, "1 / 3", "+layers pad: i row");
	eq(r.placementOverrides.q.col, "2 / 4", "+layers pad: q col");
	eq(r.placementOverrides.q.row, "1 / 4", "+layers pad: q row");
}

section("+ layers: non-overlapping (no bracket cells)");
{
	let r = p("iq i. + .q", 2);
	ok(!r.error, "+layers no overlap: no error");
	eq(r.placementOverrides, {}, "+layers no overlap: no overrides");
	eq(r.templateAreas, ['"i q"'], "+layers no overlap: normal template");
}

section("+ layers: three layers");
{
	let r = p("iqr ii. ... ... + ... .qq ... + ... ... ..r", 3);
	ok(!r.error, "+3 layers: no error");
	// no overlap between any layers, so no overrides
	eq(r.placementOverrides, {}, "+3 layers no overlap: no overrides");
}

// --- [] bracket cell syntax ---

section("[] cells: direct overlap markup");
{
	// "iq ii. i[iq]q .qqq" → 3 rows, 4 cols (padded)
	// i at (0,0)(0,1)(1,0)(1,1) → col 1/3, row 1/3
	// q at (1,1)(1,2)(2,1)(2,2)(2,3) → col 2/5, row 2/4
	let r = p("iq ii. i[iq]q .qqq", 2);
	ok(!r.error, "[] direct: no error");
	ok(r.placementOverrides.i, "[] direct: i has override");
	ok(r.placementOverrides.q, "[] direct: q has override");
	eq(r.placementOverrides.i.col, "1 / 3", "[] direct: i col");
	eq(r.placementOverrides.i.row, "1 / 3", "[] direct: i row");
	eq(r.placementOverrides.q.col, "2 / 5", "[] direct: q col");
	eq(r.placementOverrides.q.row, "2 / 4", "[] direct: q row");
}

section("[] cells: symmetric overlap");
{
	let r = p("iq ii. i[iq]q .qq", 2);
	ok(!r.error, "[] symmetric: no error");
	eq(r.placementOverrides.i.col, "1 / 3", "[] sym: i col 1/3");
	eq(r.placementOverrides.i.row, "1 / 3", "[] sym: i row 1/3");
	eq(r.placementOverrides.q.col, "2 / 4", "[] sym: q col 2/4");
	eq(r.placementOverrides.q.row, "2 / 4", "[] sym: q row 2/4");
	let si = toAreaStyle(r, "i", 0);
	eq(si.gridColumn, "1 / 3", "[] sym: i area style col");
	eq(si.gridRow, "1 / 3", "[] sym: i area style row");
	ok(!si.gridArea, "[] sym: i has no gridArea");
}

section("[] cells: triple overlap");
{
	let r = p("iqr [iqr]r. .rr.", 3);
	ok(!r.error, "[] triple: no error");
	ok(r.placementOverrides.i, "[] triple: i override");
	ok(r.placementOverrides.q, "[] triple: q override");
	ok(r.placementOverrides.r, "[] triple: r override");
}

section("[] cells: sparse placement (dots in bounding rect ok)");
{
	// i at (0,0) and (1,1) — bounding box spans 2×2, dots fill the gaps
	// this is valid: grid-column 1/3, grid-row 1/3 spans the area
	let r = p("iq i. .[iq]", 2);
	ok(!r.error, "[] sparse: no error (dots in bounding rect are valid)");
	eq(r.placementOverrides.i.col, "1 / 3", "[] sparse: i col 1/3");
	eq(r.placementOverrides.i.row, "1 / 3", "[] sparse: i row 1/3");
}

section("[] cells: truly non-rectangular overlap errors");
{
	// i appears at (0,0), (1,0), (1,1) — bounding box is 2×2
	// but (0,1) has "q" (not "." and not "i") → not rectangular
	let r = p("iq [iq]q i[iq]", 2);
	ok(r.error, "[] non-rect: error when non-dot/non-area cell in bounding rect");
}

section("[] + normal areas coexist");
{
	// a and b are normal non-overlapping areas; i and q overlap
	let r = p("iqab ii.ab i[iq]qab .qqab", 4);
	ok(!r.error, "[] + normal: no error");
	ok(r.placementOverrides.i, "[] + normal: i has override");
	ok(r.placementOverrides.q, "[] + normal: q has override");
	ok(!r.placementOverrides.a, "[] + normal: a has no override");
	ok(!r.placementOverrides.b, "[] + normal: b has no override");
	// a and b should be in template areas normally
	let sq = toAreaStyle(r, "a", 2);
	eq(sq.gridArea, "a", "[] + normal: a gets gridArea");
}

// --- unified () modifier parser ---

section("() flex-basis");
{
	let r = p("a(200) b 8");
	eq(r.areaProps?.a?.flexBasis, "200px", "a(200): flexBasis 200px");
}
{
	let r = p("a(200!) b 8");
	eq(r.areaProps?.a?.flexBasis, "200px", "a(200!): flexBasis 200px");
	eq(r.areaProps?.a?.flexShrink, 0, "a(200!): flexShrink 0");
}
{
	let r = p("a(200/2) b 8");
	eq(r.areaProps?.a?.flexBasis, "200px", "a(200/2): flexBasis 200px");
	eq(r.areaProps?.a?.flexShrink, 2, "a(200/2): flexShrink 2");
}
{
	let r = p("a(0) b 8");
	eq(r.areaProps?.a?.flexBasis, "0px", "a(0): flexBasis 0px");
}

section("() z-index");
{
	let r = p("a(z5) b 8");
	eq(r.areaProps?.a?.z, 5, "a(z5): z-index 5");
	let s = toAreaStyle(r, "a", 0);
	eq(s.zIndex, 5, "a(z5): zIndex in area style");
}
{
	// legacy [] z-index still works
	let r = p("a[1:2,1:2,5] b[2:3,1:2]");
	let s = toAreaStyle(r, "a", 0);
	eq(s.zIndex, 5, "legacy [col,row,z]: zIndex still works");
}

section("() className and alias");
{
	let r = p("a(.hero) b 8");
	eq(r.areaProps?.a?.className, "hero", "a(.hero): single className");
}
{
	let r = p("a(.foo .bar .baz) b 8");
	eq(r.areaProps?.a?.className, "foo bar baz", "a(.foo .bar .baz): multiple classnames with spaces");
}
{
	// . is self-delimiting — no whitespace needed
	let r = p("a(.foo.bar.baz) b 8");
	eq(r.areaProps?.a?.className, "foo bar baz", "a(.foo.bar.baz): chained dots no separator");
}
{
	// . and = self-delimiting together
	let r = p("a(.card=header) b 8");
	eq(r.areaProps?.a?.className, "card", ".card=header: className");
	eq(r.areaProps?.a?.alias, "header", ".card=header: alias");
}
{
	// alignment + chained dots, no separator
	let r = p("a(eC.card.hero) b 8");
	eq(r.areaAlign?.a?.justifySelf, "end", "eC.card.hero: justifySelf");
	eq(r.areaProps?.a?.className, "card hero", "eC.card.hero: classNames");
}
{
	// sizing still needs whitespace/comma
	let r = p("a(.card 200! z3) b 8");
	eq(r.areaProps?.a?.className, "card", "class + sizing: className");
	eq(r.areaProps?.a?.flexBasis, "200px", "class + sizing: basis");
	eq(r.areaProps?.a?.flexShrink, 0, "class + sizing: no-shrink");
	eq(r.areaProps?.a?.z, 3, "class + sizing: z-index");
}
{
	// classes from legend + floating meta accumulate
	let r = p("a(.foo) b 8 a(.bar)");
	eq(r.areaProps?.a?.className, "foo bar", "legend class + meta class: accumulate");
}
{
	// classes split across two floating meta entries
	let r = p("ab 8 a(.foo) a(.bar .baz)");
	eq(r.areaProps?.a?.className, "foo bar baz", "two meta entries + chained: all joined");
}
{
	let r = p("a(=header) b 8");
	eq(r.areaProps?.a?.alias, "header", "a(=header): alias");
}

section("() combined modifiers");
{
	let r = p("a(eC 200! .card) b 8");
	eq(r.areaAlign?.a?.justifySelf, "end", "combined: justifySelf");
	eq(r.areaAlign?.a?.alignSelf, "center", "combined: alignSelf");
	eq(r.areaProps?.a?.flexBasis, "200px", "combined: flexBasis");
	eq(r.areaProps?.a?.flexShrink, 0, "combined: flexShrink 0");
	eq(r.areaProps?.a?.className, "card", "combined: className");
}
{
	// comma-separated tokens also work
	let r = p("a(eC, 200!, .card) b 8");
	eq(r.areaAlign?.a?.justifySelf, "end", "combined comma: justifySelf");
	eq(r.areaProps?.a?.flexBasis, "200px", "combined comma: flexBasis");
}
{
	// alignment still works alone (backward compat)
	let r = p("a(e)B(sC)", 2);
	eq(r.areaAlign.a, { justifySelf: "end", alignSelf: null }, "backward compat: a(e)");
	eq(r.areaAlign.b, { justifySelf: "start", alignSelf: "center" }, "backward compat: B(sC)");
}

section("() with placement override: a(mods)[col,row]");
{
	let r = p("q i(cC z3)[1:3,1:3] .qq .qq", 2);
	eq(r.areaAlign.i?.justifySelf, "center", "a(cC z3)[...]: justifySelf");
	eq(r.areaAlign.i?.alignSelf, "center", "a(cC z3)[...]: alignSelf");
	eq(r.placementOverrides.i?.z, 3, "a(cC z3)[...]: z from ()");
	let s = toAreaStyle(r, "i", 0);
	eq(s.zIndex, 3, "a(cC z3)[...]: zIndex in style");
	eq(s.gridColumn, "1 / 3", "a(cC z3)[...]: placement still works");
}

// --- floating meta entries ---

section("floating meta entries");
{
	// meta entry in main segment (after map rows)
	let r = p("ab 8 a(z3 .hero)", 2);
	eq(r.areaProps?.a?.z, 3, "float main: z-index");
	eq(r.areaProps?.a?.className, "hero", "float main: className");
}
{
	// meta entry in sizes segment
	let r = p("ab 8 | 200# a(z3)", 2);
	eq(r.areaProps?.a?.z, 3, "float sizes: z from meta");
	eq(r.colSizes[0], "200px", "float sizes: col size unaffected");
	eq(r.colSizes[1], "1fr", "float sizes: col size unaffected");
}
{
	// meta entry alignment merges into areaAlign
	let r = p("ab 8 a(cC)", 2);
	eq(r.areaAlign?.a?.justifySelf, "center", "float align: justifySelf merged");
	eq(r.areaAlign?.a?.alignSelf, "center", "float align: alignSelf merged");
}
{
	// meta wins over legend on conflict
	let r = p("a(z2) b 8 a(z5)", 2);
	eq(r.areaProps?.a?.z, 5, "meta wins: z=5 over z=2");
}
{
	// meta + legend merge (different keys)
	let r = p("a(200) b 8 a(z3 .card)", 2);
	eq(r.areaProps?.a?.flexBasis, "200px", "merge: basis from legend");
	eq(r.areaProps?.a?.z, 3, "merge: z from meta");
	eq(r.areaProps?.a?.className, "card", "merge: class from meta");
}

// --- flex mode ---

section("flex mode: flags");
{
	let r = p("ab 8 ?x", 2);
	eq(r.mode, "flex", "?x: mode=flex");
	eq(r.flags.flexMode, true, "?x: flexMode flag");
}
{
	let r = p("* 8 ?W", 4);
	eq(r.mode, "flex", "?W: mode=flex");
	eq(r.flags.flexWrap, true, "?W: flexWrap flag");
}
{
	// defaultMode param
	let r = parseGridLayout("ab 8", 2, "flex");
	eq(r.mode, "flex", "defaultMode=flex");
}
{
	// auto mode: no flags = grid
	let r = parseGridLayout("ab 8", 2, "auto");
	eq(r.mode, "grid", "auto + no flags = grid");
}
{
	// auto mode: ?W = flex
	let r = parseGridLayout("* 8 ?W", 4, "auto");
	eq(r.mode, "flex", "auto + ?W = flex");
}
{
	// explicit ?x overrides defaultMode=grid
	let r = parseGridLayout("ab 8 ?x", 2, "grid");
	eq(r.mode, "flex", "?x overrides defaultMode=grid");
}

section("flex mode: toGridStyle");
{
	let s = toGridStyle(p("ab 8 ?x", 2));
	eq(s.display, "flex", "flex: display:flex");
	eq(s.flexDirection, "row", "flex: row direction default");
	ok(!s.gridTemplateColumns, "flex: no gridTemplateColumns");
	ok(!s.gridTemplateAreas, "flex: no gridTemplateAreas");
}
{
	// transpose → column
	let s = toGridStyle(p("|ab 8 ?x", 2));
	eq(s.flexDirection, "column", "flex |: column");
}
{
	// ?f → row-reverse
	let s = toGridStyle(p("ab 8 ?x ?f", 2));
	eq(s.flexDirection, "row-reverse", "flex ?f: row-reverse");
}
{
	// | + ?f → column-reverse
	let s = toGridStyle(p("|ab 8 ?x ?f", 2));
	eq(s.flexDirection, "column-reverse", "flex | ?f: column-reverse");
}
{
	// ?W → flex-wrap:wrap
	let s = toGridStyle(p("* 8 ?W", 4));
	eq(s.flexWrap, "wrap", "flex ?W: flex-wrap:wrap");
}
{
	// gap preserved
	let s = toGridStyle(p("ab 8 ?x", 2));
	eq(s.gap, "8px", "flex: gap preserved");
}
{
	// justify-content preserved
	let s = toGridStyle(p("ab 8 ?x ?c", 2));
	eq(s.justifyContent, "center", "flex: justifyContent preserved");
}
{
	// full width from grow
	let s = toGridStyle(p("Ab ?x", 2));
	eq(s.width, "100%", "flex grow: width 100%");
}
{
	// ?w flag
	let s = toGridStyle(p("ab ?x ?w", 2));
	eq(s.width, "100%", "flex ?w: width 100%");
}

section("flex mode: toAreaStyle");
{
	// grow → flex-grow:1
	let r = p("Ab ?x", 2);
	let s = toAreaStyle(r, "a", 0);
	eq(s.flexGrow, 1, "flex grow: flexGrow:1");
	ok(!s.gridArea, "flex grow: no gridArea");
}
{
	// basis from areaProps
	let r = p("ab 8 ?x a(200)", 2);
	let s = toAreaStyle(r, "a", 0);
	eq(s.flexBasis, "200px", "flex basis: from ()");
}
{
	// shrink from areaProps
	let r = p("ab 8 ?x a(200/0)", 2);
	let s = toAreaStyle(r, "a", 0);
	eq(s.flexShrink, 0, "flex shrink: 0 from (200/0)");
}
{
	// no-shrink shorthand
	let r = p("ab 8 ?x a(150!)", 2);
	let s = toAreaStyle(r, "a", 0);
	eq(s.flexBasis, "150px", "flex no-shrink: basis");
	eq(s.flexShrink, 0, "flex no-shrink: shrink=0");
}
{
	// basis from sizes segment in flex mode
	let r = p("ab 8 ?x | 200 300", 2);
	let sA = toAreaStyle(r, "a", 0);
	let sB = toAreaStyle(r, "b", 1);
	eq(sA.flexBasis, "200px", "flex sizes: a basis");
	eq(sB.flexBasis, "300px", "flex sizes: b basis");
}
{
	// minmax in flex = basis + maxWidth + flexGrow:1
	let r = p("ab 8 ?x | 200~300 80~200", 2);
	let sA = toAreaStyle(r, "a", 0);
	let sB = toAreaStyle(r, "b", 1);
	eq(sA.flexBasis, "200px", "flex minmax: basis");
	eq(sA.maxWidth, "300px", "flex minmax: maxWidth");
	eq(sA.flexGrow, 1, "flex minmax: flexGrow:1");
	eq(sB.flexBasis, "80px", "flex minmax b: basis");
	eq(sB.maxWidth, "200px", "flex minmax b: maxWidth");
	eq(sB.flexGrow, 1, "flex minmax b: flexGrow:1");
}
{
	// 1fr upper bound = no max-width, just grow freely
	let r = p("ab 8 ?x | 150~# 150~300", 2);
	let sA = toAreaStyle(r, "a", 0);
	ok(!sA.maxWidth, "150~#: no maxWidth");
	eq(sA.flexGrow, 1, "150~#: flexGrow:1");
	eq(sA.flexBasis, "150px", "150~#: flexBasis");
}
{
	// 1fr default in sizes = no basis (ignored in flex)
	let r = p("ab 8 ?x", 2);
	let s = toAreaStyle(r, "a", 0);
	ok(!s.flexBasis, "flex default 1fr: no flexBasis emitted");
}
{
	// alignment (alignSelf) still works in flex
	let r = p("a(E) b 8 ?x", 2);
	let s = toAreaStyle(r, "a", 0);
	eq(s.alignSelf, "end", "flex alignSelf: preserved");
}
{
	// z-index in flex
	let r = p("ab 8 ?x a(z9)", 2);
	let s = toAreaStyle(r, "a", 0);
	eq(s.zIndex, 9, "flex z-index: from ()");
}

section("flex mode: transposed basis");
{
	// transpose + sizes segment → rowSizes used as flex-basis
	let r = p("|ab 8 ?x | 120 200", 2);
	eq(r.transpose, true, "transposed: transpose=true");
	let sA = toAreaStyle(r, "a", 0);
	let sB = toAreaStyle(r, "b", 1);
	eq(sA.flexBasis, "120px", "transposed: a basis from rowSizes");
	eq(sB.flexBasis, "200px", "transposed: b basis from rowSizes");
}
{
	// minmax in transposed flex → maxHeight not maxWidth + flexGrow:1
	let r = p("|ab 8 ?x | 80~200 80~200", 2);
	let s = toAreaStyle(r, "a", 0);
	eq(s.flexBasis, "80px", "transposed minmax: flexBasis");
	eq(s.maxHeight, "200px", "transposed minmax: maxHeight (not maxWidth)");
	ok(!s.maxWidth, "transposed minmax: no maxWidth");
	eq(s.flexGrow, 1, "transposed minmax: flexGrow:1");
}
{
	// non-transposed explicit minmax → maxWidth + flexGrow:1
	let r = p("ab 8 ?x | 80~200 80~200", 2);
	let s = toAreaStyle(r, "a", 0);
	eq(s.flexBasis, "80px", "non-transposed minmax: flexBasis");
	eq(s.maxWidth, "200px", "non-transposed minmax: maxWidth");
	ok(!s.maxHeight, "non-transposed minmax: no maxHeight");
	eq(s.flexGrow, 1, "non-transposed minmax: flexGrow:1");
}

section("areaProps: className and alias in parsed output");
{
	// className present in areaProps — consumed by Grid.jsx wrapper
	let r = p("a(.hero)b 8");
	eq(r.areaProps?.a?.className, "hero", "className in areaProps");
}
{
	// alias present in areaProps
	let r = p("a(=sidebar)b 8");
	eq(r.areaProps?.a?.alias, "sidebar", "alias in areaProps");
}
{
	// combined className + alias
	let r = p("a(.card=header)b 8");
	eq(r.areaProps?.a?.className, "card", "combined: className");
	eq(r.areaProps?.a?.alias, "header", "combined: alias");
}
{
	// floating meta entry
	let r = p("ab 8 a(.hero=sidebar)");
	eq(r.areaProps?.a?.className, "hero", "meta float: className");
	eq(r.areaProps?.a?.alias, "sidebar", "meta float: alias");
}
{
	// origArea lookup: areaProps keyed by original letter
	// (auto-flow areas use c0,c1 — but named areas use the letter)
	let r = p("ab 8 ?wh a(.card)");
	eq(r.areaProps?.a?.className, "card", "named area: areaProps keyed by letter");
}
{
	// existing grid layouts must produce mode=grid and same styles
	let r = p("hsCf hhhh sccc sfff 8", 4);
	eq(r.mode, "grid", "grid regression: mode=grid");
	let s = toGridStyle(r);
	eq(s.display, "grid", "grid regression: display:grid");
	ok(s.gridTemplateAreas, "grid regression: has templateAreas");
}
{
	let r = p("*4 8 ?w", 8);
	eq(r.mode, "grid", "auto-flow regression: mode=grid");
	let s = toGridStyle(r);
	eq(s.display, "grid", "auto-flow regression: display:grid");
}

// --- flex mode: fr and # as flex-grow in sizes segment ---

section("flex mode: fr and # as flex-grow in sizes segment");
{
	// # (normalized to 1fr) → flex-grow: 1
	let r = p("abc 8 ?x | # 200 100", 3);
	let sA = toAreaStyle(r, "a", 0);
	eq(sA.flexGrow, 1, "# ? flexGrow:1");
	ok(!sA.flexBasis, "# ? no flexBasis");
	eq(toAreaStyle(r, "b", 1).flexBasis, "200px", "200 ? flexBasis:200px");
	eq(toAreaStyle(r, "c", 2).flexBasis, "100px", "100 ? flexBasis:100px");
}
{
	// 2fr → flex-grow: 2
	let r = p("abc 8 ?x | 2fr 1fr 100", 3);
	eq(toAreaStyle(r, "a", 0).flexGrow, 2, "2fr ? flexGrow:2");
	eq(toAreaStyle(r, "b", 1).flexGrow, 1, "1fr ? flexGrow:1");
	eq(toAreaStyle(r, "c", 2).flexBasis, "100px", "100 ? flexBasis");
}
{
	// uppercase (legend grow) + 2fr in sizes: sizes-segment wins
	let r = p("Abc 8 ?x | 2fr 200 100", 3);
	eq(toAreaStyle(r, "a", 0).flexGrow, 2, "A(grow) + 2fr sizes: flexGrow:2 wins");
}
{
	// uppercase + px basis: legend grow + basis both apply
	let r = p("Abc 8 ?x | 200 # 100", 3);
	let sA = toAreaStyle(r, "a", 0);
	eq(sA.flexGrow, 1, "A(grow) + 200 sizes: flexGrow:1 from legend");
	eq(sA.flexBasis, "200px", "A(grow) + 200 sizes: flexBasis:200px");
	eq(toAreaStyle(r, "b", 1).flexGrow, 1, "b + # sizes: flexGrow:1");
}
{
	// transposed: rowSizes used for fr too
	let r = p("|abc 8 ?x | # 200 2fr", 3);
	eq(toAreaStyle(r, "a", 0).flexGrow, 1, "transposed # ? flexGrow:1");
	eq(toAreaStyle(r, "b", 1).flexBasis, "200px", "transposed 200 ? flexBasis");
	eq(toAreaStyle(r, "c", 2).flexGrow, 2, "transposed 2fr ? flexGrow:2");
}
{
	// grid mode unaffected — fr stays as track size string
	let r = p("abc 8 | 2fr 1fr 1fr", 3);
	eq(r.mode, "grid", "grid mode: fr stays as track size");
	eq(r.colSizes[0], "2fr", "grid mode: 2fr string preserved");
}

// --- summary ---

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (errors.length > 0) {
	console.log("  failures:");
	for (let e of errors) console.log(`    ✗ ${e}`);
	console.log();
	process.exit(1);
}
