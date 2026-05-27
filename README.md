<h1 align="center">gridpack</h1>

<p align="center">
  <strong>CSS Grid layouts in one string. <a href="https://thekeydev.github.io/gridpack/demo/">See demo.</a></strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/gridpack"><img src="https://img.shields.io/npm/v/gridpack.svg" alt="npm" /></a>
  <a href="https://bundlejs.com/?q=gridpack&treeshake=[{Grid}]"><img src="https://deno.bundlejs.com/badge?q=gridpack&treeshake=%5B%7BGrid%7D%5D" alt="bundle size" /></a>
  <a href="https://github.com/thekeydev/gridpack/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/gridpack" alt="license" /></a>
</p>

---

A compact DSL that compiles layout strings into CSS Grid. One React component, optional extensions, zero wrapper divs.

```jsx
<Grid layout="hsCf hhh scc sff 8">
  <Header />
  <Sidebar />
  <Content />
  <Footer />
</Grid>
```

That's a full page layout. No CSS files, no class names, no nesting.

## Install

```bash
npm install gridpack
```

```jsx
import { Grid } from "gridpack";
```

## The Layout String

Everything fits in one prop. The string has a simple grammar:

```
[|] [legend] [rows...] [gap] [?flags] [| col-sizes [| row-sizes]]
```

### Quick examples

| String | Result |
|--------|--------|
| `ab` | Two equal columns |
| `\|ab` | Two equal rows (transpose) |
| `ab abb` | Two columns, 1:2 ratio |
| `ab a2b3` | Two columns, 2:3 ratio (char-count shorthand) |
| `hsCf hhh scc sff 8` | Holy grail, 8px gap, content grows |
| `ab ab \| 100 #` | Two columns: 100px fixed + fill remaining |
| `* 8` | Auto h-stack with gap (needs children) |
| `\| 12` | Auto v-stack with 12px gap |
| `*7 ?wh` | 7-column auto-flow grid |
| `a(e)B ab* 8 \| .#` | Form: labels right-aligned, inputs grow, repeat rows |
| `sah sh Sa* 8 \| {sw}# \| 50` | Pinned sidebar + header, repeating items |
| `abc \| 100~# 100~# 100~#` | 3 columns, each min 100px |
| `abcdef \| 50 # *` | 6 columns, sizes cycle: 50px 1fr 50px 1fr ... |
| `* 8 ?w \| *200~#` | Auto-fill: responsive columns, min 200px |
| `* 8 ?w \| *200~#*` | Auto-fit: same but empty tracks collapse |
| `iq ii. i[iq]q .qq` | Overlap: photo + quote share a cell via `[]` |
| `iq ii. + .qq` | Same overlap via `+` layers |
| `i[1:3,1:3] q[2:4,2:4]` | Same overlap via explicit line placement |
| `abc 8 ?x` | Flex row — same DSL, `display: flex` output |
| `* 8 ?w ?W \| 120~200*` | Flex wrap — last row auto-centers (impossible in grid) |

### Token vocabulary

| Token | Meaning |
|-------|---------|
| `a-z` | Named area |
| `A-Z` | Grow area (tracks become `1fr`) |
| `.` | Empty cell (in map) / `auto` (in sizes) |
| `#` | `1fr` (in sizes) |
| `\|` | Transpose prefix / pipe separator |
| `~` | `minmax(a, b)` — e.g. `200~#` |
| `*` | Auto-legend / repeat row / size cycling / auto-fill prefix |
| `?` | Flags (`?w` width, `?h` height, `?cC` center) |
| `( )` | Per-area modifiers — `a(cC)` align, `a(z5)` z-index, `a(.hero)` className, `a(=sidebar)` alias, `a(200!)` flex-basis |
| `{ }` | Template variable — `{sidebar}` |
| `[ ]` | Overlap cell — `[iq]` means both areas share that cell |
| `+` | Layer separator — maps before/after are overlaid |
| `a[1:3,1:3]` | Line placement — explicit `grid-column`/`grid-row` |
| `0-9` | After area letter: repeat count (`h12` = 12 h's) |

### Flags — SECBAG

Lowercase = `justify-content`, uppercase = `align-content`:

- **S** start · **E** end · **C** center · **B** space-between · **A** space-around · **G** space-evenly
- `?w` / `?h` — force full width / height
- `?f` — reverse auto-flow direction (row → column)
- `?F` — dense packing (`grid-auto-flow: dense`)
- `?x` — flex mode (`display: flex` instead of grid)
- `?W` — flex-wrap: wrap (also switches to flex mode)

### Sizes and auto-fill

When you write explicit `#` (1fr) in the pipe sizes section, the grid automatically fills its container — no `?w` needed. Proportional sizing from repeated area characters (like `ab abb`) keeps the grid content-sized.

```jsx
// 100px + fill remaining — grid auto-fills container width
<Grid layout="ab ab | 100 #">

// 1:2 proportional — grid is content-sized
<Grid layout="ab abb">

// 1:2 proportional — grid auto-fills container width
<Grid layout="ab abb ?w">
```

A trailing `*` in sizes cycles the pattern: `| 50 # *` with 6 columns becomes `50px 1fr 50px 1fr 50px 1fr`.

## Flex Mode

`<Flex>` emits `display: flex` using the same DSL. Use it when flex's content-negotiation fits better than grid tracks, or when you need `flex-wrap` (which solves the CSS grid last-row centering problem).

```jsx
import { Grid, Flex } from "gridpack";

// Flex row — same DSL, different CSS model
<Flex layout="abc 8">
  <A /> <B /> <C />
</Flex>

// Wrapping — last row auto-centers (impossible with grid)
<Flex layout="* 8 ?w ?W | *140~200">
  {cards.map(c => <Card />)}
</Flex>

// Or use ?x / ?W flags directly on <Grid>
<Grid layout="abc 8 ?x">...</Grid>
<Grid layout="* 8 ?w ?W | *140~200">...</Grid>
```

In flex mode:
- Uppercase letters = `flex-grow: 1` (same semantics as grid grow areas)
- `|` prefix = `flex-direction: column`
- Pipe sizes set `flex-basis` per item: `#`/`1fr` = grow, `2fr` = grow × 2, `minmax(a,b)` = basis `a` + max-width `b`
- Per-area `( )` modifiers accept `200` (flex-basis), `200!` (no-shrink), `200/2` (custom shrink)

The `<Layout>` component uses `mode="auto"`: flex when `?W`/`?x` flags are present, grid otherwise.

```jsx
import { Layout } from "gridpack";
<Layout d="abc 8 ?x">...</Layout>
```

### Repeat rows

Append `*` to a row to repeat it based on children count:

```jsx
<Grid layout="habf hh ab* ff 8 | .#">
  <Header />
  <Footer />
  {fields.map(f => <><Label /><Input /></>)}
</Grid>
```

Uppercase letters in repeat rows are **pinned** — they span all repetitions:

```jsx
// Sidebar spans all rows, items repeat next to it
<Grid layout="sa Sa* 8">
  <Sidebar />
  {items.map(i => <Card />)}
</Grid>
```

### Overlap

Three syntaxes for areas that share grid cells. All compile to explicit `grid-column`/`grid-row` placement.

**Bracket cells** — mark shared cells directly in the map:

```jsx
// image (i) and quote (q) overlap at [qi]
<Grid layout="iq ii. i[qi]q .qq | 50 50 | 50 50">
  <Photo />
  <Quote />
</Grid>
```

**Layer syntax** — draw each area's footprint separately, separated by `+`:

```jsx
// same result: layers are padded and overlaid automatically
<Grid layout="iq . .qqq .qqq + ii ii | 50 50 | 50 50">
  <Photo />
  <Quote />
</Grid>
```

**Line placement** — explicit CSS grid line numbers:

```jsx
// no map needed — each area placed by line numbers directly
<Grid layout="i[1:3, 1:3, 1] q[2:4, 2:4] | 50 50 | 50 50 .">
  <Photo />
  <Quote />
</Grid>
```

Line placement supports negative lines (`1:-1` = span full grid), z-index as a third param (`i[1:3,1:3,10]`), and alignment modifiers (`i(cC)[1:3,1:3]`).

### Per-area modifiers `()`

The `( )` syntax attaches modifiers to any area. All types compose freely, separated by whitespace or commas. `.` and `=` are self-delimiting.

| Modifier | Syntax | Effect |
|----------|--------|--------|
| Alignment | `s e c l` / `S E C L` | justify-self / align-self (start end center baseline) |
| z-index | `z5` | `z-index: 5` on wrapper |
| className | `.hero` | adds CSS class (chainable: `.foo.bar`) |
| alias | `=sidebar` | `data-area="sidebar"` on wrapper |
| flex-basis | `200` | `flex-basis: 200px` (flex mode) |
| no-shrink | `200!` | basis + `flex-shrink: 0` |
| custom shrink | `200/2` | basis + `flex-shrink: 2` |

```
a(cC)           — center both axes
a(z5 .card)     — z-index 5, class "card"
a(=sidebar)     — data-area="sidebar"
a(200! .panel)  — flex-basis 200px, no-shrink, class "panel"
a(eC z3 .hero)  — all combined
```

Works in: legend (`a(z5)B(sE)`), placement overrides (`a(cC)[1:3,1:3]`), and floating meta entries.

### Floating meta entries

`letter(mods)` can appear anywhere in the layout string as freestanding annotations — after map rows or inside pipe sizes segments. Multiple entries for the same area merge (classNames accumulate; later values win on key conflicts).

```jsx
// z-index + class after map rows
<Grid layout="ab 8 a(z3 .hero)">

// meta inside sizes segment — col sizes unaffected
<Grid layout="ab | 200# a(z3)">

// two entries — classNames accumulate
<Grid layout="ab 8 a(.header) a(.sticky)">
// ? a gets className "header sticky"
```

## Component Props

| Prop | Type | Description |
|------|------|-------------|
| `layout` | `string` | Layout string |
| `col` | `boolean` | Shorthand for transpose (`\|` prefix) |
| `gap` | `number \| string` | Override gap |
| `vars` | `object` | Values for `{placeholder}` substitution |
| `onVarsChange` | `function` | Callback when extensions mutate vars |
| `extensions` | `array` | Extension objects |
| `mode` | `"grid" \| "flex" \| "auto"` | Rendering model (`<Flex>` defaults to `"flex"`) |
| `xs` `sm` `md` `lg` `xl` | `string` | Layout strings per container breakpoint |
| `breaks` | `object` | Custom breakpoint thresholds |

### Minimal usage

```jsx
// Horizontal stack — no props needed
<Grid>
  <A /> <B /> <C />
</Grid>

// Vertical stack
<Grid col>
  <Header /> <Content /> <Footer />
</Grid>

// Responsive — each breakpoint is a complete layout string
<Grid layout="|abc ?w 8" sm="ab aab ?w 8" md="abc ?w 8">
  <A /> <B /> <C />
</Grid>
```

## Extensions

Behavioral plugins. Composable. Stack them in an array.

```jsx
import { Grid, splitPane, scrollable, debug } from "gridpack";

let [v, setV] = useState({ w: 200 });

<Grid
  layout="sC | {w}#"
  vars={v}
  onVarsChange={setV}
  extensions={[
    splitPane({ var: "w", edge: "s:e", min: 80, max: 400 }),
    scrollable({ area: ["s", "c"] }),
    debug(),
  ]}
>
  <Sidebar />
  <Content />
</Grid>
```

### Available extensions

| Extension | Description |
|-----------|-------------|
| `debug({ color? })` | Grid cell overlay |
| `splitPane({ var, edge, min?, max? })` | Draggable resize handle |
| `collapsible({ var, area, expanded?, collapsed?, handle? })` | Toggle area size on click |
| `accordion({ var, items, collapsed? })` | Mutual exclusion — expand one, collapse others |
| `scrollable({ area, axis? })` | Independent scrolling per area |
| `overlay({ area, over })` | Layer one area over another's grid cells |
| `animate({ properties?, duration?, easing? })` | CSS transitions on track changes |
| `tabs({ var, items, position? })` | Tab bar with content switching |
| `multiColumn({ area, fill? })` | CSS columns aligned to grid tracks |
| `fisheye({ axis?, intensity?, min?, sticky? })` | Tracks expand near cursor, compress away |
| `masonry({ balanced? })` | Masonry layout via `translateY` / `translateX` — items declare aspect ratio with `--width`/`--height` CSS vars or are content-measured |
| `render({ container?, cell? })` | Custom DOM output (semantic HTML, tables, etc.) |

### Writing custom extensions

Extensions are plain objects with lifecycle hooks:

```js
let myExtension = (opts) => ({
  name: "myExtension",
  needsAreas: false,                                          // force template-areas in auto-flow
  render: ({ parsed, vars, setVar, containerRef }) => [],   // inject elements
  renderContainer: ({ props, children, parsed }) => el,       // replace container output
  wrapCell: (child, areaStyle, key, childIdx, parsed) => el,  // replace cell wrapper
  containerStyle: ({ parsed, vars }) => ({}),                // modify container
  areaStyle: (area, vars) => null,                           // modify area wrappers
  transformVars: (vars) => vars,                             // derive vars from vars
  transformAreas: (parsed) => parsed,                        // modify parsed result
});
```

## Grammar (BNF)

```
layout    = ["|"] [legend] [map-rows] [gap] [?flags] ["|" cols ["|" rows]]
legend    = "*" | "*"digit+ | "*"pattern | area-def+
area-def  = letter [digit+] | LETTER [digit+]
          | letter"("mods")" | LETTER"("mods")"
          | letter"["range","range"]"                  — line placement
          | letter"["range","range","number"]"          — line placement with z-index
          | letter"("mods")" "["range","range"]"        — line placement with alignment
mods      = mod+                                       — separated by whitespace or ","
mod       = "s"|"e"|"c"|"l"|"S"|"E"|"C"|"L"           — justify/align-self
          | "z" digit+                                 — z-index
          | "." word                                   — className ("." self-delimiting)
          | "=" word                                   — alias ("=" self-delimiting)
          | digit+ ["!"]                               — flex-basis [+ no-shrink]
          | digit+ "/" digit+                          — flex-basis / flex-shrink
range     = number":"number                             — grid line start/end (1:3 ? 1 / 3)
map-row   = (letter [digit+] | LETTER | "." | overlap)+ ["*"]
overlap   = "[" letter letter+ "]"                      — shared cell: [iq] = i and q
layer-sep = "+"                                         — overlay separator
gap       = number [number]
?flags    = "?" ("w"|"h"|"f"|"F"|"x"|"W"|"s"|"e"|"c"|"b"|"a"|"g"|"S"|"E"|"C"|"B"|"A"|"G")+
size      = "." | "#" | number | atom"~"atom | css-literal
sizes     = size+ ["*"]

Implicit rules:
  legend-only           → single-row map
  empty + children      → "*" (auto-legend)
  "|" + empty           → transposed "*"
  *N + children         → N columns, auto rows
  repeated chars        → 1fr (proportional)
  row ending "*"        → repeat (varargs)
  UPPER in repeat       → pinned (shared across repetitions)
  "{var}"               → replaced from vars prop
  trailing "*" in sizes → cycle preceding tokens
  explicit # in sizes   → auto full-width/height
  ?secbag flags         → default track size becomes auto
  "+" in map rows       → split into layers, pad, overlay
  "[xy]" cells          → bounding rect ? grid-column/grid-row
  separators            → whitespace (space, tab, newline) and commas
  ?x or ?W              → mode switches to flex
  flex # in sizes       → flex-grow:1 (not a track size)
  flex Nfr in sizes     → flex-grow:N
  letter(mods) floating → annotation anywhere in string, merges with legend
```

## Before & After

<table>
<tr><th>Traditional CSS Grid</th><th>Gridpack</th></tr>
<tr>
<td>

```css
.layout {
  display: grid;
  grid-template-areas:
    "header header header"
    "sidebar content content"
    "sidebar footer footer";
  grid-template-columns: 200px 1fr 1fr;
  grid-template-rows: auto 1fr auto;
  gap: 8px;
}
.header  { grid-area: header; }
.sidebar { grid-area: sidebar; }
.content { grid-area: content; }
.footer  { grid-area: footer; }
```

</td>
<td>

```jsx
<Grid layout="hscf hhh scc sff 8 | 200##">
  <Header />
  <Sidebar />
  <Content />
  <Footer />
</Grid>
```

</td>
</tr>
</table>

## Links

- [Playground](https://thekeydev.github.io/gridpack/demo/) — interactive demo with 40+ presets, guided tutorials, and live source view
- [Documentation](https://thekeydev.github.io/gridpack/demo/) — full reference
- [npm](https://www.npmjs.com/package/gridpack)

## Support

If gridpack saves you time, consider supporting development: [![Donate](https://img.shields.io/badge/Donate-PayPal-blue)](https://www.paypal.com/donate/?hosted_button_id=9X7QBXKPBB2YW)

## License

MIT
