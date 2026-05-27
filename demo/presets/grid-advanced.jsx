import { scrollable } from "../../src/Grid.jsx";

let Box = ({ c = 0, children, style }) => <div className={`demo-box c${c % 8}`} style={style}>{children}</div>
let boxes = (labels) => labels.map((l, i) => <Box key={i} c={i}>{l}</Box>);
let loremItems = (n) => Array.from({ length: n }, (_, i) =>
	<div key={i} style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 12, color: "#888" }}>Item {i + 1} — Lorem ipsum dolor sit amet</div>);

export default [

	////////////////////////////////////////////////////////////////////////////////////////////////
	// Auto-Flow

	{ cat: "Auto-Flow", name: "Basic Grid", layout: "*4 4 ?wh", w: 400, h: 200,
		children: (v, p) => { let n = p?.n || 8; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>{i + 1}</Box>); },
		params: [{ key: "n", label: "children", type: "range", min: 1, max: 16, def: 8 }],
		info: "Auto-flow grid, 4 columns",
		src: '<Grid layout="*4 4 ?wh">\n\t{items.map(i => <Card/>)}\n</Grid>',
		guide: "Auto-flow mode uses CSS `grid-auto-flow` instead of `grid-template-areas`. Children are placed automatically in a 4-column grid. No area names needed — just a column count.",
		tryThis: [
			"Add children with the slider",
			"Try `*3` or `*6` for different column counts"
		],
	},
	{ cat: "Auto-Flow", name: "Column Flow", layout: "*3 4 ?whf", w: 400, h: 250,
		children: (v, p) => { let n = p?.n || 9; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>{i + 1}</Box>); },
		params: [{ key: "n", label: "children", type: "range", min: 1, max: 12, def: 9 }],
		info: "?f reverses flow: fills top → bottom, left → right",
		src: '<Grid layout="*3 4 ?whf">\n\t{items}\n</Grid>',
		guide: "The `?f` flag reverses auto-flow direction. Instead of filling left → right then top → bottom (row flow), children fill top → bottom then left → right (column flow).",
		tryThis: [
			"Remove `f` from `?whf` to see normal row flow",
			"Compare the numbering order"
		],
	},
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
		tryThis: [
			"Remove `F` from `?wF` to see gaps appear",
			"Notice how smaller items fill in the holes with dense mode"
		],
	},
	{ cat: "Auto-Flow", name: "Transpose |*N", layout: "|*3 4 ?wh", w: 400, h: 250,
		children: (v, p) => { let n = p?.n || 9; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>{i + 1}</Box>); },
		params: [{ key: "n", label: "children", type: "range", min: 1, max: 12, def: 9 }],
		info: "| transposes: 3 rows, children flow as columns",
		src: '<Grid layout="|*3 4 ?wh">\n\t{items}\n</Grid>',
		guide: "Transpose works with auto-flow too. `|*3` means 3 rows (not columns), and children flow column-first. The `|` swaps everything — axes, sizes, flow direction.",
		tryThis: [
			"Remove `|` to see normal 3-column row flow",
			"Compare numbering order with the Column Flow preset"
		],
	},
	{ cat: "Auto-Flow", name: "Size Repeat *", layout: "*6 4 ?wh | 50 # *", w: 500, h: 200,
		children: (v, p) => { let n = p?.n || 12; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>{i + 1}</Box>); },
		params: [{ key: "n", label: "children", type: "range", min: 1, max: 18, def: 12 }],
		info: "Trailing * cycles col sizes: 50px # 50px # 50px #",
		src: '<Grid layout="*6 4 ?wh | 50 # *">\n\t{items}\n</Grid>',
		guide: "A trailing `*` in the sizes section means \"cycle these sizes to fill all tracks.\" Here `50 # *` with 6 columns becomes `50px 1fr 50px 1fr 50px 1fr` — alternating fixed and flexible.",
		tryThis: [
			"The pattern `80 #` repeats across all 6 columns",
			"Try `| 60 # # *` for a different cycle pattern"
		],
	},
	{ cat: "Auto-Flow", name: "Auto-Fill", layout: "* 6 ?w | *150~#", w: 500, h: 200,
		children: (v, p) => { let n = p?.n || 8; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>{i + 1}</Box>); },
		params: [{ key: "n", label: "children", type: "range", min: 1, max: 16, def: 8 }],
		info: "Leading * on sizes = auto-fill — column count adapts to width",
		src: '<Grid layout="* 6 ?w | *150~#">\n\t{items}\n</Grid>',
		guide: "A leading `*` on the sizes segment enables `repeat(auto-fill, ...)`. Here `*150~#` becomes `repeat(auto-fill, minmax(150px, 1fr))` — the browser creates as many columns as fit, each at least 150px wide.\n\nNo fixed column count needed — `*` alone in the main segment means auto-flow with the count determined by auto-fill.",
		tryThis: [
			"Resize the preview to see columns appear and disappear",
			"Reduce children to 2-3 and notice empty tracks still hold space"
		],
	},
	{ cat: "Auto-Flow", name: "Auto-Fit", layout: "* 6 ?w | *150~#*", w: 500, h: 200,
		children: (v, p) => { let n = p?.n || 3; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>{i + 1}</Box>); },
		params: [{ key: "n", label: "children", type: "range", min: 1, max: 12, def: 3 }],
		info: "Both * = auto-fit — empty tracks collapse, items stretch",
		src: '<Grid layout="* 6 ?w | *150~#*">\n\t{items}\n</Grid>',
		guide: "Adding a trailing `*` alongside the leading `*` switches from auto-fill to auto-fit: `*150~#*` becomes `repeat(auto-fit, minmax(150px, 1fr))`.\n\nThe difference: with few items, auto-fill keeps empty tracks (holding space), while auto-fit collapses them to 0 so items stretch to fill the row. Try the slider — with 3 items they stretch wide, unlike auto-fill.",
		tryThis: [
			"Compare with the Auto-Fill preset at 3 children — items stretch here",
			"Add more children to see auto-fit wrap to multiple rows",
			"The trailing `*` is the auto-fit signal — remove it to get auto-fill"
		],
	},
	{ cat: "Auto-Flow", name: "Alternating Rows", layout: "*3 4 ?wh || 40 80 *", w: 400, h: 280,
		children: (v, p) => { let n = p?.n || 12; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>{i + 1}</Box>); },
		params: [{ key: "n", label: "children", type: "range", min: 1, max: 18, def: 12 }],
		info: "Row sizes cycle: 40px 80px 40px 80px ...",
		src: '<Grid layout="*3 4 ?wh || 40 80 *">\n\t{items}\n</Grid>',
		guide: "Size cycling works on rows too. `|| 40 80 *` makes rows alternate between 40px and 80px heights. The double-pipe `||` skips column sizes and goes straight to row sizes.",
		tryThis: [
			"Notice the alternating row heights",
			"Add children to see the pattern continue"
		],
	},
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
		tryThis: [
			"Notice how different cards have different widths",
			"This combines auto-flow with per-child styling"
		],
	},
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
		tryThis: [
			"Scroll each panel independently",
			"This is auto-flow but with per-area behavior"
		],
	},

	////////////////////////////////////////////////////////////////////////////////////////////////
	// Overlap

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
		tryThis: [
			"The photo spans rows 1-2, cols 1-2",
			"The quote spans rows 2-3, cols 2-4",
			"They overlap at row 2, col 2"
		],
	},
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
		tryThis: [
			"Compare with the [] version above",
			"Each layer shows one area's footprint clearly",
			"The `+` splits the two layers"
		],
	},
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
		tryThis: [
			"Try `i[1:3,1:3,10]` to add z-index",
			"Try `i(cC)[1:3,1:3]` to center the photo",
			"Negative lines work: `i[1:-1,1:-1]` spans full grid"
		],
	},
	{ cat: "Overlap", name: "Callout Card", layout: "qit ... qqq qqq + ..iii ..iii ttt | {o}#{o}#{o} | {o}#{o}", w: 550, h: 220,
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
		params: [{ key: "o", label: "off", type: "range", min: 0, max: 100, def: 25 }],
		src: '<Grid layout="qit\n\t..iii ..iii ttt\n\t+ ... qqq.. qqq\n\t| 25 # 25 # 25 | 25 # 25">\n\t<Content/>\n\t<Image/>\n\t<Accent/>\n</Grid>',
		guide: "A complex **three-layer overlap**. Content panel (`q`) spans the left 3 cols, image (`i`) spans the right 3 cols, accent bar (`t`) sits at the bottom across all 5 cols. Each layer is drawn separately with `+`, and the parser auto-detects where they overlap.\n\nAll three areas get explicit `grid-column`/`grid-row` placement — the normal template-areas map becomes all dots.",
		tryThis: [
			"Three layers separated by `+`",
			"q and i overlap in the middle column",
			"t overlaps with both at the bottom row"
		],
	},

];
