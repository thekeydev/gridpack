import React from "react";
import { Grid, debug, splitPane, scrollable, fisheye, animate, collapsible } from "../src/Grid.jsx";

let Style = ({ children }) => <style>{children}</style>

// ============================================================
// --- logo ---
// ============================================================

let Logo = ({ size = 56, color = "#7fdbca" }) =>
	<svg className="gp-logo" width={size} height={size} viewBox="0 0 56 56">
		<path fill={color} d="m41.266 19.117l8.812-5.015c-.352-.352-.774-.633-1.289-.915l-16.523-9.42C30.813 2.946 29.406 2.5 28 2.5s-2.812.445-4.266 1.266L18.977 6.46ZM28 26.641l10.008-5.672l-22.195-12.68l-8.602 4.899c-.516.28-.937.562-1.29.914ZM29.594 53.5c.164-.047.304-.117.469-.21l18.351-10.454c2.18-1.242 3.375-2.508 3.375-5.906V18.672c0-.703-.07-1.266-.187-1.781L29.594 29.453Zm-3.188 0V29.453L4.4 16.891a7.8 7.8 0 0 0-.188 1.78V36.93c0 3.398 1.195 4.664 3.375 5.906l18.352 10.453c.164.094.304.164.468.211" />
	</svg>;

// ============================================================
// --- hero showcase: synced rotating demos ---
// ============================================================

let MiniBox = ({ c = 0, children }) =>
	<div style={{ background: `hsl(${c * 47 + 200}, 40%, ${20 + c * 3}%)`, color: `hsl(${c * 47 + 200}, 60%, 75%)`, borderRadius: 4, padding: "8px 12px", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 28, border: `1px solid hsl(${c * 47 + 200}, 30%, 30%)`, overflow: "hidden", height: "100%", width: "100%" }}>{children}</div>;

let showcases = [
	{ layout: "hscf hhh scc sff 8", label: "Page Layout", h: 180,
		children: ["Header", "Sidebar", "Content", "Footer"] },
	{ layout: "aB | 120", label: "Sidebar + Main", h: 120,
		children: ["Sidebar", "Main"] },
	{ layout: "hnsCaf hhh nss nca fff 4 | 60 # 120", label: "Dashboard", h: 200,
		children: ["Header", "Nav", "Stats", "Content", "Aside", "Footer"] },
	{ layout: "a(eS)B ab* 8 | 100", label: "Form", h: 160,
		children: ["Label 1", "Input 1", "Label Foo", "Input 2", "Label Bar42", "Input 3"] },
	{ layout: "| ?w 8", label: "V-Stack", h: 140,
		children: ["A", "B", "C"] },
	{ layout: "sah sh Sa* 8 0 | 100", label: "Pinned Sidebar", h: 180,
		children: ["Sidebar", "Item 1", "Item 2", "Item 3", "Item 4"] },
	{ layout: "?whcC", label: "Center Content", h: 180,
		children: ["Content"] },
];

let HeroShowcase = () => {
	let [idx, setIdx] = React.useState(0);
	let [editLayout, setEditLayout] = React.useState(showcases[0].layout);
	let [isEditing, setIsEditing] = React.useState(false);
	let [fade, setFade] = React.useState(true);

	// auto-rotate unless user is editing
	React.useEffect(() => {
		if (isEditing) return;
		let t = setInterval(() => {
			setFade(false);
			setTimeout(() => {
				setIdx(i => {
					let next = (i + 1) % showcases.length;
					setEditLayout(showcases[next].layout);
					return next;
				});
				setFade(true);
			}, 200);
		}, 3500);
		return () => clearInterval(t);
	}, [isEditing]);

	let sc = showcases[idx];
	let activeLayout = isEditing ? editLayout : sc.layout;

	let onFocus = () => setIsEditing(true);
	let onBlur = () => {
		setIsEditing(false);
		// try to find a matching showcase
		let match = showcases.findIndex(s => s.layout === editLayout);
		if (match >= 0) setIdx(match);
	};
	let onChange = (e) => setEditLayout(e.target.value);

	// pick children — if editing with custom string, show generic boxes
	let childLabels = sc.children;
	let childCount = childLabels.length;

	return <>
		{/* editable layout string */}
		<div style={{ position: "relative", marginBottom: 16 }}>
			<label>
				<span className="gp-mono" style={{ fontSize: 10, color: "#999", marginBottom: 8, display: "inline-block" }}>
					Layout String
				</span>
				<input type="text" value={editLayout} onChange={onChange} onFocus={onFocus} onBlur={onBlur}
					spellCheck={false} className="gp-mono" style={{
						width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(127,219,202,0.15)",
						borderRadius: 6, color: "#c3e88d", fontFamily: "inherit",
						fontSize: "clamp(16px, 3vw, 28px)", fontWeight: 600,
						padding: "12px 16px", outline: "none", caretColor: "#7fdbca",
					}} />
			</label>
			{!isEditing && <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
				fontSize: 10, color: "#999", pointerEvents: "none" }} className="gp-mono">
				{sc.label} · {idx + 1}/{showcases.length}
			</div>}
		</div>

		{/* live preview */}
		<div className="gp-demo-frame" style={{
			height: sc.h, padding: 8, transition: "height 0.3s ease",
			opacity: fade ? 1 : 0.3, transitionProperty: "height, opacity",
		}}>
			<Grid layout={activeLayout} style={{ height: "100%" }}
				extensions={[debug({ color: "rgba(127,219,202,0.3)" })]}>
				{childLabels.map((l, i) => <MiniBox key={i} c={i}>{l}</MiniBox>)}
			</Grid>
		</div>
		<div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, padding: "0 4px" }}>
			<span className="gp-mono" style={{ fontSize: 10, color: "#999" }}>
				{isEditing ? "editing — auto-rotate paused" : "↑ click to edit · auto-rotating"}
			</span>
			<div style={{ display: "flex", gap: 4 }}>
				{showcases.map((_, i) =>
					<div key={i} onClick={() => { setIdx(i); setEditLayout(showcases[i].layout); setFade(true); }}
						style={{ width: 6, height: 6, borderRadius: 3, cursor: "pointer",
							background: i === idx ? "#7fdbca" : "rgba(255,255,255,0.1)",
							transition: "background 0.2s" }} />
				)}
			</div>
		</div>
	</>
};

// ============================================================
// --- feature card ---
// ============================================================

let FeatureCard = ({ icon, title, desc, code }) =>
	<Grid layout="i(C)t(C)dc it dd cc 0 8 ?h | .#" className="gp-fcard">
		<div className="gp-fcard-icon">{icon}</div>
		<div className="gp-fcard-title">{title}</div>
		<div className="gp-fcard-desc">{desc}</div>
		{code && <code className="gp-fcard-code">{code}</code>}
	</Grid>

// ============================================================
// --- code block ---
// ============================================================

let Code = ({ children, label }) =>
	<div className="gp-codeblock">
		{label && <div className="gp-codeblock-label">{label}</div>}
		<pre>{children}</pre>
	</div>

// ============================================================
// --- landing page ---
// ============================================================

let LandingPage = ({ onNavigate }) => {
	let [v, setV] = React.useState({ w: 115 });
	return <div className="gp-landing">
		<Style>{`
			.gp-landing {
				font-family: var(--font-body);
				background: #0c0c1a;
				color: #b8b8d0;
				overflow-x: hidden;
				height: 100%;
			}

			/* --- cursor blink --- */
			.gp-cursor { color: #7fdbca; animation: gp-blink 1s step-end infinite; }
			@keyframes gp-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

			/* --- logo --- */
			.gp-logo {
				filter: drop-shadow(0 0 20px rgba(127,219,202,0.3));
				animation: gp-logo-float 4s ease-in-out infinite, gp-logo-glow 3s ease-in-out infinite;
			}
			@keyframes gp-logo-float {
				0%, 100% { transform: translateY(0px) rotateY(0deg); }
				50% { transform: translateY(-6px) rotateY(8deg); }
			}
			@keyframes gp-logo-glow {
				0%, 100% { filter: drop-shadow(0 0 20px rgba(127,219,202,0.2)); }
				50% { filter: drop-shadow(0 0 35px rgba(127,219,202,0.5)); }
			}
			.gp-logo-wrap {
				display: inline-flex; align-items: center; perspective: 200px;
			}

			/* --- hero --- */
			.gp-hero { min-height: 100vh; position: relative; overflow: hidden; }
			.gp-hero-bg {
				position: absolute; inset: 0; opacity: 0.04;
				background-image:
					linear-gradient(rgba(127,219,202,0.3) 1px, transparent 1px),
					linear-gradient(90deg, rgba(127,219,202,0.3) 1px, transparent 1px);
				background-size: 60px 60px;
			}
			.gp-hero-glow {
				position: absolute; top: -200px; left: 50%; transform: translateX(-50%);
				width: 800px; height: 800px; border-radius: 50%;
				background: radial-gradient(circle, rgba(127,219,202,0.08) 0%, transparent 70%);
				pointer-events: none;
			}

			/* --- typography --- */
			.gp-mono { font-family: var(--font-mono); }
			.gp-h1 {
				font-family: var(--font-mono);
				font-size: clamp(36px, 6vw, 72px); font-weight: 800;
				color: #e8e8f0; line-height: 1.1; letter-spacing: -2px;
			}
			.gp-h1 em { font-style: normal; color: #7fdbca; }
			.gp-h2 {
				font-family: var(--font-mono);
				font-size: clamp(22px, 3vw, 32px); font-weight: 700;
				color: #e8e8f0; letter-spacing: -0.5px; margin-bottom: 12px;
			}
			.gp-h2 em { font-style: normal; color: #7fdbca; }
			.gp-sub { font-size: clamp(14px, 2vw, 18px); color: #8888a0; line-height: 1.6; max-width: 560px; }
			.gp-tag {
				display: inline-block; font-family: var(--font-mono);
				font-size: 11px; color: #7fdbca; background: rgba(127,219,202,0.08);
				border: 1px solid rgba(127,219,202,0.15); border-radius: 20px;
				padding: 4px 14px; letter-spacing: 1px; text-transform: uppercase;
			}

			/* --- layout string showcase --- */
			.gp-showcase {
				font-family: var(--font-mono);
				font-size: clamp(20px, 4vw, 40px); font-weight: 600;
				color: #c3e88d; min-height: 50px;
			}

			/* --- buttons --- */
			.gp-btn {
				display: inline-flex; align-items: center; gap: 8px;
				font-family: var(--font-mono); font-size: 13px; font-weight: 600;
				padding: 12px 28px; border-radius: 6px; cursor: pointer;
				transition: all 0.2s; border: none; text-decoration: none;
				white-space: nowrap;
			}
			.gp-btn-primary {
				background: #7fdbca; color: #0c0c1a;
			}
			.gp-btn-primary:hover { background: #a0ebd8; transform: translateY(-1px); }
			.gp-btn-ghost {
				background: transparent; color: #7fdbca;
				border: 1px solid rgba(127,219,202,0.25);
			}
			.gp-btn-ghost:hover { background: rgba(127,219,202,0.08); }

			/* --- sections --- */
			.gp-section { padding: clamp(40px, 8vw, 40px) clamp(20px, 5vw, 80px); max-width: 1100px; margin: 0 auto; }
			.gp-divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(127,219,202,0.15), transparent); margin: 0 auto; max-width: 800px; }

			/* --- feature cards --- */
			.gp-fcard {
				background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);
				border-radius: 8px; padding: 24px;
				transition: border-color 0.2s, background 0.2s;
			}
			.gp-fcard:hover { border-color: rgba(127,219,202,0.2); background: rgba(127,219,202,0.03); }
			.gp-fcard-icon { font-size: 24px; margin-bottom: 12px; }
			.gp-fcard-title { font-family: var(--font-mono); font-size: 14px; font-weight: 700; color: #e8e8f0; margin-bottom: 8px; }
			.gp-fcard-desc { font-size: 13px; color: #8888a0; line-height: 1.5; }
			.gp-fcard-code {
				display: block; margin-top: 12px; font-family: var(--font-mono);
				font-size: 11px; color: #c3e88d; background: rgba(0,0,0,0.3);
				padding: 6px 10px; border-radius: 4px;
			}

			/* --- code block --- */
			.gp-codeblock {
				background: #0a0a18; border: 1px solid rgba(255,255,255,0.06);
				border-radius: 8px; overflow: hidden;
			}
			.gp-codeblock-label {
				font-family: var(--font-mono); font-size: 10px;
				color: #fff; text-transform: uppercase; letter-spacing: 1px;
				padding: 8px 16px; border-bottom: 1px solid rgba(255,255,255,0.04);
			}
			.gp-codeblock pre {
				font-family: var(--font-mono); font-size: 13px;
				line-height: 1.7; color: #b8b8d0; padding: 16px; margin: 0;
				overflow-x: auto;
			}
			.gp-codeblock pre .kw { color: #c792ea; }
			.gp-codeblock pre .str { color: #c3e88d; }
			.gp-codeblock pre .fn { color: #82aaff; }
			.gp-codeblock pre .cm { color: #888; }
			.gp-codeblock pre .tag { color: #f07178; }
			.gp-codeblock pre .attr { color: #ffcb6b; }

			/* --- comparison --- */
			.gp-compare-label {
				font-family: var(--font-mono); font-size: 10px;
				color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;
			}

			/* --- live demo frame --- */
			.gp-demo-frame {
				border: 1px solid rgba(255,255,255,0.06); border-radius: 8px;
				overflow: hidden; background: #0a0a18;
			}

			/* --- footer --- */
			.gp-footer { text-align: center; padding: 40px 20px; color: #888; font-size: 12px; }
			.gp-footer a { color: #7fdbca; text-decoration: none; }

			/* --- token colors for inline --- */
			.gp-tok-area { color: #7fdbca; }
			.gp-tok-flag { color: #f78c6c; }
			.gp-tok-size { color: #c3e88d; }
			.gp-tok-pipe { color: #c792ea; }
		`}</Style>

		{/* --- hero --- */}
		<div className="gp-hero">
			<div className="gp-hero-bg" />
			<div className="gp-hero-glow" />
			<div className="gp-section" style={{ position: "relative", zIndex: 1 }}>
				<Grid layout="| abcde .a.b.c.d.e ?w | 24.24.12.28.40." style={{overflow:"visible"}}>
					<Grid layout="a(C)b(C)c(C) 12" style={{overflow:"visible"}}>
						<div className="gp-logo-wrap">
							<Logo size={56} color="#fff"/>
						</div>
						<h1 className="gp-h2">gridpack</h1>
						<div className="gp-tag">CSS Grid/Flex Layout DSL</div>
					</Grid>
					<h1 className="gp-h1">
						Layouts in<br /><em>one string.</em>
					</h1>
					<p className="gp-sub">
						Gridpack compiles a compact layout string into CSS Grid (or Flex).<br/>
						A React component, optional extensions, and zero wrapper divs.
						From <span className="gp-mono" style={{ color: "#c3e88d" }}>ab</span> to full dashboards — one prop.
					</p>
					<Grid layout="* 12">
						<button className="gp-btn gp-btn-primary" onClick={() => onNavigate?.("playground")}>
							Open Playground →
						</button>
						<button className="gp-btn gp-btn-ghost" onClick={() => onNavigate?.("docs")}>
							Read Docs
						</button>
					</Grid>
					<HeroShowcase />
				</Grid>
			</div>
		</div>

		<div className="gp-divider" />

		{/* --- before/after --- */}
		<div className="gp-section">
			<h2 className="gp-h2">Before & <em>After</em></h2>
			<div style={{ height: 24 }} />
			<Grid layout="* 16 ?w" xs="| 16 ?w | .." sm="* 16 ?w">
				<div>
					<div className="gp-compare-label">Traditional CSS Grid</div>
					<Code label="styles.css">{`.layout {\n  display: grid;\n  grid-template-areas:\n    "header header header"\n    "sidebar content content"\n    "sidebar footer footer";\n  grid-template-columns: 200px 1fr 1fr;\n  grid-template-rows: auto 1fr auto;\n  gap: 8px;\n}\n.header  { grid-area: header; }\n.sidebar { grid-area: sidebar; }\n.content { grid-area: content; }\n.footer  { grid-area: footer; }`}{"\n"}<span className="cm">{"// + elements or components"}</span></Code>
				</div>
				<div>
					<div className="gp-compare-label">Gridpack</div>
					<Code label="App.jsx"><span className="cm">{"// that's it. really."}</span>{"\n"}<span className="tag">{"<Grid"}</span> <span className="attr">layout</span>=<span className="str">"hscf hhh scc sff 8"</span><span className="tag">{">"}</span>{"\n  "}<span className="tag">{"<Header />"}</span>{"\n  "}<span className="tag">{"<Sidebar />"}</span>{"\n  "}<span className="tag">{"<Content />"}</span>{"\n  "}<span className="tag">{"<Footer />"}</span>{"\n"}<span className="tag">{"</Grid>"}</span></Code>
				</div>
			</Grid>
		</div>

		<div className="gp-divider" />

		{/* --- token vocabulary --- */}
		<div className="gp-section">
			<h2 className="gp-h2">12 tokens. <em>Lots of layouts.</em></h2>
			<p className="gp-sub" style={{ marginBottom: 32 }}>The entire vocabulary fits on a sticky note.</p>
			<Grid layout="*3 8 ?w" sm="*4 8 ?w" style={{ maxWidth: 800 }}>
				{[
					["a-z", "areas", "#7fdbca"],
					["A-Z", "grow", "#c792ea"],
					["s3c6", "char-count / spans", "#7fdbca"],
					["|", "pipe / transpose", "#c792ea"],
					["?", "flags (whfF + secbag)", "#f78c6c"],
					["( )", "align", "#c3e88d"],
					[".", "empty / auto", "#fff"],
					["#", "1fr", "#c3e88d"],
					["~", "minmax", "#f78c6c"],
					["*", "auto-flow / repeat", "#ff5370"],
					["[ ]", "overlap", "#82aaff"],
					["{ }", "vars", "#ffcb6b"],
				].map(([tok, desc, color], i) =>
					<div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
						<span className="gp-mono" style={{ color, fontSize: 18, fontWeight: 700, width: 48, textAlign: "center" }}>{tok}</span>
						<span style={{ fontSize: 13, color: "#8888a0" }}>{desc}</span>
					</div>
				)}
			</Grid>
		</div>

		<div className="gp-divider" />

		{/* --- features grid --- */}
		<div className="gp-section">
			<h2 className="gp-h2">Features</h2>
			<div style={{ height: 24 }} />
			<Grid layout="*1 16 ?w" sm="*2 16 ?w" md="*3 16 ?w" >
				<FeatureCard icon="⊞" title="ASCII Grid Maps"
					desc="Draw your layout as a character map. Areas, spans, and empty cells — all visible at a glance."
					code="hscf hhh scc sff" />
				<FeatureCard icon="↔" title="Proportional Sizing"
					desc="Repeat area chars for proportional columns. ab abb = 1:2 ratio. No math needed."
					code="ab abb" />
				<FeatureCard icon="⇅" title="Transpose"
					desc="Leading pipe swaps axes — sizes, gaps, alignment all follow. Vertical stack is one char away."
					code="|abc" />
				<FeatureCard icon="⊟" title="Auto-Flow"
					desc="Just say how many columns. Rows derived from children. Reverse flow with ?f, dense packing with ?F."
					code="*4 ?whF" />
				<FeatureCard icon="↕" title="Responsive"
					desc="Different layout strings per container breakpoint. No media queries, no overrides."
					code='sm="ab aab" lg="abc"' />
				<FeatureCard icon="✱" title="Repeat & Cycle"
					desc="Repeat rows expand from children. Trailing * in sizes cycles the pattern across all tracks."
					code="*6 | 80 # *" />
				<FeatureCard icon="⚡" title="Extensions"
					desc="Split panes, collapsible areas, tabs, fisheye zoom, custom DOM — composable behavior via an array."
					code="extensions={[splitPane(...)]}" />
				<FeatureCard icon="🔲" title="Render Hook"
					desc="Replace the container and cell tags. Build semantic HTML tables, definition lists, or any DOM shape."
					code='render({ container, cell })' />
			</Grid>
		</div>

		<div className="gp-divider" />

		{/* --- extensions showcase --- */}
		<div className="gp-section">
			<h2 className="gp-h2">Extension <em>Gallery</em></h2>
			<p className="gp-sub" style={{ marginBottom: 32 }}>Behavioral plugins. Stack them freely. Each one is a few lines of config.</p>
			<Grid md="*2 12 ?w" layout="*1 12 ?w">
				{[
					{ name: "splitPane", desc: "Draggable resize handle between areas", code: 'splitPane({ var: "w", edge: "s:e" })' },
					{ name: "collapsible", desc: "Toggle area size with one click", code: 'collapsible({ var: "sb", area: "s" })' },
					{ name: "accordion", desc: "Expand one, collapse others", code: 'accordion({ var: "active", items })' },
					{ name: "scrollable", desc: "Independent scrolling per area", code: 'scrollable({ area: ["s", "c"] })' },
					{ name: "tabs", desc: "Tab bar with content switching", code: 'tabs({ var: "tab", items })' },
					{ name: "overlay", desc: "Layer one area over another", code: 'overlay({ area: "m", over: "c" })' },
					{ name: "animate", desc: "Smooth CSS transitions on track changes", code: 'animate({ duration: "0.3s" })' },
					{ name: "fisheye", desc: "Tracks expand near cursor, compress away", code: 'fisheye({ axis: "both" })' },
					{ name: "multiColumn", desc: "CSS columns aligned to grid tracks", code: 'multiColumn({ area: "c" })' },
					{ name: "render", desc: "Custom container and cell tags for semantic DOM", code: 'render({ container, cell })' },
					{ name: "debug", desc: "Visualize grid cell boundaries", code: "debug()" },
				].map((ext, i) =>
					<div key={i} style={{ padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
						<div className="gp-mono" style={{ fontSize: 13, fontWeight: 600, color: "#c792ea", marginBottom: 4 }}>{ext.name}</div>
						<div style={{ fontSize: 13, color: "#8888a0", marginBottom: 6 }}>{ext.desc}</div>
						<code className="gp-mono" style={{ fontSize: 11, color: "#c3e88d", background: "rgba(0,0,0,0.3)", padding: "3px 8px", borderRadius: 3 }}>{ext.code}</code>
					</div>
				)}
			</Grid>
		</div>

		<div className="gp-divider" />

		{/* --- quick start --- */}
		<div className="gp-section">
			<h2 className="gp-h2">Quick <em>Start</em></h2>
			<div style={{ height: 24 }} />
			<Grid layout="*2 ?w | 420# | ..." gap={20} style={{ maxWidth: 800 }}>
				<Code label="install">npm install gridpack</Code>
				<div></div>
				<Code label="usage"><span className="kw">import</span> {"{ Grid }"} <span className="kw">from</span> <span className="str">"gridpack"</span>{"\n\n"}<span className="tag">{"<Grid"}</span> <span className="attr">layout</span>=<span className="str">"hsCf hhh scc sff 8"</span><span className="tag">{">"}</span>{"\n  "}<span className="tag">{"<Header />"}</span>{"\n  "}<span className="tag">{"<Sidebar />"}</span>{"\n  "}<span className="tag">{"<Content />"}</span>{"\n  "}<span className="tag">{"<Footer />"}</span>{"\n"}<span className="tag">{"</Grid>"}</span></Code>
				<Grid layout="hsCf hhh scc sff 8">
					<MiniBox>Header</MiniBox>
					<MiniBox>Sidebar</MiniBox>
					<MiniBox>Content</MiniBox>
					<MiniBox>Footer</MiniBox>
				</Grid>
				<Code label="with extensions"><span className="kw">import</span> {"{ Grid, splitPane }"} <span className="kw">from</span> <span className="str">"gridpack"</span>{"\n\n"}<span className="kw">let</span> [v, setV] = <span className="fn">useState</span>({"{ w: 200 }"});{"\n\n"}<span className="tag">{"<Grid"}</span>{"\n  "}<span className="attr">layout</span>=<span className="str">{'"sC | {w}"'}</span>{"\n  "}<span className="attr">vars</span>={"{v}"} <span className="attr">onVarsChange</span>={"{setV}"}{"\n  "}<span className="attr">extensions</span>={"{[splitPane({ var: \"w\", edge: \"s:r\" })]}"}{"\n"}<span className="tag">{">"}</span>{"\n  "}<span className="tag">{"<Sidebar />"}</span>{"\n  "}<span className="tag">{"<Content />"}</span>{"\n"}<span className="tag">{"</Grid>"}</span></Code>
				<Grid layout="sC | {w}" vars={v} onVarsChange={setV} extensions={[splitPane({ var: "w", edge: "s:r" })]}>
					<MiniBox>Sidebar</MiniBox>
					<MiniBox>Content</MiniBox>
				</Grid>
			</Grid>
		</div>

		<div className="gp-divider" />

		{/* --- cta --- */}
		<div className="gp-section" style={{ textAlign: "center" }}>
			<h2 className="gp-h2" style={{ marginBottom: 16 }}>Stop nesting <em>divs.</em></h2>
			<p className="gp-sub" style={{ margin: "0 auto 32px" }}>
				One string. One component. Every layout.
			</p>
			<Grid layout="* 12">
				<button className="gp-btn gp-btn-primary" onClick={() => onNavigate?.("playground")}>
					Try the Playground →
				</button>
				<button className="gp-btn gp-btn-ghost" onClick={() => onNavigate?.("docs")}>
					Read the Docs
				</button>
			</Grid>
		</div>

		{/* --- footer --- */}
		<div className="gp-footer">
			<div style={{ marginBottom: 12, opacity: 0.4 }}><Logo size={28} /></div>
			Made with ❤ in Europe. Built with gridpack, obviously.{" "}
			<a href="https://github.com/thekeydev/gridpack">GitHub</a> | <a href="https://www.npmjs.com/package/gridpack">npm</a>
		</div>
	</div>;
};

export default LandingPage;
export { LandingPage, Logo };
