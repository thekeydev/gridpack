import { splitPane } from "../../src/Grid.jsx";

let Box = ({ c = 0, children, style }) => <div className={`demo-box c${c % 8}`} style={style}>{children}</div>
let boxes = (labels) => labels.map((l, i) => <Box key={i} c={i}>{l}</Box>);

export default [

	////////////////////////////////////////////////////////////////////////////////////////////////
	// Basics

	{ cat: "Basics", name: "Single Area", layout: "a", w: 200, h: 80, children: () => boxes(["A"]),
		src: '<Grid layout="a">\n\t<A/>\n</Grid>',
		guide: `
The simplest layout — a single area. The letter \`a\` in the layout string declares one area and maps it to the first child.`,
		tryThis: [
			"Add more letters: `ab`, `abc`",
			"Only one child is passed here — extra areas stay empty"
		],
	},
	{ cat: "Basics", name: "H-Stack", layout: "8", w: 400, h: 80, children: () => boxes(["A", "B", "C"]),
		src: '<Grid layout="8">\n\t<A/>\n\t<B/>\n\t<C/>\n</Grid>',
		guide: `
Three children, no explicit areas — gridpack auto-generates them. The \`8\` is the gap in pixels between children.
When you omit the legend entirely, gridpack creates one from the child count.`,
		tryThis: [
			"Change the gap: try `16` or `0`",
			"Add explicit areas: `abc 8`"
		],
	},
	{ cat: "Basics", name: "V-Stack", layout: "|8", w: 200, h: 200, children: () => boxes(["A", "B", "C"]),
		src: '<Grid layout="|8">\n\t<A/>\n\t<B/>\n\t<C/>\n</Grid>',
		guide: `
The **transpose pipe** \`|\` at the start swaps axes. Everything that was horizontal becomes vertical.
A vertical stack is literally one character away from a horizontal one.`,
		tryThis: [
			"Remove the `|` to see horizontal",
			"Try `|abc 8` with explicit areas"
		],
	},
	{ cat: "Basics", name: "Two Cols", layout: "abc", w: 300, h: 80, children: () => boxes(["A", "B"]),
		src: '<Grid layout="abc">\n\t<A/>\n\t<B/>\n</Grid>',
		guide: `
Two areas side by side. The first segment in the layout string is the **legend** — it declares which areas exist and maps them to children in order.
If you write just the legend with no rows, it doubles as a single-row layout.\n
Children mapped in the legend but not occurring in area rows won't render — gridpack assumes intent. But extra children beyond the legend are still rendered so you notice them.`,
		tryThis: [
			"Repeat chars for proportional sizing: `ab abb`",
			"Add a second row: `ab ab ab`"
		],
	},
	{ cat: "Basics", name: "Two Cols 1:2+", layout: "ab abb", w: 400, h: 100, children: () => boxes(["Narrow", "Wide"]),
		src: '<Grid layout="ab abb">\n\t<Narrow/>\n\t<Wide/>\n</Grid>',
		guide: `
Repeating area characters in map rows creates proportional columns. Here \`b\` appears twice in the second row,
so \`b\` gets 2fr and \`a\` gets 1fr. No math needed — just repeat the letter.\n
That's typed fast but even faster is char + number. That repeats the char.`,
		tryThis: [
			"Try `ab aab` to make A wider",
			"Try `ab abbb` for 1:3 ratio",
			"Try `ab ab3` for 1:3 ratio too",
			"Try `ab a2b3` for equal (2:3)"
		],
	},
	{ cat: "Basics", name: "Two Cols Sized", layout: "ab ab | 100 200", w: 400, h: 100, children: () => boxes(["A", "B"]),
		src: '<Grid layout="ab ab | 100 200">\n\t<A/>\n\t<B/>\n</Grid>',
		guide: `
The **pipe separator** \`|\` introduces explicit column sizes. Numbers are pixels.
\`#\` means \`1fr\` (fractional). \`.\` means \`auto\`. This translates directly to \`grid-template-columns\`.\n
A second pipe \`||\` would set row sizes. If transpose \`|\` is active, the axes are swapped accordingly.`,
		tryThis: [
			"Try `| 100 #` — second col fills remaining space",
			"Try `| # #` — equal fractions",
			"Add row sizes: `| 100 200 | 50`"
		],
	},
	{ cat: "Basics", name: "Centered Card", layout: "c .c. 16", w: 400, h: 200, children: () => boxes(["Card"]),
		src: '<Grid layout="c .c. 16">\n\t<Card/>\n</Grid>',
		guide: `
The dot \`.\` in area rows marks empty cells. Here the card area \`c\` is surrounded by empty cells on both sides, centering it. The \`16\` is the gap.`,
		tryThis: [
			"Try `c ..c.. 16` for more padding",
			"Try `c .c. .c. 16` to see 2 rows"
		],
	},
	{ cat: "Basics", name: "Empty Corners", layout: "hf h. .f 8", w: 300, h: 200, children: () => boxes(["Header", "Footer"]),
		src: '<Grid layout="hf h. .f 8">\n\t<Header/>\n\t<Footer/>\n</Grid>',
		guide: `
Areas can span multiple rows/columns by appearing in multiple cells. Here \`h\` spans the top-left and \`f\` spans the bottom-right,
leaving diagonal corners empty.\n
**Uppercase letters** in the legend make areas grow (their tracks become \`1fr\`). Try making one area grow!`,
		tryThis: [
			"Try `Hf h. .f 8` — header grows horizontally",
			"Try `hF h. .f 8` — footer grows",
			"Try explicit sizes: `| .# | #.`",
			"Swap axes: `| hf h. .f 8`",
			"Swap children: `| fh h. .f 8`",
			"To the max: `| hf hh. .ff ?wh | ..# | #..`"
		],
	},

	////////////////////////////////////////////////////////////////////////////////////////////////
	// Layouts

	{ cat: "Layouts", name: "Page Layout (basic)", layout: "hsCf hhhh sccc sfff 8", w: 500, h: 300,
		children: () => boxes(["Header", "Sidebar", "Content", "Footer"]),
		src: '<Grid layout="hsCf hhhh sccc sfff 8">\n\t<Header/>\n\t<Sidebar/>\n\t<Content/>\n\t<Footer/>\n</Grid>',
		guide: `
A classic layout. The legend \`hsCf\` declares four areas — \`C\` is uppercase so it grows. The three rows describe where each area sits:
header spans the full width, sidebar is narrow, content fills the rest, footer spans the bottom.\n
This is what would normally take 12+ lines of CSS.`,
		tryThis: [
			"Remove the uppercase: `hscf` — watch areas shrink to content",
			"Change proportions: try `hsCf h6 sc5 sf5 8`",
			"Try comma separators: `hsCf, h4 sccc sfff, 8`"
		],
	},
	{ cat: "Layouts", name: "Page Layout (advanced)", layout: "hs(S)Cf(e) hh sc sf 8 | 100# | .#.", w: 500, h: 300,
		children: () => boxes(["Header", "Sidebar", "Content", "Footer"]),
		src: '<Grid layout="hs(S)Cf(e) hh sc sf 8 | 100# | .#.">\n\t<Header/>\n\t<Sidebar/>\n\t<Content/>\n\t<Footer/>\n</Grid>',
		guide: `
Same layout but with per-area alignment and explicit sizes.\n
\`s(S)\` aligns the sidebar to the top (align-self: start). \`f(e)\` pushes footer to the end.
Column sizes \`100#\` = 100px + 1fr. Row sizes \`.#.\` = auto, 1fr, auto.\n
Alignment section below will talk about this.`,
		tryThis: [
			"Try `s(cC)` to center sidebar both ways",
			"Try `| 200# | 60#60`"
		],
	},
	{ cat: "Layouts", name: "Sidebar + Main (vars)", layout: "sM | {w}#", w: 500, h: 250, vars: { w: 250 },
		children: () => boxes(["Sidebar", "Main"]),
		params: [{ key: "w", label: "sidebar", type: "range", min: 80, max: 400, def: 250 }],
		src: '<Grid layout="sM | {w}#"\n vars={{ w: 250 }}>\n\t<Sidebar/>\n\t<Main/>\n</Grid>',
		guide: `
**Template variables** let you inject dynamic values into the layout string. \`{w}\` is replaced with
the value from the \`vars\` prop before parsing.\n
This is the foundation that all extensions build on — they read and write variables to control layout interactively.`,
		tryThis: [
			"Drag the slider to resize",
			"The layout string stays the same — only the variable changes"
		],
	},
	{ cat: "Layouts", name: "Dashboard (sneak👀)", layout: "hnsCaf hhh nss nca fff 8 | {nav}#{aside} | 40 40#{footer}", w: 600, h: 350,
		vars: { nav: 100, aside: 100, footer: 80 },
		ext: () => [
			splitPane({ var: "nav", edge: "n:r", min: 50, max: 300 }),
			splitPane({ var: "aside", edge: "a:L", min: 50, max: 300 }),
			splitPane({ var: "footer", edge: "f:T", axis: "y", min: 50, max: 300 })
		],
		children: () => boxes(["Header", "Nav", "Stats", "Content", "Aside", "Footer"]),
		info: "Drag edges to resize",
		src: `
<Grid layout="hnsCaf hhh nss nca fff 8 | {nav}#{aside} | 40 40#{footer}"
	vars={v} onVarsChange={setV}
	extensions={[
		splitPane({ var: "nav", edge: "n:e" }),
		splitPane({ var: "aside", edge: "a:s" }),
		splitPane({ var: "footer", edge: "f:s", axis: "y" }),
	]}>
	...
</Grid>`,
		guide: `
Variables + extensions in action. Three split panes control nav width, aside width, and footer height —
all draggable. The layout string uses \`{nav}\`, \`{aside}\`, and \`{footer}\` as template variables.\n
This is one component, one layout string, zero wrapper divs.`,
		tryThis: [
			"Drag the edges between panels to resize",
			"All three dimensions are independently adjustable"
		],
	},

	////////////////////////////////////////////////////////////////////////////////////////////////
	// Alignment

	{ cat: "Alignment", name: "Full Width", layout: "ab ?w 8", w: 400, h: 80, children: () => boxes(["A", "B"]),
		src: '<Grid layout="ab ?w 8">\n\t<A/>\n\t<B/>\n</Grid>',
		guide: `
The \`?\` prefix introduces **flags**. \`?w\` forces the grid to fill the container width — children stretch
horizontally without needing uppercase grow letters.`,
		tryThis: [
			"Add `h` to fill height too: `ab ?wh 8`",
			"Remove `?w` to see default sizing"
		],
	},
	{ cat: "Alignment", name: "Full Both", layout: "ab ?wh 8", w: 400, h: 200, children: () => boxes(["A", "B"]),
		src: '<Grid layout="ab ?wh 8">\n\t<A/>\n\t<B/>\n</Grid>',
		guide: `
\`?wh\` fills both width and height. The children stretch to fill their cells.
But what if you want the space without the stretching? That's where alignment flags come in.`,
		tryThis: [
			"Add center: `ab ?whcC 8`",
			"Try just centering horizontally: `ab ?whc 8`"
		],
	},
	{ cat: "Alignment", name: "Center Both (justify)", layout: "abc ?whcC", w: 400, h: 200, children: () => boxes(["A", "B", "C"]),
		src: '<Grid layout="abc ?whcC">\n\t<A/>\n\t<B/>\n\t<C/>\n</Grid>',
		guide: `
Alignment flags: lowercase controls the horizontal axis (justify-content), uppercase controls the vertical axis (align-content).\n
Mnemonic: **SECBAG** — Start, End, Center, Borders (space-between), Around (space-around), Gaps (space-evenly).\n
\`?cC\` = center both axes.\n
Lowercase is main axis. Uppercase is cross axis.`,
		tryThis: [
			"Try typing `?whb`,`?whba`,`?whbag` for space-between/around/evenly",
			"Try `?wheE` for end horizontal and vertical, e.g. dialog buttons"
		],
	},
//	{ cat: "Alignment", name: "Space Evenly", layout: "abc ?whg", w: 400, h: 100, children: () => boxes(["A", "B", "C"]) },
//	{ cat: "Alignment", name: "Space Between", layout: "abc ?wb", w: 400, h: 80, children: () => boxes(["A", "B", "C"]) },
	{ cat: "Alignment", name: "Per-Area", layout: "a(e)b(s)c(cC) abc ?wh", w: 400, h: 200,
		children: () => boxes(["end", "start", "center"]),
		src: '<Grid layout="a(e)b(s)c(cC) abc ?wh">\n\t<End/>\n\t<Start/>\n\t<Center/>\n</Grid>',
		guide: `
Alignment can also be set **per area** using parentheses after the area letter in the legend.
Lowercase \`s/e/c\` controls justify-self, uppercase \`S/E/C\` controls align-self.\n
\`a(e)\` = area a pushed to end. \`c(cC)\` = area c centered on both axes.`,
		tryThis: [
			"Try `a(cC)b(cC)c(cC)` to center everything",
			"Try `a(sS)b(eE)c(cC) acb ?wh` for diagonal",
			"Try `a(sS)b(eE)c(cC) acab ?wh` for fun"
		],
	},

	////////////////////////////////////////////////////////////////////////////////////////////////
	// Sizing

	{ cat: "Sizing", name: "Faked Minmax", layout: "hnMsf hhhh nnnn ssmm ffff 12 6 | 100## 200 | 48 48#40", w: 550, h: 300,
		children: () => boxes(["Header", "Nav", "Main", "Sidebar", "Footer"]),
		src: '<Grid layout="hnMsf hhhh nnnn ssmm ffff 12 6 | 100## 300 | 48 48#40">\n\t...\n</Grid>',
		guide: `
A more complex layout showing explicit sizing on both axes. Column sizes \`100## 200\` = 100px, 1fr, 1fr, 200px.
Row sizes \`48 48#40\` = 48px, 48px, 1fr, 40px. The gap is \`12 6\` (12px row gap, 6px col gap).`,
		tryThis: [
			"Change col sizes: `| 200# 200`",
			"Change row gap: try `8 8`"
		],
	},
	{ cat: "Sizing", name: "Minmax Sidebar", layout: "sc 8 ?w | 100~200 #", w: 500, h: 200,
		children: () => boxes(["Sidebar", "Content"]), info: "Resize container — sidebar clamps",
		src: '<Grid layout="sc 8 ?w | 100~300 #">\n\t<Sidebar/>\n\t<Content/>\n</Grid>',
		guide: `
The **tilde** \`~\` creates a \`minmax()\` size. \`100~200\` becomes \`minmax(100px, 200px)\`.
The sidebar will never be smaller than 100px or larger than 300px, even as the container resizes.\n
You can mix any size types: \`100~#\` = minmax(100px, 1fr), \`.~300\` = minmax(auto, 300px).`,
		tryThis: [
			"Resize the dashed container border to see clamping",
			"Try `200~400` for a wider range","Try `100~# #` — sidebar grows with 1fr max"
		],
	},
	{ cat: "Sizing", name: "Minmax Responsive", layout: "abc | 100~# 100~# 100~#", w: 500, h: 150,
		children: () => boxes(["A", "B", "C"]), info: "Resize container — cols min width",
		src: '<Grid layout="abc | 100~# 100~# 100~#">\n\t<A/>\n\t<B/>\n\t<C/>\n</Grid>',
		guide: `
All three columns use \`100~#\` = minmax(100px, 1fr). They share space equally but never go below 100px each.
A simple way to make columns responsive without breakpoints.`,
		tryThis: [
			"Resize the container to see the minimum kick in",
			"Try different minimums: `50~#`, `200~#`"
		],
	},
	{ cat: "Sizing", name: "Size Repeat", layout: "abcdef | 50 # *", w: 500, h: 120,
		children: () => boxes(["A", "B", "C"]), info: "Resize container — widths repeated",
		src: '<Grid layout="abcdef | 50 # *">\n\t<A/>\n\t<B/>\n\t<C/>\n</Grid>',
		guide: `
Sizes can be repeated with **wildcard** \`*\`. Useful for single values, patterns or auto-flow - see below.\n
Here \`50 # *\` with 6 columns becomes \`50px 1fr 50px 1fr 50px 1fr\` — the pattern cycles to fill all tracks.`,
		tryThis: [
			"Resize the container to see sizes w/ debug grid overlay",
			"Try: `50#*` — `.`, `#` and `*` don't need space/separators",
			"Try single values like `50*`, `.*`, `#*`",
			"Try with minmax: `150~#*`"
		],
	},

	////////////////////////////////////////////////////////////////////////////////////////////////
	// Responsive

	{ cat: "Responsive", name: "Sidebar Collapse", layout: "|sc ?w 8", w: 500, h: 250,
		sm: "sC sc 8 | 200#",
		children: () => boxes(["Sidebar", "Content"]),
		info: "Below md: stacked. Above: side by side",
		src: '<Grid layout="|sc ?w 8" sm="sC sc 8 | 200#">\n\t<Sidebar/>\n\t<Content/>\n</Grid>',
		guide: `
Because each layout is just a short string, **responsive design is trivial** — write a different string per breakpoint.
No media query blocks, no duplicate CSS, no overrides.\n
Here the base layout stacks vertically. At \`sm\` (576px+) it switches to side-by-side with a 200px sidebar.`,
		tryThis: [
			"Resize the dashed container to trigger the breakpoint",
			"The sm prop is a completely independent layout string"
		],
	},
	{ cat: "Responsive", name: "Article Layout", layout: "|hnCf 4", w: 600, h: 350,
		sm: "hnCf hhhh nccc ffff 8 | 150###",
		md: "hnCf hhhh nccc nccc ffff 16 | 200###",
		children: () => boxes(["Header", "Nav", "Content", "Footer"]),
		info: "xs: stacked, md: 4-col, lg: sidebar nav",
		src: '<Grid layout="|hnCf 4"\n\tsm="hnCf hhhh nccc ffff 8 | 150###"\n\tmd="hnCf hhhh nccc nccc ffff 16 | 200###">\n\t...\n</Grid>',
		guide: `
Three breakpoints, three completely different layouts — all from short strings.
At mobile it's a vertical stack, at tablet it's 4-column, at desktop the nav becomes a persistent sidebar spanning two rows.`,
		tryThis: [
			"Resize the container through all three breakpoints"
		],
	},
	{ cat: "Responsive", name: "Stack → 2col → 3col", layout: "|abc ?w 8", w: 600, h: 200,
		sm: "ab aab ?w 8", md: "abc ?w 8",
		children: () => boxes(["A", "B", "C"]),
		info: "Resize container to see layout switch",
		src: '<Grid layout="|abc ?w 8" sm="ab aab ?w 8" md="abc ?w 8">\n\t<A/>\n\t<B/>\n\t<C/>\n</Grid>',
		guide: `
A progressive enhancement pattern: single column on mobile, 2 columns with A wider at tablet, 3 equal columns at desktop.
Each breakpoint is its own complete layout string — no inheritance, no overrides.`,
		tryThis: [
			"Resize the container slowly to see all three states",
			"Notice the 2-col layout uses `aab` to make A twice as wide"
		],
	},
	{ cat: "Responsive", name: "Product Grid (w/ repeat)", layout: "|* ?w 4", w: 600, h: 300,
		sm: "ab ab* ?w 4", md: "abc abc* ?w 4",
		children: (v, p) => { let n = p?.n || 6; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>Product {i+1}</Box>); },
		params: [{ key: "n", label: "children", type: "range", min: 1, max: 12, def: 6 }],
		info: "xs: 1 col, sm: 2 cols, lg: 3 cols",
		src: '<Grid layout="|* ?w 4"\n\tsm="ab ab* ?w 4"\n\tmd="abc abc* ?w 4">\n\t{products}\n</Grid>',
		guide: `
Responsive + repeat combined. At mobile: single column stack. At tablet: 2-column grid. At desktop: 3-column grid.
The \`*\` in \`ab*\` means the row repeats for however many children you have.`,
		tryThis: [
			"Drag the children slider to add/remove products",
			"Resize the container to switch column counts"
		],
	},

	////////////////////////////////////////////////////////////////////////////////////////////////
	// Repeat

	{ cat: "Repeat", name: "* Auto", layout: "* 8 | 40 80 120", w: 400, h: 80,
		children: (v, p) => { let n = p?.n || 3; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>{String.fromCharCode(65+i)}</Box>); },
		params: [{ key: "n", label: "children", type: "range", min: 1, max: 8, def: 3 }],
		src: '<Grid layout="* 8 | 40 80 120">\n\t{children}\n</Grid>',
		guide: `
The lone \`*\` is the auto-legend wildcard — gridpack generates area names from the child count.
Mostly optional since an empty legend does the same, but useful when you need the \`|\` pipe for sizes
without it being interpreted as transpose.\n
Here \`| 40 80 120\` sets explicit column widths.`,
		tryThis: [
			"Add more children with the slider — extra ones get auto-sized",
			"Remove `*` and just use `8 | 40 80 120`",
			"Compare `*| 40 80 120` vs. `|| 40 80 120`"
		],
	},
	{ cat: "Repeat", name: "| Auto", layout: "| 8", w: 200, h: 250,
		children: (v, p) => { let n = p?.n || 4; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>{String.fromCharCode(65+i)}</Box>); },
		params: [{ key: "n", label: "children", type: "range", min: 1, max: 8, def: 4 }],
		src: '<Grid layout="| 8">\n\t{children}\n</Grid>',
		guide: `
Transpose + auto-legend. The \`|\` swaps axes so children stack vertically.
The empty legend plus empty areas auto-recognize children. You don't even need the \`*\` here.`,
		tryThis: [
			"Add/remove children with the slider",
			"Try `|* 8` — same result, explicit wildcard"
		],
	},
	{ cat: "Repeat", name: "*N Grid", layout: "*4 4 ?w", w: 400,
		children: (v, p) => { let n = p?.n || 8; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>{i+1}</Box>); },
		params: [{ key: "n", label: "children", type: "range", min: 1, max: 16, def: 8 }],
		src: '<Grid layout="*4 4 ?w">\n\t{items}\n</Grid>',
		guide: `
Suffix `*` with a number N to create an **N-column auto-flow grid**. Children wrap to new rows automatically.
Add more children with the slider — rows appear on their own.\n
Swap axes with \`|*4\` and you get automatic columns instead of rows.`,
		tryThis: [
			"Drag the slider to add children — rows auto-expand",
			"Try `*3`, `*5`, `*6` for different column counts",
			"Try `|*4` to swap to column flow"
		],
	},
	{ cat: "Repeat", name: "Form 2-Col", layout: "habf hh ab* ff 8 | .#", w: 400,
		children: (v, p) => {
			let n = p?.rows || 3; return [
				<Box key="h" c={0}>Header</Box>, <Box key="f" c={3}>Footer</Box>,
				...Array.from({ length: n }, (_, i) => [
					<Box key={`l${i}`} c={1}>Label {i+1}</Box>, <Box key={`v${i}`} c={2}>Input {i+1}</Box>]
				).flat()
			];
		},
		params: [{ key: "rows", label: "rows", type: "range", min: 1, max: 8, def: 3 }],
		src: `
<Grid layout="habf hh ab* ff 8 | .#">
	<Header/>
	<Footer/>
	{fields.map(f => <><Label/><Input/></>)}
</Grid>`,
		guide: `
The **repeat row** \`ab*\` is the really powerful part. The \`*\` suffix on a row means "repeat this row for remaining children."
Header and footer stay pinned — only the form rows multiply.\n
Try doing this with pure CSS grid — you'd need JavaScript to dynamically generate \`grid-template-areas\`. Here it's just two characters: \`ab*\`.`,
		tryThis: [
			"Drag the rows slider — layout adapts dynamically",
			"The header and footer stay put, only form rows repeat"
		],
	},
	{ cat: "Repeat", name: "Pinned Sidebar", layout: "sah sh Sa* 8 | {sw}# | 50", w: 400, h: 260, vars: { sw: 120 },
		children: (v, p) => {
			let n = p?.items || 4; return [
				<Box key="h" c={0}>Header</Box>, <Box key="s" c={1}>Sidebar</Box>,
				...Array.from({ length: n }, (_, i) => <Box key={`i${i}`} c={2+i}>Item {i+1}</Box>)
			];
		},
		params: [{ key: "sw", label: "sidebar", type: "range", min: 60, max: 250, def: 120 }, { key: "items", label: "items", type: "range", min: 1, max: 8, def: 4 }],
		src: '<Grid layout="sah sh Sa* 8 | {sw}# | 50">\n\t<Header/>\n\t<Sidebar/>\n\t{items.map(i => <Item/>)}\n</Grid>',
		guide: `
**Uppercase letters in a repeat row are pinned** — they don't get numbered and span all repetitions.
The sidebar \`S\` (uppercase in \`Sa*\`) is one continuous area while content items multiply next to it.\n
One capital letter replaces what would normally require complex \`grid-row\` spanning.`,
		tryThis: [
			"Add items with the slider — sidebar spans them all",
			"Adjust sidebar width with the other slider",
			"Try butterfly `sah SaH* 8 ?wc | {sw}.{sw}`"
		],
	},
	{ cat: "Repeat", name: "Card Grid", layout: "abc aabc* 4 | ####", w: 450,
		children: (v, p) => {
			let n = p?.cards || 6;
			return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>Card {i+1}</Box>);
		},
		params: [{ key: "cards", label: "cards", type: "range", min: 3, max: 12, def: 6 }],
		src: '<Grid layout="abc aabc* 4 | ####">\n\t{cards}\n</Grid>',
		guide: `
A card grid with the first card spanning 2 columns (\`aabc\` — \`a\` repeated twice).
Subsequent rows repeat via \`*\`. The proportional sizing \`aabc\` makes the first card wider while keeping a clean grid.`,
		tryThis: [
			"Add more cards with the slider",
			"Try `abc abc* 4 | ###` for equal cards"
		],
	},
	{ cat: "Repeat", name: "List", layout: "a a* 4 ?w", w: 300,
		children: (v, p) => { let n = p?.items || 5; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>Item {i+1}</Box>); },
		params: [{ key: "items", label: "items", type: "range", min: 1, max: 10, def: 5 }],
		src: '<Grid layout="a a* 4 ?w">\n\t{items}\n</Grid>',
		guide: `
The simplest repeat pattern — a single-column list. \`a a*\` declares one area per row,
repeating for however many children you have. \`?w\` fills the container width.`,
		tryThis: [
			"Add items with the slider",
			"This is essentially a styled vertical list"
		],
	},

];
