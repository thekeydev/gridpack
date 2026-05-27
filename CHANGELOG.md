# Changelog

## 0.3.0

### Flex Mode

- **`?x` flag** — opt into flex mode from `<Grid layout="abc 8 ?x">` without switching component.
- **`?W` flag** — `flex-wrap: wrap`, implicitly switches to flex mode. Solves the CSS grid last-row centering problem: with flex wrap + `justify-content: center`, incomplete last rows center automatically — impossible with grid alone.
- **Uppercase = flex-grow** — uppercase letters in the legend map to `flex-grow: 1`, matching grid's grow semantics.
- **Flex sizing from pipe** — in flex mode the `| sizes` segment sets per-item `flex-basis` in flow order. `#` / `1fr` maps to `flex-grow: 1`, `2fr` to `flex-grow: 2`, `minmax(a, b)` to `flex-basis: a` + `max-width: b` + `flex-grow: 1`. Transposed layouts use `max-height` instead.
- **Transpose = column direction** — `|` prefix maps to `flex-direction: column`. `?f` produces `row-reverse` / `column-reverse`.
- **`<Layout>` component** — `d` prop shorthand with `mode="auto"`: flex when `?W`/`?x` flags present, grid otherwise.
  - **`<Flex>` component** — same DSL as `<Grid>` but emits `display: flex`. Drop-in for h-stacks, v-stacks, and wrapping layouts where flex's content-negotiation model fits better than grid's track model.
- **`splitPane` in flex mode** — handle positioned via CSS `order` property (even slots for areas, odd for handles).
- 9 flex mode playground presets: Basic `<Flex>`, V-Stack, Grow with uppercase, Reverse `?f`, Wrap `?W`, Wrap + center last row, Sidebar in grid vs flex, Split Pane in flex mode.
  - and more other (also flex mode related) playground presets

### Unified `()` Modifier System

The per-area `( )` syntax is extended from alignment-only to a full annotation system. All modifier types compose freely inside one set of parens, separated by whitespace or commas. `.` and `=` are self-delimiting.

- **className** — `a(.hero)` adds CSS class `hero`. Chained: `a(.foo.bar)` = `foo bar`. Accumulates across multiple entries for the same area.
- **alias / data-area** — `a(=sidebar)` sets `data-area="sidebar"` on the wrapper for CSS targeting without coupling to grid area letter names.
- **flex-basis** (flex mode) — `a(200)` = `flex-basis: 200px`. `a(200!)` also sets `flex-shrink: 0`. `a(200/2)` sets `flex-shrink: 2`.
- **z-index** — `a(z5)` sets `z-index: 5` on the area wrapper. Useful with overlap layouts (v0.2.4).
- **Combined** — `a(eC 200! .card z3)`: justify-end, align-center, no-shrink at 200px, class `card`, z-index 3.
- Works in: legend (`a(z5)b`), floating meta entries, and placement overrides (`a(cC)[1:3,1:3]`).
- Floating Meta Entries: `letter(mods)` tokens can appear anywhere in the layout string — after map rows in the main segment or inside pipe sizes segments — as freestanding annotations on any area. Multiple entries for the same area merge (classNames concatenate; later values win on key conflicts).

### Other

- Test suite expanded from 250 to 377 tests.

## 0.2.4

### Overlap Layouts

Three new syntaxes for overlapping grid areas — layouts where children share cells, like a photo overlapping a card or a background image behind a content panel. All three compile to explicit `grid-column`/`grid-row` placement and coexist with normal template-areas layouts.

- **`[]` bracket cells** — mark overlap directly in the map. `[iq]` in a cell means both `i` and `q` occupy that position. The parser computes each area's bounding rectangle, converts it to line-based placement, and removes the area from the template-areas map. Non-rectangular overlap areas are detected and produce errors.
- **`+` layer syntax** — split the layout into separate maps with `+`. Each layer is padded to the maximum dimensions (missing columns/rows become `.`), then layers are overlaid. Where two layers place an area in the same cell, a `[xy]` bracket cell is auto-generated. Supports any number of layers.
- **`[col,row]` line placement** — explicit CSS grid line numbers as an escape hatch. `i[1:3,1:3]` sets `grid-column: 1 / 3; grid-row: 1 / 3`. Supports negative lines (`1:-1`), z-index as third param (`i[1:3,1:3,10]`), and alignment modifiers (`i(cC)[1:3,1:3]`). Can appear anywhere in the layout string — legend, map rows, or standalone. Pure placement layouts (no map at all) infer grid dimensions from the highest line numbers.
- 4 playground presets in the new "Overlap" category: Testimonial Card (`[]` cells), Testimonial Card (`+` layers), Callout Card (three-layer `+`), Line Placement (`[col,row]`).

### More

- Responsive landing page + playground
- Test suite: 250 tests covering the full DSL surface including the new overlap syntaxes.
- **Whitespace normalization** — newlines, carriage returns, and tabs are now treated as segment separators alongside spaces and commas. Layout strings can be written as multi-line template literals.

## 0.2.3

### Masonry Extension

- **`masonry()` extension** — adapts the TrigenSoftware/masonry-grid algorithm into a gridpack extension. Uses `translateY()` (or `translateX()` when transposed) to close vertical gaps in auto-flow grids.
- **Dual sizing mode** — auto-detected per item. Items with `--width`/`--height` CSS vars get aspect-ratio-locked sizing. Items without get measured from `offsetHeight` (content-sized). Both modes work in the same grid.
- **Balanced mode** — `masonry({ balanced: true })` reorders items within rows via CSS `order` to minimize total grid height. Pairs shortest items with tallest columns. Stable sort with quantized comparisons to prevent oscillating order swaps during resize.
- **Transpose support** — respects the `|` transpose prefix. Masonry packs horizontally with `translateX()` instead of vertically.
- **Multi-size track support** — works with alternating track sizes like `* 80 60` (e.g. `repeat(auto-fill, 80px 60px)`). Each item uses its own column's track width for height calculation, including after balanced reordering.
- 5 playground presets: Regular, Balanced, Photo Gallery (with images + balanced toggle), Cards (content-measured), Transposed.

### Auto-Fill / Auto-Fit Sizes

- **Leading `*` on col/row sizes** — `| * 200~#` becomes `repeat(auto-fill, minmax(200px, 1fr))`. The browser determines column count based on container width. Works with any auto-flow layout.
- **Both leading + trailing `*`** — `| * 200~# *` becomes `repeat(auto-fit, minmax(200px, 1fr))`. Auto-fit collapses empty tracks so items stretch to fill the row.
- **Multi-size patterns** — `| * 200 300` becomes `repeat(auto-fill, 200px 300px)`, creating alternating track pairs.
- **Auto-implies full width** — auto-fill/auto-fit sizes automatically set `width: 100%` (or `height: 100%` when transposed) without needing `?w`.
- **`parseSizeRepeat()` helper** — strips leading/trailing `*` from sizes strings, returns repeat mode. `buildRepeatSizes()` generates the CSS `repeat()` value.
- `colRepeat`/`rowRepeat`/`colRepeatSizes`/`rowRepeatSizes` fields added to parsed result. Transpose correctly swaps them.
- 2 playground presets: Auto-Fill (responsive column count), Auto-Fit (empty track collapse comparison).

## 0.2.2

### Lol

- Forgot to update README.md and CHANGELOG.md

## 0.2.1

### Playground Overhaul

- **Guided tutorials** — every preset now has a `guide` with explanation text and `tryThis` hints that tell the user what to edit in the layout field. Content derived from the video tutorial script series.
- **Source view** — every preset shows its React source code alongside the guide. Responsive breakpoint props are displayed separately when present.
- **Guide + Debug tabs** — the right panel now has Guide (tutorial + source side by side) and Debug (parsed output, generated CSS) tabs. Guide is the default.
- **Tab persistence** — navigating between Welcome, Playground, and Docs no longer resets state. All tabs stay mounted once visited, hidden with `display: none`. Preset selection, layout edits, slider positions, and split pane widths are preserved.

### New Presets

- **Size Repeat** (Sizing) — demonstrates trailing `*` in sizes section: `abcdef | 50 # *` cycles the pattern across all tracks.
- **Product Grid (w/ repeat)** (Responsive) — combines responsive breakpoints with repeat rows.

### Explicit Sizes Auto-Fill

- **`explicitSizes` tracking** — the parser now tracks whether col/row sizes came from an explicit pipe section (`| ...`) or were auto-inferred. Added `explicitSizes: { cols, rows }` to the parsed result.
- **Smart `width: 100%`** — when the user writes explicit `#` (1fr) in the pipe sizes section (e.g. `| 100 #`), the grid automatically fills its container width. Proportional sizing from repeated area characters (like `ab abb`) no longer triggers auto-fill, keeping those grids content-sized. This distinction prevents the confusing case where `ab abb` and `ab abb | ###` produced identical output.
- **Per-axis grow detection** — grow areas (uppercase letters) now only force `width: 100%` or `height: 100%` on axes where they actually generate `1fr` tracks, instead of forcing both axes unconditionally.
- Transpose correctly swaps the `explicitSizes` flags along with everything else.

## 0.2.0

### Auto-Flow

- **`*N` auto-flow mode** — `*4` creates a 4-column grid, rows derived from child count. Uses `grid-auto-flow` instead of `grid-template-areas`. Children are named `c0`, `c1`, `c2`, ...
- **`*pattern` span patterns** — `*s3c6a3` creates a 12-column grid where children cycle spans of 3/6/3. `*w2*2` = w spans 2 + 2 singles = 4-col grid.
- **Mixed mode** — combine static map rows with auto-flow: `h12 *s3c6a3` = pinned header row + auto-flow body.
- **`?f` flag** — reverses auto-flow direction (row↔column). `*3 ?f` fills top→bottom instead of left→right.
- **`?F` flag** — enables dense packing (`grid-auto-flow: dense`). Backfills gaps left by spanning items.
- **`needsAreas` extension hook** — extensions that need grid-area placement (splitPane, collapsible, accordion, scrollable, overlay, multiColumn) declare `needsAreas: true`. When combined with auto-flow layouts, Grid automatically converts to template-areas so extensions work transparently.

### Size Cycling

- **Trailing `*` in col/row sizes** — cycles the preceding size tokens to fill all tracks. `*6 | 80 # *` → `80px 1fr 80px 1fr 80px 1fr`. Works independently on cols and rows: `|| 40 80 *` cycles row sizes only.

### Char-Count Shorthand

- **`h12` in map rows** — expands to `hhhhhhhhhhhh`. Any lowercase letter followed by digits repeats that letter. Useful for wide-spanning areas without typing repeated characters.

### Transpose Improvements

- Transpose now swaps **justify-self ↔ align-self** on all per-area alignment modifiers.
- Transpose now swaps **justifyContent ↔ alignContent** in `?` flags.
- Transpose now swaps **gapH ↔ gapV** when asymmetric gaps are specified.
- Fisheye extension auto-swaps its axis on transpose (`axis: "x"` becomes `"y"` and vice versa).

### Render Extension

- New **`render({ container, cell })`** extension for custom DOM output.
- `renderContainer({ props, children, parsed })` — full control over the container element and child grouping. Enables semantic HTML structures like `<table>/<thead>/<tbody>/<tr>/<td>` with CSS subgrid, `<dl>/<dt>/<dd>`, or any custom DOM shape.
- `wrapCell(child, areaStyle, key, childIdx, parsed)` — replace the default `<div>` wrapper per child with any element or component.

### Alignment Fix

- Auto-flow tracks now default to `auto` (instead of `1fr`) when `justifyContent` or `alignContent` flags are set. This makes `?whcC` correctly center content instead of stretching tracks to fill the container.

### Fisheye Improvements

- Fixed `--fe-scale` / `--fe-scale-x` / `--fe-scale-y` CSS custom properties not being set in auto-flow mode. Added index-based position fallback when `getComputedStyle` returns `auto` for grid positions.
- Fixed area name resolution for map-based layouts where `gridArea` serializes as `"a / a / a / a"` — now extracts the first token.
- When all tracks on an axis are `auto` (no `fr` tracks), fisheye treats them as flexible so the effect works with both `*7` and `abcdefg` style layouts.

### Bug Fixes

- Fixed React "fewer hooks than expected" error when typing produces a transient parse error. Error check moved after all hooks.
- Fixed `fillSizes` utility to correctly handle explicit sizes that exceed or match the target count.

## 0.1.2

- Bug fixes.

## 0.1.1

- Initial working release.
- Layout string DSL: areas, grow, empty cells, proportional sizing, transpose, minmax, gaps, `?` flags (w/h/secbag), per-area alignment modifiers, template variables, repeat rows.
- `Grid` React component with container-width breakpoints (xs/sm/md/lg/xl), `vars`/`onVarsChange` for bidirectional state, and `extensions` prop.
- Extensions: `debug`, `splitPane`, `collapsible`, `accordion`, `scrollable`, `overlay`, `animate`, `tabs`, `multiColumn`, `fisheye`.
- Landing page, playground with 35+ presets, and docs panel.

## 0.1.0

- Package name claimed on npm.
