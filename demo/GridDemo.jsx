import React from "react";
import { Grid, debug, debug2, accordion, collapsible, splitPane, scrollable, animate, overlay, tabs, multiColumn, fisheye, render, masonry } from "../src/Grid.jsx";
import { parseGridLayout, toGridStyle } from "../src/grid-layout-dsl.js";

let Style = ({ children }) => <style>{children}</style>
Style.__notAComponent = true;
let Box = ({ c = 0, children, style }) => <div className={`demo-box c${c % 8}`} style={style}>{children}</div>

// --- children builders ---
let boxes = (labels) => labels.map((l, i) => <Box key={i} c={i}>{l}</Box>);
let loremItems = (n) => Array.from({ length: n }, (_, i) =>
	<div key={i} style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 12, color: "#888" }}>Item {i + 1} — Lorem ipsum dolor sit amet</div>);

let calendarCells = () => {
	let dn = ["Mo","Tu","We","Th","Fr","Sa","Su"], sd = 2, dm = 30;
	let ev = { 3: "Sync", 7: "Dentist", 12: "Release", 15: "Review", 19: "Hack", 23: "Today", 27: "Demo" };
	let cells = [];
	for (let d = 0; d < 7; d++) cells.push(<div key={`h${d}`} style={{ background: "#16213e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "calc(7px + var(--fe-scale, 1) * 3px)", color: d >= 5 ? "#c792ea" : "#7fdbca", fontWeight: 700, borderBottom: "2px solid #2a2a4a", borderRight: "1px solid #1a1a2a", overflow: "hidden" }}>{dn[d]}</div>);
	for (let w = 0; w < 5; w++) for (let d = 0; d < 7; d++) { let idx = w*7+d, dayNum = idx-sd+1, ok = dayNum >= 1 && dayNum <= dm, we = d >= 5, e = ok ? ev[dayNum] : null, td = dayNum === 23;
		cells.push(<div key={`c${w}-${d}`} style={{ background: td ? "#2a3a5f" : ok ? (we ? "#1a1525" : "#151520") : "#0f0f18", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: 2, borderRight: "1px solid #1a1a2a", borderBottom: "1px solid #1a1a2a", opacity: ok ? 1 : 0.25 }}>
			<span style={{ fontSize: "calc(8px + var(--fe-scale, 1) * 5px)", fontWeight: 600, color: td ? "#7fdbca" : we ? "#c792ea" : "#888" }}>{ok ? dayNum : ""}</span>
			{e && <span style={{ fontSize: "calc(var(--fe-scale, 1) * 8px)", color: "#f78c6c", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", textAlign: "center", opacity: "calc(0.1 + var(--fe-scale, 1) * 0.7)" }}>{e}</span>}
		</div>);
	}
	return cells;
};

// ============================================================
// --- presets ---
// ============================================================

let presets = [
	// --- basics ---
	{ cat: "Basics", name: "Single Area", layout: "a", w: 200, h: 80, children: () => boxes(["A"]),
		src: '<Grid layout="a">\n\t<A/>\n</Grid>',
		guide: "The simplest layout — a single area. The letter `a` in the layout string declares one area and maps it to the first child.",
		tryThis: ["Add more letters: `ab`, `abc`", "Only one child is passed here — extra areas stay empty"] },
	{ cat: "Basics", name: "H-Stack", layout: "8", w: 400, h: 80, children: () => boxes(["A", "B", "C"]),
		src: '<Grid layout="8">\n\t<A/>\n\t<B/>\n\t<C/>\n</Grid>',
		guide: "Three children, no explicit areas — gridpack auto-generates them. The `8` is the gap in pixels between children. When you omit the legend entirely, gridpack creates one from the child count.",
		tryThis: ["Change the gap: try `16` or `0`", "Add explicit areas: `abc 8`"] },
	{ cat: "Basics", name: "V-Stack", layout: "|8", w: 200, h: 200, children: () => boxes(["A", "B", "C"]),
		src: '<Grid layout="|8">\n\t<A/>\n\t<B/>\n\t<C/>\n</Grid>',
		guide: "The **transpose pipe** `|` at the start swaps axes. Everything that was horizontal becomes vertical. A vertical stack is literally one character away from a horizontal one.",
		tryThis: ["Remove the `|` to see horizontal", "Try `|abc 8` with explicit areas"] },
	{ cat: "Basics", name: "Two Cols", layout: "abc", w: 300, h: 80, children: () => boxes(["A", "B"]),
		src: '<Grid layout="abc">\n\t<A/>\n\t<B/>\n</Grid>',
		guide: "Two areas side by side. The first segment in the layout string is the **legend** — it declares which areas exist and maps them to children in order. If you write just the legend with no rows, it doubles as a single-row layout.\n\nChildren mapped in the legend but not occurring in area rows won't render — gridpack assumes intent. But extra children beyond the legend are still rendered so you notice them.",
		tryThis: ["Repeat chars for proportional sizing: `ab abb`", "Add a second row: `ab ab ab`"] },
	{ cat: "Basics", name: "Two Cols 1:2+", layout: "ab abb", w: 400, h: 100, children: () => boxes(["Narrow", "Wide"]),
		src: '<Grid layout="ab abb">\n\t<Narrow/>\n\t<Wide/>\n</Grid>',
		guide: "Repeating area characters in map rows creates proportional columns. Here `b` appears twice in the second row, so `b` gets 2fr and `a` gets 1fr. No math needed — just repeat the letter.\n\nThat's typed fast but even faster is char + number. That repeats the char.",
		tryThis: ["Try `ab aab` to make A wider", "Try `ab abbb` for 1:3 ratio", "Try `ab ab3` for 1:3 ratio too", "Try `ab a2b3` for equal (2:3)"] },
	{ cat: "Basics", name: "Two Cols Sized", layout: "ab ab | 100 200", w: 400, h: 100, children: () => boxes(["A", "B"]),
		src: '<Grid layout="ab ab | 100 200">\n\t<A/>\n\t<B/>\n</Grid>',
		guide: "The **pipe separator** `|` introduces explicit column sizes. Numbers are pixels. `#` means `1fr` (fractional). `.` means `auto`. This translates directly to `grid-template-columns`.\n\nA second pipe `||` would set row sizes. If transpose `|` is active, the axes are swapped accordingly.",
		tryThis: ["Try `| 100 #` — second col fills remaining space", "Try `| # #` — equal fractions", "Add row sizes: `| 100 200 | 50`"] },
	{ cat: "Basics", name: "Centered Card", layout: "c .c. 16", w: 400, h: 200, children: () => boxes(["Card"]),
		src: '<Grid layout="c .c. 16">\n\t<Card/>\n</Grid>',
		guide: "The dot `.` in area rows marks empty cells. Here the card area `c` is surrounded by empty cells on both sides, centering it. The `16` is the gap.",
		tryThis: ["Try `c ..c.. 16` for more padding", "Try `c .c. .c. 16` to see 2 rows"] },
	{ cat: "Basics", name: "Empty Corners", layout: "hf h. .f 8", w: 300, h: 200, children: () => boxes(["Header", "Footer"]),
		src: '<Grid layout="hf h. .f 8">\n\t<Header/>\n\t<Footer/>\n</Grid>',
		guide: "Areas can span multiple rows/columns by appearing in multiple cells. Here `h` spans the top-left and `f` spans the bottom-right, leaving diagonal corners empty.\n\n**Uppercase letters** in the legend make areas grow (their tracks become `1fr`). Try making one area grow!",
		tryThis: ["Try `Hf h. .f 8` — header grows horizontally", "Try `hF h. .f 8` — footer grows", "Try explicit sizes: `| .# | #.`", "Swap axes: `| hf h. .f 8`", "Swap children: `| fh h. .f 8`", "To the max: `| hf hh. .ff ?wh | ..# | #..`"] },

	// --- layouts ---
	{ cat: "Layouts", name: "Page Layout (basic)", layout: "hsCf hhhh sccc sfff 8", w: 500, h: 300,
		children: () => boxes(["Header", "Sidebar", "Content", "Footer"]),
		src: '<Grid layout="hsCf hhhh sccc sfff 8">\n\t<Header/>\n\t<Sidebar/>\n\t<Content/>\n\t<Footer/>\n</Grid>',
		guide: "A classic layout. The legend `hsCf` declares four areas — `C` is uppercase so it grows. The three rows describe where each area sits: header spans the full width, sidebar is narrow, content fills the rest, footer spans the bottom.\n\nThis is what would normally take 12+ lines of CSS.",
		tryThis: ["Remove the uppercase: `hscf` — watch areas shrink to content", "Change proportions: try `hsCf h6 sc5 sf5 8`", "Try comma separators: `hsCf, h4 sccc sfff, 8`"] },
	{ cat: "Layouts", name: "Page Layout (advanced)", layout: "hs(S)Cf(e) hh sc sf 8 | 100# | .#.", w: 500, h: 300,
		children: () => boxes(["Header", "Sidebar", "Content", "Footer"]),
		src: '<Grid layout="hs(S)Cf(e) hh sc sf 8 | 100# | .#.">\n\t<Header/>\n\t<Sidebar/>\n\t<Content/>\n\t<Footer/>\n</Grid>',
		guide: "Same layout but with per-area alignment and explicit sizes.\n\n`s(S)` aligns the sidebar to the top (align-self: start). `f(e)` pushes footer to the end.\nColumn sizes `100#` = 100px + 1fr. Row sizes `.#.` = auto, 1fr, auto.\n\nAlignment section below will talk about this.",
		tryThis: ["Try `s(cC)` to center sidebar both ways", "Try `| 200# | 60#60`"] },
	{ cat: "Layouts", name: "Sidebar + Main (vars)", layout: "sM | {w}#", w: 500, h: 250, vars: { w: 250 },
		children: () => boxes(["Sidebar", "Main"]),
		params: [{ key: "w", label: "sidebar", type: "range", min: 80, max: 400, def: 250 }],
		src: '<Grid layout="sM | {w}#"\n vars={{ w: 250 }}>\n\t<Sidebar/>\n\t<Main/>\n</Grid>',
		guide: "**Template variables** let you inject dynamic values into the layout string. `{w}` is replaced with the value from the `vars` prop before parsing.\n\nThis is the foundation that all extensions build on — they read and write variables to control layout interactively.",
		tryThis: ["Drag the slider to resize", "The layout string stays the same — only the variable changes"] },
	{ cat: "Layouts", name: "Dashboard (sneak👀)", layout: "hnsCaf hhh nss nca fff 8 | {nav}#{aside} | 40 40#{footer}", w: 600, h: 350,
		vars: { nav: 100, aside: 100, footer: 80 },
		ext: () => [splitPane({ var: "nav", edge: "n:r", min: 50, max: 300 }), splitPane({ var: "aside", edge: "a:L", min: 50, max: 300 }), splitPane({ var: "footer", edge: "f:T", axis: "y", min: 50, max: 300 })],
		children: () => boxes(["Header", "Nav", "Stats", "Content", "Aside", "Footer"]),
		info: "Drag edges to resize",
		src: '<Grid layout="hnsCaf hhh nss nca fff 8 | {nav}#{aside} | 40 40#{footer}"\n\tvars={v} onVarsChange={setV}\n\textensions={[\n\t\tsplitPane({ var: "nav", edge: "n:e" }),\n\t\tsplitPane({ var: "aside", edge: "a:s" }),\n\t\tsplitPane({ var: "footer", edge: "f:s", axis: "y" }),\n\t]}>\n\t...\n</Grid>',
		guide: "Variables + extensions in action. Three split panes control nav width, aside width, and footer height — all draggable. The layout string uses `{nav}`, `{aside}`, and `{footer}` as template variables.\n\nThis is one component, one layout string, zero wrapper divs.",
		tryThis: ["Drag the edges between panels to resize", "All three dimensions are independently adjustable"] },

	// --- alignment ---
	{ cat: "Alignment", name: "Full Width", layout: "ab ?w 8", w: 400, h: 80, children: () => boxes(["A", "B"]),
		src: '<Grid layout="ab ?w 8">\n\t<A/>\n\t<B/>\n</Grid>',
		guide: "The `?` prefix introduces **flags**. `?w` forces the grid to fill the container width — children stretch horizontally without needing uppercase grow letters.",
		tryThis: ["Add `h` to fill height too: `ab ?wh 8`", "Remove `?w` to see default sizing"] },
	{ cat: "Alignment", name: "Full Both", layout: "ab ?wh 8", w: 400, h: 200, children: () => boxes(["A", "B"]),
		src: '<Grid layout="ab ?wh 8">\n\t<A/>\n\t<B/>\n</Grid>',
		guide: "`?wh` fills both width and height. The children stretch to fill their cells. But what if you want the space without the stretching? That's where alignment flags come in.",
		tryThis: ["Add center: `ab ?whcC 8`", "Try just centering horizontally: `ab ?whc 8`"] },
	{ cat: "Alignment", name: "Center Both (justify)", layout: "abc ?whcC", w: 400, h: 200, children: () => boxes(["A", "B", "C"]),
		src: '<Grid layout="abc ?whcC">\n\t<A/>\n\t<B/>\n\t<C/>\n</Grid>',
		guide: "Alignment flags: lowercase controls the horizontal axis (justify-content), uppercase controls the vertical axis (align-content).\n\nMnemonic: **SECBAG** — Start, End, Center, Borders (space-between), Around (space-around), Gaps (space-evenly).\n\n`?cC` = center both axes.\n\nLowercase is main axis. Uppercase is cross axis.",
		tryThis: ["Try typing `?whb`,`?whba`,`?whbag` for space-between/around/evenly", "Try `?wheE` for end horizontal and vertical, e.g. dialog buttons"] },
//	{ cat: "Alignment", name: "Space Evenly", layout: "abc ?whg", w: 400, h: 100, children: () => boxes(["A", "B", "C"]) },
//	{ cat: "Alignment", name: "Space Between", layout: "abc ?wb", w: 400, h: 80, children: () => boxes(["A", "B", "C"]) },
	{ cat: "Alignment", name: "Per-Area", layout: "a(e)b(s)c(cC) abc ?wh", w: 400, h: 200,
		children: () => boxes(["end", "start", "center"]),
		src: '<Grid layout="a(e)b(s)c(cC) abc ?wh">\n\t<End/>\n\t<Start/>\n\t<Center/>\n</Grid>',
		guide: "Alignment can also be set **per area** using parentheses after the area letter in the legend. Lowercase `s/e/c` controls justify-self, uppercase `S/E/C` controls align-self.\n\n`a(e)` = area a pushed to end. `c(cC)` = area c centered on both axes.",
		tryThis: ["Try `a(cC)b(cC)c(cC)` to center everything", "Try `a(sS)b(eE)c(cC) acb ?wh` for diagonal", "Try `a(sS)b(eE)c(cC) acab ?wh` for fun"] },

	// --- minmax ---
	{ cat: "Sizing", name: "Faked Minmax", layout: "hnMsf hhhh nnnn ssmm ffff 12 6 | 100## 200 | 48 48#40", w: 550, h: 300,
		children: () => boxes(["Header", "Nav", "Main", "Sidebar", "Footer"]),
		src: '<Grid layout="hnMsf hhhh nnnn ssmm ffff 12 6 | 100## 300 | 48 48#40">\n\t...\n</Grid>',
		guide: "A more complex layout showing explicit sizing on both axes. Column sizes `100## 200` = 100px, 1fr, 1fr, 200px. Row sizes `48 48#40` = 48px, 48px, 1fr, 40px. The gap is `12 6` (12px row gap, 6px col gap).",
		tryThis: ["Change col sizes: `| 200# 200`", "Change row gap: try `8 8`"] },
	{ cat: "Sizing", name: "Minmax Sidebar", layout: "sc 8 ?w | 100~200 #", w: 500, h: 200,
		children: () => boxes(["Sidebar", "Content"]), info: "Resize container — sidebar clamps",
		src: '<Grid layout="sc 8 ?w | 100~300 #">\n\t<Sidebar/>\n\t<Content/>\n</Grid>',
		guide: "The **tilde** `~` creates a `minmax()` size. `100~200` becomes `minmax(100px, 200px)`. The sidebar will never be smaller than 100px or larger than 300px, even as the container resizes.\n\nYou can mix any size types: `100~#` = minmax(100px, 1fr), `.~300` = minmax(auto, 300px).",
		tryThis: ["Resize the dashed container border to see clamping", "Try `200~400` for a wider range", "Try `100~# #` — sidebar grows with 1fr max"] },
	{ cat: "Sizing", name: "Minmax Responsive", layout: "abc | 100~# 100~# 100~#", w: 500, h: 150,
		children: () => boxes(["A", "B", "C"]), info: "Resize container — cols min width",
		src: '<Grid layout="abc | 100~# 100~# 100~#">\n\t<A/>\n\t<B/>\n\t<C/>\n</Grid>',
		guide: "All three columns use `100~#` = minmax(100px, 1fr). They share space equally but never go below 100px each. A simple way to make columns responsive without breakpoints.",
		tryThis: ["Resize the container to see the minimum kick in", "Try different minimums: `50~#`, `200~#`"] },
	{ cat: "Sizing", name: "Size Repeat", layout: "abcdef | 50 # *", w: 500, h: 120,
		children: () => boxes(["A", "B", "C"]), info: "Resize container — widths repeated",
		src: '<Grid layout="abcdef | 50 # *">\n\t<A/>\n\t<B/>\n\t<C/>\n</Grid>',
		guide: "Sizes can be repeated with **wildcard** `*`. Useful for single values, patterns or auto-flow - see below.\n\nHere `50 # *` with 6 columns becomes `50px 1fr 50px 1fr 50px 1fr` — the pattern cycles to fill all tracks.",
		tryThis: ["Resize the container to see sizes w/ debug grid overlay", "Try: `50#*` — `.`, `#` and `*` don't need space/separators", "Try single values like `50*`, `.*`, `#*`", "Try with minmax: `150~#*`"] },

	// --- responsive ---
	{ cat: "Responsive", name: "Sidebar Collapse", layout: "|sc ?w 8", w: 500, h: 250,
		sm: "sC sc 8 | 200#",
		children: () => boxes(["Sidebar", "Content"]),
		info: "Below md: stacked. Above: side by side",
		src: '<Grid layout="|sc ?w 8" sm="sC sc 8 | 200#">\n\t<Sidebar/>\n\t<Content/>\n</Grid>',
		guide: "Because each layout is just a short string, **responsive design is trivial** — write a different string per breakpoint. No media query blocks, no duplicate CSS, no overrides.\n\nHere the base layout stacks vertically. At `sm` (576px+) it switches to side-by-side with a 200px sidebar.",
		tryThis: ["Resize the dashed container to trigger the breakpoint", "The sm prop is a completely independent layout string"] },
	{ cat: "Responsive", name: "Article Layout", layout: "|hnCf 4", w: 600, h: 350,
		sm: "hnCf hhhh nccc ffff 8 | 150###",
		md: "hnCf hhhh nccc nccc ffff 16 | 200###",
		children: () => boxes(["Header", "Nav", "Content", "Footer"]),
		info: "xs: stacked, md: 4-col, lg: sidebar nav",
		src: '<Grid layout="|hnCf 4"\n\tsm="hnCf hhhh nccc ffff 8 | 150###"\n\tmd="hnCf hhhh nccc nccc ffff 16 | 200###">\n\t...\n</Grid>',
		guide: "Three breakpoints, three completely different layouts — all from short strings. At mobile it's a vertical stack, at tablet it's 4-column, at desktop the nav becomes a persistent sidebar spanning two rows.",
		tryThis: ["Resize the container through all three breakpoints"] },
	{ cat: "Responsive", name: "Stack → 2col → 3col", layout: "|abc ?w 8", w: 600, h: 200,
		sm: "ab aab ?w 8", md: "abc ?w 8",
		children: () => boxes(["A", "B", "C"]),
		info: "Resize container to see layout switch",
		src: '<Grid layout="|abc ?w 8" sm="ab aab ?w 8" md="abc ?w 8">\n\t<A/>\n\t<B/>\n\t<C/>\n</Grid>',
		guide: "A progressive enhancement pattern: single column on mobile, 2 columns with A wider at tablet, 3 equal columns at desktop. Each breakpoint is its own complete layout string — no inheritance, no overrides.",
		tryThis: ["Resize the container slowly to see all three states", "Notice the 2-col layout uses `aab` to make A twice as wide"] },
	{ cat: "Responsive", name: "Product Grid (w/ repeat)", layout: "|* ?w 4", w: 600, h: 300,
		sm: "ab ab* ?w 4", md: "abc abc* ?w 4",
		children: (v, p) => { let n = p?.n || 6; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>Product {i+1}</Box>); },
		params: [{ key: "n", label: "children", type: "range", min: 1, max: 12, def: 6 }],
		info: "xs: 1 col, sm: 2 cols, lg: 3 cols",
		src: '<Grid layout="|* ?w 4"\n\tsm="ab ab* ?w 4"\n\tmd="abc abc* ?w 4">\n\t{products}\n</Grid>',
		guide: "Responsive + repeat combined. At mobile: single column stack. At tablet: 2-column grid. At desktop: 3-column grid. The `*` in `ab*` means the row repeats for however many children you have.",
		tryThis: ["Drag the children slider to add/remove products", "Resize the container to switch column counts"] },

	// --- repeat ---
	{ cat: "Repeat", name: "* Auto", layout: "* 8 | 40 80 120", w: 400, h: 80,
		children: (v, p) => { let n = p?.n || 3; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>{String.fromCharCode(65+i)}</Box>); },
		params: [{ key: "n", label: "children", type: "range", min: 1, max: 8, def: 3 }],
		src: '<Grid layout="* 8 | 40 80 120">\n\t{children}\n</Grid>',
		guide: "The lone `*` is the auto-legend wildcard — gridpack generates area names from the child count. Mostly optional since an empty legend does the same, but useful when you need the `|` pipe for sizes without it being interpreted as transpose.\n\nHere `| 40 80 120` sets explicit column widths.",
		tryThis: ["Add more children with the slider — extra ones get auto-sized", "Remove `*` and just use `8 | 40 80 120`", "Compare `*| 40 80 120` vs. `|| 40 80 120`"] },
	{ cat: "Repeat", name: "| Auto", layout: "| 8", w: 200, h: 250,
		children: (v, p) => { let n = p?.n || 4; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>{String.fromCharCode(65+i)}</Box>); },
		params: [{ key: "n", label: "children", type: "range", min: 1, max: 8, def: 4 }],
		src: '<Grid layout="| 8">\n\t{children}\n</Grid>',
		guide: "Transpose + auto-legend. The `|` swaps axes so children stack vertically. The empty legend plus empty areas auto-recognize children. You don't even need the `*` here.",
		tryThis: ["Add/remove children with the slider", "Try `|* 8` — same result, explicit wildcard"] },
	{ cat: "Repeat", name: "*N Grid", layout: "*4 4 ?w", w: 400,
		children: (v, p) => { let n = p?.n || 8; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>{i+1}</Box>); },
		params: [{ key: "n", label: "children", type: "range", min: 1, max: 16, def: 8 }],
		src: '<Grid layout="*4 4 ?w">\n\t{items}\n</Grid>',
		guide: "Suffix `*` with a number N to create an **N-column auto-flow grid**. Children wrap to new rows automatically. Add more children with the slider — rows appear on their own.\n\nSwap axes with `|*4` and you get automatic columns instead of rows.",
		tryThis: ["Drag the slider to add children — rows auto-expand", "Try `*3`, `*5`, `*6` for different column counts", "Try `|*4` to swap to column flow"] },
	{ cat: "Repeat", name: "Form 2-Col", layout: "habf hh ab* ff 8 | .#", w: 400,
		children: (v, p) => { let n = p?.rows || 3; return [<Box key="h" c={0}>Header</Box>, <Box key="f" c={3}>Footer</Box>, ...Array.from({ length: n }, (_, i) => [<Box key={`l${i}`} c={1}>Label {i+1}</Box>, <Box key={`v${i}`} c={2}>Input {i+1}</Box>]).flat()]; },
		params: [{ key: "rows", label: "rows", type: "range", min: 1, max: 8, def: 3 }],
		src: '<Grid layout="habf hh ab* ff 8 | .#">\n\t<Header/>\n\t<Footer/>\n\t{fields.map(f => <><Label/><Input/></>)}\n</Grid>',
		guide: "The **repeat row** `ab*` is the really powerful part. The `*` suffix on a row means \"repeat this row for remaining children.\" Header and footer stay pinned — only the form rows multiply.\n\nTry doing this with pure CSS grid — you'd need JavaScript to dynamically generate `grid-template-areas`. Here it's just two characters: `ab*`.",
		tryThis: ["Drag the rows slider — layout adapts dynamically", "The header and footer stay put, only form rows repeat"] },
	{ cat: "Repeat", name: "Pinned Sidebar", layout: "sah sh Sa* 8 | {sw}# | 50", w: 400, h: 260, vars: { sw: 120 },
		children: (v, p) => { let n = p?.items || 4; return [<Box key="h" c={0}>Header</Box>, <Box key="s" c={1}>Sidebar</Box>, ...Array.from({ length: n }, (_, i) => <Box key={`i${i}`} c={2+i}>Item {i+1}</Box>)]; },
		params: [{ key: "sw", label: "sidebar", type: "range", min: 60, max: 250, def: 120 }, { key: "items", label: "items", type: "range", min: 1, max: 8, def: 4 }],
		src: '<Grid layout="sah sh Sa* 8 | {sw}# | 50">\n\t<Header/>\n\t<Sidebar/>\n\t{items.map(i => <Item/>)}\n</Grid>',
		guide: "**Uppercase letters in a repeat row are pinned** — they don't get numbered and span all repetitions. The sidebar `S` (uppercase in `Sa*`) is one continuous area while content items multiply next to it.\n\nOne capital letter replaces what would normally require complex `grid-row` spanning.",
		tryThis: ["Add items with the slider — sidebar spans them all", "Adjust sidebar width with the other slider", "Try butterfly `sah SaH* 8 ?wc | {sw}.{sw}`"] },
	{ cat: "Repeat", name: "Card Grid", layout: "abc aabc* 4 | ####", w: 450,
		children: (v, p) => { let n = p?.cards || 6; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>Card {i+1}</Box>); },
		params: [{ key: "cards", label: "cards", type: "range", min: 3, max: 12, def: 6 }],
		src: '<Grid layout="abc aabc* 4 | ####">\n\t{cards}\n</Grid>',
		guide: "A card grid with the first card spanning 2 columns (`aabc` — `a` repeated twice). Subsequent rows repeat via `*`. The proportional sizing `aabc` makes the first card wider while keeping a clean grid.",
		tryThis: ["Add more cards with the slider", "Try `abc abc* 4 | ###` for equal cards"] },
	{ cat: "Repeat", name: "List", layout: "a a* 4 ?w", w: 300,
		children: (v, p) => { let n = p?.items || 5; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>Item {i+1}</Box>); },
		params: [{ key: "items", label: "items", type: "range", min: 1, max: 10, def: 5 }],
		src: '<Grid layout="a a* 4 ?w">\n\t{items}\n</Grid>',
		guide: "The simplest repeat pattern — a single-column list. `a a*` declares one area per row, repeating for however many children you have. `?w` fills the container width.",
		tryThis: ["Add items with the slider", "This is essentially a styled vertical list"] },

	// --- extensions ---
	{ cat: "Extensions", name: "Split Pane", layout: "sC | {w}#", w: 500, h: 280, vars: { w: 200 },
		ext: () => [splitPane({ var: "w", edge: "s:r", min: 80, max: 400 })],
		children: () => boxes(["Sidebar", "Content"]), info: "Drag the edge",
		src: '<Grid layout="sC | {w}#"\n\tvars={v} onVarsChange={setV}\n\textensions={[\n\t\tsplitPane({ var: "w", edge: "s:r",\n\t\t\tmin: 80, max: 400 })\n\t]}\n>\n\t<Sidebar/>\n\t<Content/>\n</Grid>',
		guide: "Extensions add **behavior** to layouts. They're composable — stack them in an array.\n\n`splitPane` creates a draggable handle. It writes back to the `{w}` variable, the layout re-renders, and the grid updates. The `edge` syntax `s:e` means \"right edge of area s.\"\n\nThis is the pattern all extensions follow: inject behavior without changing how you write layouts.",
		tryThis: ["Drag the edge between sidebar and content", "Min/max constraints are built in (80-400px here)"] },
	{ cat: "Extensions", name: "Collapsible", layout: "sC | {sb}#", w: 500, h: 250, vars: { sb: 200 },
		ext: () => [collapsible({ var: "sb", area: "s", expanded: 200, collapsed: 0 })],
		children: (v) => [<Box key="s" c={1}>{(v.sb||0) > 0 ? "Sidebar" : ""}</Box>, <Box key="c" c={2}>Content</Box>],
		info: "Click arrow",
		src: '<Grid layout="sC | {sb}#"\n\tvars={v} onVarsChange={setV}\n\textensions={[\n\t\tcollapsible({ var: "sb", area: "s",\n\t\t\texpanded: 200, collapsed: 0 })\n\t]}\n>\n\t...\n</Grid>',
		guide: "Same idea as split pane but simpler: click the arrow to toggle. The sidebar collapses to zero and expands back to 200px. One variable, one extension.",
		tryThis: ["Click the collapse arrow to toggle", "Notice the content area fills the freed space"] },
	{ cat: "Extensions", name: "Animate", layout: "sC | {w}#", w: 500, h: 200, vars: { w: 200 },
		ext: () => [animate({ duration: "0.6s" })], children: () => boxes(["Sidebar", "Content"]),
		params: [{ key: "w", label: "sidebar", type: "toggle", on: 400, off: 200 }],
		src: '<Grid layout="sC | {w}#"\n\textensions={[animate({ duration: "0.6s" })]}>\n\t...\n</Grid>',
		guide: "The `animate` extension adds CSS transitions to grid track changes. Toggle the sidebar width — it glides instead of snapping. One line: `animate({ duration: \"0.6s\" })`.\n\nIt composes with any other extension.",
		tryThis: ["Toggle the sidebar checkbox — watch the smooth transition", "This composes with splitPane, collapsible, etc."] },
	{ cat: "Extensions", name: "Animated Collapsible", layout: "sC | {sb}#", w: 500, h: 250, vars: { sb: 200 },
		ext: () => [animate({ duration: "0.2s" }), collapsible({ var: "sb", area: "s", expanded: 200, collapsed: 0 })],
		children: (v) => [<Box key="s" c={1}>{(v.sb||0) > 0 ? "Sidebar" : ""}</Box>, <Box key="c" c={2}>Content</Box>],
		info: "Click arrow",
		src: '<Grid layout="sC | {sb}#"\n\textensions={[\n\t\tanimate({ duration: "0.2s" }),\n\t\tcollapsible({ var: "sb", area: "s",\n\t\t\texpanded: 200, collapsed: 0 })\n\t]}\n>\n\t...\n</Grid>',
		guide: "Extensions compose naturally. Here `animate` + `collapsible` together create a smooth collapse/expand animation. Just two entries in the extensions array.",
		tryThis: ["Click the arrow — smooth animated collapse", "Compare with the non-animated Collapsible preset"] },
	{ cat: "Extensions", name: "Accordion", layout: "| abc 8 | {a} {b} {c}", w: 400, h: 300, vars: { active: "a", a: "#", b: ".", c: "." },
		ext: () => [accordion({ var: "active", collapsed: ".", items: [{ area: "a", sizeVar: "a", expanded: "#" }, { area: "b", sizeVar: "b", expanded: "#" }, { area: "c", sizeVar: "c", expanded: "#" }] })],
		children: () => boxes(["Section A", "Section B", "Section C"]), info: "Click headers",
		src: '<Grid layout="| abc 8 | {a} {b} {c}"\n\textensions={[\n\t\taccordion({ var: "active", collapsed: ".", items: [\n\t\t\t{ area: "a", sizeVar: "a", expanded: "#" },\n\t\t\t{ area: "b", sizeVar: "b", expanded: "#" },\n\t\t\t{ area: "c", sizeVar: "c", expanded: "#" },\n\t\t] })\n\t]}\n>\n\t...\n</Grid>',
		guide: "Mutual exclusion: expanding one section collapses the others. The layout uses variables for row sizes — `.` (auto/collapsed) and `#` (1fr/expanded). The accordion extension manages which section gets which value.",
		tryThis: ["Click each section header to expand it", "Notice the others collapse automatically"] },
	{ cat: "Extensions", name: "Scrollable", layout: "hscf hhh scc sff 8 | {sb}# | 40#40", w: 500, h: 350, vars: { sb: 100 },
		ext: () => [scrollable({ area: ["s", "c"] }), splitPane({ var: "sb", edge: "s:r", min: 50, max: 300 })],
		children: () => [<Box key="h" c={0}>Header</Box>, <div key="s" style={{ background: "#1a1a2e" }}><div style={{ padding: 8, fontSize: 11, color: "#c792ea", borderBottom: "1px solid #2a2a4a" }}>Sidebar</div>{loremItems(12)}</div>, <div key="c" style={{ background: "#1a1a2e" }}><div style={{ padding: 8, fontSize: 11, color: "#c3e88d", borderBottom: "1px solid #2a2a4a" }}>Content</div>{loremItems(20)}</div>, <Box key="f" c={3}>Footer</Box>],
		src: '<Grid layout="hscf hhh scc sff 8 | {sb}# | 40#40"\n\textensions={[\n\t\tscrollable({ area: ["s", "c"] }),\n\t\tsplitPane({ var: "sb", edge: "s:r" })\n\t]}\n>\n\t...\n</Grid>',
		guide: "Fixed header and footer with independently scrollable sidebar and content — a very common layout need. The `scrollable` extension marks areas as overflow-scrollable. Combined with split pane, you get a fully interactive IDE-style layout.",
		tryThis: ["Scroll sidebar and content independently", "Drag the divider — both areas adjust and keep scrolling"] },
	{ cat: "Extensions", name: "Tabs", layout: "| abc .abc | 28 {_tab_a} {_tab_b} {_tab_c}", w: 400, h: 250, vars: { tab: "a" },
		ext: () => [tabs({ var: "tab", items: [{ label: "Overview", area: "a", sizeVar: "_tab_a" }, { label: "Details", area: "b", sizeVar: "_tab_b" }, { label: "Settings", area: "c", sizeVar: "_tab_c" }] }), animate({ duration: "0.2s" })],
		children: () => [
			<div key="a" style={{ background: "#1e3a5f", padding: 16, color: "#7fdbca", fontSize: 13, overflow: "hidden", height: "100%" }}><b>Overview</b><br/>Dashboard overview</div>,
			<div key="b" style={{ background: "#3a1e5f", padding: 16, color: "#c792ea", fontSize: 13, overflow: "hidden", height: "100%" }}><b>Details</b><br/>Detailed data</div>,
			<div key="c" style={{ background: "#1e5f3a", padding: 16, color: "#c3e88d", fontSize: 13, overflow: "hidden", height: "100%" }}><b>Settings</b><br/>Configuration</div>],
		src: '<Grid layout="| abc .abc | 28 {_tab_a} {_tab_b} {_tab_c}"\n\textensions={[\n\t\ttabs({ var: "tab", items: [\n\t\t\t{ label: "Overview", area: "a", sizeVar: "_tab_a" },\n\t\t\t{ label: "Details", area: "b", sizeVar: "_tab_b" },\n\t\t\t{ label: "Settings", area: "c", sizeVar: "_tab_c" },\n\t\t]}),\n\t\tanimate({ duration: "0.2s" })\n\t]}\n>\n\t...\n</Grid>',
		guide: "The tabs extension renders a tab bar, manages visibility through variables, and the animate extension smooths transitions. The layout string defines the structure — the extension adds the interaction.",
		tryThis: ["Click each tab to switch content", "Notice the smooth transition from the animate extension"] },
	{ cat: "Extensions", name: "Overlay", layout: "| hmCf hcfm 8 | 40#40", w: 500, h: 280,
		ext: () => [overlay({ area: "m", over: "c" }), debug()],
		children: (v, p) => {
			let show = p?._showOverlay;
			return [<Box key="h" c={0}>Header</Box>,
				show ? <div key="m" style={{ background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", borderRadius: 4 }}><div style={{ background: "#1e2a4a", border: "1px solid #3a4a6a", borderRadius: 8, padding: "20px 28px", color: "#ccc", fontSize: 13, textAlign: "center" }}><div style={{ fontWeight: 700, color: "#7fdbca", marginBottom: 8 }}>Modal</div><div style={{ color: "#888" }}>Overlaying area "c"</div></div></div> : <div key="m" />,
				<div key="c" style={{ background: "#1a1a2e", padding: 16, color: "#888", fontSize: 12 }}>Content area</div>,
				<Box key="f" c={3}>Footer</Box>];
		},
		params: [{ key: "_showOverlay", label: "show overlay", type: "toggle", on: true, off: false }],
		src: '<Grid layout="| hmCf hcfm 8 | 40#40"\n\textensions={[\n\t\toverlay({ area: "m", over: "c" })\n\t]}\n>\n\t...\n</Grid>',
		guide: "Overlay places one area on top of another. Area `m` covers the same grid cells as area `c` but with higher z-index. Useful for modals, loading states, or any layered content. The area is always in the layout — the extension positions it.",
		tryThis: ["Toggle the overlay checkbox", "The modal covers the content area without disturbing the layout"] },
	{ cat: "Extensions", name: "Multi-Column", layout: "hscf hhhh sccc ffff {g} ?h | {sb}### | 40#40", w: 600, h: 300, vars: { sb: 200, g: 8 },
		ext: (v, p) => [multiColumn({ area: "c", fill: p?.fill || "auto" })],
		children: () => [<Box key="h" c={0}>Header</Box>, <div key="s" style={{ background: "#3a1e5f", padding: 12, color: "#c792ea", fontSize: 11 }}>Sidebar</div>, <div key="c" style={{ background: "#1a1a2e", padding: 12, color: "#999", fontSize: 12, lineHeight: 1.7 }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.</div>, <Box key="f" c={3}>Footer</Box>],
		params: [{ key: "sb", label: "sidebar", type: "range", min: 100, max: 350, def: 200 }, { key: "g", label: "gap", type: "range", min: 0, max: 20, def: 8 }, { key: "fill", label: "col-fill", type: "toggle", on: "balance", off: "auto" }],
		src: '<Grid layout="hscf hhhh sccc ffff {g} ?h | {sb}### | 40#40"\n\textensions={[\n\t\tmultiColumn({ area: "c", fill: "auto" })\n\t]}\n>\n\t...\n</Grid>',
		guide: "Area `c` spans three grid columns. The multi-column extension reads the actual computed track widths and sets CSS column properties to match — so text flows across columns that align perfectly with the grid.\n\nToggle column-fill between `balance` (even distribution) and `auto` (sequential fill). Adjust the sidebar width — columns recalculate automatically.",
		tryThis: ["Toggle balance/auto to see different text distribution", "Drag the sidebar slider — columns adapt", "Adjust the gap slider"] },

	// --- fisheye ---
	{ cat: "Fisheye", name: "Calendar 2D", layout: "*7 ?wh || 30", w: 280, h: 220,
		ext: (v, p) => [fisheye({ axis: p?.axis || "both", intensity: (p?.intensity || 60) / 100, min: (p?.minFr || 15) / 100 })],
		children: calendarCells, gridStyle: { cursor: "crosshair" },
		params: [{ key: "intensity", label: "intensity", type: "range", min: 10, max: 95, def: 60 }, { key: "minFr", label: "min fr%", type: "range", min: 5, max: 50, def: 15 }],
		src: '<Grid layout="*7 ?wh || 30"\n\textensions={[\n\t\tfisheye({ axis: "both", intensity: 0.6, min: 0.15 })\n\t]}\n>\n\t{calendarCells}\n</Grid>',
		guide: "Hover over the calendar — cells near your cursor expand, distant ones compress. The total stays constant — it's pure fractional redistribution.\n\nEach cell receives CSS custom properties `--fe-scale`, `--fe-scale-x`, `--fe-scale-y` that children use to scale their content. Day numbers grow, event labels fade in.",
		tryThis: ["Hover around the calendar to see the effect", "Adjust intensity and min-fraction sliders", "Higher min% = less extreme compression"] },
	{ cat: "Fisheye", name: "Week View", layout: "*7 ?wh 2", w: 500, h: 160,
		ext: (v, p) => [fisheye({ axis: "x", intensity: (p?.intensity || 60) / 100, min: (p?.minFr || 15) / 100 })],
		children: () => ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((d, i) =>
			<div key={d} style={{ background: i < 5 ? "#1e2a3e" : "#2a1e3e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: "calc(6px + var(--fe-scale-x, 1) * 8px)", color: i < 5 ? "#7fdbca" : "#c792ea", fontWeight: 600, overflow: "hidden", gap: 4, height: "100%" }}>
				<span>{d}</span><span style={{ fontSize: "calc(var(--fe-scale-x, 1) * 9px)", color: "#555", opacity: "calc(var(--fe-scale-x, 1) * 0.8)" }}>{i < 5 ? "9am-5pm" : "Free"}</span>
			</div>),
		gridStyle: { cursor: "crosshair" },
		params: [{ key: "intensity", label: "intensity", type: "range", min: 10, max: 95, def: 60 }, { key: "minFr", label: "min fr%", type: "range", min: 5, max: 50, def: 15 }],
		src: '<Grid layout="*7 ?wh 2"\n\textensions={[\n\t\tfisheye({ axis: "x", intensity: 0.6, min: 0.15 })\n\t]}\n>\n\t{dayColumns}\n</Grid>',
		guide: "Horizontal-only fisheye. Full day names become readable as you hover. The `--fe-scale-x` CSS variable scales the font size and detail visibility per cell.\n\nThe effect works purely in `fr` units, only modifying flexible tracks while preserving fixed `px` tracks.",
		tryThis: ["Hover left to right — day names expand", "Adjust the intensity slider", "Notice event text fading in on hovered cells"] },

	// --- auto-flow ---
	{ cat: "Auto-Flow", name: "Basic Grid", layout: "*4 4 ?wh", w: 400, h: 200,
		children: (v, p) => { let n = p?.n || 8; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>{i + 1}</Box>); },
		params: [{ key: "n", label: "children", type: "range", min: 1, max: 16, def: 8 }],
		info: "Auto-flow grid, 4 columns",
		src: '<Grid layout="*4 4 ?wh">\n\t{items.map(i => <Card/>)}\n</Grid>',
		guide: "Auto-flow mode uses CSS `grid-auto-flow` instead of `grid-template-areas`. Children are placed automatically in a 4-column grid. No area names needed — just a column count.",
		tryThis: ["Add children with the slider", "Try `*3` or `*6` for different column counts"] },
	{ cat: "Auto-Flow", name: "Column Flow", layout: "*3 4 ?whf", w: 400, h: 250,
		children: (v, p) => { let n = p?.n || 9; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>{i + 1}</Box>); },
		params: [{ key: "n", label: "children", type: "range", min: 1, max: 12, def: 9 }],
		info: "?f reverses flow: fills top → bottom, left → right",
		src: '<Grid layout="*3 4 ?whf">\n\t{items}\n</Grid>',
		guide: "The `?f` flag reverses auto-flow direction. Instead of filling left → right then top → bottom (row flow), children fill top → bottom then left → right (column flow).",
		tryThis: ["Remove `f` from `?whf` to see normal row flow", "Compare the numbering order"] },
	{ cat: "Auto-Flow", name: "Dense Packing", layout: "*4 4 ?wF", w: 450, h: 280,
		children: () => {
			// use span pattern children: some span 2, leaving gaps that dense backfills
			let spans = [2, 1, 2, 1, 1, 2, 1, 1, 1, 2];
			return spans.map((sp, i) => {
				let wide = sp > 1;
				return <div key={i} style={{
					background: wide ? "#3a1e5f" : `hsl(${i * 35 + 180}, 35%, 22%)`,
					border: `1px solid ${wide ? "#5a2a8f" : `hsl(${i * 35 + 180}, 25%, 32%)`}`,
					borderRadius: 6, padding: "8px 12px", fontSize: 11, fontWeight: 600,
					color: wide ? "#c792ea" : `hsl(${i * 35 + 180}, 50%, 70%)`,
					display: "flex", alignItems: "center", justifyContent: "center",
				}}>{wide ? `Wide ${i + 1}` : i + 1}</div>;
			});
		},
		// override childSpans via a custom ext that sets grid-column on the wrapper
		ext: () => [{
			name: "_denseSpans",
			areaStyle: (area) => {
				let idx = parseInt(area.replace("c", ""));
				let spans = [2, 1, 2, 1, 1, 2, 1, 1, 1, 2];
				let sp = spans[idx];
				return sp > 1 ? { gridColumn: "span " + sp } : null;
		},
		}],
		info: "?F = dense — backfills gaps left by wide items. Remove ?F to see gaps.",
		src: '<Grid layout="*4 4 ?whF">\n\t// wide items span 2 cols, dense backfills gaps\n</Grid>',
		guide: "The `?F` flag enables dense packing (`grid-auto-flow: dense`). Wide items that span 2 columns leave gaps — dense mode backfills those gaps with smaller items.\n\nRemove `?F` to see the gaps that would normally appear.",
		tryThis: ["Remove `F` from `?wF` to see gaps appear", "Notice how smaller items fill in the holes with dense mode"] },
	{ cat: "Auto-Flow", name: "Transpose |*N", layout: "|*3 4 ?wh", w: 400, h: 250,
		children: (v, p) => { let n = p?.n || 9; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>{i + 1}</Box>); },
		params: [{ key: "n", label: "children", type: "range", min: 1, max: 12, def: 9 }],
		info: "| transposes: 3 rows, children flow as columns",
		src: '<Grid layout="|*3 4 ?wh">\n\t{items}\n</Grid>',
		guide: "Transpose works with auto-flow too. `|*3` means 3 rows (not columns), and children flow column-first. The `|` swaps everything — axes, sizes, flow direction.",
		tryThis: ["Remove `|` to see normal 3-column row flow", "Compare numbering order with the Column Flow preset"] },
	{ cat: "Auto-Flow", name: "Size Repeat *", layout: "*6 4 ?wh | 50 # *", w: 500, h: 200,
		children: (v, p) => { let n = p?.n || 12; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>{i + 1}</Box>); },
		params: [{ key: "n", label: "children", type: "range", min: 1, max: 18, def: 12 }],
		info: "Trailing * cycles col sizes: 50px # 50px # 50px #",
		src: '<Grid layout="*6 4 ?wh | 50 # *">\n\t{items}\n</Grid>',
		guide: "A trailing `*` in the sizes section means \"cycle these sizes to fill all tracks.\" Here `50 # *` with 6 columns becomes `50px 1fr 50px 1fr 50px 1fr` — alternating fixed and flexible.",
		tryThis: ["The pattern `80 #` repeats across all 6 columns", "Try `| 60 # # *` for a different cycle pattern"] },
	{ cat: "Auto-Flow", name: "Auto-Fill", layout: "* 6 ?w | *150~#", w: 500, h: 200,
		children: (v, p) => { let n = p?.n || 8; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>{i + 1}</Box>); },
		params: [{ key: "n", label: "children", type: "range", min: 1, max: 16, def: 8 }],
		info: "Leading * on sizes = auto-fill — column count adapts to width",
		src: '<Grid layout="* 6 ?w | *150~#">\n\t{items}\n</Grid>',
		guide: "A leading `*` on the sizes segment enables `repeat(auto-fill, ...)`. Here `*150~#` becomes `repeat(auto-fill, minmax(150px, 1fr))` — the browser creates as many columns as fit, each at least 150px wide.\n\nNo fixed column count needed — `*` alone in the main segment means auto-flow with the count determined by auto-fill.",
		tryThis: ["Resize the preview to see columns appear and disappear", "Reduce children to 2-3 and notice empty tracks still hold space"] },
	{ cat: "Auto-Flow", name: "Auto-Fit", layout: "* 6 ?w | *150~#*", w: 500, h: 200,
		children: (v, p) => { let n = p?.n || 3; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>{i + 1}</Box>); },
		params: [{ key: "n", label: "children", type: "range", min: 1, max: 12, def: 3 }],
		info: "Both * = auto-fit — empty tracks collapse, items stretch",
		src: '<Grid layout="* 6 ?w | *150~#*">\n\t{items}\n</Grid>',
		guide: "Adding a trailing `*` alongside the leading `*` switches from auto-fill to auto-fit: `*150~#*` becomes `repeat(auto-fit, minmax(150px, 1fr))`.\n\nThe difference: with few items, auto-fill keeps empty tracks (holding space), while auto-fit collapses them to 0 so items stretch to fill the row. Try the slider — with 3 items they stretch wide, unlike auto-fill.",
		tryThis: ["Compare with the Auto-Fill preset at 3 children — items stretch here", "Add more children to see auto-fit wrap to multiple rows", "The trailing `*` is the auto-fit signal — remove it to get auto-fill"] },
	{ cat: "Auto-Flow", name: "Alternating Rows", layout: "*3 4 ?wh || 40 80 *", w: 400, h: 280,
		children: (v, p) => { let n = p?.n || 12; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>{i + 1}</Box>); },
		params: [{ key: "n", label: "children", type: "range", min: 1, max: 18, def: 12 }],
		info: "Row sizes cycle: 40px 80px 40px 80px ...",
		src: '<Grid layout="*3 4 ?wh || 40 80 *">\n\t{items}\n</Grid>',
		guide: "Size cycling works on rows too. `|| 40 80 *` makes rows alternate between 40px and 80px heights. The double-pipe `||` skips column sizes and goes straight to row sizes.",
		tryThis: ["Notice the alternating row heights", "Add children to see the pattern continue"] },
	{ cat: "Auto-Flow", name: "Dashboard Grid", layout: "*4 6 ?whC | .*", w: 500, h: 300,
		ext: () => [{
			name: "_dashSpans",
			areaStyle: (area) => {
				let idx = parseInt(area.replace("c", ""));
				// first row: 2 wide cards, second row: 4 narrow, third row: 1 full-width + 3
				let spans = [2, 2, 1, 1, 1, 1, 4, 1, 1, 1];
				let sp = spans[idx];
				return sp > 1 ? { gridColumn: "span " + sp } : null;
			},
		}],
		children: () => {
			let labels = ["Revenue", "Users", "CPU", "Memory", "Disk", "Net", "Activity Log", "Alerts", "Tasks", "Deploy"];
			return labels.map((l, i) => {
				let hue = [200, 260, 150, 35, 350, 180, 220, 0, 280, 120][i];
			return <div key={i} style={{
					background: `hsl(${hue}, 30%, 16%)`, border: `1px solid hsl(${hue}, 20%, 28%)`,
					borderRadius: 6, padding: 10, fontSize: 11, fontWeight: 600,
					color: `hsl(${hue}, 50%, 65%)`, display: "flex", alignItems: "center", justifyContent: "center",
				}}>{l}</div>;
			});
		},
		info: "Mixed-span dashboard — wide cards via areaStyle extension",
		src: '<Grid layout="*4 6 ?whC | .*"\n\textensions={[{\n\t\tname: "_dashSpans",\n\t\tareaStyle: (area) => {\n\t\t\tlet spans = [2, 2, 1, 1, 1, 1, 4, ...];\n\t\t\treturn sp > 1 ? { gridColumn: "span " + sp } : null;\n\t\t}\n\t}]}\n>\n\t...\n</Grid>',
		guide: "Auto-flow with custom spans. An extension sets `gridColumn: span N` on specific children to create a mixed-width dashboard. The first two cards span 2 columns, the Activity Log spans 4.",
		tryThis: ["Notice how different cards have different widths", "This combines auto-flow with per-child styling"] },
	{ cat: "Auto-Flow", name: "Scrollable Grid", layout: "*3 8 ?wh", w: 400, h: 250,
		ext: () => [scrollable({ area: ["c0", "c1", "c2", "c3", "c4", "c5"] })],
		children: () => Array.from({ length: 6 }, (_, i) =>
			<div key={i} style={{ background: `hsl(${i * 50 + 200}, 30%, 18%)`, border: `1px solid hsl(${i * 50 + 200}, 20%, 30%)`, borderRadius: 6, padding: 8, fontSize: 11, color: `hsl(${i * 50 + 200}, 50%, 65%)`, overflow: "auto" }}>
				<div style={{ fontWeight: 700, marginBottom: 4 }}>Panel {i + 1}</div>
				{loremItems(6)}
			</div>),
		info: "Auto-flow + scrollable extension (needsAreas)",
		src: '<Grid layout="*3 8 ?wh"\n\textensions={[\n\t\tscrollable({ area: ["c0","c1",...] })\n\t]}\n>\n\t{panels}\n</Grid>',
		guide: "Extensions that need area names (like `scrollable`) trigger automatic conversion from auto-flow to template-areas mode. Grid generates `c0, c1, c2, ...` names internally so extensions work seamlessly.",
		tryThis: ["Scroll each panel independently", "This is auto-flow but with per-area behavior"] },

	// --- masonry ---
	{ cat: "Masonry", name: "Regular", layout: "* 10 ?w | *150~#", w: 600, h: 400,
		ext: (v, p) => [masonry()],
		children: () => {
			let frames = [
				[4, 3], [1, 1], [3, 4], [3, 2], [1, 1], [4, 3],
				[2, 3], [3, 2], [1, 1], [4, 3], [3, 4], [1, 1],
			];
			return frames.map(([w, h], i) => {
				let hue = (i * 31 + 180) % 360;
				return <div key={i} style={{
					"--width": w, "--height": h,
					background: `hsl(${hue}, 35%, 20%)`,
					border: `1px solid hsl(${hue}, 25%, 32%)`,
					borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
					fontSize: 11, fontWeight: 600, color: `hsl(${hue}, 50%, 65%)`, height: "100%",
				}}>{w}:{h}</div>;
			});
		},
		info: "Regular masonry — items pulled up via translateY()",
		src: '<Grid layout="* 10 ?w | *150~#"\n\textensions={[masonry()]}\n>\n\t<div style={{ "--width": 4, "--height": 3 }}>4:3</div>\n\t<div style={{ "--width": 1, "--height": 1 }}>1:1</div>\n\t...\n</Grid>',
		guide: "Masonry layout using the `masonry()` extension. Items declare their aspect ratio via `--width` and `--height` CSS variables. The extension uses `translateY()` to pull items up and fill vertical gaps.\n\nColumn sizing is in the layout string: `*150~#` means `repeat(auto-fill, minmax(150px, 1fr))` — the `*` prefix on sizes enables auto-fill.",
		tryThis: ["Items maintain their aspect ratios", "Gaps are filled by pulling items up", "Resize the preview to see columns reflow"] },
	{ cat: "Masonry", name: "Balanced", layout: "* 10 ?w | *150~#", w: 600, h: 400,
		ext: (v, p) => [masonry({ balanced: true })],
		children: () => {
			let frames = [
				[4, 3], [1, 1], [3, 4], [3, 2], [1, 1], [4, 3],
				[2, 3], [3, 2], [1, 1], [4, 3], [3, 4], [1, 1],
			];
			return frames.map(([w, h], i) => {
				let hue = (i * 31 + 180) % 360;
				return <div key={i} style={{
					"--width": w, "--height": h,
					background: `hsl(${hue}, 35%, 20%)`,
					border: `1px solid hsl(${hue}, 25%, 32%)`,
					borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
					fontSize: 11, fontWeight: 600, color: `hsl(${hue}, 50%, 65%)`, height: "100%",
				}}>{w}:{h}</div>;
			});
		},
		info: "Balanced masonry — reorders items for minimal total height",
		src: '<Grid layout="* 10 ?w | *150~#"\n\textensions={[masonry({ balanced: true })]}\n>\n\t...\n</Grid>',
		guide: "Balanced masonry reorders items within each row using the CSS `order` property to minimize total grid height. Tall items get paired with short previous-row columns, producing a more compact result than regular masonry.\n\nThe DOM order stays the same — only the visual order changes.",
		tryThis: ["Compare with the Regular preset — notice the height difference", "Items are visually reordered but DOM order is preserved"] },
	{ cat: "Masonry", name: "Photo Gallery", layout: "* 8 ?w | *180~#", w: 600, h: 450,
		ext: (v, p) => [masonry({ balanced: p?.balanced ?? true })],
		children: (v, p) => {
			let photos = [
				[4, 3, 200], [3, 4, 201], [1, 1, 202], [16, 9, 203],
				[3, 2, 204], [2, 3, 205], [4, 3, 206], [1, 1, 207],
				[3, 4, 208], [4, 3, 209], [2, 3, 210], [3, 2, 211],
			];
			let n = p?.n || 12;
			return photos.slice(0, n).map(([w, h, seed], i) =>
				<div key={i} style={{
					"--width": w, "--height": h,
					overflow: "hidden", borderRadius: 6,
				}}>
					<img src={`https://picsum.photos/seed/${seed}/${w * 100}/${h * 100}`}
						style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
						alt={`Photo ${i + 1}`} />
				</div>
			);
		},
		params: [
			{ key: "n", label: "photos", type: "range", min: 3, max: 12, def: 12 },
			{ key: "balanced", label: "balanced", type: "toggle", on: true, off: false },
		],
		info: "Photo gallery with real images — toggle balanced mode",
		src: '<Grid layout="* 8 ?w | *180~#"\n\textensions={[\n\t\tmasonry({ balanced: true })\n\t]}\n>\n\t<div style={{ "--width": 4, "--height": 3 }}>\n\t\t<img src="..." />\n\t</div>\n\t...\n</Grid>',
		guide: "A photo gallery using masonry layout. Each image declares its aspect ratio via `--width` and `--height`. The extension reads these from the child elements and computes vertical translations.\n\nToggle balanced mode to see how reordering minimizes total height. Column sizing `*180~#` is `repeat(auto-fill, minmax(180px, 1fr))`.",
		tryThis: ["Toggle balanced mode to compare layouts", "Adjust the photo count", "Resize the preview to see columns reflow"] },
	{ cat: "Masonry", name: "Cards", layout: "* 12 ?w | *200~#", w: 600, h: 400,
		ext: (v, p) => [masonry({ balanced: true })],
		children: () => {
			let cards = [
				{ t: "Getting Started", d: "Quick introduction to the library and core concepts." },
				{ t: "API Reference", d: "Complete reference for all available functions, options, and configuration parameters." },
				{ t: "Examples", d: "Live demos and code samples." },
				{ t: "Extensions", d: "How to write custom extensions. Covers the lifecycle hooks, render functions, and best practices for composable plugins." },
				{ t: "Layout DSL", d: "Grammar reference for the compact layout string." },
				{ t: "Changelog", d: "Version history." },
				{ t: "FAQ", d: "Frequently asked questions about setup, browser support, performance, and edge cases with various frameworks." },
				{ t: "Migration Guide", d: "Upgrading from v1." },
				{ t: "Themes", d: "Customizing colors, fonts, and spacing. Includes dark mode and high-contrast presets with full variable reference." },
			];
			return cards.map((card, i) => {
				let hue = (i * 40 + 160) % 360;
				return <div key={i} style={{
					background: `hsl(${hue}, 30%, 14%)`,
					border: `1px solid hsl(${hue}, 20%, 25%)`,
					borderRadius: 8, padding: 16, display: "flex", flexDirection: "column", gap: 6,
				}}>
					<div style={{ fontWeight: 700, fontSize: 13, color: `hsl(${hue}, 50%, 70%)` }}>{card.t}</div>
					<div style={{ fontSize: 11, color: "#777", lineHeight: 1.5 }}>{card.d}</div>
				</div>;
			});
		},
		info: "Content cards — heights measured from DOM, no aspect-ratio needed",
		src: '<Grid layout="* 12 ?w | *200~#"\n\textensions={[\n\t\tmasonry({ balanced: true })\n\t]}\n>\n\t<Card>...</Card>\n\t...\n</Grid>',
		guide: "Text content without `--width`/`--height` CSS variables. The extension auto-detects this and measures actual `offsetHeight` from the DOM instead of computing from an aspect ratio.\n\nThis means cards fit their content exactly — no wasted space, no clipping. The masonry algorithm still pulls items up via `translateY()` to fill gaps.",
		tryThis: ["Cards fit their content — no fixed aspect ratio", "Compare with Photo Gallery where aspect ratios are locked", "Resize the preview to see content reflow and re-measure"] },
	{ cat: "Masonry", name: "Transposed", layout: "| * 8 ?h | *80~#", w: 400, h: 350,
		ext: (v, p) => [masonry({ balanced: true })],
		children: () => {
			let frames = [
				[3, 4], [1, 1], [4, 3], [2, 3], [1, 1], [3, 2],
				[4, 3], [1, 1], [3, 4], [2, 3], [3, 2], [1, 1],
			];
			return frames.map(([w, h], i) => {
				let hue = (i * 31 + 180) % 360;
				return <div key={i} style={{
					"--width": w, "--height": h,
					background: `hsl(${hue}, 35%, 20%)`,
					border: `1px solid hsl(${hue}, 25%, 32%)`,
					borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
					fontSize: 11, fontWeight: 600, color: `hsl(${hue}, 50%, 65%)`, height: "100%",
				}}>{w}:{h}</div>;
			});
		},
		info: "Transposed masonry — horizontal packing with translateX",
		src: '<Grid layout="| * 8 ?h | *80~#"\n\textensions={[\n\t\tmasonry({ balanced: true })\n\t]}\n>\n\t...\n</Grid>',
		guide: "The `|` prefix transposes the layout — masonry packs horizontally instead of vertically. Rows become auto-fill tracks, and `translateX` shifts items left to close gaps.\n\nThe `*80~#` controls min row height (axes are swapped by transpose). `?h` fills container height.",
		tryThis: ["Items pack horizontally instead of vertically", "Compare with the Regular preset to see the axis swap"] },

	// --- render ---
	{ cat: "Render", name: "Scrollable Table", layout: "*5 ?wh", w: 550, h: 300,
		ext: () => {
			let sg = { display: "grid", gridTemplateColumns: "subgrid", gridColumn: "1 / -1" };
			return [render({
				cell: (child, style, key) => <td key={key} style={style}>{child}</td>,
				container: ({ props, children, parsed }) => {
					let n = parsed.colCount;
					let cells = children.filter(c => c != null);
					let head = cells.slice(0, n);
					let body = cells.slice(n);
					let bodyRows = [];
					for (let i = 0; i < body.length; i += n) bodyRows.push(body.slice(i, i + n));
					return <table {...props} style={{ ...props.style, gridTemplateRows: "32px 1fr" }}>
						<thead style={sg}><tr style={sg}>{head}</tr></thead>
						<tbody style={{ ...sg, overflow: "auto", minHeight: 0, alignContent: "start" }}>
							{bodyRows.map((row, i) => <tr key={i} style={sg}>{row}</tr>)}
						</tbody>
					</table>;
				},
			})];
		},
		children: (v, p) => {
			let cols = ["Name", "Role", "Dept", "Status", "Score"];
			let data = [
				["Alice", "Engineer", "Platform", "Active", "94"],
				["Bob", "Designer", "Product", "Active", "87"],
				["Carol", "PM", "Growth", "On Leave", "91"],
				["Dave", "Engineer", "Infra", "Active", "88"],
				["Eve", "Analyst", "Data", "Active", "95"],
				["Frank", "Engineer", "Platform", "Active", "82"],
				["Grace", "Designer", "Brand", "Active", "90"],
				["Hank", "PM", "Core", "Inactive", "76"],
				["Iris", "Engineer", "Mobile", "Active", "93"],
				["Jack", "Analyst", "Data", "On Leave", "85"],
			];
			let n = p?.rows || 10;
			let hdr = cols.map((c, i) => <span key={"h" + i} style={{ fontWeight: 700, color: "#7fdbca", fontSize: 11, padding: "6px 10px", background: "#16213e", borderBottom: "2px solid #2a4a6a", whiteSpace: "nowrap" }}>{c}</span>);
			let rows = data.slice(0, n).flatMap((row, r) =>
				row.map((cell, c) => <span key={`r${r}c${c}`} style={{ padding: "4px", fontSize: 11, color: "#999", borderBottom: "1px solid #1a1a2e", whiteSpace: "nowrap", background: r % 2 ? "#111122" : "transparent" }}>{cell}</span>)
			);
			return [...hdr, ...rows];
		},
		params: [{ key: "rows", label: "rows", type: "range", min: 2, max: 10, def: 10 }],
		gridStyle: { borderCollapse: "collapse", tableLayout: "fixed" },
		info: "table/thead/tbody/tr/td — tbody scrolls, header stays synced via subgrid",
		src: 'render({\n\tcell: (child, style, key) => <td ...>,\n\tcontainer: ({ props, children, parsed }) => {\n\t\t// split children into head/body rows\n\t\treturn <table>\n\t\t\t<thead>...</thead>\n\t\t\t<tbody style={{overflow:"auto"}}>...</tbody>\n\t\t</table>\n\t}\n})',
		guide: "The `render` extension gives you full control over the DOM output. Here the grid renders as a `<table>` with proper `<thead>/<tbody>/<tr>/<td>` tags and CSS subgrid for column alignment. The tbody scrolls while the header stays pinned.",
		tryThis: ["Scroll the table body — header stays fixed", "Adjust the rows slider"] },
	{ cat: "Render", name: "Definition List", layout: "*2 4 ?w | .#", w: 400,
		ext: () => [render({
			cell: (child, style, key, idx, parsed) => {
				let Tag = idx % parsed.colCount === 0 ? "dt" : "dd";
				return <Tag key={key} style={style}>{child}</Tag>;
			},
			container: ({ props, children }) => <dl {...props}>{children}</dl>,
		})],
		children: () => {
			let items = [
				["gridpack", "CSS Grid layout DSL for React"],
				["layout", "Compact string describing grid areas"],
				["extension", "Composable behavioral plugin"],
				["auto-flow", "Automatic child placement in a grid"],
				["transpose", "Swap columns and rows with | prefix"],
			];
			return items.flatMap(([term, def], i) => [
				<span key={"t" + i} style={{ fontWeight: 700, color: "#c792ea", fontSize: 12, padding: "4px 0" }}>{term}</span>,
				<span key={"d" + i} style={{ color: "#888", fontSize: 12, padding: "4px 0" }}>{def}</span>,
			]);
		},
		info: "dl/dt/dd — cell callback picks tag based on column index",
		src: 'render({\n\tcell: (child, style, key, idx, parsed) =>\n\t\tidx % parsed.colCount===0\n\t\t\t? <dt ...> : <dd ...>,\n\tcontainer: ({props, children}) =>\n\t\t<dl {...props}>{children}</dl>\n})',
		guide: "Semantic HTML via the `render` extension. The `cell` callback picks `<dt>` or `<dd>` based on column index, and the `container` callback wraps everything in a `<dl>`. Grid layout logic stays the same — only the DOM output changes.",
		tryThis: ["This renders as a proper `<dl>` definition list", "The cell callback decides the tag per column"] },

		// --- overlap ---
		{ cat: "Overlap", name: "Testimonial Card", layout: "iq ii. i[qi]q .qq | 50 50 | 50 50", w: 500, h: 280,
			children: () => [
				<div key="photo" style={{
					width: "100%", height: "100%",
					background: "linear-gradient(135deg, #3a1e5f, #2a3a6f)",
					borderRadius: "50%", border: "3px solid #c792ea",
					display: "flex", alignItems: "center", justifyContent: "center",
					fontSize: 32, color: "#c792ea", zIndex: 2,
				}}>👤</div>,
				<div key="quote" style={{
					background: "#1a1a2e", borderRadius: 12, padding: 16, paddingLeft: 50,
					color: "#ccc", fontSize: 13, lineHeight: 1.6,
					display: "flex", flexDirection: "column", justifyContent: "center",
				}}>
					<span style={{ color: "#f78c6c", fontSize: 28, fontFamily: "serif" }}>"</span>
					Lorem ipsum dolor sit amet consectetur. Sagittis nisi feugiat eros urna vestibulum cras iaculis odio.
					<span style={{ color: "#7fdbca", marginTop: 12, fontSize: 12 }}>– Jane L. Student</span>
				</div>,
			],
			src: '<Grid layout="iq ii. i[qi]q .qq | 50 50 | 50 50">\n\t<Photo/>\n\t<Quote/>\n</Grid>',
			guide: "**Overlap** via `[]` bracket cells. The `[iq]` cell marks where the photo (`i`) and quote (`q`) share a grid cell. Each area's bounding rectangle is computed and converted to explicit `grid-column`/`grid-row` placement.\n\nThis layout was impossible before — `grid-template-areas` doesn't allow two areas in one cell.",
			tryThis: ["The photo spans rows 1-2, cols 1-2", "The quote spans rows 2-3, cols 2-4", "They overlap at row 2, col 2"] },
		{ cat: "Overlap", name: "Testimonial (+ layers)", layout: "iq . .qqq .qqq + ii ii | 50 50 | 50 50", w: 500, h: 280,
			children: () => [
				<div key="photo" style={{
					width: "100%", height: "100%",
					background: "linear-gradient(135deg, #3a1e5f, #2a3a6f)",
					borderRadius: "50%", border: "3px solid #c792ea",
					display: "flex", alignItems: "center", justifyContent: "center",
					fontSize: 32, color: "#c792ea", zIndex: 2,
				}}>👤</div>,
				<div key="quote" style={{
					background: "#1a1a2e", borderRadius: 12, padding: 16, paddingLeft: 50,
					color: "#ccc", fontSize: 13, lineHeight: 1.6,
					display: "flex", flexDirection: "column", justifyContent: "center",
				}}>
					<span style={{ color: "#f78c6c", fontSize: 28, fontFamily: "serif" }}>"</span>
					Lorem ipsum dolor sit amet consectetur. Sagittis nisi feugiat eros urna vestibulum cras iaculis odio.
					<span style={{ color: "#7fdbca", marginTop: 12, fontSize: 12 }}>– Jane L. Student</span>
				</div>,
			],
			src: '<Grid layout="iq . .qqq .qqq + ii ii | 50 50 | 50 50">\n\t<Photo/>\n\t<Quote/>\n</Grid>',
			guide: "Same testimonial card, but using **`+` layer syntax** instead of `[]` cells. Each layer is a separate grid map — the parser pads them to the same dimensions and overlays them. Where both layers have an area in the same cell, a `[xy]` bracket is auto-generated.\n\nSame output, different authoring style — layers are more visual for complex overlaps.",
			tryThis: ["Compare with the [] version above", "Each layer shows one area's footprint clearly", "The `+` splits the two layers"] },
	{ cat: "Overlap", name: "Line Placement", layout: "i[1:3, 1:3, 1] q[2:4, 2:4] | 50 50 | 50 50 .", w: 400, h: 280,
		children: () => [
			<div key="photo" style={{
				width: "100%", height: "100%",
				background: "linear-gradient(135deg, #3a1e5f, #2a3a6f)",
				borderRadius: "50%", border: "3px solid #c792ea",
				display: "flex", alignItems: "center", justifyContent: "center",
				fontSize: 32, color: "#c792ea",
			}}>👤</div>,
			<div key="quote" style={{
				background: "#1a1a2e", borderRadius: 12, padding: 16, paddingLeft: 50,
				color: "#ccc", fontSize: 13, lineHeight: 1.6,
				display: "flex", flexDirection: "column", justifyContent: "center",
			}}>
				<span style={{ color: "#f78c6c", fontSize: 28, fontFamily: "serif" }}>"</span>
				Explicit grid line numbers — no map needed.
				<span style={{ color: "#7fdbca", marginTop: 12, fontSize: 12 }}>– Direct Placement</span>
			</div>,
		],
		src: '<Grid layout="i[1:3, 1:3, 1] q[2:4, 2:4] | 50 50 | 50 50 .">\n\t<Photo/>\n\t<Quote/>\n</Grid>',
		guide: "**Direct line placement** with `[col,row]` syntax. No area map at all — each area gets explicit `grid-column` and `grid-row` values. `1:3` becomes `1 / 3` in CSS.\n\nSupports negative lines (`-1` = last), z-index as third param (`[1:3,1:3,10]`), and alignment modifiers (`i(cC)[1:3,1:3]`).",
		tryThis: ["Try `i[1:3,1:3,10]` to add z-index", "Try `i(cC)[1:3,1:3]` to center the photo", "Negative lines work: `i[1:-1,1:-1]` spans full grid"] },
	{ cat: "Overlap", name: "Callout Card", layout: "qit qqq.. qqq.. qqq.. + ..iii ..iii ..iii + ..... ..... ttttt | # # # # # | # # #", w: 550, h: 220,
		children: () => [
			<div key="content" style={{
				background: "#1a1a2e", borderRadius: 8, padding: "20px 24px",
				display: "flex", flexDirection: "column", justifyContent: "center",
			}}>
				<div style={{ fontWeight: 700, fontSize: 16, fontStyle: "italic", color: "#eee", marginBottom: 8 }}>Basic Callout</div>
				<div style={{ fontSize: 12, color: "#999", lineHeight: 1.6 }}>
					Lorem ipsum dolor sit amet. Sagittis nisi feugiat eros urna vestibulum cras iaculis odio.
				</div>
				<div style={{
					marginTop: 12, display: "inline-flex", alignItems: "center", gap: 8,
					background: "#f5f0eb", color: "#333", borderRadius: 20, padding: "6px 16px",
					fontSize: 12, fontWeight: 600, width: "fit-content",
				}}>Learn More <span style={{ color: "#f78c6c" }}>→</span></div>
			</div>,
			<div key="image" style={{
				width: "100%", height: "100%",
				background: "linear-gradient(135deg, #2a3a5f 0%, #3a4a7f 100%)",
				display: "flex", alignItems: "center", justifyContent: "center",
				fontSize: 48, color: "#7fdbca55",
			}}>🖼</div>,
			<div key="accent" style={{
				background: "linear-gradient(90deg, #f78c6c, #ffcb6b)",
				borderRadius: 2, alignSelf: "end", height: 4,
			}} />,
		],
		src: '<Grid layout="qit\n\tqqq.. qqq.. qqq..\n\t+ ..iii ..iii ..iii\n\t+ ..... ..... ttttt\n\t| # # # # # | # # #">\n\t<Content/>\n\t<Image/>\n\t<Accent/>\n</Grid>',
		guide: "A complex **three-layer overlap**. Content panel (`q`) spans the left 3 cols, image (`i`) spans the right 3 cols, accent bar (`t`) sits at the bottom across all 5 cols. Each layer is drawn separately with `+`, and the parser auto-detects where they overlap.\n\nAll three areas get explicit `grid-column`/`grid-row` placement — the normal template-areas map becomes all dots.",
		tryThis: ["Three layers separated by `+`", "q and i overlap in the middle column", "t overlaps with both at the bottom row"] },
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
			? <pre style={{ background: "#0a0a18", border: "1px solid #2a2a4a", borderRadius: 4, padding: 12, color: "#b8b8d0", fontSize: 11, lineHeight: 1.7, margin: 0, whiteSpace: "pre", wordBreak: "break-word", tabSize: 4 }}>{preset.src}</pre>
			: <div style={{ color: "#555", fontSize: 12, padding: 8 }}>No source example for this preset.</div>
		}
		{Object.keys(responsiveProps).length > 0 && <div style={{ marginTop: 8 }}>
			<div style={{ fontSize: 10, color: "#c792ea", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Responsive breakpoints</div>
			{Object.entries(responsiveProps).map(([bp, val]) =>
				<div key={bp} style={{ fontSize: 11, marginBottom: 2 }}>
					<span style={{ color: "#f78c6c" }}>{bp}</span>
					<span style={{ color: "#555" }}>{" = "}</span>
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
						<div style={{ borderTop: "1px solid #2a2a4a", margin: "6px 0 4px", paddingTop: 4 }}><span className="k">css:</span></div>
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
		.pg-input { width: 100%; background: #0f0f23; border: 1px solid #2a2a4a; border-radius: 4px; color: #c3e88d; font-family: inherit; font-size: 13px; padding: 8px 10px; resize: none; outline: none; line-height: 1.5; }
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
		.pg-dbg { background: #0f0f23; border: 1px solid #2a2a4a; border-radius: 4px; padding: 8px; font-size: 11px; line-height: 1.6; overflow: auto; }
		.pg-dbg .k { color: #c792ea; } .pg-dbg .v { color: #c3e88d; }
		.pg-tabs { display: flex; gap: 0; border-bottom: 1px solid #2a2a4a; margin: 0 12px; }
		.pg-tab { background: none; border: none; border-bottom: 2px solid transparent; color: #555; font-family: inherit; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; padding: 6px 10px; cursor: pointer; transition: all 0.15s; }
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
		.pg-preset-nav { display: flex; align-items: center; gap: 0; border-top: 1px solid #2a2a4a; background: #0f0f1a; flex-shrink: 0; }
		.pg-nav-btn { background: none; border: none; color: #7fdbca; font-family: inherit; font-size: 16px; padding: 8px 14px; cursor: pointer; flex-shrink: 0; transition: background 0.1s; line-height: 1; }
		.pg-nav-btn:hover { background: #7fdbca18; }
		.pg-nav-btn:active { background: #7fdbca28; }
		.pg-nav-center { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 6px 0; overflow: hidden; }
		.pg-nav-cat { font-size: 9px; color: #555; text-transform: uppercase; letter-spacing: 1px; }
		.pg-nav-name { font-size: 12px; color: #ccc; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
		.pg-nav-count { font-size: 9px; color: #444; }

		/* --- reset btn --- */
		.pg-reset { background: none; border: 1px solid #2a2a4a; border-radius: 3px; color: #555; font-family: inherit; font-size: 10px; padding: 2px 7px; cursor: pointer; transition: all 0.1s; line-height: 1.6; }
		.pg-reset:hover { color: #f78c6c; border-color: #f78c6c60; background: #f78c6c10; }
		.pg-reset.dirty { color: #f78c6c; border-color: #f78c6c60; }
	`}</Style>;

// --- desktop playground ---
let DesktopPlayground = () => {
	let s = usePlaygroundState();
	let [vars2, setVars2] = React.useState({ sb: 260 });

	return <Grid layout="pC pc ?wh | {sb}#" vars={vars2} onVarsChange={setVars2} extensions={[
		scrollable({ area: ["p", "c"] }), splitPane({ var: "sb", edge: "p:e", min: 80, max: 300 })
	]}>
		<PlaygroundStyles />

		{/* --- left panel --- */}
		<div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
			<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingRight: 10 }}>
				<div className="pg-h2">Layout</div>
				<button className={`pg-reset ${s.isDirty ? "dirty" : ""}`} onClick={s.resetPreset} title="Reset to preset default">reset</button>
			</div>
			<div style={{ padding: "0 10px 4px" }}>
				<textarea className="pg-input" rows={3} spellCheck={false} value={s.layout} onChange={e => s.setLayout(e.target.value)} />
			</div>
			<ParamControls preset={s.preset} params={s.params} setParams={s.setParams} vars={s.vars} setVars={s.setVars} />
			<div style={{ padding: "0 10px 4px", display: "flex", gap: 10 }}>
				<label className="pg-chk"><input type="checkbox" checked={s.showGrid} onChange={e => s.setShowGrid(e.target.checked)} /> grid overlay</label>
			</div>
			{s.preset.info && <div style={{ padding: "2px 10px 4px", fontSize: 10, color: "#f78c6c" }}>{s.preset.info}</div>}

			<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingRight: 10 }}>
				<div className="pg-h2">Presets</div>
				<div style={{ display: "flex", gap: 2 }}>
					<button className="pg-nav-btn" style={{ fontSize: 12, padding: "4px 8px" }} onClick={s.prevPreset} title="Previous">?</button>
					<button className="pg-nav-btn" style={{ fontSize: 12, padding: "4px 8px" }} onClick={s.nextPreset} title="Next">?</button>
				</div>
			</div>
			<PresetList presetIdx={s.presetIdx} selectPreset={s.selectPreset} />
		</div>

		{/* --- right panel --- */}
		<div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
			<div className="pg-h2" style={{ display: "flex", gap: 8, alignItems: "center" }}>
				Preview <span style={{ color: "#fff8", fontSize: 9 }}>{s.preset.cat} / {s.preset.name}</span>
			</div>
			<div style={{ padding: "0 12px 8px", flexShrink: 0 }}>
				<div style={{ width: s.preset.w || "100%", height: s.preset.h || "auto", minHeight: 20, maxWidth: "100%", border: "1px dashed #2a2a4a", borderRadius: 4, position: "relative", overflow: "hidden", resize: "both" }}>
					<Grid layout={s.layout} vars={s.allVars} onVarsChange={s.setVars} extensions={s.extensions}
						style={{ ...(s.preset.gridStyle || {}) }}
						{...s.responsiveProps}>
						{s.children}
					</Grid>
				</div>
				{s.parsed.error && <div style={{ color: "#ff5370" }}>Error: {s.parsed.error}</div>}
			</div>
			<GuidePanel preset={s.preset} parsed={s.parsed} cssLines={s.cssLines} extSummary={s.extSummary}
				responsiveProps={s.responsiveProps} panel={s.panel} setPanel={s.setPanel} />
		</div>
	</Grid>;
};

let MobilePlayground = () => {
	let s = usePlaygroundState();
	let [v, setV] = React.useState({ nw: 200, w: 20, h: 400 });

	return <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
		<PlaygroundStyles />
		<Style>{`
			.pg-mobile-scroll { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; }
			.pg-drag-handle { height: 18px; display: flex; align-items: center; justify-content: center; cursor: ns-resize; background: #0f0f1a; border-top: 1px solid #2a2a4a; flex-shrink: 0; touch-action: none; }
			.pg-drag-handle::after { content: ""; display: block; width: 32px; height: 3px; border-radius: 2px; background: #2a2a5a; }
			.pg-drag-handle:hover::after, .pg-drag-handle:active::after { background: #7fdbca60; }
			.pg-mobile-section { padding: 0 10px; border-bottom: 1px solid #1a1a2e; }
			.pg-mobile-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #444; padding: 8px 0 4px; }
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
					style={{ ...(s.preset.gridStyle || {}) }}
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

let Playground = () => useIsMobile() ? <MobilePlayground /> : <DesktopPlayground />;

// ============================================================
// --- app ---
// ============================================================

import LandingPage from "./LandingPage";
import Docs from "./Docs";
import OgImage from "./OgImage";

export default function App() {
	let [tab,setTab] = React.useState("landing");
	let [mounted,setMounted] = React.useState({ landing: true });
	let tabList = [["Welcome","landing"], ["Playground","playground"], ["Docs","docs"]];
	if (document.location.hash=="#og:image" && tab!="ogimage")
		setTab("ogimage");

	// track which tabs have been visited so they stay mounted
	React.useEffect(() => {
		if (!mounted[tab]) setMounted(m => ({ ...m, [tab]: true }));
	}, [tab]);

	let show = (id) => ({ display: tab == id ? "block" : "none", height: "100%", overflow: "hidden" });

	return <Grid layout="|?wh|.#" style={{height:"100%",position:"fixed"}} className="app">
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
			.demo-box { border-radius: 6px; padding: 8px 16px; font-size: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; min-height: 0px; height: 100%; width: 100%; }
			.c0 { background: #1e3a5f; color: #7fdbca; border: 1px solid #2a5a8f; }
			.c1 { background: #3a1e5f; color: #c792ea; border: 1px solid #5a2a8f; }
			.c2 { background: #1e5f3a; color: #c3e88d; border: 1px solid #2a8f5a; }
			.c3 { background: #5f3a1e; color: #f78c6c; border: 1px solid #8f5a2a; }
			.c4 { background: #5f1e3a; color: #ff5370; border: 1px solid #8f2a5a; }
			.c5 { background: #3a5f1e; color: #dcedc8; border: 1px solid #5a8f2a; }
			.c6 { background: #1e5f5f; color: #80cbc4; border: 1px solid #2a8f8f; }
			.c7 { background: #5f5f1e; color: #ffeb3b; border: 1px solid #8f8f2a; }
		`}</Style>
		<div style={{ padding: "12px", background: "#16213e", borderBottom: "1px solid #2a2a4a", display: "flex", alignItems: "center", gap: 8 }}>
			<svg width="28" height="28" viewBox="0 0 56 56"><path fill="#7fdbca" d=
				"m41.266 19.117l8.812-5.015c-.352-.352-.774-.633-1.289-.915l-16.523-9.42C30.813 2.946 29.406 2.5 28 2.5s-2.812.445-4.266 1.266L18.977 6.46ZM28 26.641l10.008-5.672l-22.195-12.68l-8.602 4.899c-.516.28-.937.562-1.29.914ZM29.594 53.5c.164-.047.304-.117.469-.21l18.351-10.454c2.18-1.242 3.375-2.508 3.375-5.906V18.672c0-.703-.07-1.266-.187-1.781L29.594 29.453Zm-3.188 0V29.453L4.4 16.891a7.8 7.8 0 0 0-.188 1.78V36.93c0 3.398 1.195 4.664 3.375 5.906l18.352 10.453c.164.094.304.164.468.211"
			/></svg>
			<span style={{ fontSize: 18, fontWeight: 700, color: "#7fdbca", marginRight: 8 }}>gridpack</span>
			{tabList.map(([name,tabId]) =>
				<button key={name} onClick={() => setTab(tabId)} style={{ background: "none", border: "none", color: tab==tabId ? "#7fdbca" : "#476", fontFamily: "inherit", fontSize: 14, cursor: "pointer", borderBottom: tab==tabId ? "2px solid #7fdbca" : "2px solid transparent", padding: "4px 8px" }}>{name}</button>
			)}
		</div>
		<div style={{ overflow: "hidden", height: "100%", minWidth: 0 }}>
			<div style={show("landing")}>{mounted.landing && <LandingPage onNavigate={setTab} />}</div>
			<div style={show("playground")}>{mounted.playground && <MobilePlayground />}</div>
			<div style={show("docs")}>{mounted.docs && <Docs />}</div>
			{tab == "ogimage" && <OgImage />}
		</div>
	</Grid>
}
