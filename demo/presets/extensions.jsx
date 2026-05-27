import {
	debug, accordion, collapsible, splitPane, scrollable, animate, overlay, tabs, multiColumn, fisheye, render, masonry
} from "../../src/Grid.jsx";

let Box = ({ c = 0, children, style }) => <div className={`demo-box c${c % 8}`} style={style}>{children}</div>
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

export default [

	////////////////////////////////////////////////////////////////////////////////////////////////
	// Extensions

	{ cat: "Extensions", name: "Split Pane", layout: "sC | {w}#", w: 500, h: 280, vars: { w: 200 },
		ext: () => [splitPane({ var: "w", edge: "s:r", min: 80, max: 400 })],
		children: () => boxes(["Sidebar", "Content"]), info: "Drag the edge",
		src: '<Grid layout="sC | {w}#"\n\tvars={v} onVarsChange={setV}\n\textensions={[\n\t\tsplitPane({ var: "w", edge: "s:r",\n\t\t\tmin: 80, max: 400 })\n\t]}\n>\n\t<Sidebar/>\n\t<Content/>\n</Grid>',
		guide: `
Extensions add **behavior** to layouts. They're composable — stack them in an array.\n
\`splitPane\` creates a draggable handle. It writes back to the \`{w}\` variable, the layout re-renders, and the grid updates.
The \`edge\` syntax \`s:r\` means "right edge of area s."\n
This is the pattern all extensions follow: inject behavior without changing how you write layouts.`,
		tryThis: [
			"Drag the edge between sidebar and content",
			"Min/max constraints are built in (80-400px here)"
		],
	},
	{ cat: "Extensions", name: "Collapsible", layout: "sC | {sb}#", w: 500, h: 250, vars: { sb: 200 },
		ext: () => [collapsible({ var: "sb", area: "s", expanded: 200, collapsed: 0 })],
		children: (v) => [<Box key="s" c={1}>{(v.sb||0) > 0 ? "Sidebar" : ""}</Box>, <Box key="c" c={2}>Content</Box>],
		info: "Click arrow",
		src: '<Grid layout="sC | {sb}#"\n\tvars={v} onVarsChange={setV}\n\textensions={[\n\t\tcollapsible({ var: "sb", area: "s",\n\t\t\texpanded: 200, collapsed: 0 })\n\t]}\n>\n\t...\n</Grid>',
		guide: "Same idea as split pane but simpler: click the arrow to toggle. The sidebar collapses to zero and expands back to 200px. One variable, one extension.",
		tryThis: [
			"Click the collapse arrow to toggle",
			"Notice the content area fills the freed space"
		],
	},
	{ cat: "Extensions", name: "Animate", layout: "sC | {w}#", w: 500, h: 200, vars: { w: 200 },
		ext: () => [animate({ duration: "0.6s" })], children: () => boxes(["Sidebar", "Content"]),
		params: [{ key: "w", label: "sidebar", type: "toggle", on: 400, off: 200 }],
		src: '<Grid layout="sC | {w}#"\n\textensions={[animate({ duration: "0.6s" })]}>\n\t...\n</Grid>',
		guide: "The `animate` extension adds CSS transitions to grid track changes. Toggle the sidebar width — it glides instead of snapping. One line: `animate({ duration: \"0.6s\" })`.\n\nIt composes with any other extension.",
		tryThis: [
			"Toggle the sidebar checkbox — watch the smooth transition",
			"This composes with splitPane, collapsible, etc."
		],
	},
	{ cat: "Extensions", name: "Animated Collapsible", layout: "sC | {sb}#", w: 500, h: 250, vars: { sb: 200 },
		ext: () => [animate({ duration: "0.2s" }), collapsible({ var: "sb", area: "s", expanded: 200, collapsed: 0 })],
		children: (v) => [<Box key="s" c={1}>{(v.sb||0) > 0 ? "Sidebar" : ""}</Box>, <Box key="c" c={2}>Content</Box>],
		info: "Click arrow",
		src: '<Grid layout="sC | {sb}#"\n\textensions={[\n\t\tanimate({ duration: "0.2s" }),\n\t\tcollapsible({ var: "sb", area: "s",\n\t\t\texpanded: 200, collapsed: 0 })\n\t]}\n>\n\t...\n</Grid>',
		guide: "Extensions compose naturally. Here `animate` + `collapsible` together create a smooth collapse/expand animation. Just two entries in the extensions array.",
		tryThis: [
			"Click the arrow — smooth animated collapse",
			"Compare with the non-animated Collapsible preset"
		],
	},
	{ cat: "Extensions", name: "Accordion", layout: "| abc 8 | {a} {b} {c}", w: 400, h: 300, vars: { active: "a", a: "#", b: ".", c: "." },
		ext: () => [accordion({ var: "active", collapsed: ".", items: [{ area: "a", sizeVar: "a", expanded: "#" }, { area: "b", sizeVar: "b", expanded: "#" }, { area: "c", sizeVar: "c", expanded: "#" }] })],
		children: () => boxes(["Section A", "Section B", "Section C"]), info: "Click headers",
		src: '<Grid layout="| abc 8 | {a} {b} {c}"\n\textensions={[\n\t\taccordion({ var: "active", collapsed: ".", items: [\n\t\t\t{ area: "a", sizeVar: "a", expanded: "#" },\n\t\t\t{ area: "b", sizeVar: "b", expanded: "#" },\n\t\t\t{ area: "c", sizeVar: "c", expanded: "#" },\n\t\t] })\n\t]}\n>\n\t...\n</Grid>',
		guide: "Mutual exclusion: expanding one section collapses the others. The layout uses variables for row sizes — `.` (auto/collapsed) and `#` (1fr/expanded). The accordion extension manages which section gets which value.",
		tryThis: [
			"Click each section header to expand it",
			"Notice the others collapse automatically"
		],
	},
	{ cat: "Extensions", name: "Scrollable", layout: "hscf hhh scc sff 8 | {sb}# | 40#40", w: 500, h: 350, vars: { sb: 100 },
		ext: () => [scrollable({ area: ["s", "c"] }), splitPane({ var: "sb", edge: "s:r", min: 50, max: 300 })],
		children: () => [
			<Box key="h" c={0}>Header</Box>,
			<div key="s" style={{ background: "#1a1a2e" }}>
				<div style={{ padding: 8, fontSize: 11, color: "#c792ea", borderBottom: "1px solid #2a2a4a" }}>Sidebar</div>
				{loremItems(12)}
			</div>,
			<div key="c" style={{ background: "#1a1a2e" }}>
				<div style={{ padding: 8, fontSize: 11, color: "#c3e88d", borderBottom: "1px solid #2a2a4a" }}>Content</div>
				{loremItems(20)}
			</div>,
			<Box key="f" c={3}>Footer</Box>
		],
		src: '<Grid layout="hscf hhh scc sff 8 | {sb}# | 40#40"\n\textensions={[\n\t\tscrollable({ area: ["s", "c"] }),\n\t\tsplitPane({ var: "sb", edge: "s:r" })\n\t]}\n>\n\t...\n</Grid>',
		guide: "Fixed header and footer with independently scrollable sidebar and content — a very common layout need. The `scrollable` extension marks areas as overflow-scrollable. Combined with split pane, you get a fully interactive IDE-style layout.",
		tryThis: [
			"Scroll sidebar and content independently",
			"Drag the divider — both areas adjust and keep scrolling"
		],
	},
	{ cat: "Extensions", name: "Tabs", layout: "| abc .abc | 28 {_tab_a} {_tab_b} {_tab_c}", w: 400, h: 250, vars: { tab: "a" },
		ext: () => [tabs({ var: "tab", items: [{ label: "Overview", area: "a", sizeVar: "_tab_a" }, { label: "Details", area: "b", sizeVar: "_tab_b" }, { label: "Settings", area: "c", sizeVar: "_tab_c" }] }), animate({ duration: "0.2s" })],
		children: () => [
			<div key="a" style={{ background: "#1e3a5f", padding: 16, color: "#7fdbca", fontSize: 13, overflow: "hidden", height: "100%" }}><b>Overview</b><br/>Dashboard overview</div>,
			<div key="b" style={{ background: "#3a1e5f", padding: 16, color: "#c792ea", fontSize: 13, overflow: "hidden", height: "100%" }}><b>Details</b><br/>Detailed data</div>,
			<div key="c" style={{ background: "#1e5f3a", padding: 16, color: "#c3e88d", fontSize: 13, overflow: "hidden", height: "100%" }}><b>Settings</b><br/>Configuration</div>],
		src: `
<Grid layout="| abc .abc | 28 {_tab_a} {_tab_b} {_tab_c}"
	extensions={[
		tabs({ var: "tab", items: [
			{ label: "Overview", area: "a", sizeVar: "_tab_a" },
			{ label: "Details", area: "b", sizeVar: "_tab_b" },
			{ label: "Settings", area: "c", sizeVar: "_tab_c" },
		]}),
		animate({ duration: "0.2s" })
	]}
>
	...
</Grid>`,
		guide: "The tabs extension renders a tab bar, manages visibility through variables, and the animate extension smooths transitions. The layout string defines the structure — the extension adds the interaction.",
		tryThis: [
			"Click each tab to switch content",
			"Notice the smooth transition from the animate extension"
		],
	},
	{ cat: "Extensions", name: "Overlay", layout: "| hmCf hcfm 8 | 40#40", w: 500, h: 280,
		ext: () => [overlay({ area: "m", over: "c" }), debug()],
		children: (v, p) => {
			let show = p?._showOverlay;
			return [<Box key="h" c={0}>Header</Box>,
				show ? <div key="m" style={{ background: "rgba(0,0,0,0.75)", display: "flex",
					alignItems: "center", justifyContent: "center", width: "100%", height: "100%", borderRadius: 4 }}>
					<div style={{ background: "#1e2a4a", border: "1px solid #3a4a6a", borderRadius: 8,
						padding: "20px 28px", color: "#ccc", fontSize: 13, textAlign: "center" }}>
						<div style={{ fontWeight: 700, color: "#7fdbca", marginBottom: 8 }}>Modal</div>
						<div style={{ color: "#888" }}>Overlaying area "c"</div>
					</div>
				</div> : <div key="m" />,
				<div key="c" style={{ background: "#1a1a2e", padding: 16, color: "#888", fontSize: 12 }}>Content area</div>,
				<Box key="f" c={3}>Footer</Box>];
		},
		params: [{ key: "_showOverlay", label: "show overlay", type: "toggle", on: true, off: false }],
		src: '<Grid layout="| hmCf hcfm 8 | 40#40"\n\textensions={[\n\t\toverlay({ area: "m", over: "c" })\n\t]}\n>\n\t...\n</Grid>',
		guide: "Overlay places one area on top of another. Area `m` covers the same grid cells as area `c` but with higher z-index. Useful for modals, loading states, or any layered content. The area is always in the layout — the extension positions it.",
		tryThis: [
			"Toggle the overlay checkbox",
			"The modal covers the content area without disturbing the layout"
		],
	},
	{ cat: "Extensions", name: "Multi-Column", layout: "hscf hhhh sccc ffff {g} ?h | {sb}### | 40#40", w: 600, h: 300, vars: { sb: 200, g: 8 },
		ext: (v, p) => [multiColumn({ area: "c", fill: p?.fill || "auto" })],
		children: () => [
			<Box key="h" c={0}>Header</Box>,
			<div key="s" style={{ background: "#3a1e5f", padding: 12, color: "#c792ea", fontSize: 11 }}>Sidebar</div>,
			<div key="c" style={{ background: "#1a1a2e", padding: 12, color: "#999", fontSize: 12, lineHeight: 1.7 }}>
				Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
				Ut enim ad minim veniam, quis nostrud exercitation. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
				dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.</div>,
			<Box key="f" c={3}>Footer</Box>
		],
		params: [{ key: "sb", label: "sidebar", type: "range", min: 100, max: 350, def: 200 }, { key: "g", label: "gap", type: "range", min: 0, max: 20, def: 8 }, { key: "fill", label: "col-fill", type: "toggle", on: "balance", off: "auto" }],
		src: '<Grid layout="hscf hhhh sccc ffff {g} ?h | {sb}### | 40#40"\n\textensions={[\n\t\tmultiColumn({ area: "c", fill: "auto" })\n\t]}\n>\n\t...\n</Grid>',
		guide: `
Area \`c\` spans three grid columns. The multi-column extension reads the actual computed track widths
and sets CSS column properties to match — so text flows across columns that align perfectly with the grid.\n
Toggle column-fill between \`balance\` (even distribution) and \`auto\` (sequential fill). Adjust the
sidebar width — columns recalculate automatically.`,
		tryThis: [
			"Toggle balance/auto to see different text distribution",
			"Drag the sidebar slider — columns adapt",
			"Adjust the gap slider"
		],
	},

	////////////////////////////////////////////////////////////////////////////////////////////////
	// Fisheye

	{ cat: "Fisheye", name: "Calendar 2D", layout: "*7 ?wh || 30", w: 280, h: 220,
		ext: (v, p) => [fisheye({ axis: p?.axis || "both", intensity: (p?.intensity || 60) / 100, min: (p?.minFr || 15) / 100 })],
		children: calendarCells, gridStyle: { cursor: "crosshair" },
		params: [{ key: "intensity", label: "intensity", type: "range", min: 10, max: 95, def: 60 }, { key: "minFr", label: "min fr%", type: "range", min: 5, max: 50, def: 15 }],
		src: '<Grid layout="*7 ?wh || 30"\n\textensions={[\n\t\tfisheye({ axis: "both", intensity: 0.6, min: 0.15 })\n\t]}\n>\n\t{calendarCells}\n</Grid>',
		guide: `
Hover over the calendar — cells near your cursor expand, distant ones compress. The total stays constant —
it's pure fractional redistribution.\n
Each cell receives CSS custom properties \`--fe-scale\`, \`--fe-scale-x\`, \`--fe-scale-y\` that children
use to scale their content. Day numbers grow, event labels fade in.`,
		tryThis: [
			"Hover around the calendar to see the effect",
			"Adjust intensity and min-fraction sliders",
			"Higher min% = less extreme compression"
		],
	},
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
		tryThis: [
			"Hover left to right — day names expand",
			"Adjust the intensity slider",
			"Notice event text fading in on hovered cells"
		],
	},

	////////////////////////////////////////////////////////////////////////////////////////////////
	// Masonry

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
		guide: `
Masonry layout using the \`masonry()\` extension. Items declare their aspect ratio via \`--width\` and \`--height\` CSS variables.
The extension uses \`translateY()\` to pull items up and fill vertical gaps.\n
Column sizing is in the layout string: \`*150~#\` means \`repeat(auto-fill, minmax(150px, 1fr))\` —
the \`*\` prefix on sizes enables auto-fill.`,
		tryThis: [
			"Items maintain their aspect ratios",
			"Gaps are filled by pulling items up",
			"Resize the preview to see columns reflow"
		],
	},
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
		tryThis: [
			"Compare with the Regular preset — notice the height difference",
			"Items are visually reordered but DOM order is preserved"
		],
	},
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
		guide: `
A photo gallery using masonry layout. Each image declares its aspect ratio via \`--width\` and \`--height\`.
The extension reads these from the child elements and computes vertical translations.\n
Toggle balanced mode to see how reordering minimizes total height. Column sizing \`*180~#\` is \`repeat(auto-fill, minmax(180px, 1fr))\`.`,
		tryThis: [
			"Toggle balanced mode to compare layouts",
			"Adjust the photo count",
			"Resize the preview to see columns reflow"
		],
	},
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
		guide: `
Text content without \`--width\`/\`--height\` CSS variables. The extension auto-detects this and measures
actual \`offsetHeight\` from the DOM instead of computing from an aspect ratio.\n
This means cards fit their content exactly — no wasted space, no clipping. The masonry algorithm still
pulls items up via \`translateY()\` to fill gaps.`,
		tryThis: [
			"Cards fit their content — no fixed aspect ratio",
			"Compare with Photo Gallery where aspect ratios are locked",
			"Resize the preview to see content reflow and re-measure"
		],
	},
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
		tryThis: [
			"Items pack horizontally instead of vertically",
			"Compare with the Regular preset to see the axis swap"
		],
	},

	////////////////////////////////////////////////////////////////////////////////////////////////
	// Render

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
		tryThis: [
			"Scroll the table body — header stays fixed",
			"Adjust the rows slider"
		],
	},
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
		tryThis: [
			"This renders as a proper `<dl>` definition list",
			"The cell callback decides the tag per column"
		],
	},

];
