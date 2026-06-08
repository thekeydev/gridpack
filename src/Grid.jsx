import React from "react";
import { parseGridLayout, toGridStyle, toAreaStyle } from "./grid-layout-dsl.js";

// --- default breakpoints (container-width based) ---
let DefaultBreaks = { xs: 0, sm: 576, md: 768, lg: 992, xl: 1200 };
let BreakpointNames = ["xs", "sm", "md", "lg", "xl"];

// --- useContainerWidth: ResizeObserver hook ---
let useContainerWidth = (ref) => {
	let [width, setWidth] = React.useState(0);
	React.useEffect(() => {
		let el = ref.current?.parentElement;
		if (!el) return;
		setWidth(el.clientWidth);
		let observer = new ResizeObserver(entries => {
			for (let entry of entries) {
				let w = entry.contentBoxSize
					? entry.contentBoxSize[0]?.inlineSize
					: entry.contentRect.width;
				setWidth(Math.round(w));
			}
		});
		observer.observe(el);
		return () => observer.disconnect();
	}, [ref]);
	return width;
};

// --- resolve active layout from breakpoint props ---
let resolveLayout = (baseLayout, bpLayouts, breaks, width) => {
	if (width === 0) return baseLayout;

	// walk breakpoints descending, find largest that fits
	let sorted = [...BreakpointNames]
		.map(name => ({ name, px: breaks[name] ?? DefaultBreaks[name] }))
		.sort((a, b) => b.px - a.px);
	for (let { name, px } of sorted) {
		if (width >= px && bpLayouts[name]) return bpLayouts[name];
	}
	return baseLayout;
};

// --- flatten children helper ---
let flattenChildren = (children) => {
	let arr = [];
	let flatten = (c) => {
		if (c == null || typeof c === "boolean") return;
		if (Array.isArray(c)) c.forEach(flatten);
		else arr.push(c);
	};
	flatten(children);
	return arr;
};

// ============================================================
// --- extensions ---
// ============================================================

// --- debug: cell overlay ---
let debug = (opts = {}) => ({
	name: "debug",
	render: ({ parsed }) => {
		// in auto-flow mode, overlay divs interfere with auto-placement — skip them
		if (!parsed.templateAreas) return [];
		let color = opts.color || "rgba(255,255,255,0.25)";
		let elements = [];
		for (let r = 0; r < parsed.rowCount; r++) {
			for (let c = 0; c < parsed.colCount; c++) {
				elements.push(
					<div key={`debug-${r}-${c}`} style={{
						gridRow: `${r + 1} / ${r + 2}`,
						gridColumn: `${c + 1} / ${c + 2}`,
						border: `1px dashed ${color}`,
						pointerEvents: "none",
						zIndex: 1000,
					}} />
				);
			}
		}
		return elements;
	},
	// in auto-flow mode, use outline on children instead (doesn't affect layout)
	areaStyle: (area, vars) => {
		let color = opts.color || "rgba(255,255,255,0.25)";
		return { outline: `1px dashed ${color}`, outlineOffset: "-1px" };
	},
});

// --- collapsible: toggle an area between expanded/collapsed ---
// uses a var to control the size, toggles on click
// opts: { var, expanded, collapsed, area, handle }
// - var: name of the var to control (e.g. "sidebar")
// - expanded: value when expanded (default: 250)
// - collapsed: value when collapsed (default: 0)
// - area: which area to place the toggle handle in
// - handle: "start" | "end" | "top" | "bottom" — where the toggle renders
let collapsible = (opts) => ({
	name: "collapsible",
	needsAreas: true,
	render: ({ parsed, vars, setVar, containerRef }) => {
		let { var: varName, expanded = 250, collapsed = 0, area, handle = "end" } = opts;
		let isCollapsed = (vars[varName] ?? expanded) <= collapsed;

		let isVertical = handle === "start" || handle === "end";
		let handleStyle = {
			gridArea: area,
			alignSelf: handle === "top" || handle === "start" ? "start" :
				handle === "bottom" || handle === "end" ? "end" : "center",
			justifySelf: isVertical ? "end" : "center",
			width: isVertical ? "16px" : "100%",
			height: isVertical ? "100%" : "16px",
			cursor: "pointer",
			display: "flex",
			alignItems: "center",
			justifyContent: "end",
			zIndex: 100,
			userSelect: "none",
			fontSize: "10px",
			color: "rgba(255,255,255,0.4)",
			pointerEvents: "auto",
			position: "relative",
			left: 8,
		};

		let arrow = isCollapsed
			? (isVertical ? "\u25B6" : "\u25BC")
			: (isVertical ? "\u25C0" : "\u25B2");

		let toggle = () => setVar(varName, isCollapsed ? expanded : collapsed);

		return [
			<div key={`collapse-${varName}`} style={handleStyle} onClick={toggle}>{arrow}</div>
		];
	},
	containerStyle: () => ({ /*transition: "grid-template-columns 0.2s, grid-template-rows 0.2s",*/ overflow: "unset" }),
});

// --- accordion: mutual exclusion — expanding one collapses others ---
// opts: { var, items: [{ area, expanded }], collapsed }
// the var holds the currently expanded area name (or null for all collapsed)
let accordion = (opts) => ({
	name: "accordion",
	needsAreas: true,
	render: ({ parsed, vars, setVar }) => {
		let { var: varName, items, collapsed = 0 } = opts;
		let activeArea = vars[varName] ?? null;

		return items.map(item => {
			let isActive = activeArea === item.area;
			let handleStyle = {
				gridArea: item.area,
				alignSelf: "start",
				justifySelf: "stretch",
				height: "24px",
				cursor: "pointer",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				zIndex: 100,
				userSelect: "none",
				fontSize: "10px",
				color: "rgba(255,255,255,0.5)",
				background: "rgba(255,255,255,0.05)",
				borderRadius: "2px",
				pointerEvents: "auto",
			};

			let toggle = () => setVar(varName, isActive ? null : item.area);
			let arrow = isActive ? "\u25B2" : "\u25BC";

			return (
				<div key={`accordion-${item.area}`} style={handleStyle} onClick={toggle}>
					{item.area} {arrow}
				</div>
			);
		});
	},
	// accordion needs to set size vars for each item based on active state
	transformVars: (vars, opts2) => {
		let { var: varName, items, collapsed = 0 } = opts;
		let activeArea = vars[varName] ?? null;
		let newVars = { ...vars };
		for (let item of items) {
			if (item.sizeVar) newVars[item.sizeVar] = activeArea === item.area ? (item.expanded || 200) : collapsed;
		}
		return newVars;
	},
});

// --- splitPane: draggable handle between areas ---
// opts: { var, edge, min, max }
// - var: name of the var to control
// - edge: "a:tlbr" means top/left/bottom/right edge of area a, "a:TLBR" means inverted
// - min/max: pixel constraints
let splitPane = (opts) => ({
	name: "splitPane",
	needsAreas: true,
	render: ({ parsed, vars, setVar, containerRef }) => {
		let { var: varName, edge, min = 0, max = 9999, handleSize = 6, handleClass = undefined } = opts;

		// parse edge: "a:e" -> area a, side end
		let [edgeArea, edgeSide] = edge.split(":");
		let edgeLower = edgeSide.toLowerCase();
		let axis = edgeLower === "l" || edgeLower === "r" ? "x" : "y";
		let isX = axis === "x";

		let flex = parsed.mode === "flex";

		// in flex mode, position handle via order between the two areas
		// find the index of edgeArea among the areas list
		let handleOrder = null;
		if (flex) {
			let areaIdx = parsed.areas.indexOf(edgeArea);
			// place handle after edgeArea (order = areaIdx + 0.5 isn't valid — use areaIdx * 2 + 1)
			// assign order to all children via areaStyle instead; here just set the handle order
			handleOrder = areaIdx * 2 + 1;
		}

		let handleStyle = {
			...(flex ? {
				order: handleOrder,
				alignSelf: "stretch",
				flexShrink: 0,
				position: "relative",
				zIndex: 200,
				pointerEvents: "none",
				touchAction: "none",
				...(isX ? { width: 0, minWidth: 0 } : { height: 0, minHeight: 0 }),
			} : {
				gridArea: edgeArea,
				alignSelf: "stretch",
				justifySelf: "stretch",
				position: "relative",
				zIndex: 200,
				pointerEvents: "none",
				touchAction: "none",
			}),
		};

		let barStyle = {
			position: "absolute",
			pointerEvents: "auto",
			zIndex: 201,
			...(isX ? {
				top: 0, bottom: 0, width: handleSize + "px",
				cursor: "col-resize",
				[edgeLower === "r" ? "right" : "left"]: -Math.floor(handleSize / 2) + "px",
			} : {
				left: 0, right: 0, height: handleSize + "px",
				cursor: "row-resize",
				[edgeLower === "b" ? "bottom" : "top"]: -Math.floor(handleSize / 2) + "px",
			}),
//			background: "rgba(255,255,255,0.08)",
			transition: "background 0.15s",
		};

		let onPointerDown = (e) => {
			e.preventDefault();
			e.target.setPointerCapture(e.pointerId);
			let container = containerRef.current;
			if (!container) return;
			let startPos = isX ? e.clientX : e.clientY;
			let startVal = parseFloat(vars[varName]) || 0;

			// invert direction for right/bottom edges
			let invert = edgeSide === edgeSide.toUpperCase() ? -1 : 1;

			let onMove = (e2) => {
				let delta = ((isX ? e2.clientX : e2.clientY) - startPos) * invert;
				let newVal = Math.round(Math.min(max, Math.max(min, startVal + delta)));
				setVar(varName, newVal);
			};

			let onUp = () => {
				document.body.style.cursor = "";
				document.body.style.userSelect = "";
				document.removeEventListener("pointermove", onMove);
				document.removeEventListener("pointerup", onUp);
			};

			document.body.style.cursor = isX ? "col-resize" : "row-resize";
			document.body.style.userSelect = "none";
			document.addEventListener("pointermove", onMove);
			document.addEventListener("pointerup", onUp);
		};

//		onPointerEnter={e => e.target.style.background = "rgba(255,255,255,0.2)"}
//		onPointerLeave={e => e.target.style.background = "rgba(255,255,255,0.08)"}
		return [
			<div key={`split-zone-${varName}`} style={handleStyle}>
				<div
					style={barStyle} className={handleClass}
					onPointerDown={onPointerDown}
				/>
			</div>
		];
	},
	areaStyle: (area, vars, parsed) => {
		if (!parsed || parsed.mode !== "flex") return null;
		let idx = parsed.areas.indexOf(area);
		if (idx === -1) return null;
		return { order: idx * 2 }; // even slots for areas, odd slots for handles
	},
});

// --- scrollable: make an area scrollable ---
// opts: { area, axis? }
// axis: "both" (default) | "x" | "y"
let scrollable = (opts) => ({
	name: "scrollable",
	needsAreas: true,
	render: ({ parsed }) => {
		let areas = Array.isArray(opts.area) ? opts.area : [opts.area];
		let axis = opts.axis || "both";
		let overflow = axis === "x" ? { overflowX: "auto", overflowY: "hidden" }
			: axis === "y" ? { overflowX: "hidden", overflowY: "auto" }
			: { overflow: "auto" };
		return areas.map(area => <div key={`scroll-${area}`} style={{
			gridArea: area, alignSelf: "stretch", justifySelf: "stretch",
			...overflow, pointerEvents: "none", zIndex: 0,
		}} />);
	},
	// the real work: inject overflow on the area's wrapper div
	areaStyle: (area) => {
		let areas = Array.isArray(opts.area) ? opts.area : [opts.area];
		if (!areas.includes(area)) return null;
		let axis = opts.axis || "both";
		if (axis === "x") return { overflowX: "auto", overflowY: "hidden" };
		if (axis === "y") return { overflowX: "hidden", overflowY: "auto" };
		return { overflow: "auto" };
	},
});

// --- overlay: place an area on top of another area's grid cells ---
// opts: { area, over, blur? }
// the overlay area gets the same grid-row/grid-column as the "over" area, with high z-index
// optionally adds a backdrop blur
let overlay = (opts) => ({
	name: "overlay",
	needsAreas: true,
	areaStyle: (area, vars) => {
		if (area !== opts.area) return null;
		// override grid-area with explicit row/col matching the "over" target
		// we can't resolve this here since we don't know the parsed grid positions
		// instead we mark it for the render hook to handle
		return { zIndex: 500, position: "relative" };
	},
	render: ({ parsed }) => {
		// find the "over" area's grid position from template-areas
		// and inject it as grid-row/grid-column on the overlay area's wrapper
		// but we can't modify the wrapper from render — we return overlay elements instead
		return [];
	},
	// the key trick: remap the area in the parsed result so it covers the "over" area's cells
	transformAreas: (parsed) => {
		if (!opts.over) return parsed;
		let map = parsed.areaNameMap || {};
		let overName = map[opts.over] || opts.over;
		let areaName = map[opts.area] || opts.area;
		// find bounding box of "over" area in templateAreas
		let rows = parsed.templateAreas.map(r => r.replace(/"/g, "").trim().split(/\s+/));
		let minR = Infinity, maxR = -1, minC = Infinity, maxC = -1;
		for (let r = 0; r < rows.length; r++) {
			for (let c = 0; c < rows[r].length; c++) {
				if (rows[r][c] === overName) {
					minR = Math.min(minR, r); maxR = Math.max(maxR, r);
					minC = Math.min(minC, c); maxC = Math.max(maxC, c);
				}
			}
		}
		if (minR > maxR) return parsed; // "over" area not found
		return { ...parsed, _overlayPositions: { ...parsed._overlayPositions, [areaName]: { row: `${minR+1}/${maxR+2}`, col: `${minC+1}/${maxC+2}` } } };
	},
});

// --- animate: CSS transitions on grid changes ---
// opts: { properties?, duration?, easing? }
let animate = (opts = {}) => ({
	name: "animate",
	containerStyle: ({ parsed }) => {
		let dur = opts.duration || "0.25s";
		let ease = opts.easing || "ease";
		if (parsed.mode === "flex") {
			// flex containers don't have grid-template-* — animate flex-wrap layout changes
			// item-level flex-basis transitions are handled in areaStyle below
			return {};
		}
		let props = opts.properties || ["grid-template-columns", "grid-template-rows"];
		return { transition: props.map(p => `${p} ${dur} ${ease}`).join(", ") };
	},
	areaStyle: (area, vars, parsed) => {
		if (!parsed || parsed.mode !== "flex") return null;
		let dur = opts.duration || "0.25s";
		let ease = opts.easing || "ease";
		return { transition: `flex-basis ${dur} ${ease}, max-width ${dur} ${ease}, max-height ${dur} ${ease}` };
	},
});

// --- multiColumn: CSS multi-column inside an area, aligned to grid tracks ---
// opts: { area }
// reads computed grid column widths and sets column-width/column-gap to match
let multiColumn = (opts) => ({
	name: "multiColumn",
	needsAreas: true,
	render: ({ containerRef, parsed }) => {
		let map = parsed.areaNameMap || {};
		let area = map[opts.area] || opts.area;
		// find which grid columns this area spans
		let rows = parsed.templateAreas.map(r => r.replace(/"/g, "").trim().split(/\s+/));
		let minC = Infinity, maxC = -1;
		for (let r of rows)
			for (let c = 0; c < r.length; c++)
				if (r[c] === area) { minC = Math.min(minC, c); maxC = Math.max(maxC, c); }
		if (minC > maxC) return [];

		let spanCount = maxC - minC + 1;
		if (spanCount <= 1) return []; // single column, nothing to do

		// we need to measure actual computed track widths after render
		// use a zero-height measuring element that spans the area
		// and a ResizeObserver / useEffect to read computed column widths
		// but since render returns static elements, we'll use a self-measuring component
		return [<MultiColumnMeasurer key={`mcol-${area}`} area={area} spanStart={minC} spanCount={spanCount} containerRef={containerRef} gapH={parsed.gapH} fill={opts.fill} />];
	},
	areaStyle: (area) => {
		if (area !== opts.area) return null;
		// mark for multi-column — actual values set by measurer
		return { _multiColumn: true };
	},
});

// helper component that measures grid tracks and applies CSS columns
let MultiColumnMeasurer = ({ area, spanStart, spanCount, containerRef, gapH, fill }) => {
	React.useEffect(() => {
		let container = containerRef.current;
		if (!container) return;

		let update = () => {
			let computed = getComputedStyle(container);
			let colWidths = computed.gridTemplateColumns.split(/\s+/).map(parseFloat);
			let gap = parseFloat(computed.columnGap) || gapH || 0;

			// find the area's wrapper div by grid-area
			let areaEl = container.querySelector(`[style*="grid-area: ${area}"]`) ||
				container.querySelector(`[style*="grid-area:${area}"]`);
			if (!areaEl) return;

			// each spanned grid column becomes a CSS column
			// column-width = first track width (they may differ, use min for safety)
			let trackWidths = colWidths.slice(spanStart, spanStart + spanCount);
			let minTrack = Math.min(...trackWidths);

			let padLeft = parseInt(areaEl.style.paddingLeft);
			let padRight = parseInt(areaEl.style.paddingRight);
			areaEl.style.paddingLeft;
			areaEl.style.columnCount = spanCount;
			areaEl.style.columnGap = (padLeft + gap + padRight) + "px";
			areaEl.style.columnWidth = "0px";//minTrack + "px";
			if (fill) areaEl.style.columnFill = fill;
		};

		update();
		let observer = new ResizeObserver(update);
		observer.observe(container);
		return () => observer.disconnect();
	}, [area, spanStart, spanCount, containerRef, gapH, fill]);

	return null; // invisible, just runs the effect
};

// --- fisheye: grid tracks expand near cursor, compress away ---
// works in fr units — only redistributes fr-based tracks, fixed tracks (px, auto) stay untouched
// opts: { axis?, intensity?, min?, sticky? }
// sets --fe-scale, --fe-scale-x, --fe-scale-y CSS custom properties on each child
let FisheyeEffect = ({ containerRef, parsed, axis, intensity, minFr, stickyMode }) => {
	React.useEffect(() => {
		let container = containerRef.current;
		if (!container) return;
		let raf = null;

		let colSizes = parsed.colSizes;
		let rowSizes = parsed.rowSizes;
		let colFlex = colSizes.map(s => s.includes("fr"));
		let rowFlex = rowSizes.map(s => s.includes("fr"));
		// if no flex tracks on an axis, treat auto tracks as flexible (otherwise fisheye is a no-op)
		if (!colFlex.some(Boolean)) colFlex = colSizes.map(s => s === "auto");
		if (!rowFlex.some(Boolean)) rowFlex = rowSizes.map(s => s === "auto");
		let flexColCount = colFlex.filter(Boolean).length;
		let flexRowCount = rowFlex.filter(Boolean).length;

		let gaussian = (dist, sigma) => sigma === 0 ? 1 : Math.exp(-(dist * dist) / (2 * sigma * sigma));

		let computeFr = (flexMask, cursorRatio) => {
			let totalTracks = flexMask.length;
			let flexCount = flexMask.filter(Boolean).length;
			if (flexCount === 0) return flexMask.map(() => 1);
			let sigma = 0.3 * intensity;
			let boost = 1 + intensity * 2;
			let frs = flexMask.map((isFlex, i) => {
				if (!isFlex) return 1;
				let center = (i + 0.5) / totalTracks;
				let w = gaussian(Math.abs(center - cursorRatio), sigma);
				return Math.max(minFr, 1 + (boost - 1) * w - (1 - w) * intensity * 0.5);
			});
			let flexFrs = frs.filter((_, i) => flexMask[i]);
			let avg = flexFrs.reduce((a, b) => a + b, 0) / flexCount;
			return frs.map((f, i) => flexMask[i] ? f / avg : 1);
		};

		let buildSizeStr = (origSizes, flexMask, frs) =>
			origSizes.map((s, i) => flexMask[i] ? frs[i].toFixed(4) + "fr" : s).join(" ");

		let applyScales = (colFrs, rowFrs) => {
			// pre-build area -> position lookup from templateAreas
			let areaPos = {};
			if (parsed.templateAreas) {
				for (let r = 0; r < parsed.templateAreas.length; r++) {
					let cells = parsed.templateAreas[r].replace(/"/g, "").trim().split(/\s+/);
					for (let c = 0; c < cells.length; c++) {
						if (cells[c] !== "." && !areaPos[cells[c]]) areaPos[cells[c]] = { col: c + 1, row: r + 1 };
					}
				}
			}
			let childIdx = 0;
			for (let child of container.children) {
				let col = NaN, row = NaN;
				// try getComputedStyle first (works for explicit grid-column/row)
				let cs = getComputedStyle(child);
				col = parseInt(cs.gridColumnStart);
				row = parseInt(cs.gridRowStart);
				// fallback: resolve from grid-area name via templateAreas
				if (isNaN(col) || isNaN(row)) {
					// gridArea serializes as "name / name / name / name" — extract first token
					let raw = child.style.gridArea || cs.gridArea || "";
					let area = raw.split("/")[0].trim();
					let pos = areaPos[area];
					if (pos) { col = pos.col; row = pos.row; }
				}
				// fallback: compute from child index (auto-flow)
				if (isNaN(col) || isNaN(row)) {
					col = (childIdx % parsed.colCount) + 1;
					row = Math.floor(childIdx / parsed.colCount) + 1;
				}
				let sx = col > 0 && col <= colFrs.length ? colFrs[col - 1] : 1;
				let sy = row > 0 && row <= rowFrs.length ? rowFrs[row - 1] : 1;
				child.style.setProperty("--fe-scale", Math.min(sx, sy).toFixed(3));
				child.style.setProperty("--fe-scale-x", sx.toFixed(3));
				child.style.setProperty("--fe-scale-y", sy.toFixed(3));
				childIdx++;
			}
		};

		let onMove = (e) => {
			let rect = container.getBoundingClientRect();
			if (raf) cancelAnimationFrame(raf);
			raf = requestAnimationFrame(() => {
				let colFrs = Array(colSizes.length).fill(1);
				let rowFrs = Array(rowSizes.length).fill(1);
				if ((axis === "x" || axis === "both") && flexColCount > 0) {
					colFrs = computeFr(colFlex, (e.clientX - rect.left) / rect.width);
					container.style.gridTemplateColumns = buildSizeStr(colSizes, colFlex, colFrs);
				}
				if ((axis === "y" || axis === "both") && flexRowCount > 0) {
					rowFrs = computeFr(rowFlex, (e.clientY - rect.top) / rect.height);
					container.style.gridTemplateRows = buildSizeStr(rowSizes, rowFlex, rowFrs);
				}
				applyScales(colFrs, rowFrs);
			});
		};

		let onLeave = () => {
			if (stickyMode) return;
			if (raf) cancelAnimationFrame(raf);
			if (axis === "x" || axis === "both")
				container.style.gridTemplateColumns = colSizes.join(" ");
			if (axis === "y" || axis === "both")
				container.style.gridTemplateRows = rowSizes.join(" ");
			applyScales(Array(colSizes.length).fill(1), Array(rowSizes.length).fill(1));
		};

		container.style.touchAction = "none";
		container.addEventListener("pointermove", onMove);
		container.addEventListener("pointerleave", onLeave);
		return () => {
			container.removeEventListener("pointermove", onMove);
			container.removeEventListener("pointerleave", onLeave);
			if (raf) cancelAnimationFrame(raf);
		};
	}, [containerRef, parsed, axis, intensity, minFr, stickyMode]);

	return null;
};

let fisheye = (opts = {}) => ({
	name: "fisheye",
	render: ({ containerRef, parsed }) => {
		let { axis = "x", intensity = 0.6, min: minFr = 0.15, sticky: stickyMode = false } = opts;
		// swap axis when layout is transposed so fisheye follows the content direction
		if (parsed.transpose && axis !== "both") axis = axis === "x" ? "y" : "x";
		return [<FisheyeEffect key="fisheye" containerRef={containerRef} parsed={parsed}
			axis={axis} intensity={intensity} minFr={minFr} stickyMode={stickyMode} />];
	},
});

// --- tabs: tab headers with content switching ---
// opts: { var, items: [{ label, area }], position? }
// position: "top" (default) | "bottom"
let tabs = (opts) => ({
	name: "tabs",
	render: ({ vars, setVar }) => {
		let { var: varName, items, position = "top" } = opts;
		let activeArea = vars[varName] ?? items[0]?.area;

		let barStyle = {
			gridColumn: "1 / -1",
			gridRow: position === "bottom" ? "-1" : "1",
			display: "flex", gap: 0,
			background: "rgba(255,255,255,0.03)",
			borderBottom: position === "top" ? "1px solid rgba(255,255,255,0.1)" : "none",
			borderTop: position === "bottom" ? "1px solid rgba(255,255,255,0.1)" : "none",
			zIndex: 100, alignSelf: "stretch", justifySelf: "stretch",
		};

		let tabButtons = items.map(item => {
			let isActive = activeArea === item.area;
			return <div key={`tab-${item.area}`} onClick={() => setVar(varName, item.area)} style={{
				padding: "6px 14px", cursor: "pointer", fontSize: 11, userSelect: "none",
				color: isActive ? "rgba(127,219,202,1)" : "rgba(255,255,255,0.4)",
				borderBottom: isActive ? "2px solid rgba(127,219,202,1)" : "2px solid transparent",
				transition: "all 0.15s",
			}}>{item.label || item.area}</div>;
		});

		return [<div key="tab-bar" style={barStyle}>{tabButtons}</div>];
	},
	// hide inactive areas by setting height to 0
	areaStyle: (area) => {
		let { var: varName, items } = opts;
		let isTabArea = items.some(it => it.area === area);
		if (!isTabArea) return null;
		// we can't read vars here directly, but we can return a function-like marker
		// actually areaStyle gets vars passed — let's adjust the interface
		return { _tabVar: varName, _tabArea: area };
	},
	transformVars: (vars) => {
		let { var: varName, items } = opts;
		let activeArea = vars[varName] ?? items[0]?.area;
		let newVars = { ...vars };
		for (let item of items) {
			let sizeVar = item.sizeVar || ("_tab_" + item.area);
			newVars[sizeVar] = activeArea === item.area ? "." : "0";
		}
		return newVars;
	},
});

// ============================================================
// --- Grid component ---
// ============================================================

let Grid = ({ layout, col, gap, breaks, xs, sm, md, lg, xl,
	vars: varsProp, onVarsChange, extensions = [],
	nodivs = false, mode: modeProp,
	className, style, children, ...rest
}) => {
	// --- internal vars state (used when uncontrolled) ---
	let [internalVars, setInternalVars] = React.useState({});
	let vars = varsProp ?? internalVars;
	let setVar = React.useCallback((key, val) => {
		let next = { ...vars, [key]: val };
		if (onVarsChange) onVarsChange(next);
		else setInternalVars(next);
	}, [vars, onVarsChange]);

	// --- apply transformVars from extensions ---
	let effectiveVars = vars;
	for (let ext of extensions) {
		if (ext.transformVars) effectiveVars = ext.transformVars(effectiveVars);
	}

	// --- responsive ---
	let bpLayouts = { xs, sm, md, lg, xl };
	let hasResponsive = BreakpointNames.some(n => bpLayouts[n]);

	let containerRef = React.useRef(null);

	let isArea = c => c.type!="style" && c.type.name!="Style" && !c.type?.__notAComponent;
	let childArray = React.useMemo(() => flattenChildren(children), [children]);
	let childCount = childArray.filter(isArea).length;

	// resolve layout string
	let baseLayout = layout || "";
	if (col && !baseLayout.startsWith("|")) baseLayout = "|" + baseLayout;

	// check if base layout produces a full-width grid
	let baseResolved = baseLayout;
	if (effectiveVars) baseResolved = baseResolved.replace(/\{(\w+)\}/g, (_, k) => effectiveVars[k] ?? "");
	let baseParsed = React.useMemo(() => parseGridLayout(baseResolved, childCount, modeProp || "grid"), [baseResolved, childCount, modeProp]);
	let baseIsFullWidth = !baseParsed.error && (
		baseParsed.flags?.fullWidth ||
		baseParsed.growAreas?.length > 0
//		||
//		baseParsed.colSizes?.some(s => s.includes("fr"))
	);

	// only observe when responsive AND the grid is externally sized (full width)
	let shouldObserve = hasResponsive && baseIsFullWidth;
	let width = useContainerWidth(shouldObserve ? containerRef : { current: null }, breaks);

	let activeLayout = hasResponsive
		? resolveLayout(baseLayout, bpLayouts, breaks || {}, width)
		: baseLayout;

	// replace {varname} placeholders
	if (effectiveVars)
		activeLayout = activeLayout.replace(/\{(\w+)\}/g, (_, k) => effectiveVars[k] ?? "");

	// parse
	let parsedRaw = React.useMemo(
		() => parseGridLayout(activeLayout, childCount, modeProp || "grid"),
		[activeLayout, childCount, modeProp],
	);

	// --- auto-flow -> named areas when extensions need it ---
	// if any extension declares needsAreas and the layout is auto-flow,
	// generate synthetic templateAreas so gridArea works for both children and extension elements
	let parsed = React.useMemo(() => {
		if (parsedRaw.error) return parsedRaw;
		if (!parsedRaw.autoFlow || !extensions.some(e => e.needsAreas)) return parsedRaw;

		let { areas, colCount, rowCount, childSpans, transpose: tp, flags } = parsedRaw;
		let grid = Array.from({ length: rowCount }, () => Array(colCount).fill("."));

		// generate unique area names per child
		let uniqueAreas = areas.map((a, i) => "c" + i);

		// determine effective flow direction (must match what gridAutoFlow would be)
		let colFlow = tp ? !flags.flowReverse : flags.flowReverse;

		// place each child into the grid, respecting spans and flow direction
		let r = 0, c = 0;
		for (let i = 0; i < uniqueAreas.length; i++) {
			let span = childSpans?.[i]?.span || 1;
			if (colFlow) {
				// column flow: advance down rows, then next column
				if (r + span > rowCount) { c++; r = 0; }
				if (c >= colCount) break;
				for (let s = 0; s < span; s++) {
					if (r + s < rowCount) grid[r + s][c] = uniqueAreas[i];
				}
				r += span;
				if (r >= rowCount) { r = 0; c++; }
			} else {
				// row flow: advance across columns, then next row
				if (c + span > colCount) { r++; c = 0; }
				if (r >= rowCount) break;
				for (let s = 0; s < span; s++) {
					if (c + s < colCount) grid[r][c + s] = uniqueAreas[i];
				}
				c += span;
				if (c >= colCount) { r++; c = 0; }
			}
		}

		let templateAreas = grid.map(row => '"' + row.join(" ") + '"');

		// build a lookup from original area names to the first matching unique name
		// so extensions using gridArea: "s" can resolve to the right cell
		let areaNameMap = {};
		for (let i = 0; i < areas.length; i++) {
			if (!areaNameMap[areas[i]]) areaNameMap[areas[i]] = uniqueAreas[i];
		}

		return { ...parsedRaw, areas: uniqueAreas, originalAreas: areas, templateAreas, areaNameMap };
	}, [parsedRaw, extensions]);

	if (parsed.error) {
		console.warn("Grid layout error:", parsed.error);
		return <div ref={containerRef} className={className} style={style} {...rest}>{children}</div>;
	}

	// build container style
	let gridStyle = toGridStyle(parsed);

	// override gap from prop if provided
	if (gap != null) gridStyle.gap = typeof gap === "number" ? gap + "px" : gap;

	// apply extension container styles
	for (let ext of extensions) {
		if (ext.containerStyle) Object.assign(gridStyle, ext.containerStyle({ parsed, vars: effectiveVars }));
	}

	// apply transformAreas (overlay positioning)
	let effectiveParsed = parsed;
	for (let ext of extensions) {
		if (ext.transformAreas) effectiveParsed = ext.transformAreas(effectiveParsed);
	}
	let overlayPositions = effectiveParsed._overlayPositions || {};

	// merge with user style
	let containerStyle = { ...gridStyle, ...style };

	// assign children to areas
	let i = 0;
	let extNeedsWrapper = extensions.some(ext => ext.needsWrapper);
	let cellWrapper = null;
	for (let ext of extensions) {
		if (ext.wrapCell) { cellWrapper = ext.wrapCell; break; }
	}
	let mappedChildren = childArray.map((child,childIdx) => {
		if (i >= parsed.areas.length) return child; // overflow children render without grid-area
		let area = parsed.areas[i];
		let origArea = parsed.originalAreas ? parsed.originalAreas[i] : area;
		if (parsed.templateAreas && !parsed.templateAreas.some(t => t.includes(area))
			&& !(parsed.placementOverrides && parsed.placementOverrides[area])) {
			i++;
			return null;
		}
		let areaStyle = toAreaStyle(parsed, area, childIdx);

		// apply overlay position overrides (replaces grid-area with explicit row/col)
		let ovPos = overlayPositions[origArea] || overlayPositions[area];
		if (ovPos) {
			delete areaStyle.gridArea;
			areaStyle.gridRow = ovPos.row;
			areaStyle.gridColumn = ovPos.col;
			areaStyle.zIndex = 500;
		}

		// apply extension area styles — pass original area name so extensions match their config
		for (let ext of extensions) {
			if (ext.areaStyle) {
				let extStyle = ext.areaStyle(origArea, effectiveVars, parsed);
				if (extStyle) {
					// filter out internal markers
					let clean = {};
					for (let [k, v] of Object.entries(extStyle)) { if (!k.startsWith("_")) clean[k] = v; }
					Object.assign(areaStyle, clean);
				}
			}
		}

		if (cellWrapper) return cellWrapper(child, areaStyle, area + "-" + i++, childIdx, parsed);
		if (!isArea(child)) return child;
		let key = area + "-" + i++;
		// inject grid styles directly onto DOM elements — no wrapper div needed
		// extensions that mutate item DOM (masonry) need wrappers
		// alignment (justifySelf/alignSelf) may need a wrapper to isolate from child sizing
//		let needsWrap = extNeedsWrapper || nodivs || areaStyle.justifySelf || areaStyle.alignSelf;
		let needsWrap = extNeedsWrapper || nodivs;
		// pick up className and alias from areaProps
		let ap = parsed.areaProps && parsed.areaProps[origArea];
		let areaClass = ap?.className || null;
		let areaName = ap?.alias || origArea;
		if (typeof child.type === "string" && !needsWrap) {
			let merged = { key, style: { ...child.props.style, ...areaStyle } };
			if (areaClass) merged.className = [child.props.className, areaClass].filter(Boolean).join(" ");
			return React.cloneElement(child, merged);
		}
		return <div key={key} style={areaStyle} className={areaClass || undefined} data-area={areaName}>{child}</div>;
	});

	// --- render extension elements ---
	let extCtx = { parsed, vars: effectiveVars, setVar, containerRef };
	let extensionElements = extensions.flatMap(ext => ext.render ? ext.render(extCtx) : []);

	// remap gridArea in extension elements when auto-flow was converted to named areas
	let areaNameMap = parsed.areaNameMap;
	if (areaNameMap) {
		extensionElements = extensionElements.map(el => {
			if (!el?.props?.style?.gridArea) return el;
			let mapped = areaNameMap[el.props.style.gridArea];
			if (!mapped) return el;
			return React.cloneElement(el, { style: { ...el.props.style, gridArea: mapped } });
		});
	}

	// renderContainer hook — lets an extension take full control of the DOM tree
	let allChildren = [...mappedChildren, ...extensionElements];
	let containerProps = { ref: containerRef, className, style: containerStyle, ...rest };
	for (let ext of extensions) {
		if (ext.renderContainer) return ext.renderContainer({ props: containerProps, children: allChildren, parsed });
	}

	return <div {...containerProps}>
		{allChildren}
	</div>
};

export default Grid;

// --- Flex: same as Grid but defaults to flex mode ---
let Flex = (props) => <Grid {...props} mode={props.mode || "flex"} />;

// --- Layout: chameleon variant — "d" prop, auto mode detection ---
// use d= instead of layout= for the definition string
let Layout = ({ d, layout, mode, ...props }) =>
	<Grid {...props} layout={d || layout} mode={mode || "auto"} />;

// opts.container  — renderContainer({ props, children, parsed }) => element
// opts.cell       — wrapCell(child, areaStyle, key, childIdx, parsed) => element
let render = (opts) => ({
	name: "render",
	...(opts.container && { renderContainer: opts.container }),
	...(opts.cell && { wrapCell: opts.cell }),
});

// --- masonry extension for gridpack ---
// adapts the masonry-grid algorithm (TrigenSoftware/masonry-grid) into
// a gridpack extension. uses translateY (or translateX when transposed)
// to close vertical gaps in an auto-flow grid.
//
// two sizing modes per item (auto-detected):
//   1. aspect-ratio: item has --width/--height CSS vars -> height from ratio
//   2. measured: no vars -> height from offsetHeight (content-sized)
//
// transpose: layout string starting with | swaps axes — masonry packs
// horizontally instead of vertically.
//
// usage:
//   masonry()                   -> regular masonry
//   masonry({ balanced: true }) -> balanced (reorder for min height)
//
// column sizing is controlled by the layout string via *-prefix:
//   * 10 ?w | *200~#    ? repeat(auto-fill, minmax(200px, 1fr))
//   * 10 ?w | *200~#*   ? repeat(auto-fit, minmax(200px, 1fr))
//
// opts:
//   balanced   -> reorder items within rows for minimal height (default: false)

let MasonryEffect = ({ containerRef, parsed, balanced }) => {
	React.useEffect(() => {
		let container = containerRef.current;
		if (!container) return;

		let tp = parsed.transpose;

		let gap = -1;
		let trackSizes = null; // array of track widths (one per column/row)
		let containerWidth = -1;
		let columnsCount = -1;
		let containerAspectRatio = -1;
		let positionsMap = new WeakMap();

		// --- read --width/--height from element or its first child ---
		let readRatio = el => {
			let w = parseFloat(el.style.getPropertyValue("--width"));
			let h = parseFloat(el.style.getPropertyValue("--height"));
			if (!isNaN(w) && !isNaN(h) && w!==0) return h / w;
			return NaN;
		};

		// --- prepare element: hoist vars + set aspect-ratio, or clear it ---
		let prepareElement = el => {
			let r = readRatio(el);
			if (isNaN(r)) {
				let child = el.firstElementChild;
				if (child) {
					r = readRatio(child);
					if (!isNaN(r)) {
						el.style.setProperty("--width", child.style.getPropertyValue("--width"));
						el.style.setProperty("--height", child.style.getPropertyValue("--height"));
					}
				}
			}
			if (!isNaN(r)) {
				let w = el.style.getPropertyValue("--width");
				let h = el.style.getPropertyValue("--height");
				// when transposed, swap aspect-ratio so the "short" axis is controlled
				el.style.aspectRatio = tp ? (h + " / " + w) : (w + " / " + h);
				return { ratio: r, measured: false };
			}
			el.style.removeProperty("aspect-ratio");
			return { ratio: NaN, measured: true };
		};

		// --- get item size along the masonry axis ---
		// normal: height (masonry packs vertically)
		// transposed: width (masonry packs horizontally)
		let getItemSize = (el, i, info) => {
			if (!info.measured) return info.ratio * trackSizes[i % columnsCount];
			return tp ? el.offsetWidth : el.offsetHeight;
		};

		let getFramePosition = (el, i, offset, info) => {
			let height = getItemSize(el, i, info);
			let bottom = offset + height + (i >= columnsCount ? gap : 0);
			return { realIndex: i, virtualIndex: i,
				height, realBottom: bottom, virtualBottom: bottom };
		};

		// --- balance a row by reordering to minimize height ---
		let balanceRow = (positions, start, end) => {
			let prevRow = [];
			let currRow = [];
			for (let s = 0, t = start; t <= end; s++, t++) {
				prevRow[s] = positions[t - columnsCount];
				currRow[s] = positions[t];
			}
			prevRow.sort((a,b) => (Math.round(b.virtualBottom) - Math.round(a.virtualBottom)) || (b.virtualIndex - a.virtualIndex));
			currRow.sort((a,b) => (Math.round(a.height) - Math.round(b.height)) || (a.virtualIndex - b.virtualIndex));
			for (let s = 0, t = start; t <= end; s++, t++) {
				let vi = prevRow[s].virtualIndex + columnsCount;
				positions[vi] = currRow[s];
				currRow[s].virtualIndex = vi;
			}
		};

		let translate = tp ? "translateX" : "translateY";

		// --- regular reflow ---
		let reflowRegular = () => {
			let children = container.children;
			let count = Math.min(children.length, parsed.areas?.length || children.length);
			let maxBottom = -1;

			for (let i = 0, rowOffset = 0, maxReal = 0; i < count; i++) {
				let el = children[i];
				if (columnsCount===1) {
					el.style.removeProperty("transform");
					continue;
				}
				if (i % columnsCount===0) rowOffset = maxReal;
				let info = prepareElement(el);
				let pos = getFramePosition(el, i, rowOffset, info);
				positionsMap.set(el, pos);

				if (i >= columnsCount) {
					let above = positionsMap.get(children[i - columnsCount]);
					let diff = rowOffset - above.virtualBottom;
					if (diff!==0) {
						let pct = diff * 100 / pos.height * -1;
						el.style.transform = translate + "(" + pct + "%)";
						pos.virtualBottom -= diff;
					} else el.style.removeProperty("transform");
				} else el.style.removeProperty("transform");

				maxReal = Math.max(maxReal, pos.realBottom);
				maxBottom = Math.max(maxBottom, pos.virtualBottom);
			}
			return maxBottom;
		};

		// --- balanced reflow ---
		let reflowBalanced = () => {
			let children = container.children;
			let count = Math.min(children.length, parsed.areas?.length || children.length);
			let last = count - 1;
			let positions = Array(count);
			let infos = Array(count);
			let maxBottom = -1;

			for (let i = 0, rowOffset = 0, maxReal = 0; i < count; i++) {
				let el = children[i];
				if (columnsCount===1) {
					el.style.removeProperty("transform");
					el.style.removeProperty("order");
					continue;
				}
				if (i % columnsCount===0) rowOffset = maxReal;
				let info = prepareElement(el);
				infos[i] = info;
				let pos = getFramePosition(el, i, rowOffset, info);
				positions[i] = pos;

				if (i >= columnsCount && ((i + 1) % columnsCount===0 || i===last)) {
					let rowStart = i - i % columnsCount;
					balanceRow(positions, rowStart, i);

					for (let d = rowStart; d <= i; d++) {
						let p = positions[d];
						let child = children[p.realIndex];
						child.style.order = String(p.virtualIndex);

						// recalculate height for new column's track size
						let newCol = p.virtualIndex % columnsCount;
						let inf = infos[p.realIndex];
						if (!inf.measured) {
							p.height = inf.ratio * trackSizes[newCol];
							p.realBottom = rowOffset + p.height + gap;
							p.virtualBottom = p.realBottom;
						}

						let above = positions[d - columnsCount];
						let diff = rowOffset - above.virtualBottom;
						if (diff!==0) {
							let pct = diff * 100 / p.height * -1;
							child.style.transform = translate + "(" + pct + "%)";
							p.virtualBottom -= diff;
						} else child.style.removeProperty("transform");

						maxReal = Math.max(maxReal, p.realBottom);
						maxBottom = Math.max(maxBottom, p.virtualBottom);
					}
				} else if (i < columnsCount) {
					el.style.order = String(i);
					el.style.removeProperty("transform");
					maxReal = Math.max(maxReal, pos.realBottom);
					maxBottom = Math.max(maxBottom, pos.virtualBottom);
				}
			}
			return maxBottom;
		};

		// --- main reflow dispatcher ---
		let reflow = () => {
			let cs = getComputedStyle(container);
			// read the track sizes along the masonry's cross-axis
			let trackStr = tp ? cs.gridTemplateRows : cs.gridTemplateColumns;
			let cols = trackStr.split(/\s+/);
			let newColCount = cols.length;
			let newTrackSizes = cols.map(s => parseFloat(s) || 0);
			let newContainerWidth = tp ? container.clientHeight : container.clientWidth;
			let newGap = parseFloat(cs.gap)
				|| parseFloat(tp ? cs.rowGap : cs.columnGap) || 0;

			// skip if container or tracks aren't laid out yet
			if (newTrackSizes[0]===0 || newContainerWidth===0) return;

			// check if anything actually changed
			let same = newGap===gap && newContainerWidth===containerWidth
				&& newColCount===columnsCount
				&& trackSizes && newTrackSizes.every((s, i) => s===trackSizes[i]);
			if (same) {
				if (containerAspectRatio!==-1) {
					let dim = newContainerWidth * containerAspectRatio;
					container.style[tp ? "width" : "height"] = dim + "px";
				}
				return;
			}

			gap = newGap;
			trackSizes = newTrackSizes;
			containerWidth = newContainerWidth;
			columnsCount = newColCount;

			let maxBottom = balanced ? reflowBalanced() : reflowRegular();

			let prop = tp ? "width" : "height";
			if (maxBottom===-1) {
				container.style.removeProperty(prop);
				containerAspectRatio = -1;
			} else {
				container.style[prop] = maxBottom + "px";
				containerAspectRatio = maxBottom / containerWidth;
			}
		};

		// --- observers ---
		let mutObs;
		let startMut = () => {
			mutObs.observe(container, {
				childList: true, attributeFilter: ["style"], subtree: true,
			});
		};
		let stopMut = () => mutObs.disconnect();

		let resizeObs = new ResizeObserver(() => {
			stopMut();
			reflow();
			startMut();
		});

		mutObs = new MutationObserver(() => {
			stopMut();
			reflow();
			startMut();
		});

		reflow();
		resizeObs.observe(container);
		startMut();

		return () => {
			resizeObs.disconnect();
			stopMut();
			for (let child of container.children) {
				positionsMap.delete(child);
				child.style.removeProperty("transform");
				child.style.removeProperty("order");
				child.style.removeProperty("aspect-ratio");
				child.style.removeProperty("--width");
				child.style.removeProperty("--height");
				child.style.removeProperty("min-height");
			}
			container.style[tp ? "width" : "height"] = "100%";
		};
	}, [containerRef, parsed, balanced]);

	return null;
};

// --- masonry extension factory ---
let masonry = (opts = {}) => {
	let { balanced = false } = opts;
	return {
		name: "masonry",
		needsWrapper: true,
		render: ({ containerRef, parsed }) => [
			<MasonryEffect key="masonry-effect" containerRef={containerRef}
				parsed={parsed} balanced={balanced} />,
		],
		containerStyle: ({ parsed }) => {
			let tp = parsed.transpose;
			return {
				...(tp
					? { justifyItems: "start", alignItems: "unset" }
					: { alignItems: "start", justifyItems: "unset" }),
				overflow: "hidden",
			};
		},
	};
};

export { Grid, Flex, Layout, DefaultBreaks, useContainerWidth, debug, collapsible, accordion, splitPane,
	scrollable, overlay, animate, tabs, multiColumn, fisheye, render, masonry };
