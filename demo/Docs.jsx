import React from "react";
import { Grid } from "../src/Grid.jsx";

export default function Docs() {
	let S = ({ children }) => <span style={{ color: "#c3e88d" }}>{children}</span>;
	let K = ({ children }) => <span style={{ color: "#c792ea" }}>{children}</span>;
	let C = ({ children }) => <span style={{ color: "#7fdbca" }}>{children}</span>;
	let F = ({ children }) => <span style={{ color: "#f78c6c" }}>{children}</span>;

	let Section = ({ title, children }) => <div style={{ marginBottom: 20 }}>
		<div style={{ fontSize: 13, fontWeight: 700, color: "#7fdbca", marginBottom: 8, borderBottom: "1px solid #2a2a4a", paddingBottom: 4 }}>{title}</div>
		<div style={{ fontSize: 12, lineHeight: 1.8 }}>{children}</div>
	</div>;

	let Ex = ({ code, desc }) => <div style={{ display: "flex", gap: 12, marginBottom: 4 }}>
		<code style={{ color: "#c3e88d", background: "#0f0f23", padding: "1px 6px", borderRadius: 3, whiteSpace: "nowrap", flexShrink: 0 }}>{code}</code>
		<span style={{ color: "#888" }}>{desc}</span>
	</div>;

	return <Grid layout="16 | *520" style={{ padding: 8, overflow: "auto", width: "100%", height: "100%" }}>
		<div style={{ maxWidth: 700, padding: "0 4px", lineHeight: 1.8 }}>
			<Section title="Layout String Grammar">
				<code style={{ color: "#c3e88d", display: "block", background: "#0f0f23", padding: 10, borderRadius: 4, marginBottom: 10, border: "1px solid #2a2a4a", lineHeight: 1.6 }}>
					[<F>|</F>] [<K>legend</K> | <F>*</F> | <F>*N</F> | <F>*pattern</F>] [<K>rows</K>] [<F>gap</F> [<F>gap</F>]] [<F>?flags</F>] [<K>placements</K>] [<F>|</F> <K>col-sizes</K> [<F>|</F> <K>row-sizes</K>]]
				</code>
			</Section>
			<Section title="Map Tokens">
				<Ex code="a-z" desc="Area (lowercase in map)" />
				<Ex code="A-Z" desc="Grow area in legend (tracks become 1fr)" />
				<Ex code="." desc="Empty cell (in map) / auto (in sizes)" />
				<Ex code="#" desc="1fr (in sizes)" />
				<Ex code="number" desc="Gap (in map) / px size (in sizes)" />
				<Ex code="|" desc="Transpose prefix / pipe separator for col|row sizes" />
				<Ex code="*" desc="Auto-legend from children count / auto-fill prefix on sizes" />
				<Ex code="*N" desc="Auto-flow grid with N columns" />
				<Ex code="*pattern" desc="Auto-flow with span pattern — e.g. *s3c6a3 = 12-col with 3/6/3 spans" />
				<Ex code="h12" desc="Char-count shorthand — h12 expands to hhhhhhhhhhhh in map rows" />
				<Ex code="ab*" desc="Repeat row — expands based on children" />
				<Ex code="Ab*" desc="Uppercase in repeat row = pinned (shared, not numbered)" />
				<Ex code="a~b" desc="minmax(a, b) — e.g. 200~# = minmax(200px, 1fr)" />
				<Ex code="[iq]" desc="Overlap cell — i and q both occupy this cell (? placement overrides)" />
				<Ex code="+" desc="Layer separator — overlay multiple maps, overlapping cells merge to [xy]" />
				<Ex code="a[1:3,1:3]" desc="Placement override — grid-column: 1/3, grid-row: 1/3" />
				<Ex code="a[1:3,1:3,10]" desc="Placement with z-index — third value = z-index" />
				<Ex code="," desc="Optional separator (commas or spaces)" />
				<Ex code="{var}" desc="Template variable — replaced from vars prop" />
			</Section>
			<Section title="Auto-Flow Modes">
				<div style={{ color: "#888", marginBottom: 4 }}>When no map rows are given, children are auto-placed in a grid.</div>
				<Ex code="*" desc="Single row, all children side by side" />
				<Ex code="*4" desc="4 columns, rows auto-generated from child count" />
				<Ex code="|*3" desc="Transposed: 3 rows, children flow as columns" />
				<Ex code="*s3c6a3" desc="Span pattern: 12-col grid, children cycle 3/6/3 spans" />
				<Ex code="*w2*2" desc="Pattern: w spans 2 + 2 singles = 4-col grid" />
				<Ex code="h12 *s3c6a3" desc="Mixed: static header row + auto-flow body" />
				<div style={{ color: "#555", marginTop: 4 }}>Auto-flow areas are named <C>c0</C>, <C>c1</C>, <C>c2</C>, ... for use with extensions.</div>
			</Section>
			<Section title="Size Sections">
				<div style={{ color: "#888", marginBottom: 4 }}>After the pipe(s): <code style={{ color: "#c3e88d" }}>| col-sizes | row-sizes</code></div>
				<Ex code="." desc="auto" />
				<Ex code="#" desc="1fr" />
				<Ex code="200" desc="200px" />
				<Ex code="200~#" desc="minmax(200px, 1fr)" />
				<Ex code="100 200 *" desc="Trailing * cycles sizes to fill all tracks: 100 200 100 200 ..." />
				<Ex code="|| 40 80 *" desc="Skip col-sizes (empty), cycle row-sizes: 40 80 40 80 ..." />
				<Ex code="*200~#" desc="Leading * = auto-fill: repeat(auto-fill, minmax(200px, 1fr))" />
				<Ex code="*200~#*" desc="Both * = auto-fit: repeat(auto-fit, minmax(200px, 1fr))" />
				<Ex code="*200 300" desc="Multi-size auto-fill: repeat(auto-fill, 200px 300px)" />
				<div style={{ color: "#555", marginTop: 4 }}>Without trailing <C>*</C>, remaining tracks are filled with 1fr (auto-flow) or auto (map).</div>
				<div style={{ color: "#555", marginTop: 2 }}>Leading <C>*</C> auto-fill/auto-fit implies full width (or height when transposed).</div>
			</Section>
			<Section title="? Flags (container-level)">
				<div style={{ color: "#888", marginBottom: 4 }}>Flags float freely in the layout string. Lowercase = justify, Uppercase = align.</div>
				<Ex code="?w" desc="Full width (width: 100%)" />
				<Ex code="?h" desc="Full height (height: 100%)" />
				<Ex code="?f" desc="Reverse auto-flow direction (row↔column) — auto-flow only" />
				<Ex code="?F" desc="Dense packing (grid-auto-flow: dense) — auto-flow only" />
				<Ex code="?x" desc="Flex mode — emit display:flex instead of grid" />
				<Ex code="?W" desc="flex-wrap: wrap (implies flex mode)" />
				<Ex code="?s / ?S" desc="start" />
				<Ex code="?e / ?E" desc="end" />
				<Ex code="?c / ?C" desc="center" />
				<Ex code="?b / ?B" desc="space-between (Borders)" />
				<Ex code="?a / ?A" desc="space-around" />
				<Ex code="?g / ?G" desc="space-evenly (Gaps)" />
				<div style={{ color: "#555", marginTop: 4 }}>Mnemonic: <C>SECBAG</C> — Start End Center Borders Around Gaps</div>
				<div style={{ color: "#555", marginTop: 2 }}>Transpose swaps justify↔align axes automatically.</div>
			</Section>
			<Section title="Per-Area Modifiers ()">
				<div style={{ color: "#888", marginBottom: 4 }}>Attach modifiers to any area in the legend or as placement annotations. All types compose freely, separated by spaces or commas.</div>
				<Ex code="a(s/e/c/l)" desc="justify-self: start / end / center / baseline" />
				<Ex code="a(S/E/C/L)" desc="align-self: start / end / center / baseline" />
				<Ex code="a(cC)" desc="center both axes" />
				<Ex code="a(z5)" desc="z-index: 5 on area wrapper" />
				<Ex code="a(.hero)" desc="add CSS class 'hero' to wrapper" />
				<Ex code="a(.foo.bar)" desc="add classes 'foo bar' — . is self-delimiting, no separator needed" />
				<Ex code="a(=sidebar)" desc="data-area='sidebar' — alias for CSS targeting" />
				<Ex code="a(200)" desc="flex-basis: 200px (flex mode)" />
				<Ex code="a(200!)" desc="flex-basis: 200px + flex-shrink: 0" />
				<Ex code="a(200/2)" desc="flex-basis: 200px + flex-shrink: 2" />
				<Ex code="a(eC z3 .card)" desc="combined: end justify, center align, z-index 3, class 'card'" />
				<div style={{ color: "#555", marginTop: 4 }}>Works in legend: <C>a(z5)B(sE)</C>, on placements: <C>a(cC)[1:3,1:3]</C>, and as floating meta entries.</div>
				<div style={{ color: "#555", marginTop: 2 }}>Transpose swaps justify-self?align-self.</div>
			</Section>
			<Section title="Floating Meta Entries">
				<div style={{ color: "#888", marginBottom: 4 }}>
					<code style={{ color: "#c3e88d" }}>letter(mods)</code> can appear anywhere in the layout string — after map rows or inside pipe sizes — as freestanding annotations. Multiple entries merge: classNames accumulate, other keys take the later value.
				</div>
				<Ex code="ab 8 a(z3 .hero)" desc="z-index + class on a, after map rows" />
				<Ex code="ab | 200# a(z3)" desc="meta in sizes segment — col sizes unaffected" />
				<Ex code="ab a(.foo) a(.bar)" desc="two entries — className accumulates to 'foo bar'" />
			</Section>
			<Section title="Proportional Columns">
				<div style={{ color: "#888", marginBottom: 4 }}>Repeating area chars in map rows → columns default to 1fr (proportional)</div>
				<Ex code="ab abb" desc="a=1fr b=2fr (b appears twice)" />
				<Ex code="ab aab" desc="a=2fr b=1fr" />
			</Section>
			<Section title="Placement Overrides">
				<div style={{ color: "#888", marginBottom: 4 }}>Line-based positioning — bypasses grid-template-areas, uses grid-column/row directly.</div>
				<Ex code="i[1:3,1:3]" desc="i spans cols 1–3, rows 1–3" />
				<Ex code="I[1:3,1:3]" desc="Uppercase = grow area (tracks ? 1fr)" />
				<Ex code="i[1:3,1:3,10]" desc="Third value = z-index" />
				<Ex code="i[1:-1,1:-1]" desc="Negative lines allowed (CSS grid line syntax)" />
				<Ex code="i(cC)[1:3,1:3]" desc="Alignment modifiers on placement" />
				<Ex code="q i[1:3,1:3] .qq .qq" desc="Mixed: i placed by lines, q by template-areas" />
				<Ex code="i[1:3,1:3] q[2:4,2:4]" desc="Pure placement: no map, grid size inferred from lines" />
			</Section>
			<Section title="Overlap & Layers">
				<div style={{ color: "#888", marginBottom: 4 }}>Two ways to overlap areas — both resolve to placement overrides.</div>
				<Ex code="[iq]" desc="Bracket cell: i and q share this cell in the map" />
				<Ex code="ii. i[iq]q .qq" desc="Direct overlap markup in map rows" />
				<Ex code="ii. + .qq" desc="Layer separator: overlay two maps, merge overlapping cells" />
				<Ex code="iq ii. ii. + ... .qq .qq" desc="Layers: i and q overlap in center ? placement overrides" />
				<div style={{ color: "#555", marginTop: 4 }}>Overlap areas are extracted from the map and positioned via grid-column/row.</div>
				<div style={{ color: "#555", marginTop: 2 }}>Non-overlapping layers merge normally without bracket cells.</div>
			</Section>
			<Section title="Flex Mode">
				<div style={{ color: "#888", marginBottom: 4 }}>Same DSL, <code style={{ color: "#c3e88d" }}>display: flex</code> output. Use <C>&lt;Flex&gt;</C> or add <C>?x</C> / <C>?W</C> to any layout string.</div>
				<Ex code="<Flex layout='abc 8'>" desc="Flex row — h-stack with gap" />
				<Ex code="<Flex layout='|abc 8'>" desc="Flex column — v-stack with gap" />
				<Ex code="abc 8 ?x" desc="Same as <Flex> — explicit flex flag on <Grid>" />
				<Ex code="* 8 ?w ?W | *140~200" desc="Wrap — last row auto-centers (impossible with grid)" />
				<Ex code="<Layout d='abc ?x'>" desc="<Layout> with d prop — mode auto-detected from flags" />
				<div style={{ color: "#555", marginTop: 6, marginBottom: 2 }}>In flex mode:</div>
				<Ex code="A (uppercase)" desc="flex-grow: 1 — same semantics as grid grow areas" />
				<Ex code="| prefix" desc="flex-direction: column" />
				<Ex code="?f" desc="row-reverse / column-reverse when combined with |" />
				<Ex code="| 200 # 100" desc="flex-basis per item in flow order: 200px, grow, 100px" />
				<Ex code="| 1fr 2fr" desc="flex-grow: 1, flex-grow: 2" />
				<Ex code="| 120~# 80~200" desc="basis 120 + grow freely / basis 80 + max-width 200" />
				<Ex code="a(200!)" desc="flex-basis 200px, flex-shrink: 0 — via () modifier" />
				<div style={{ color: "#555", marginTop: 4 }}>Transposed layouts use <C>max-height</C> instead of <C>max-width</C> for minmax caps.</div>
			</Section>
			<Section title="Grid Component Props">
				<Ex code="layout" desc="Layout string" />
				<Ex code="col" desc="Boolean — prepend | for vertical layout" />
				<Ex code="gap" desc="Override gap — number (px) or string" />
				<Ex code="mode" desc='"grid" | "flex" | "auto" — rendering model (<Flex> defaults to "flex")' />
				<Ex code="vars" desc="Template vars — values for {placeholder} substitution" />
				<Ex code="onVarsChange" desc="Callback when extensions mutate vars" />
				<Ex code="extensions" desc="Extension array" />
				<Ex code="xs/sm/md/lg/xl" desc="Layout strings for breakpoints" />
				<Ex code="breaks" desc="Custom thresholds — default { xs:0, sm:576, md:768, lg:992, xl:1200 }" />
			</Section>
			<Section title="Extensions">
				<div style={{ color: "#888", marginBottom: 6 }}>Behavioral extensions — composable, stackable on any Grid.</div>
				<Ex code="debug({ color? })" desc="Show grid cell overlay" />
				<Ex code='scrollable({ area, axis? })' desc='Make area scrollable — axis: "both" | "x" | "y". Area can be string or array.' />
				<Ex code='overlay({ area, over })' desc="Place area over another — same grid cells, higher z-index" />
				<Ex code='animate({ properties?, duration?, easing? })' desc="CSS transitions on grid changes" />
				<Ex code='splitPane({ var, edge, min?, max? })' desc='Draggable resize handle — edge: "s:e" = right edge of area s' />
				<Ex code='collapsible({ var, area, expanded?, collapsed? })' desc="Toggle area size on click" />
				<Ex code='accordion({ var, items, collapsed? })' desc="Mutual exclusion — items: [{ area, sizeVar, expanded }]" />
				<Ex code='tabs({ var, items, position? })' desc='Tab bar — items: [{ label, area, sizeVar? }], position: "top" | "bottom"' />
				<Ex code='multiColumn({ area, fill? })' desc='Auto-align CSS multi-column to grid tracks — fill: "auto"|"balance"' />
				<Ex code='fisheye({ axis?, intensity?, min?, sticky? })' desc='Tracks expand near cursor — axis: "x"|"y"|"both". sticky: keep effect after cursor leaves. Auto-swaps on transpose.' />
				<Ex code='masonry({ balanced? })' desc='Masonry layout — close gaps via translateY (or translateX when transposed). Items use --width/--height CSS vars for aspect-ratio sizing, or get measured from DOM. balanced: reorder items per row to minimize height.' />
				<Ex code='render({ container?, cell? })' desc="Custom DOM output — replace container tag and/or cell wrapper elements" />
				<div style={{ color: "#555", marginTop: 8, fontSize: 11 }}>Extension interface: {"{ name, render?, renderContainer?, wrapCell?, containerStyle?, areaStyle?, transformVars?, transformAreas?, needsAreas?, needsWrapper? }"}</div>
			</Section>
			<Section title="Quick Examples">
				<Ex code="ab" desc="Two equal columns" />
				<Ex code="|ab" desc="Two equal rows" />
				<Ex code="*" desc="Auto h-stack (needs children)" />
				<Ex code="|" desc="Auto v-stack (needs children)" />
				<Ex code="hsCf hhh scc sff 8" desc="Holy grail with grow" />
				<Ex code="a(e)B ab* 8 | .#" desc="Form with right-aligned labels" />
				<Ex code="sa ss Sa* 8 | 120#" desc="Pinned sidebar + repeating list" />
				<Ex code='abc | 100~# 100~# 100~#' desc="Responsive 3-col with min 100px" />
				<Ex code="*7 ?wh" desc="7-column auto-flow grid" />
				<Ex code="*4 ?whf" desc="4-row auto-flow, column direction (?f)" />
				<Ex code="*4 ?whF" desc="4-col auto-flow, dense packing (?F)" />
				<Ex code="*6 | 80 # *" desc="6-col grid, col sizes cycle 80px 1fr" />
				<Ex code="*3 || 40 80 *" desc="3-col grid, row sizes cycle 40px 80px" />
				<Ex code="* 8 ?w | * 200~#" desc="Auto-fill: responsive columns, min 200px each" />
				<Ex code="* 8 ?w | * 200~# *" desc="Auto-fit: empty tracks collapse, items stretch" />
				<Ex code="?whcC" desc="Center single child both axes" />
				<Ex code="iq ii. i[iq]q .qq" desc="Overlap via bracket cells in map" />
				<Ex code="iq ii. ii. + ... .qq .qq" desc="Overlap via + layer merge" />
				<Ex code="i[1:3,1:3] q[2:4,2:4]" desc="Two overlapping areas via placement" />
			</Section>
		</div>
		<Section title="Full Grammar & Rules">
			<code><pre style={{ lineHeight: "14px", tabSize: 4 }}>{`
-- ═══════════════════════════════════════════════
--  LAYOUT STRING GRAMMAR
-- ═══════════════════════════════════════════════

layout       = [transpose] [main] ["|" col-sizes ["|" row-sizes]]

transpose    = "|"                                -- prefix: swap cols ↔ rows


-- ───────────────────────────────────────────────
--  MAIN SEGMENT
-- ───────────────────────────────────────────────

main         = [legend] [map-rows] [gap] [flags] [placements]
			-- segments separated by whitespace or commas (interchangeable)
			-- flags and placements float freely among segments

legend       = area-def+                          -- named areas
			| "*"                                -- auto-legend, single row
			| "*" digit+                         -- auto-flow with N columns
			| "*" pattern                        -- auto-flow with span pattern

area-def     = letter ["(" self-mods ")"]         -- lowercase = normal area
			| LETTER ["(" self-mods ")"]         -- uppercase = grow area (tracks → 1fr)

pattern      = (letter digit* | "*" digit*)+     -- e.g. s3c6a3, w2*2
			-- letter = named span, digit = span width, * = unnamed singles
			-- total column count = sum of all spans


-- ───────────────────────────────────────────────
--  MAP ROWS
-- ───────────────────────────────────────────────

map-rows     = map-row+ ["+" map-row+]*          -- "+" separates overlay layers

map-row      = cell+                             -- regular row
			| cell+ "*"                          -- repeat row (exactly one allowed)

cell         = letter                            -- area reference (lowercase)
			| LETTER                            -- pinned area in repeat row
			| letter digit+                     -- char-count: h12 → hhhhhhhhhhhh
			| "."                               -- empty cell
			| "[" letter+ "]"                   -- overlap cell: [iq] = i and q share this cell

			-- char-count expands before parsing: a2b3 → aabbb
			-- "." in map = empty, in sizes = auto, as size-atom = auto


-- ───────────────────────────────────────────────
--  GAP
-- ───────────────────────────────────────────────

gap          = number                            -- uniform gap (px)
			| number number                     -- row-gap col-gap (px)

			-- gap segments are trailing numbers after map rows
			-- if all segments are numeric + childCount > 0 → auto-flow with gap


-- ───────────────────────────────────────────────
--  FLAGS (container-level)
-- ───────────────────────────────────────────────

flags        = "?" flag-char+                    -- float freely in layout string

flag-char    = "w"                               -- width: 100%
			| "h"                               -- height: 100%
			| "f"                               -- reverse auto-flow (row↔column)
			| "F"                               -- dense packing (grid-auto-flow: dense)
			| "x"                               -- flex mode (display: flex)
			| "W"                               -- flex-wrap: wrap (implies flex mode)
			| "s" | "e" | "c" | "b" | "a" | "g" -- justify-content (lowercase)
			| "S" | "E" | "C" | "B" | "A" | "G" -- align-content (uppercase)

			-- SECBAG mnemonic:
			--   s/S = start, e/E = end, c/C = center,
			--   b/B = space-between, a/A = space-around, g/G = space-evenly


-- ───────────────────────────────────────────────
--  PER-AREA MODIFIERS
-- ───────────────────────────────────────────────

self-mods    = mod+                                  -- separated by whitespace or ","
			-- "." and "=" are self-delimiting (no separator needed)

self-mod     = "s" | "e" | "c" | "l"            -- justify-self (lowercase)
			| "S" | "E" | "C" | "L"            -- align-self (uppercase)
			| "z" digit+                           -- z-index
			| "." word                             -- className (self-delimiting)
			| "=" word                             -- alias / data-area (self-delimiting)
			| digit+ ["!"]                         -- flex-basis [+ flex-shrink:0]
			| digit+ "/" digit+                    -- flex-basis / flex-shrink

			-- examples:
			--   a(cC)          = center both axes
			--   a(z5 .card)    = z-index 5, class "card"
			--   a(.foo.bar)    = classes "foo bar" (chained)
			--   a(=sidebar)    = data-area="sidebar"
			--   a(200!)        = flex-basis 200px, flex-shrink 0
			--   a(eC z3 .hero) = all combined


-- ───────────────────────────────────────────────
--  PLACEMENT OVERRIDES (line-based positioning)
-- ───────────────────────────────────────────────

placements   = placement+                        -- float freely among segments

placement    = letter ["(" self-mods ")"] "[" coords "]"
			| LETTER ["(" self-mods ")"] "[" coords "]"

coords       = col "," row                      -- grid-column, grid-row
			| col "," row "," z-index           -- + z-index (integer)

col          = line-spec                         -- e.g. 1:3 → gridColumn: 1 / 3
row          = line-spec                         -- e.g. 2:4 → gridRow: 2 / 4
line-spec    = number [":" number]               -- start[:end], negative lines allowed
z-index      = number                            -- integer z-index

			-- uppercase letter = grow area, same as in legend
			-- placement areas skip grid-template-areas, use grid-column/grid-row
			-- can coexist with area-map areas in the same layout
			-- pure-placement layouts (no legend/map) infer grid size from max lines
			-- ":" in line-spec becomes " / " in CSS: 1:3 → "1 / 3"


-- ───────────────────────────────────────────────
--  PIPE SIZES (column and row tracks)
-- ───────────────────────────────────────────────

col-sizes    = ["*"] size-token+ ["*"]
row-sizes    = ["*"] size-token+ ["*"]

size-token   = "."                               -- auto
			| "#"                               -- 1fr
			| number                            -- px
			| size-atom "~" size-atom            -- minmax(a, b)
			| css-size                           -- literal passthrough (e.g. 20vw, 3em)
			| "*"                               -- trailing: cycle pattern / leading: auto-fill

size-atom    = "." | "#" | number | css-size

			-- "~" binds tightly: 200~# = minmax(200px, 1fr), .~# = minmax(auto, 1fr)
			-- "." and "#" need no surrounding whitespace in sizes

			-- trailing "*": cycle preceding tokens to fill all tracks
			--   "80 # *" with 6 cols → 80px 1fr 80px 1fr 80px 1fr
			--   works on both col-sizes and row-sizes independently

			-- leading "*": repeat(auto-fill, ...)
			--   "* 200~#" → repeat(auto-fill, minmax(200px, 1fr))
			--   implies full width (or height when transposed)

			-- leading + trailing "*": repeat(auto-fit, ...)
			--   "* 200~# *" → repeat(auto-fit, minmax(200px, 1fr))
			--   empty tracks collapse, items stretch to fill

			-- without trailing *, remaining tracks pad with:
			--   auto-flow mode → 1fr (or auto if justify/alignContent set)
			--   area-map mode → auto
			-- excess sizes are truncated to track count

			-- skip col-sizes with empty pipe: || row-sizes
			--   "*3 || 40 80 *" → 3 cols (default), rows cycle 40 80


-- ───────────────────────────────────────────────
--  TERMINALS
-- ───────────────────────────────────────────────

number       = digit+ ["." digit+]               -- integer or decimal
letter       = "a"-"z"
LETTER       = "A"-"Z"
css-size     = <any non-whitespace not matching above>
			-- passed through as literal CSS value


-- ═══════════════════════════════════════════════
--  SEMANTIC RULES
-- ═══════════════════════════════════════════════


-- ─── implicit coercions ────────────────────────

--   legend only, no map rows       → legend doubles as single-row map
--   empty input + childCount       → "*" (auto h-stack)
--   "|" + empty + childCount       → transposed "*" (auto v-stack)
--   all-numeric segments + children → gap only, auto-flow prepended
--   grow areas (UPPERCASE in legend) → column/row tracks become 1fr
--   explicit fr in pipe sizes      → implies full width/height
--   grow areas present             → implies full width (100%)


-- ─── transpose ("|" prefix) ────────────────────

--   swaps columns ↔ rows in template areas
--   swaps col-sizes ↔ row-sizes
--   swaps colCount ↔ rowCount
--   swaps justify-self ↔ align-self on all areas
--   swaps justifyContent ↔ alignContent flags
--   swaps gapH ↔ gapV
--   flips auto-flow direction (row → column)
--   fisheye extension auto-swaps its axis


-- ─── auto-flow details ─────────────────────────

--   * or *N → no grid-template-areas, uses grid-auto-flow
--   *N generates area names c0, c1, c2, ...
--   *pattern → named areas from letters, unnamed from *
--     *s3c6a3 = 12-col grid, children cycle spans 3/6/3
--     *w2*2 = 4-col grid, w spans 2 + 2 unnamed singles
--   ?f reverses flow direction (row ↔ column)
--   ?F adds dense packing (grid-auto-flow: ... dense)
--   mixed mode: static rows before *, dynamic after
--     h12 *s3c6a3 = 12-col header row + auto-flow body
--   extensions with needsAreas force template-areas generation


-- ─── repeat row expansion ──────────────────────

--   row ending with "*" = repeat row (max one per layout)
--   lowercase letters in repeat row → numbered per repetition
--     ab* with 4 dynamic children → a1 b1 a2 b2
--   UPPERCASE letters in repeat row → pinned (shared across all copies)
--     Sa* → s column shared, a numbered: s a1, s a2, ...
--   repeat count = ceil((childCount − staticAreaCount) / repeatAreasPerRow)
--   row sizes for repeat row: duplicated per copy, or cycled with trailing *


-- ─── overlay / overlap (layers and brackets) ───

--   "+" between map rows splits into layers
--     layers are padded to same dimensions, then overlaid
--     overlapping cells become [xy] bracket groups
--   [xy] cells in map rows (direct or from + merge):
--     each letter's bounding rectangle → placement override
--     areas removed from template-areas map (replaced with ".")
--     placement via grid-column/grid-row (line-based)
--   non-overlapping layers merge normally (no brackets)


-- ─── var substitution ──────────────────────────

--   "{" identifier "}" replaced from vars prop before parsing
--   handled by Grid component, not by parser
--   enables dynamic layouts via splitPane, collapsible, etc.


-- ─── floating meta entries ──────────────────────────

--   letter(mods) anywhere in the layout string = annotation on that area
--   can appear after map rows or inside pipe sizes segments
--   multiple entries for the same area merge:
--     classNames accumulate (space-separated)
--     other keys: later value wins
--   e.g. "ab 8 a(z3 .hero)"  — z+class on a, no effect on sizes


-- ─── flex mode ──────────────────────────

--   ?x or ?W flag ? mode = "flex" (display: flex)
--   | prefix      ? flex-direction: column
--   ?f            ? row-reverse / column-reverse
--   ?W            ? flex-wrap: wrap
--   uppercase letters ? flex-grow: 1 (same as grid grow areas)
--   sizes segment in flex mode ? per-item flex-basis in flow order
--     "."  ? auto (no-op)
--     "#" / "1fr"  ? flex-grow: 1 (no basis)
--     "2fr"        ? flex-grow: 2
--     "200"        ? flex-basis: 200px
--     "120~#"      ? flex-basis: 120px + flex-grow: 1
--     "120~200"    ? flex-basis: 120px + max-width: 200px + flex-grow: 1
--   transposed flex uses max-height instead of max-width for minmax caps
--   () modifiers: 200 = flex-basis, 200! = +no-shrink, 200/N = +shrink N


-- ─── proportional columns ──────────────────────────

--   when area chars repeat in map rows without explicit col-sizes:
--     all columns default to 1fr (proportional mode)
--   ab abb → a=1fr, b=2fr (b appears twice in row)
--   grow areas (UPPERCASE) make their tracks 1fr regardless


-- ─── error conditions ──────────────────────────

--   duplicate area in legend (e.g. "aa")
--   unknown area char in map not present in legend
--   row length mismatch across map rows
--   non-rectangular area shape in map
--   * or repeat row without childCount
--   more than one repeat row per layout
--   unclosed "(" in legend modifiers
--   overlap area [xy] not rectangular in bounding rect
			`}</pre></code>
		</Section>
	</Grid>
};
