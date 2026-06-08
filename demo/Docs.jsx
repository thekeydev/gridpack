import React from "react";
import { Grid, debug, splitPane, collapsible, accordion, scrollable, animate,
	tabs, multiColumn, masonry, overlay, fisheye } from "../src/Grid.jsx";
import { decodeState, encodeFragment } from "./urldsl.js";
import guideMd from "./guide.md"; // esbuild text loader: { ".md": "text" }

// --- child generators (mirror of GenericPlayground) ---

let Box = ({ c = 0, children, style }) =>
	<div className={`dx-box dx-c${c % 8}`} style={style}>{children}</div>;

let GENERATORS = {
	boxes: ({ count = 4, labels = "A,B,C,D" }) => {
		let arr = (labels || "").split(",").map(s => s.trim());
		return Array.from({ length: count }, (_, i) =>
			<Box key={i} c={i}>{arr[i] || String.fromCharCode(65 + i % 26)}</Box>);
	},
	lorem: ({ count = 10, pad = 8 }) =>
		Array.from({ length: count }, (_, i) =>
			<div key={i} className="dx-lorem" style={{ padding: `${pad / 2}px ${pad}px` }}>
				{`Item ${i + 1} — Lorem ipsum dolor sit amet consectetur`}
			</div>),
	cards: ({ count = 4, height = 80 }) =>
		Array.from({ length: count }, (_, i) =>
			<div key={i} className="dx-card" style={{ height }}>
				<div className="dx-card-t">Card {i + 1}</div>
				<div className="dx-card-b">Some content here</div>
			</div>),
	tiles: ({ count = 6, ratio = "4/3" }) =>
		Array.from({ length: count }, (_, i) =>
			<div key={i} className="dx-tile" style={{
				aspectRatio: ratio.replace("/", " / "),
				background: `hsl(${(i * 53) % 360},35%,22%)`,
				color: `hsl(${(i * 53) % 360},60%,65%)`,
			}}>{i + 1}</div>),
	numbered: ({ count = 4, minH = 40 }) =>
		Array.from({ length: count }, (_, i) =>
			<div key={i} className="dx-num" style={{ minHeight: minH }}>{i + 1}</div>),
	empty: ({ count = 3 }) =>
		Array.from({ length: count }, (_, i) => <div key={i} />),
};

// --- extension builder (mirror of GenericPlayground) ---

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
	} catch { return null; }
};

// --- live example renderer ---
// the fence body is a URL-DSL string ("<layout>;<nodes>;<vars>")
// decoded with the same decodeState used by the playground.

let LiveExample = ({ dsl, onOpenPlayground }) => {
	let [vars, setVars] = React.useState(() => {
		let s = decodeState(dsl);
		return s?.vars || {};
	});

	let state = React.useMemo(() => decodeState(dsl), [dsl]);
	if (!state) return <div className="dx-ex-err">could not parse example</div>;

	let children = React.useMemo(() => {
		let gen = GENERATORS[state.childConfig?.type] || GENERATORS.boxes;
		return gen(state.childConfig?.opts || {});
	}, [state]);

	let extensions = React.useMemo(() =>
		(state.extConfigs || []).map(buildExt).filter(Boolean), [state]);

	let responsive = {};
	for (let [bp, val] of Object.entries(state.breakpoints || {})) if (val) responsive[bp] = val;

	// open in the in-app playground (no reload). gp value is gently encoded so
	// the resulting URL stays readable.
	let open = () => onOpenPlayground?.("gp=" + encodeFragment(dsl));

	return <div className="dx-ex">
		<div className="dx-ex-stage">
			<Grid layout={state.layout} vars={vars} onVarsChange={setVars}
				extensions={extensions} {...responsive}>
				{children}
			</Grid>
		</div>
		<div className="dx-ex-bar">
			<code className="dx-ex-str">{state.layout || "(empty)"}</code>
			<button className="dx-ex-link" onClick={open}>open in playground →</button>
		</div>
	</div>;
};

// --- inline markdown: code, bold, links ---
// minimal: `code`, **bold**, [text](url). escaped backslashes not handled (not needed).

// scroll a heading (by slug id) into view within the article
let scrollToSlug = (slug) => {
	let el = document.getElementById(slug);
	if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

let renderInline = (text, keyPrefix) => {
	let out = [];
	let i = 0, n = 0;
	let push = (node) => out.push(typeof node === "string"
		? node : React.cloneElement(node, { key: `${keyPrefix}-${n++}` }));

	while (i < text.length) {
		// inline code `...`
		if (text[i] === "`") {
			let end = text.indexOf("`", i + 1);
			if (end > i) {
				push(<code className="dx-code">{text.slice(i + 1, end)}</code>);
				i = end + 1; continue;
			}
		}
		// bold **...**
		if (text[i] === "*" && text[i + 1] === "*") {
			let end = text.indexOf("**", i + 2);
			if (end > i) {
				push(<strong>{renderInline(text.slice(i + 2, end), `${keyPrefix}-b${n}`)}</strong>);
				i = end + 2; continue;
			}
		}
		// link [text](url) — in-doc anchors (#slug) are handled by a delegated
		// click handler on the article; external links open in a new tab
		if (text[i] === "[") {
			let close = text.indexOf("]", i + 1);
			if (close > i && text[close + 1] === "(") {
				let pend = text.indexOf(")", close + 2);
				if (pend > close) {
					let label = text.slice(i + 1, close);
					let url = text.slice(close + 2, pend);
					if (url[0] === "#")
						push(<a className="dx-link dx-anchor" href={url}>{label}</a>);
					else
						push(<a className="dx-link" href={url} target="_blank" rel="noreferrer">{label}</a>);
					i = pend + 1; continue;
				}
			}
		}
		// plain run up to next special char
		let next = i + 1;
		while (next < text.length && !"`*[".includes(text[next])) next++;
		push(text.slice(i, next));
		i = next;
	}
	return out;
};

// --- block-level parser ---
// splits markdown into blocks: heading, fence, table, list, blockquote, paragraph, hr.

let parseBlocks = (md) => {
	let lines = md.replace(/\r\n/g, "\n").split("\n");
	let blocks = [];
	let i = 0;

	while (i < lines.length) {
		let line = lines[i];

		// blank
		if (!line.trim()) { i++; continue; }

		// fenced code ```lang
		if (line.startsWith("```")) {
			let lang = line.slice(3).trim();
			let body = [];
			i++;
			while (i < lines.length && !lines[i].startsWith("```")) { body.push(lines[i]); i++; }
			i++; // skip closing fence
			blocks.push({ type: "fence", lang, code: body.join("\n") });
			continue;
		}

		// heading
		let h = line.match(/^(#{1,6})\s+(.*)$/);
		if (h) { blocks.push({ type: "heading", level: h[1].length, text: h[2] }); i++; continue; }

		// hr (--- on its own line)
		if (/^---+\s*$/.test(line)) { blocks.push({ type: "hr" }); i++; continue; }

		// table: a line with | followed by a |---| separator line
		if (line.includes("|") && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]) && lines[i + 1].includes("-")) {
			let header = line;
			let rows = [];
			i += 2; // skip header + separator
			while (i < lines.length && lines[i].includes("|") && lines[i].trim()) { rows.push(lines[i]); i++; }
			blocks.push({ type: "table", header, rows });
			continue;
		}

		// blockquote
		if (line.startsWith(">")) {
			let body = [];
			while (i < lines.length && lines[i].startsWith(">")) { body.push(lines[i].replace(/^>\s?/, "")); i++; }
			blocks.push({ type: "quote", text: body.join(" ") });
			continue;
		}

		// list (unordered - or *, ordered N.)
		if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
			let ordered = /^\s*\d+\.\s+/.test(line);
			let items = [];
			while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
				items.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, ""));
				i++;
			}
			blocks.push({ type: "list", ordered, items });
			continue;
		}

		// paragraph: gather until blank / block start
		let para = [];
		while (i < lines.length && lines[i].trim()
			&& !lines[i].startsWith("```") && !lines[i].startsWith("#")
			&& !lines[i].startsWith(">") && !/^---+\s*$/.test(lines[i])
			&& !/^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
			para.push(lines[i]); i++;
		}
		blocks.push({ type: "para", text: para.join(" ") });
	}
	return blocks;
};

// split a table row on unescaped pipes, unescaping "\|" → "|" inside cells
let splitRow = (row) => {
	let trimmed = row.replace(/^\s*\|/, "").replace(/\|\s*$/, "");
	let cells = [], buf = "";
	for (let i = 0; i < trimmed.length; i++) {
		if (trimmed[i] === "\\" && trimmed[i + 1] === "|") { buf += "|"; i++; }
		else if (trimmed[i] === "|") { cells.push(buf.trim()); buf = ""; }
		else buf += trimmed[i];
	}
	cells.push(buf.trim());
	return cells;
};

let slugify = (text) =>
	text.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");

// --- block renderer ---

let renderBlock = (b, key, onOpenPlayground) => {
	switch (b.type) {
		case "heading": {
			let Tag = `h${b.level}`;
			return <Tag key={key} id={slugify(b.text)} className={`dx-h dx-h${b.level}`}>
				{renderInline(b.text, key)}
			</Tag>;
		}
		case "para":
			return <p key={key} className="dx-p">{renderInline(b.text, key)}</p>;
		case "quote":
			return <blockquote key={key} className="dx-quote">{renderInline(b.text, key)}</blockquote>;
		case "hr":
			return <hr key={key} className="dx-hr" />;
		case "list": {
			let Tag = b.ordered ? "ol" : "ul";
			return <Tag key={key} className="dx-list">
				{b.items.map((it, idx) => <li key={idx}>{renderInline(it, `${key}-${idx}`)}</li>)}
			</Tag>;
		}
		case "table": {
			let head = splitRow(b.header);
			return <div key={key} className="dx-table-wrap">
				<table className="dx-table">
					<thead><tr>{head.map((c, idx) => <th key={idx}>{renderInline(c, `${key}-h${idx}`)}</th>)}</tr></thead>
					<tbody>
						{b.rows.map((r, ri) => {
							let cells = splitRow(r);
							return <tr key={ri}>{cells.map((c, ci) => <td key={ci}>{renderInline(c, `${key}-${ri}-${ci}`)}</td>)}</tr>;
						})}
					</tbody>
				</table>
			</div>;
		}
		case "fence":
			if (b.lang === "example")
				return <LiveExample key={key} dsl={b.code.trim()} onOpenPlayground={onOpenPlayground} />;
			return <pre key={key} className="dx-pre"><code className={`dx-pre-code lang-${b.lang}`}>{b.code}</code></pre>;
		default:
			return null;
	}
};

// --- table of contents: h2 sections, each with its h3 children nested ---

let buildToc = (blocks) => {
	let toc = [];
	let current = null;
	for (let b of blocks) {
		if (b.type !== "heading") continue;
		if (b.level === 2) {
			current = { text: b.text, slug: slugify(b.text), children: [] };
			toc.push(current);
		} else if (b.level === 3 && current) {
			current.children.push({ text: b.text, slug: slugify(b.text) });
		}
	}
	return toc;
};

// flat list of every heading slug in document order — used by the scroll-spy
let buildHeadingList = (blocks) =>
	blocks.filter(b => b.type === "heading" && (b.level === 2 || b.level === 3))
		.map(b => ({ slug: slugify(b.text), level: b.level }));

// --- main component ---

export default function Docs({ source = guideMd, onOpenPlayground, onNavigateSection, onToc,
	scrollTo = null, navSeq = 0, histKey = null, navType = "push" }) {
	let blocks = React.useMemo(() => parseBlocks(source), [source]);
	let toc = React.useMemo(() => buildToc(blocks), [blocks]);
	let headings = React.useMemo(() => buildHeadingList(blocks), [blocks]);
	let scrollerRef = React.useRef(null);

	// scroll-spy: slug of the heading currently at the top of the reading area
	let [activeSlug, setActiveSlug] = React.useState(null);

	// per-history-entry scroll memory. histKeyRef mirrors the current entry key so
	// the scroll listener (a stable closure) always saves against the right entry.
	let scrollByKey = React.useRef({});
	let histKeyRef = React.useRef(histKey);
	histKeyRef.current = histKey;

	// jump to a section. when the router gave us a navigator, route through it so
	// the jump becomes a back-navigable history entry; otherwise just scroll
	// (keeps Docs usable on its own, e.g. in tests or standalone embeds).
	let goToSection = (slug) => {
		if (onNavigateSection) onNavigateSection(slug);
		else scrollToSlug(slug);
	};

	// delegated handler: intercept clicks on in-doc anchors (<a class="dx-anchor">)
	// so inline cross-references in the rendered markdown go through goToSection
	let onArticleClick = (e) => {
		let a = e.target.closest?.("a.dx-anchor");
		if (!a) return;
		let href = a.getAttribute("href") || "";
		if (href[0] !== "#") return;
		e.preventDefault();
		goToSection(href.slice(1));
	};

	// react to route-driven navigation (navSeq bumps on every nav so this re-fires
	// even when the target is unchanged):
	//   - back/forward (navType "pop") -> restore the scroll saved for that entry,
	//     so leaving Docs for the Playground and pressing back lands you exactly
	//     where you were. falls back to section/top if nothing was saved.
	//   - a fresh click (navType "push") with a slug -> scroll that heading in.
	//   - a fresh click with no slug (bare "#docs")   -> scroll to the top.
	// on a cold first mount the target may not be laid out yet, so retry a few frames.
	React.useEffect(() => {
		let scroller = scrollerRef.current;
		if (navType === "pop" && scroller && scrollByKey.current[histKey] != null) {
			let top = scrollByKey.current[histKey];
			let tries = 0, raf;
			let restore = () => {
				scroller.scrollTop = top;
				// content (live examples, images) can still be settling; re-assert briefly
				if (++tries < 8 && Math.abs(scroller.scrollTop - top) > 2) raf = requestAnimationFrame(restore);
			};
			raf = requestAnimationFrame(restore);
			return () => cancelAnimationFrame(raf);
		}
		if (!scrollTo) {
			scroller?.scrollTo({ top: 0, behavior: "smooth" });
			return;
		}
		let tries = 0, raf;
		let attempt = () => {
			let el = document.getElementById(scrollTo);
			if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
			if (++tries < 10) raf = requestAnimationFrame(attempt);
		};
		raf = requestAnimationFrame(attempt);
		return () => cancelAnimationFrame(raf);
	}, [scrollTo, navSeq]);

	// scroll-spy + scroll memory: on scroll, update the active heading and stash
	// the current scrollTop for this history entry so it can be restored later.
	React.useEffect(() => {
		let scroller = scrollerRef.current;
		if (!scroller) return;
		let raf = 0;
		let compute = () => {
			raf = 0;
			if (histKeyRef.current != null) scrollByKey.current[histKeyRef.current] = scroller.scrollTop;
			// at (or near) the bottom, the last heading wins — it may be too short
			// to ever reach the sensor line otherwise
			if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4) {
				setActiveSlug(headings[headings.length - 1]?.slug || null);
				return;
			}
			let sensor = scroller.getBoundingClientRect().top + 80; // 80px below the top edge
			let active = headings[0]?.slug || null;
			for (let h of headings) {
				let el = document.getElementById(h.slug);
				if (!el) continue;
				if (el.getBoundingClientRect().top <= sensor) active = h.slug;
				else break;
			}
			setActiveSlug(active);
		};
		let onScroll = () => { if (!raf) raf = requestAnimationFrame(compute); };
		scroller.addEventListener("scroll", onScroll, { passive: true });
		compute(); // initial
		return () => { scroller.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
	}, [headings]);

	// which h2 is "open": the active heading's parent section. precompute the
	// owning h2 slug for every heading so an active h3 keeps its parent expanded.
	let activeParent = React.useMemo(() => {
		let parentOf = {};
		for (let sec of toc) {
			parentOf[sec.slug] = sec.slug;
			for (let c of sec.children) parentOf[c.slug] = sec.slug;
		}
		return parentOf[activeSlug] || null;
	}, [toc, activeSlug]);

	// expose TOC + reading progress to the host (GridDemo) so its mobile drawer
	// can render the same table of contents
	React.useEffect(() => {
		onToc?.({ toc, activeSlug, activeParent });
	}, [toc, activeSlug, activeParent]);

	// keep the highlighted TOC entry visible within the (independently scrolling)
	// sidebar — "nearest" only scrolls when it's actually out of view
	let navRef = React.useRef(null);
	React.useEffect(() => {
		if (!activeSlug || !navRef.current) return;
		let link = navRef.current.querySelector(`[data-slug="${activeSlug}"]`);
		link?.scrollIntoView({ block: "nearest" });
	}, [activeSlug]);

	return <div className="dx-root">
		<style>{DX_CSS}</style>
		<Grid layout="tc ?wh | 0 #" sm="tc ?wh | 180 #" lg="tc ?wh | 260 #"
			breaks={{ sm: 641, lg: 992 }} className="dx-grid">
			<nav className="dx-toc" ref={navRef}>
				<div className="dx-toc-hd">Guide</div>
				{toc.map(sec => {
					let open = sec.slug === activeParent;
					return <div key={sec.slug} className="dx-toc-sec">
						<a data-slug={sec.slug} className={`dx-toc-link ${activeSlug === sec.slug ? "act" : ""} ${open ? "open" : ""}`}
							onClick={() => goToSection(sec.slug)}>{renderInline(sec.text, `toc-${sec.slug}`)}</a>
						{open && sec.children.length > 0 &&
							<div className="dx-toc-sub">
								{sec.children.map(c =>
									<a key={c.slug} data-slug={c.slug} className={`dx-toc-link dx-toc-sublink ${activeSlug === c.slug ? "act" : ""}`}
										onClick={() => goToSection(c.slug)}>{renderInline(c.text, `toc-${c.slug}`)}</a>)}
							</div>}
					</div>;
				})}
			</nav>
			<div className="dx-root" ref={scrollerRef} style={{overflow:"auto"}}>
				<article className="dx-article" onClick={onArticleClick}>
					{blocks.map((b, idx) => renderBlock(b, `b${idx}`, onOpenPlayground))}
				</article>
			</div>
		</Grid>
	</div>;
}

// --- styles ---

let DX_CSS = `
.dx-root { width: 100%; height: 100%; font-family: inherit; color: #c9c9d4; background: #13131f; }
.dx-grid { width: 100%; height: 100%; }
.dx-toc { height: 100%; overflow: auto; border-right: 1px solid #2a2a3a; padding: 16px 12px;
	position: sticky; top: 0; font-size: 12px; }
@media (max-width: 640px) { .dx-toc { display: none; } }
.dx-toc-hd { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #686880;
	margin-bottom: 10px; font-weight: 700; }
.dx-toc-sec { margin-bottom: 1px; }
.dx-toc-link { display: block; padding: 4px 8px; color: #8a8aa0; cursor: pointer; border-radius: 4px;
	text-decoration: none; line-height: 1.4; border-left: 2px solid transparent; }
.dx-toc-link:hover { color: #7fdbca; background: #1a1a2a; }
.dx-toc-link code { font-size: 0.92em; color: inherit; background: none; padding: 0; }
/* active section/heading — reading-progress highlight */
.dx-toc-link.act { color: #7fdbca; background: #7fdbca12; border-left-color: #7fdbca; font-weight: 600; }
.dx-toc-link.open:not(.act) { color: #c9c9d4; }
/* expanded h3 children of the on-screen section */
.dx-toc-sub { margin: 2px 0 6px; border-left: 1px solid #2a2a3a; margin-left: 8px; }
.dx-toc-sublink { font-size: 11.5px; padding: 3px 8px 3px 12px; color: #777790; border-left: none;
	border-radius: 0 4px 4px 0; }
.dx-toc-sublink.act { color: #7fdbca; background: #7fdbca10; font-weight: 500; box-shadow: inset 2px 0 0 #7fdbca; }
.dx-article { height: 100%; padding: 24px 32px 80px; max-width: 820px; line-height: 1.7; }
@media (max-width: 640px) { .dx-article { padding: 16px 16px 60px; } }
.dx-h { color: #e8e8f0; font-weight: 700; line-height: 1.25; }
.dx-h1 { font-size: 30px; margin: 0 0 20px; }
.dx-h2 { font-size: 22px; margin: 40px 0 14px; padding-bottom: 8px; border-bottom: 1px solid #2a2a3a;
	color: #7fdbca; scroll-margin-top: 16px; }
.dx-h3 { font-size: 16px; margin: 26px 0 10px; color: #c792ea; }
.dx-h4 { font-size: 14px; margin: 20px 0 8px; color: #9edcd6; }
.dx-p { margin: 0 0 14px; font-size: 14px; }
.dx-quote { margin: 0 0 16px; padding: 10px 14px; border-left: 3px solid #c792ea;
	background: #1a1525; border-radius: 0 4px 4px 0; font-size: 13px; color: #b8a8d8; }
.dx-hr { border: none; border-top: 1px solid #2a2a3a; margin: 28px 0; }
.dx-list { margin: 0 0 14px; padding-left: 22px; font-size: 14px; }
.dx-list li { margin-bottom: 5px; }
.dx-code { background: #0f0f23; color: #c3e88d; padding: 1px 6px; border-radius: 3px;
	font-family: "SF Mono", Menlo, monospace; font-size: 0.88em; }
.dx-link { color: #7fdbca; text-decoration: none; border-bottom: 1px solid #7fdbca40; }
.dx-link:hover { border-bottom-color: #7fdbca; }
.dx-pre { background: #0f0f23; border: 1px solid #2a2a3a; border-radius: 6px; padding: 14px 16px;
	overflow-x: auto; margin: 0 0 16px; }
.dx-pre-code { font-family: "SF Mono", Menlo, monospace; font-size: 12.5px; color: #c3e88d;
	line-height: 1.6; white-space: pre; tab-size: 4; }
.dx-table-wrap { overflow-x: auto; margin: 0 0 16px; }
.dx-table { border-collapse: collapse; font-size: 13px; width: 100%; }
.dx-table th, .dx-table td { border: 1px solid #2a2a3a; padding: 6px 10px; text-align: left;
	vertical-align: top; }
.dx-table th { background: #1a1a2a; color: #9edcd6; font-weight: 600; }
.dx-table td { color: #b0b0c0; }
.dx-ex { margin: 0 0 16px; border: 1px solid #2a2a3a; border-radius: 6px; overflow: hidden; background: #0d0d18; }
.dx-ex-stage { padding: 16px; min-height: 80px; }
.dx-ex-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px;
	padding: 7px 12px; border-top: 1px solid #2a2a3a; background: #15151f; }
.dx-ex-str { font-family: "SF Mono", Menlo, monospace; font-size: 11.5px; color: #c3e88d;
	overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dx-ex-link { font-size: 11px; color: #7fdbca; text-decoration: none; white-space: nowrap; flex-shrink: 0; background: transparent; border: 0; }
.dx-ex-link:hover { text-decoration: underline; }
.dx-ex-err { color: #ff5370; font-size: 12px; padding: 12px; }
.dx-box { border-radius: 6px; padding: 8px 16px; font-size: 12px; font-weight: 600; display: flex;
	align-items: center; justify-content: center; height: 100%; width: 100%; min-height: 0; }
.dx-c0 { background: #1e3a5f; color: #7fdbca; border: 1px solid rgba(255,255,255,0.25); }
.dx-c1 { background: #3a1e5f; color: #c792ea; border: 1px solid rgba(255,255,255,0.25); }
.dx-c2 { background: #1e5f3a; color: #c3e88d; border: 1px solid rgba(255,255,255,0.25); }
.dx-c3 { background: #5f3a1e; color: #ff9e80; border: 1px solid rgba(255,255,255,0.25); }
.dx-c4 { background: #5f1e3a; color: #ff7385; border: 1px solid rgba(255,255,255,0.25); }
.dx-c5 { background: #3a5f1e; color: #dcedc8; border: 1px solid rgba(255,255,255,0.25); }
.dx-c6 { background: #1e5f5f; color: #9edcd6; border: 1px solid rgba(255,255,255,0.25); }
.dx-c7 { background: #5f5f1e; color: #ffeb3b; border: 1px solid rgba(255,255,255,0.25); }
.dx-lorem { border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 12px; color: #888; }
.dx-card { background: #16213e; border: 1px solid #2a2a4a; border-radius: 6px; padding: 10px 14px;
	font-size: 12px; overflow: hidden; display: flex; flex-direction: column; gap: 4px; }
.dx-card-t { color: #7fdbca; font-weight: 600; font-size: 11px; }
.dx-card-b { color: #999; font-size: 10px; line-height: 1.5; }
.dx-tile { border-radius: 4px; display: flex; align-items: center; justify-content: center;
	font-size: 12px; font-weight: 600; }
.dx-num { background: #1a1a2e; border: 1px solid #2a2a4a; border-radius: 3px; display: flex;
	align-items: center; justify-content: center; font-size: 11px; color: #999; }
`;
