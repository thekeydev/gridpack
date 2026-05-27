import { Grid, Flex, splitPane, animate, scrollable } from "../../src/Grid.jsx";

let Box = ({ c = 0, children, style }) => <div className={`demo-box c${c % 8}`} style={style}>{children}</div>
let boxes = (labels) => labels.map((l, i) => <Box key={i} c={i}>{l}</Box>);

export default [

	////////////////////////////////////////////////////////////////////////////////////////////////
	// Flex Mode

	{ cat: "Flex Mode", name: "Basic <Flex>", layout: "abc 8",
		component: "Flex",
		w: 400, h: 80,
		children: () => boxes(["A", "B", "C"]),
		src: '<Flex layout="abc 8">\n\t<A/>\n\t<B/>\n\t<C/>\n</Flex>',
		guide: "The new `<Flex>` component uses the same DSL but emits `display: flex` instead of `display: grid`. `abc 8` produces a flex row with 8px gap.\n\nFor simple h-stacks and v-stacks the output is identical — but the underlying model is different: flex items *negotiate* their size rather than fitting into declared tracks.",
		tryThis: [
			"Compare with `<Grid layout=\"abc 8\">` — visually identical, different CSS",
			"Flex shines when content drives size"
		],
	},
	{ cat: "Flex Mode", name: "V-Stack <Flex>", layout: "|abc 8",
		component: "Flex",
		w: 200, h: 240,
		children: () => boxes(["Top", "Middle", "Bottom"]),
		src: '<Flex layout="|abc 8">\n\t<Top/>\n\t<Middle/>\n\t<Bottom/>\n</Flex>',
		guide: "The `|` transpose works identically on `<Flex>` — it switches `flex-direction` to `column`. Same mental model as Grid: `|` = vertical.",
		tryThis: [
			"Remove `|` to switch back to row",
			"Add `?h` to fill height: `|abc 8 ?h`"
		],
	},
	{ cat: "Flex Mode", name: "Grow with uppercase", layout: "aBc 8 ?w",
		component: "Flex",
		w: 500, h: 80,
		children: () => boxes(["A", "Grows", "C"]),
		src: '<Flex layout="aBc 8 ?w">\n\t<A/>\n\t<Grows/>\n\t<C/>\n</Flex>',
		guide: "Uppercase letters in `<Flex>` map to `flex-grow: 1`, exactly like they map to `1fr` tracks in `<Grid>`. `B` grows to fill available space while `a` and `c` are content-sized.",
		tryThis: [
			"Try `ABc` to make both A and B grow equally",
			"Try `ABBc` for B to grow twice as much as A... wait, that's not valid — use basis/shrink for ratio control"
		],
	},
	{ cat: "Flex Mode", name: "Reverse ?f", layout: "abc 8 ?w ?f",
		component: "Flex",
		w: 400, h: 80,
		children: () => boxes(["1", "2", "3"]),
		src: '<Flex layout="abc 8 ?w ?f">\n\t<A/>\n\t<B/>\n\t<C/>\n</Flex>',
		guide: "`?f` maps to `flex-direction: row-reverse`. Items render right-to-left while the DOM order stays the same. Combined with `|` it produces `column-reverse`.",
		tryThis: [
			"Remove `?f` to see normal order",
			"Try `|abc 8 ?h ?f` for column-reverse"
		],
	},
	{ cat: "Flex Mode", name: "Wrap ?W", layout: "* 8 ?w ?W | *120~#",
		component: "Flex",
		w: 500, h: 200,
		children: (v, p) => {
			let n = p?.n || 8;
			return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>{i + 1}</Box>);
		},
		params: [{ key: "n", label: "items", type: "range", min: 2, max: 16, def: 8 }],
		info: "?W = flex-wrap: wrap — items wrap, last row is centered",
		src: '<Flex layout="* 8 ?w ?W | *120~#">\n\t{items}\n</Flex>',
		guide: "`?W` enables `flex-wrap: wrap`. This is the main reason to reach for `<Flex>` over `<Grid>` — with grid, trailing items in an incomplete last row can't be centered.\n\nWith flex wrap + `justify-content: center`, the last row centers automatically. This is the most-requested missing grid feature in the State of CSS survey.\n\nThe `| *120~#` sizes segment in flex mode = each item gets `flex-basis: 120px` (the minmax lower bound) with `max-width: # (1fr proportional)`. Items wrap when they'd go below 120px.",
		tryThis: [
			"Resize the preview — items wrap and re-center",
			"The last row centers — impossible in grid-only mode",
			"Adjust item count"
		],
	},
	{ cat: "Flex Mode", name: "Wrap + center (last-row fix)", layout: "12 ?Wcx | 140~180*",
		component: "Flex",
		w: 500, h: 220,
		children: (v, p) => {
			let n = p?.n || 7;
			return Array.from({ length: n }, (_, i) => {
				let hue = i * 43 + 190;
				return <div key={i} style={{ background: `hsl(${hue},40%,18%)`, border: `1px solid hsl(${hue},30%,30%)`, borderRadius: 8, padding: "12px 16px", fontSize: 12, fontWeight: 600, color: `hsl(${hue},60%,68%)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>Card {i + 1}</div>;
			});
		},
		params: [{ key: "n", label: "cards", type: "range", min: 1, max: 12, def: 7 }],
		info: "Last-row centering — the thing grid can't do",
		src: '<Flex layout="12 ?Wc | 140~180*">\n\t{cards}\n</Flex>',
		guide: "The #1 layout pain point from State of CSS 2025 — solved. When the last row of a wrapping flex container has fewer items than the full row, `?c` (`justify-content: center`) centers them.\n\nGrid's `justify-content: center` doesn't center individual trailing items — it centers the whole track system. This is a fundamental difference.\n\nTry 7 cards in a 3-wide wrap — the lone card in the last row is centered.",
		tryThis: [
			"Try 4, 7, 10 cards — orphan card always centers",
			"Compare: change to `<Grid layout=\"12 ?wc | *140~180\">` — last row aligns left",
			"?c = justify-content: center"
		],
	},
	{ cat: "Flex Mode", name: "Basis from sizes segment", layout: "abc 8 ?w ?x | 120 200 80",
		component: "Layout",
		w: 500, h: 80,
		children: () => boxes(["120px", "200px", "80px"]),
		src: '<Layout d="abc 8 ?w ?x | 120 200 80">\n\t<A/>\n\t<B/>\n\t<C/>\n</Layout>',
		guide: "In flex mode, the sizes segment `| 120 200 80` is reinterpreted: each value becomes `flex-basis` for the corresponding item in order. In grid mode the same segment declares track sizes.\n\nThis reuse means the pipe-sizes mental model transfers directly to flex — same syntax, mode-appropriate semantics.",
		tryThis: [
			"Same `| sizes` syntax, different effect in flex mode",
			"Try uppercase letters for grow: `ABc | 120 200 80` — A and B grow from their bases"
		],
	},
	{ cat: "Flex Mode", name: "Minmax → basis + maxWidth", layout: "* 8 ?W ?w | *150~280",
		component: "Flex",
		w: 500, h: 180,
		children: (v, p) => {
			let n = p?.n || 5;
			return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>Item {i + 1}</Box>);
		},
		params: [{ key: "n", label: "items", type: "range", min: 2, max: 10, def: 5 }],
		info: "~minmax in flex: flex-basis + max-width",
		src: '<Flex layout="* 8 ?W ?w | *150~280">\n\t{items}\n</Flex>',
		guide: "The `~` minmax syntax is reinterpreted in flex mode: `150~280` becomes `flex-basis: 150px; max-width: 280px`. Items are at least 150px wide but cap at 280px.\n\nThis approximates the CSS Grid `minmax(150px, 1fr)` responsive column pattern in a flex container. With `?W` wrap, items flow to new rows when they'd go below 150px, and cap at 280px when there's excess space.",
		tryThis: [
			"Resize the preview — items maintain their size range",
			"Change item count to see wrap behavior",
			"This is the \"responsive cards without media queries\" pattern"
		],
	},
	{ cat: "Flex Mode", name: "<Layout> chameleon", layout: "* 8 ?W ?w | *160~#",
		component: "Layout",
		w: 500, h: 200,
		children: (v, p) => {
			let n = p?.n || 6;
			return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>Item {i + 1}</Box>);
		},
		params: [{ key: "n", label: "items", type: "range", min: 2, max: 12, def: 6 }],
		info: "<Layout d=\"...\"> — auto-detects flex from ?W flag",
		src: '<Layout d="* 8 ?W ?w | *160~#">\n\t{items}\n</Layout>',
		guide: "`<Layout>` is the chameleon variant. It uses `d=` instead of `layout=` and uses `mode=\"auto\"` by default: if `?W` or `?x` appears in the string, it switches to flex mode. Otherwise it stays grid.\n\nUseful when you want a single component that adapts without specifying the mode explicitly. `<Grid>` forces grid, `<Flex>` forces flex, `<Layout>` infers.",
		tryThis: [
			"Remove `?W` — auto-mode falls back to grid, items no longer wrap",
			"`d=` prop is an alias for `layout=` — shorter for long strings"
		],
	},
	{ cat: "Flex Mode", name: "Explicit ?x on <Grid>", layout: "abc 8 ?x ?w",
		component: "Grid",
		w: 400, h: 80,
		children: () => boxes(["A", "B", "C"]),
		src: '<Grid layout="abc 8 ?x ?w">\n\t<A/>\n\t<B/>\n\t<C/>\n</Grid>',
		guide: "`?x` is the explicit flex-mode flag. You can put it on a `<Grid>` component to force flex output without switching components — useful when iterating or when the component type is fixed by a wrapper.\n\nMode resolution order: component default ? `?W` implicit ? `?x` explicit (wins).",
		tryThis: [
			"Remove `?x` — reverts to grid output",
			"`?x` always wins over component default"
		],
	},

	////////////////////////////////////////////////////////////////////////////////////////////////
	// Area Modifiers

	{ cat: "Area Modifiers", name: "Flex basis in legend", layout: "a(200)Bc 8 ?x ?w",
		component: "Grid",
		w: 500, h: 80,
		children: () => boxes(["200px base", "grows", "content"]),
		src: '<Grid layout="a(200)Bc 8 ?x ?w">\n\t<A/>\n\t<B/>\n\t<C/>\n</Grid>',
		guide: "Per-area flex sizing directly in the legend. `a(200)` sets `flex-basis: 200px` on area `a`. `B` (uppercase) gets `flex-grow: 1`. `c` is content-sized with default flex-shrink.\n\nThis is the new `()` unified modifier syntax — previously parentheses only accepted alignment chars.",
		tryThis: [
			"Try `a(300)` for a wider base",
			"Try `a(200!) ` — `!` = flex-shrink: 0 (won't shrink below 200px)",
			"Try `a(100/2)` — basis 100px, shrink factor 2"
		],
	},
	{ cat: "Area Modifiers", name: "No-shrink !", layout: "a(200!)Bc 8 ?x ?w",
		component: "Grid",
		w: 500, h: 80,
		children: () => boxes(["fixed 200px", "grows", "C"]),
		src: '<Grid layout="a(200!)Bc 8 ?x ?w">\n\t...\n</Grid>',
		guide: "`a(200!)` = `flex-basis: 200px` + `flex-shrink: 0`. The `!` suffix locks the item — it will never shrink below its basis even if the container is too small.\n\nThe most common flex pattern: sidebar that won't compress, next to a flexible content area.",
		tryThis: [
			"Try shrinking the preview — A stays at 200px",
			"Compare with `a(200)` (no `!`) — A can shrink",
			"Classic sidebar pattern: `a(200!)B`"
		],
	},
	{ cat: "Area Modifiers", name: "Shrink factor /N", layout: "a(300/3)b(300/1)c(300/1) 8 ?x ?w",
		component: "Grid",
		w: 500, h: 80,
		children: () => boxes(["shrinks 3×", "shrinks 1×", "shrinks 1×"]),
		src: '<Grid layout="a(300/3)b(300/1)c(300/1) 8 ?x ?w">\n\t...\n</Grid>',
		guide: "`a(300/3)` = `flex-basis: 300px`, `flex-shrink: 3`. When the container is too small, area A gives up space 3× faster than B or C.\n\nShrink is weighted by basis × factor: A's weight = 300×3 = 900, B and C = 300×1 = 300 each. A absorbs 3× as much deficit in absolute pixels.",
		tryThis: [
			"Shrink the preview — A gets smaller much faster than B or C",
			"Try equal factors: `a(300/1)b(300/1)c(300/1)`",
			"Notice B and C stay equal while A shrinks faster"
		],
	},
	{ cat: "Area Modifiers", name: "z-index z3", layout: "a b a[2:3,1:2,10] | 50 50 | 50 50",
		component: "Grid",
		w: 300, h: 200,
		children: () => [
			<div key="a" style={{ width: "100%", height: "100%", background: "#1e3a5f", border: "2px solid #7fdbca", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#7fdbca", fontSize: 12, fontWeight: 700 }}>A (z10)</div>,
			<div key="b" style={{ width: "100%", height: "100%", background: "#3a1e5f", border: "2px solid #c792ea", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#c792ea", fontSize: 12, fontWeight: 700 }}>B (z0)</div>,
		],
		src: '// old syntax (still works):\n<Grid layout="a b a[2:3,1:2,10]">\n\n// new syntax — z in ():\n<Grid layout="a b a(z10)[2:3,1:2]">',
		guide: "Z-index is migrating from the third `[]` slot to the unified `()` modifier. Both forms work:\n\n- Old: `a[col,row,z]` — z as third positional in placement brackets\n- New: `a(z10)[col,row]` — z in the unified modifier parens\n\nThe old form still works for backward compatibility. The `z` prefix in `()` disambiguates from flex-basis (which is always a bare number).",
		tryThis: [
			"A overlaps B due to z-index 10",
			"Try `a(z1)[2:3,1:2]` — lower z, B would show on top",
			"Try `a(cC z10)[2:3,1:2]` — combine z-index + alignment"
		],
	},
	{ cat: "Area Modifiers", name: "className .name", layout: "a(.hero)b(.card)c(.card) abc ?wh",
		component: "Grid",
		w: 400, h: 150,
		children: () => [
			<div key="a" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>Hero area</div>,
			<div key="b" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>Card B</div>,
			<div key="c" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>Card C</div>,
		],
		src: '<Grid layout="a(.hero)b(.card)c(.card) abc ?wh">\n\t...\n</Grid>',
		guide: "`.className` in `()` adds a CSS class to the area wrapper div. Multiple classes work too: `a(.hero.featured)`. The class is appended to gridpack's own wrapper class.\n\nThis is the main way to style individual grid areas from external CSS without inline styles.",
		tryThis: [
			"Add a style rule targeting `.hero` to customize it",
			"Use `.card.dark` for multiple classes",
			"Combine with other mods: `a(eC .hero z2)`"
		],
	},
	{ cat: "Area Modifiers", name: "Multiple classnames .a.b.c", layout: "a(.card.featured.large)b(.card)c(.card) abc ?wh 8",
		component: "Grid",
		w: 400, h: 150,
		children: () => [
			<Box key="a" className="featured-demo">Featured</Box>,
			<Box key="b" c={1}>Regular</Box>,
			<Box key="c" c={2}>Regular</Box>,
		],
		src: '<Grid layout="a(.card.featured.large)b(.card)c(.card) abc ?wh 8">\n\t...\n</Grid>',
		guide: "Multiple classnames: chain dots `.card.featured.large` — no spaces needed. The `.` is self-delimiting like `#` and `.` in sizes — it flushes the previous token and starts a new one.\n\nFloating meta entries work too: `abc 8 a(.featured.large)` — same result, legend stays clean.",
		tryThis: [
			"Try `a(.card.featured.large=header)` — chain class + alias",
			"`.` and `=` are self-delimiting: no comma or space needed between them"
		],
	},
	{ cat: "Area Modifiers", name: "Area alias =name", layout: "a(=sidebar)b(=main) ab ?wh | 200# 8",
		component: "Grid",
		w: 400, h: 150,
		children: () => boxes(["Sidebar", "Main"]),
		src: '<Grid layout="a(=sidebar)b(=main) ab ?wh | 200#">\n\t...\n</Grid>',
		guide: "`=name` sets the area's output alias — the `data-area` attribute and any generated class name uses this instead of the single letter. Useful for debugging (`data-area=\"sidebar\"` in DevTools) and for semantic CSS selectors.\n\nThe single letter still works in the layout map — `a` and `b` are still valid shorthand.",
		tryThis: [
			"Inspect the DOM — see `data-area=\"sidebar\"` instead of `data-area=\"a\"`",
			"Works with className too: `a(.sidebar-wrapper =sidebar)`"
		],
	},
	{ cat: "Area Modifiers", name: "Combined: all in one", layout: "a(eC.card.hero=header 200! z2)B(.content) ab ?wh 8 | 200#",
		component: "Grid",
		w: 500, h: 200,
		children: () => boxes(["A: all mods", "B: grows"]),
		src: '<Grid layout="a(eC.card.hero=header 200! z2)B(.content) ab ?wh 8 | 200#">\n\t...\n</Grid>',
		guide: "All modifier types in one `()`: alignment chars, flex sizing, z-index, classnames, alias — whitespace or comma separated, any order.\n\n`a(eC .card.hero =header 200! z2)` = align-self: center + justify-self: end + classes \"card hero\" + alias \"header\" + flex-basis 200px no-shrink + z-index 2.",
		tryThis: [
			"Mix and match modifiers freely",
			". and = are self-delimiting so `a(eC.card=header200!z2)` won't work — sizing and z still need whitespace"
		],
	},

	////////////////////////////////////////////////////////////////////////////////////////////////
	// Meta Entries

	{ cat: "Meta Entries", name: "Clean legend, mods float", layout: "abc ?wh 8 a(.hero) b(.card) c(.card)",
		component: "Grid",
		w: 400, h: 150,
		children: () => boxes(["Hero", "Card B", "Card C"]),
		src: '// legend-attached:\n<Grid layout="a(.hero)b(.card)c(.card) abc ?wh 8">\n\n// meta-attached (same result):\n<Grid layout="abc ?wh 8 a(.hero) b(.card) c(.card)">',
		guide: "Modifiers don't have to live in the legend. They can float anywhere as **meta entries**: `a(.hero)` appearing after the map rows attaches `.hero` to area `a` just like it would in the legend.\n\nThis lets you keep the legend clean — just letters — and group all per-area customization at the end or in the sizes segment.",
		tryThis: [
			"Both forms produce identical output",
			"Float entries can go in sizes segment too: `| 200# a(.hero)`",
			"Meta wins on conflict — legend sets default, meta overrides"
		],
	},
	{ cat: "Meta Entries", name: "Mods in sizes segment", layout: "abc 8 ?wh | 200# a(.hero z2) b(.card)",
		component: "Grid",
		w: 400, h: 150,
		children: () => boxes(["Hero", "Card", "C"]),
		src: '<Grid layout="abc 8 ?wh | 200# a(.hero z2) b(.card)">\n\t...\n</Grid>',
		guide: "Meta entries can live in the sizes segment after the pipe. Any token matching `letter(...)` that isn't a size gets extracted and merged into the area's properties.\n\nThe sizes still parse normally — `200#` becomes `200px 1fr` — the `a(.hero z2) b(.card)` entries are consumed before size parsing runs.",
		tryThis: [
			"Sizes and meta entries coexist in the same segment",
			"`a(.hero z2)` ? className: hero, z-index: 2",
			"Legend stays as bare letters: `abc`"
		],
	},
	{ cat: "Meta Entries", name: "Meta + legend merge", layout: "a(.card)b 8 ?wh | 200# a(.featured z3)",
		component: "Grid",
		w: 400, h: 150,
		children: () => boxes(["A: card + featured", "B"]),
		src: '<Grid layout="a(.card)b 8 ?wh | 200# a(.featured z3)">\n\t...\n</Grid>',
		guide: "Legend props and meta props **merge** — they don't overwrite. Here area `a` gets `.card` from the legend and `.featured` from the meta entry. The resulting className is `\"card featured\"`.\n\nOn conflict (same prop set in both), meta wins. For classnames specifically, they always accumulate.",
		tryThis: [
			"Area A has both 'card' and 'featured' classes",
			"z-index comes from meta only: z3",
			"Inspect the DOM to see merged classes"
		],
	},

	////////////////////////////////////////////////////////////////////////////////////////////////
	// Mixed mode: flex + grid in same tree

	{ cat: "Mixed Mode", name: "Grid outer, Flex inner", layout: "hcf hhh ccc fff 8 | # | 40 # 40",
		component: "Grid",
		w: 500, h: 300,
		children: () => [
			<Box key="h" c={0}>Header</Box>,
			<Flex key="c" layout="* 8 ?W ?w ?h | *120~#" style={{ padding: 8 }}>
				{Array.from({ length: 6 }, (_, i) => <Box key={i} c={i + 1}>{i + 1}</Box>)}
			</Flex>,
			<Box key="f" c={3}>Footer</Box>,
		],
		src: '<Grid layout="hcf hhh ccc fff 8 | # | 40 # 40">\n\t<Header/>\n\t<Flex layout="* 8 ?W ?w ?h | *120~#">\n\t\t{cards}\n\t</Flex>\n\t<Footer/>\n</Grid>',
		guide: "Mix modes freely. The outer layout is a `<Grid>` (architectural, explicit rows), the content area is a `<Flex>` (organic, wrapping cards).\n\nEach component uses the mode that fits its job. The nested `<Flex>` fills its grid cell using `?wh`.",
		tryThis: [
			"The outer Grid controls structure, inner Flex controls content",
			"Resize to see inner cards wrap",
			"This is the answer to 'when to use grid vs flex' — use both"
		],
	},
	{ cat: "Mixed Mode", name: "Flex nav + Grid content", layout: "nC | 200",
		component: "Grid",
		w: 600, h: 350,
		children: () => [
			<Flex key="n" layout="|abc 8 ?wh" style={{ background: "#16213e", padding: 8 }}>
				{["Dashboard", "Analytics", "Settings"].map((label, i) =>
					<div key={i} style={{ padding: "8px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, color: i === 0 ? "#7fdbca" : "#556", background: i === 0 ? "#1e3a5f" : "transparent", cursor: "pointer" }}>{label}</div>
				)}
			</Flex>,
			<div key="c" style={{ background: "#111122", padding: 16, display: "flex", flexDirection: "column" }}>
				<div style={{ color: "#7fdbca", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Dashboard</div>
				<Grid layout="* 8 ?w | *140~#">
					{Array.from({ length: 4 }, (_, i) => {
						let labels = ["Revenue", "Users", "Sessions", "Conversion"];
						let vals = ["$48.2k", "12,400", "38,900", "3.2%"];
						let hue = i * 60 + 180;
						return <div key={i} style={{ background: `hsl(${hue},35%,14%)`, border: `1px solid hsl(${hue},25%,25%)`, borderRadius: 8, padding: 16, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
							<div style={{ fontSize: 11, color: `hsl(${hue},40%,55%)` }}>{labels[i]}</div>
							<div style={{ fontSize: 22, fontWeight: 700, color: `hsl(${hue},60%,68%)` }}>{vals[i]}</div>
						</div>;
					})}
				</Grid>
			</div>,
		],
		src: '<Grid layout="nC | 200">\n\t<Flex layout="|abc 8 ?wh">\n\t\t<NavItem/> ...\n\t</Flex>\n\t<div>\n\t\t<Grid layout="* 8 ?w | *140~#">\n\t\t\t<StatCard/> ...\n\t\t</Grid>\n\t</div>\n</Grid>',
		guide: "Three levels of layout, three different strategies:\n\n1. **Outer Grid** — two-column page frame (200px nav + fill content)\n2. **Flex nav** — vertical nav items stacked with `|` transpose\n3. **Inner Grid** — auto-fill stat cards\n\nEach uses the right tool for its context.",
		tryThis: [
			"Outer = structural grid",
			"Nav = organic flex stack",
			"Cards = auto-fill grid"
		],
	},

	////////////////////////////////////////////////////////////////////////////////////////////////
	// Flex + Extensions

	{ cat: "Flex + Extensions", name: "Flex + splitPane", layout: "sC 8 ?w ?x | {w}",
		component: "Grid",
		w: 500, h: 200,
		vars: { w: 180 },
		ext: () => [splitPane({ var: "w", edge: "s:r", min: 80, max: 350 }), animate({ duration: "0.15s" })],
		children: (v) => [
			<Box key="s" c={1}>Sidebar {Math.round(v.w || 180)}px</Box>,
			<Box key="c" c={2}>Content</Box>,
		],
		info: "Drag the edge — flex basis resizes",
		src: '<Grid layout="sC 8 ?w ?x | {w}"\n\tvars={v} onVarsChange={setV}\n\textensions={[\n\t\tsplitPane({ var: "w", edge: "s:r", min: 80, max: 350 }),\n\t\tanimate({ duration: "0.15s" })\n\t]}\n>',
		guide: "Extensions work in flex mode too. `splitPane` updates the `{w}` variable which the parser uses as `flex-basis` for the sidebar area via the sizes segment reinterpretation.\n\n`animate` smooths the resize. The mechanism is identical to grid — variables feed into the layout string.",
		tryThis: [
			"Drag the divider to resize",
			"The sizes segment `| {w}` = flex-basis for sidebar in flex mode"
		],
	},
	{ cat: "Flex + Extensions", name: "Wrapping + animate", layout: "* 12 ?W ?w | {min}~{max}*",
		component: "Flex",
		w: 550, h: 220,
		vars: { min: 140, max: 260 },
		ext: () => [animate({ duration: "0.3s" })],
		children: (v, p) => {
			let n = p?.n || 6;
			return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>Item {i + 1}</Box>);
		},
		params: [
			{ key: "n", label: "items", type: "range", min: 2, max: 12, def: 6 },
			{ key: "min", label: "min px", type: "range", min: 60, max: 300, def: 140 },
			{ key: "max", label: "max px", type: "range", min: 100, max: 400, def: 260 },
		],
		info: "Adjust min/max to see items wrap with animation",
		src: '<Flex layout="* 12 ?W ?w | {min}~{max}*"\n\tvars={v}\n\textensions={[animate({ duration: "0.3s" })]}\n>\n\t{items}\n</Flex>',
		guide: "Template variables in flex mode. `{min}` and `{max}` inject into the sizes segment at parse time. As you slide the min/max values, items reflow — `animate` smooths the transition.\n\nThis is the responsive card pattern made interactive: drag min to force more wrapping, drag max to space them out.",
		tryThis: [
			"Drag min-px up to force earlier wrapping",
			"Drag max-px to control how wide items get",
			"Animate smooths the reflow"
		],
	},
	{ cat: "Flex + Extensions", name: "Flex + scrollable", layout: "* 8 ?whx | {w}",
		component: "Grid",
		w: 550, h: 280,
		vars: { w: 200 },
		ext: (v) => [splitPane({ var: "w", edge: "c0:r", min: 80, max: 350 }), scrollable({ area: ["c0", "c1"] })],
		children: () => {
			let loremItems = (n, color) => Array.from({ length: n }, (_, i) =>
				<div key={i} style={{ padding: "6px 10px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 11, color }}>Item {i + 1} — Lorem ipsum dolor</div>
			);
			return [
				<div key="s" style={{ background: "#1a1a2e" }}>
					<div style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "#c792ea", borderBottom: "1px solid #2a2a4a" }}>Sidebar</div>
					{loremItems(15, "#777")}
				</div>,
				<div key="c" style={{ background: "#111122" }}>
					<div style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "#7fdbca", borderBottom: "1px solid #2a2a4a" }}>Content</div>
					{loremItems(20, "#666")}
				</div>,
			];
		},
		info: "Drag edge, scroll panels independently",
		src: '<Grid layout="* 8 ?whx | {w}"\n\textensions={[\n\t\tsplitPane({ var: "w", edge: "c0:r" }),\n\t\tscrollable({ area: ["c0", "c1"] })\n\t]}\n>',
		guide: "Extensions compose in flex mode just like in grid mode. `splitPane` + `scrollable` produce an IDE-style layout: draggable divider, each panel independently scrollable.\n\n`?x` forces flex mode on `<Grid>`. The split pane updates flex-basis of the sidebar via the sizes segment.",
		tryThis: [
			"Drag the divider",
			"Scroll each panel independently",
			"Same extension API works in both modes"
		],
	},

];
