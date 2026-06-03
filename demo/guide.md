# Gridpack Guide

A complete guide to the gridpack layout DSL — from your first layout to advanced features. Every concept is introduced with a real goal, a working example, and then an explanation of the syntax involved.

> **Live examples** — code blocks marked `example` contain playground strings. Each one renders as an interactive preview in the documentation viewer. Click "Open in Playground" on any example to edit it live.


## Getting Started

### Install

```bash
npm install gridpack
```

```js
import { Grid } from "gridpack";
```

### Your first layout

You want a header, a sidebar, and a content area — the classic app shell.

```example
hsCf hhh scc sff 8;bx(4,Header,Sidebar,Content,Footer)
```

```jsx
<Grid layout="hsCf hhh scc sff 8">
  <Header />
  <Sidebar />
  <Content />
  <Footer />
</Grid>
```

That's it. No CSS files, no class names, no wrapper divs. The entire layout is one string.

Here's what the same layout looks like in plain CSS Grid:

```css
.layout {
  display: grid;
  grid-template-areas:
    "header header header"
    "sidebar content content"
    "sidebar footer footer";
  grid-template-columns: auto 1fr 1fr;
  grid-template-rows: auto 1fr auto;
  gap: 8px;
}
.header  { grid-area: header; }
.sidebar { grid-area: sidebar; }
.content { grid-area: content; }
.footer  { grid-area: footer; }
```

Gridpack replaces all of that with one prop. Let's learn how.


## Stacking Things

The simplest layouts are stacks — children placed side by side or on top of each other. For these you don't name anything or describe any grid; gridpack just flows the children into a row or column for you. (This is *auto-flow* mode — the zero-configuration branch. Naming and placing areas comes in [Area Maps](#area-maps).)

### Horizontal stack

Put children in a row. No layout string needed at all.

```example
;bx(3,A,B,C)
```

```jsx
<Grid>
  <A /> <B /> <C />
</Grid>
```

With an empty layout, gridpack flows the children left to right into a single row. There are no area names and no map — placement is automatic.

To add spacing between them, give a gap in pixels:

```example
8;bx(3,A,B,C)
```

```jsx
<Grid layout="8">
  <A /> <B /> <C />
</Grid>
```

The `8` is the whole layout string — just the gap. You can also write the row explicitly as `*`, which means "one auto-flow row":

```example
* 8;bx(3,A,B,C)
```

`*` and `8` (and the empty string) all describe the same thing here. The bare number is the shorthand; `*` becomes useful once you add sizes, which we'll get to.

### Vertical stack

Add a pipe `|` at the start to swap axes. The row becomes a column.

```example
| 8;bx(3,Top,Mid,Bottom)
```

```jsx
<Grid layout="| 8">
  <Top /> <Mid /> <Bottom />
</Grid>
```

The `|` is the **transpose pipe**. It's a single character that flips columns ↔ rows for the whole layout — and it keeps doing so once layouts get more complex (it flips the area map, the sizes, the alignment, even the gaps). A vertical stack is literally one character away from a horizontal one.

### Doing it with props

For these zero-config stacks you don't even need a layout string — there are dedicated props. `col` transposes (same as a leading `|`), and `gap` sets the spacing (overriding any gap in the layout string):

```jsx
<Grid>                {/* row */}
<Grid col>            {/* column */}
<Grid gap={8}>        {/* row, 8px gap */}
<Grid col gap={8}>    {/* column, 8px gap */}
```

`gap` takes a number (pixels) or any CSS string (`gap="1rem"`). It works alongside a layout string too, overriding whatever gap the string specifies.

The same props work on `<Flex>`, which is just `<Grid>` in flex mode:

```jsx
<Flex gap={8}>        {/* flex row */}
<Flex col gap={8}>    {/* flex column */}
```

For simple stacks the two are interchangeable; the difference between grid and flex only starts to matter once you care about sizing and wrapping (see [Flex Mode](#flex-mode)).

### Wrapping into a grid

A lone `*` is one row. Write `*N` to flow children into **N columns**, wrapping to as many rows as needed.

```example
*3 8 ?wh;nu(6)
```

```jsx
<Grid layout="*3 8 ?wh">
  {items.map(i => <Cell />)}
</Grid>
```

`*3` lays the children out three per row. With six children that's two rows. (The `?wh` flag makes the grid fill its container — more on flags later.)

Once there's more than one row, you can give two gap values — row gap and column gap:

```example
*3 8 24 ?wh;nu(6)
```

That's 8px between rows and 24px between columns (the order swaps if you transpose with `|`).

`*N` has more to it — controlling flow direction, dense packing, and per-child span patterns. For the full story see [Auto-Flow](#auto-flow).

## Area Maps

Auto-flow places children for you. When you want to *control* where things go — a header that spans the top, a sidebar that runs down one side — you name the regions and draw a map. This is the heart of gridpack, and the feature it was originally built around.

Named regions are called **areas**, written as single letters. You declare them in a **legend** and then arrange them in **map rows**.

### The legend and the map

The layout string has two parts: the **legend** declares which areas exist (and binds each to a child), and the **map rows** describe where they sit in the grid.

```example
hsc hhh scc 8;bx(3,Header,Sidebar,Content)
```

```jsx
<Grid layout="hsc hhh scc 8">
  <Header /> <Sidebar /> <Content />
</Grid>
```

Reading this string: the **first segment** `hsc` is always the legend — it declares areas `h`, `s`, `c` and binds them to children in order (`h` → first child, `s` → second, `c` → third). The legend itself is *not* a rendered row. The segments after it — `hhh` and `scc` — are the map rows. So this is a 3-column × **2-row** grid: `h` spans the full top row, `s` takes the left column below, `c` takes the right two columns.

You can read the map rows like ASCII art — each letter is a grid cell, and areas that span multiple cells are written by repeating the letter. Every letter you use in a map row must be declared in the legend; an undeclared letter is an error.

### Legend as a single-row layout

If you write only a legend with no map rows after it, the legend doubles as a one-row layout — each area becomes one cell in a single row:

```example
abc 8;bx(3,A,B,C)
```

```jsx
<Grid layout="abc 8">
  <A /> <B /> <C />
</Grid>
```

This looks like the horizontal stack from the previous section, and visually it is — but it's a different mechanism. Here `a`, `b`, `c` are real named areas (you could give them sizes, alignment, or span them across rows), whereas the auto-flow stack had no names at all. Reach for auto-flow when you just want things in a row; reach for areas when you need to address them individually.

### Empty cells

Use `.` in map rows for empty cells:

```example
abc abc .b. .b. 8;bx(3,A,B,C)
```

```jsx
<Grid layout="abc abc .b. .b. 8">
  <A /> <B /> <C />
</Grid>
```

Legend `abc`, then three map rows. In the top row all three areas sit side by side (`a b c`). In the two rows below, only `b` appears (`. b .`), so `b` spans down the center column while the cells beside it stay empty.

A common gotcha: an area declared in the legend but never placed in any map row simply doesn't render. The legend maps children to letters, but the *map rows* decide what actually appears. If you write `abc .b. .b.` (no `abc` map row), then `a` and `c` are declared but never placed — only `b` shows up.


## Sizing

### Proportional columns with repeated characters

You want one column wider than another? Repeat the letter in a map row.

```example
ab abb;bx(2,Narrow,Wide)
```

```jsx
<Grid layout="ab abb">
  <Narrow /> <Wide />
</Grid>
```

`b` appears twice in the second row, so `b` gets `2fr` and `a` gets `1fr`. No math needed — just repeat the letter.

There's also a **char-count shorthand**: `a2b3` means "repeat `a` twice and `b` three times", which expands to `aabbb`. Useful for larger ratios:

```example
ab a2b3;bx(2,Small,Large)
```

### Explicit sizes with the pipe separator

For precise control, use `|` to introduce column sizes:

```example
ab ab | 100 200;bx(2,A,B)
```

```jsx
<Grid layout="ab ab | 100 200">
  <A /> <B />
</Grid>
```

Numbers are pixels. This translates directly to `grid-template-columns: 100px 200px`.

Three tokens you'll use constantly in sizes:

| Token | Meaning | CSS equivalent |
|-------|---------|----------------|
| `#` | fractional unit | `1fr` |
| `.` | automatic | `auto` |
| number | pixels | `Npx` |

So `| 200 #` means "first column 200px, second column fills the rest":

```example
ab ab | 200 #;bx(2,Fixed,Fills)
```

And `| . # .` means "auto, fill, auto":

```example
abc abc | . # .;bx(3,Auto,Fills,Auto)
```

### Row sizes with a second pipe

A second `|` introduces row sizes:

```example
ab ab | 200 # | 50 100;bx(2,A,B)
```

```jsx
<Grid layout="ab ab | 200 # | 50 100">
  <A /> <B />
</Grid>
```

If you want to set only row sizes and skip column sizes, use an empty segment between pipes:

```example
ab ab || 50 100;bx(2,A,B)
```

### Minmax with the tilde

For responsive sizing, use `~` between two values to generate a `minmax()`:

```example
ab ab | 200~# #;bx(2,Min200,Fills)
```

`200~#` becomes `minmax(200px, 1fr)` — at least 200px, but grows fractionally. You can use any size tokens on either side: `.~#` means `minmax(auto, 1fr)`, `100~300` means `minmax(100px, 300px)`.

No space is allowed around the `~` — it binds tightly.


## Growing and Filling

### Uppercase letters = grow

When a layout should fill its container, uppercase letters in the legend make those areas grow. Their tracks become `1fr`.

```example
hsCf hhh scc sff 8;bx(4,Header,Sidebar,Content,Footer)
```

In the legend `hsCf`, `C` is uppercase — its columns become `1fr`, making the grid stretch to fill the available width. `s` is lowercase, so the sidebar stays content-sized.

Uppercase is a **legend concept** — it's declared once and applies to all rows where that area appears. You can have multiple grow areas: `HSCf` would make both header/sidebar grow.

### The `?w` and `?h` flags

Sometimes you want the whole grid to fill its container without making any specific area grow. That's what the `?w` (full width) and `?h` (full height) flags do:

```example
abc 8 ?w;bx(3,A,B,C)
```

```jsx
<Grid layout="abc 8 ?w">
  <A /> <B /> <C />
</Grid>
```

`?wh` forces both axes. Flags start with `?` and can appear anywhere in the string.

### When does auto-fill kick in?

There's a subtle distinction worth knowing:

- **Repeated chars** in map rows (`ab abb`) → proportional sizing, but the grid stays content-sized
- **Explicit `#` in pipe sizes** (`ab | # #`) → the grid automatically fills its container width

This means `ab abb` and `ab abb ?w` look different — the first is content-sized, the second fills the container. But `ab | # #` fills the container even without `?w`, because you wrote explicit `1fr` units.


## Alignment

### Container-level alignment with flags

You want all children centered in the grid? Use alignment flags.

```example
abc 8 ?whcC;bx(3,A,B,C)
```

```jsx
<Grid layout="abc 8 ?whcC">
  <A /> <B /> <C />
</Grid>
```

`?cC` centers both axes — lowercase `c` centers horizontally (`justify-content`), uppercase `C` centers vertically (`align-content`).

The full set of alignment flags follows the mnemonic **SECBAG**:

| Flag | Lowercase (horizontal) | Uppercase (vertical) |
|------|----------------------|---------------------|
| **S** | `justify-content: start` | `align-content: start` |
| **E** | `justify-content: end` | `align-content: end` |
| **C** | `justify-content: center` | `align-content: center` |
| **B** | `justify-content: space-between` | `align-content: space-between` |
| **A** | `justify-content: space-around` | `align-content: space-around` |
| **G** | `justify-content: space-evenly` | `align-content: space-evenly` |

Think: **S**tart, **E**nd, **C**enter, **B**orders (between), **A**round, **G**aps (evenly).

When transpose `|` is active, the axes swap — lowercase becomes vertical, uppercase horizontal. This is automatic.

### Per-area alignment with parentheses

You want one specific area centered while others stay default? Use `()` after the area letter in the legend:

```example
a(cC)bc 8 ?w;bx(3,Centered,B,C)
```

```jsx
<Grid layout="a(cC)bc 8 ?w">
  <Centered /> <B /> <C />
</Grid>
```

`a(cC)` centers area `a` on both axes. The same SECBAG letters work here, but they control `justify-self` and `align-self` instead of the container-level properties.

Per-area modifiers also support `l` / `L` for baseline alignment.

You can apply modifiers to any area in the legend:

```example
a(e)B(cC)c(s) abc 8 ?w;bx(3,End,Center,Start)
```

This right-aligns `a`, centers `B` (with grow), and left-aligns `c`.


## Responsive Layouts

Because each layout is just a short string, responsive design is trivial — write a different string per breakpoint.

```example
abc ?w 8;xs:|abc ?w 8;md:abc ?w 8;bx(3,A,B,C)
```

```jsx
<Grid layout="abc ?w 8" xs="|abc ?w 8">
  <A /> <B /> <C />
</Grid>
```

The `layout` prop is the default. The breakpoint props (`xs`, `sm`, `md`, `lg`, `xl`) override it at different container widths. Each breakpoint is a complete layout string — no incremental overrides, just a new description.

Default breakpoint thresholds (container-level, not viewport):

| Prop | Width |
|------|-------|
| `xs` | 0px |
| `sm` | 576px |
| `md` | 768px |
| `lg` | 992px |
| `xl` | 1200px |

You can customize these with the `breaks` prop:

```jsx
<Grid layout="abc 8" sm="ab aab 8" breaks={{ sm: 480, md: 640 }}>
```

Since gridpack uses a `ResizeObserver` on the Grid's container (not the viewport), nested grids can have their own breakpoints. A sidebar that's 300px wide will use its own `xs` breakpoint even when the page is 1200px wide.


## Dynamic Rows

### Repeat rows with `*`

You have a list of items and want them to flow into rows automatically? Append `*` to a map row.

```example
habf hh ab* ff 8 | .#;bx(8,Header,Footer,Item 1,Input 1,Item 2,Input 2,Item 3,Input 3)
```

```jsx
<Grid layout="habf hh ab* ff 8 | .#">
  <Header />
  <Footer />
  {fields.map(f => <><Label /><Input /></>)}
</Grid>
```

The row `ab*` repeats based on how many children are left after the static areas (`h`, `f`) are assigned. Each repetition gets numbered: `a1 b1`, `a2 b2`, `a3 b3`, etc.

### Pinned areas with uppercase in repeat rows

Uppercase letters in a repeat row are **pinned** — they span all repetitions instead of being numbered.

```example
sah sh Sa* 8 | 120 #;bx(6,Sidebar,Header,Card 1,Card 2,Card 3,Card 4)
```

```jsx
<Grid layout="sah sh Sa* 8 | 120 #">
  <Sidebar />
  <Header />
  {items.map(i => <Card />)}
</Grid>
```

Here `S` (uppercase) in `Sa*` means the sidebar spans all repeated rows — it's one continuous area. Only `a` gets numbered (`a1`, `a2`, ...). This replaces what would normally require complex `grid-row: span N` calculations.


## Auto-Flow

We met auto-flow back in [Stacking Things](#stacking-things): an empty string or `*` flows children into a row, and `*N` wraps them into N columns. No area names, no map — gridpack lets CSS place the children. This section covers the rest of what auto-flow can do: controlling flow direction, dense packing, and per-child span patterns.

### Recap: `*` and `*N`

```example
*4 8 ?wh;nu(12)
```

```jsx
<Grid layout="*4 8 ?wh">
  {items.map(i => <Card />)}
</Grid>
```

`*4` means "4 columns, rows auto-generated"; children are placed by CSS `grid-auto-flow`. A lone `*` is a single auto-flow row.

One practical note: the lone `*` is interchangeable with the empty string for a plain row, but you need the explicit `*` when you also want pipe sizes, because a leading `|` would otherwise be read as the transpose pipe:

```example
* 8 | 200 #;bx(2,Fixed,Fills)
```

### Flow direction and packing

Two flags modify auto-flow:

- `?f` — reverses flow direction. Instead of filling left→right then top→bottom, children fill top→bottom then left→right.
- `?F` — enables dense packing (`grid-auto-flow: dense`). Backfills gaps left by spanning items.

```example
*3 4 ?whf;nu(9)
```

### Span patterns with `*pattern`

For layouts where children need different column spans, use a span pattern:

```example
*s3c6a3 8 ?w;bx(6,S,Content,A,S,Content,A)
```

`*s3c6a3` creates a 12-column grid where children cycle through spans of 3, 6, and 3. The letters become area names, the numbers are span widths. Unnamed spans use `*`: `*w2*2` = `w` spans 2 + 2 unnamed singles = 4-column grid.

### Mixed mode: static rows + auto-flow

You can combine a static header row with auto-flow children:

```example
h12 *s3c6a3 8 ?w;bx(8,Header,S,Content,A,S,Content,A,S)
```

`h12` is a static row (header spanning 12 columns), `*s3c6a3` is the auto-flow body.


## Sizing Deep Dive

### Size cycling with trailing `*`

When you want sizes to repeat across all tracks, append `*` after the size pattern:

```example
*6 4 ?wh | 80 # *;nu(12)
```

`| 80 # *` with 6 columns becomes `80px 1fr 80px 1fr 80px 1fr` — the pattern cycles. Works independently on column and row sizes:

```example
*3 4 ?wh || 40 80 *;nu(9)
```

`|| 40 80 *` cycles row sizes: 40px, 80px, 40px, 80px, ...

### Auto-fill: responsive column count

A leading `*` on sizes creates `repeat(auto-fill, ...)` — the browser decides how many columns fit:

```example
* 8 ?w | *200~#;nu(8)
```

`| *200~#` becomes `repeat(auto-fill, minmax(200px, 1fr))`. Resize the container and columns are added or removed automatically. No breakpoints needed.

### Auto-fit: collapse empty tracks

Both leading and trailing `*` create `repeat(auto-fit, ...)` — same as auto-fill, but empty tracks collapse so items stretch to fill the row:

```example
* 8 ?w | *200~# *;nu(3)
```

With only 3 items, auto-fit collapses unused tracks and the items stretch. Auto-fill would leave empty tracks at the end.

### Multi-size auto-fill

Auto-fill supports multiple size tokens: `| *200 300` becomes `repeat(auto-fill, 200px 300px)`, creating alternating column pairs.


## Overlap

Three syntaxes for areas that share grid cells. All three compile to explicit `grid-column`/`grid-row` placement.

### Bracket cells `[xy]`

Mark shared cells directly in the map by wrapping the overlapping area letters in brackets:

```example
iq ii. i[iq]q .qq | # # | # #;bx(2,Photo,Quote)
```

```jsx
<Grid layout="iq ii. i[iq]q .qq | # # | # #">
  <Photo />
  <Quote />
</Grid>
```

`[iq]` means both `i` and `q` occupy that cell. The parser computes each area's bounding rectangle and converts it to line-based placement.

### Layer syntax with `+`

When marking individual overlap cells gets tedious, split the layout into separate layers with `+`:

```example
iq ii. ii. + ... .qq .qq | # # | # #;bx(2,Photo,Quote)
```

Each layer describes one area's footprint. Layers are padded to the same dimensions and overlaid. Where two layers occupy the same cell, they're merged into bracket cells automatically.

### Line placement with `[col,row]`

For full control, place areas by explicit CSS grid line numbers:

```example
i[1:3,1:3] q[2:4,2:4] | # # # | # # #;bx(2,Photo,Quote)
```

```jsx
<Grid layout="i[1:3,1:3] q[2:4,2:4] | # # # | # # #">
  <Photo />
  <Quote />
</Grid>
```

`i[1:3,1:3]` sets `grid-column: 1 / 3; grid-row: 1 / 3`. Supports negative lines (`1:-1` = span full grid), z-index as a third param (`i[1:3,1:3,10]`), and alignment modifiers (`i(cC)[1:3,1:3]`).

Line placements can appear anywhere in the string — legend, after map rows, or standalone. When no map is given at all, the grid size is inferred from the highest line numbers.

You can mix line placement with regular area maps: some areas placed by template-areas, others by explicit lines.


## Template Variables

Variables let you put dynamic values into layout strings. Write `{name}` in the string, pass values through the `vars` prop.

```example
sC | {w}#;bx(2,Sidebar,Content);sp(w,s:r,80,400);w:200
```

```jsx
let [v, setV] = useState({ w: 200 });

<Grid layout="sC | {w}#" vars={v} onVarsChange={setV}>
  <Sidebar /> <Content />
</Grid>
```

`{w}` is replaced with the value of `v.w` before parsing — simple string substitution. When `w` is 200, the layout becomes `sC | 200#`, giving the sidebar a 200px column.

This is how extensions like `splitPane` and `collapsible` work — they update variables, the layout string recalculates, and the grid re-renders.


## Extensions

Extensions add behavior to layouts. They're composable — stack them in an array and they work together.

### splitPane

Draggable resize handle between areas.

```example
sC | {w}#;bx(2,Sidebar,Content);sp(w,s:r,80,400);w:200
```

```jsx
let [v, setV] = useState({ w: 200 });

<Grid
  layout="sC | {w}#"
  vars={v}
  onVarsChange={setV}
  extensions={[splitPane({ var: "w", edge: "s:r", min: 80, max: 400 })]}
>
  <Sidebar /> <Content />
</Grid>
```

`edge: "s:r"` means the handle is on the **r**ight edge of area **s**. The handle writes back to variable `w`, which updates the column size. Drag it — the sidebar resizes smoothly.

Edge format: `area:side` where side is `l` (left), `r` (right), `t` (top), `b` (bottom). Uppercase inverts the drag direction.

### collapsible

Toggle an area between two sizes on click.

```example
sC | {w}#;bx(2,Sidebar,Content);cl(w,s,200,0);an;w:200
```

```jsx
<Grid
  layout="sC | {w}#"
  vars={v}
  onVarsChange={setV}
  extensions={[
    collapsible({ var: "w", area: "s", expanded: 200, collapsed: 0 }),
    animate(),
  ]}
>
```

Click the arrow — the sidebar collapses to 0px. Click again — it expands to 200px. Pair with `animate()` for smooth transitions.

### accordion

Mutual exclusion — expand one section, collapse others.

```example
|aBc | {a}{b}{c};bx(3,A,B,C);ac(active,.,a:200,b:200,c:200);an;a:#;b:.;c:.
```

```jsx
<Grid
  layout="|aBc | {a}{b}{c}"
  vars={{ a: "#", b: ".", c: "." }}
  onVarsChange={setV}
  extensions={[
    accordion({ var: "active", items: [
      { area: "a", sizeVar: "a", expanded: "#" },
      { area: "b", sizeVar: "b", expanded: "#" },
      { area: "c", sizeVar: "c", expanded: "#" },
    ], collapsed: "." }),
    animate(),
  ]}
>
```

### scrollable

Mark areas as independently scrollable.

```example
hsCf hhh scc sff 8 | 200##;bx(4,Header,Sidebar,Content,Footer);sc(s:c)
```

```jsx
<Grid
  layout="hsCf hhh scc sff 8 | 200##"
  extensions={[scrollable({ area: ["s", "c"] })]}
>
```

Each area scrolls independently. Combine with `splitPane` — drag the divider and both areas adjust while keeping their scroll positions.

### animate

CSS transitions on grid track changes. One line, composes with everything.

```jsx
extensions={[animate({ duration: "0.4s", easing: "ease" })]}
```

### overlay

Layer one area over another, occupying the same grid cells with higher z-index.

```jsx
extensions={[overlay({ area: "m", over: "c" })]}
```

Area `m` covers the same cells as area `c`. Useful for modals, loading states, or any layered content.

### tabs

Tab bar with content switching.

```example
|taBc 8;bx(4,Tabs,A,B,C);tb(tab,top,Tab1:a,Tab2:b,Tab3:c);an;tab:a
```

```jsx
<Grid
  layout="|taBc 8"
  vars={{ tab: "a" }}
  extensions={[
    tabs({ var: "tab", items: [
      { label: "Tab 1", area: "a" },
      { label: "Tab 2", area: "b" },
      { label: "Tab 3", area: "c" },
    ]}),
    animate(),
  ]}
>
```

### multiColumn

CSS multi-column layout aligned to grid tracks.

```jsx
extensions={[multiColumn({ area: "c", fill: "balance" })]}
```

Area `c` spans multiple grid columns. The extension reads the computed track widths and sets CSS `column-width` to match — text flows across columns aligned with the grid.

### fisheye

Tracks expand near cursor, compress away. Each cell receives a `--fe-scale` CSS variable that children use to scale content.

```jsx
extensions={[fisheye({ axis: "x", intensity: 0.6, min: 0.15 })]}
```

### masonry

Close vertical gaps in auto-flow grids via `translateY`. Items can use `--width`/`--height` CSS vars for aspect-ratio sizing, or get measured from DOM.

```jsx
extensions={[masonry({ balanced: true })]}
```

`balanced: true` reorders items within each row to minimize total height.

### render

Custom DOM output. Replace the container tag, the cell wrappers, or both.

```jsx
extensions={[render({
  container: ({ props, children }) => <table {...props}><tbody>{children}</tbody></table>,
  cell: (child, style, key) => <td key={key} style={style}>{child}</td>,
})]}
```

Enables semantic HTML structures like `<table>`, `<dl>`, or any custom DOM shape while keeping gridpack's layout logic.

### debug

Grid cell overlay for visualizing the layout during development.

```jsx
extensions={[debug()]}
```

### Writing custom extensions

Extensions are plain objects with lifecycle hooks:

```js
let myExtension = (opts) => ({
  name: "myExtension",
  needsAreas: false,
  render: ({ parsed, vars, setVar, containerRef }) => [],
  renderContainer: ({ props, children, parsed }) => el,
  wrapCell: (child, areaStyle, key, childIdx, parsed) => el,
  containerStyle: ({ parsed, vars }) => ({}),
  areaStyle: (area, vars) => null,
  transformVars: (vars) => vars,
  transformAreas: (parsed) => parsed,
});
```

Extensions compose freely — stack `splitPane`, `scrollable`, `animate`, and `debug` in one array and they all work together. Each hook runs in extension-array order.


## Per-Area Modifiers

The `()` syntax after an area letter supports more than just alignment. All modifier types compose freely inside the same parentheses.

### CSS classes

```jsx
<Grid layout="a(.card)b(.sidebar) ab ab 8">
```

`a(.card)` adds class `card` to area `a`'s wrapper element. Chain them: `a(.card.featured)` adds both classes. The `.` is self-delimiting — no separator needed.

### Data-area alias

```jsx
<Grid layout="a(=sidebar)b ab ab 8">
```

`a(=sidebar)` sets `data-area="sidebar"` on the wrapper. Useful for CSS targeting without coupling to the internal letter name.

### Z-index

```jsx
<Grid layout="a(z5)b ab ab 8">
```

`a(z5)` sets `z-index: 5` on area `a`'s wrapper.

### Combined modifiers

All modifier types work together:

```jsx
<Grid layout="a(eC z3 .card =sidebar) ab ab 8">
```

That's: justify-self end, align-self center, z-index 3, class "card", data-area "sidebar" — all on area `a`.

### Floating meta entries

Per-area modifiers don't have to be in the legend. They can appear anywhere in the layout string as freestanding annotations:

```jsx
<Grid layout="ab ab 8 a(z3 .hero)">
```

Multiple entries for the same area merge: class names accumulate, other keys take the later value.


## Flex Mode

The same DSL can emit `display: flex` instead of `display: grid`. Use the `<Flex>` component or add `?x` to any layout string.

### When to use Flex vs Grid

Grid defines tracks and places items into cells. Flex lets items negotiate their own size. Use Flex when:

- Content should drive sizing (navigation bars, toolbars)
- You need wrapping with a last-row that auto-centers (impossible with grid)
- You want `flex-shrink` / `flex-grow` behavior

### Basic usage

```example
aBc 8 ?w ?x;bx(3,A,Grows,C)
```

```jsx
import { Flex } from "gridpack";

<Flex layout="aBc 8 ?w">
  <A /> <Grows /> <C />
</Flex>

// or equivalently:
<Grid layout="aBc 8 ?w ?x">
```

Uppercase letters map to `flex-grow: 1`, same as they map to `1fr` in grid. The `|` transpose switches to `flex-direction: column`.

### Flex-specific flags

- `?f` — `flex-direction: row-reverse` (or `column-reverse` with `|`)
- `?W` — `flex-wrap: wrap` (implies flex mode, no `?x` needed)

### Flex sizing

In the pipe sizes section, tokens take on flex meanings:

| Token | Flex meaning |
|-------|-------------|
| `.` | `auto` (no-op) |
| `#` | `flex-grow: 1` |
| `2fr` | `flex-grow: 2` |
| `200` | `flex-basis: 200px` |
| `120~#` | `flex-basis: 120px` + `flex-grow: 1` |
| `120~200` | `flex-basis: 120px` + `max-width: 200px` + `flex-grow: 1` |

### Flex modifiers in parentheses

Per-area parentheses gain flex-specific modifiers:

- `a(200)` — `flex-basis: 200px`
- `a(200!)` — `flex-basis: 200px` + `flex-shrink: 0` (won't shrink below 200px)
- `a(200/2)` — `flex-basis: 200px` + `flex-shrink: 2`

### Wrapping

```example
* 8 ?w ?W | *140~200;nu(12)
```

`?W` enables `flex-wrap: wrap`. This example creates wrappable items, each between 140px and 200px. The last row auto-centers — something impossible with CSS grid.

Transposed flex uses `max-height` instead of `max-width` for minmax caps.


## Sub-Layouts

> **Coming soon** — this feature is designed but not yet released.

Sub-layouts let you nest layouts inside a single `<Grid>` without manual wrapper divs. The DSL describes the entire tree.

### The problem

Right now, nesting requires explicit wrapper components:

```jsx
<Grid layout="gc 8 | 200 #">
  <Grid layout="|ab 8">     {/* wrapper div just for layout */}
    <Sidebar />
    <Nav />
  </Grid>
  <Content />
</Grid>
```

With sub-layouts, the tree is encoded in one string:

### The syntax: `letter<layout>`

```jsx
<Grid layout="g<|ab 8> gc 8 | 200 #">
  <Sidebar />   {/* a — consumed into g */}
  <Nav />        {/* b — consumed into g */}
  <Content />    {/* c */}
</Grid>
```

`g<|ab 8>` declares area `g` with an inner layout `|ab 8`. The angle brackets `<>` visually suggest containment — like HTML tags. The component creates the wrapper div for you and applies the inner layout to it.

### How children are assigned

The top-level legend defines the child-to-letter mapping. Those same letters appear inside sub-layouts:

```
layout="g<|ab 8> gc 8 | 200 #"
```

- Top-level legend: `a`=child 0, `b`=child 1, `c`=child 2
- `g<|ab 8>` references `a` and `b` — those children are placed inside `g`'s wrapper
- `c` is placed directly in the outer grid

The letters are a global namespace — defined once in the legend, usable anywhere including inside nested sub-layouts.

### Dynamic sub-layouts with auto-flow

When the sub-layout is auto-flow (unknown child count), pass a single child div and gridpack injects the layout into it:

```jsx
<Grid layout="g<* 8 ?w> c 8 | # 200">
  <div>                     {/* g — Grid reads child count from here */}
    <Card /> <Card /> <Card />
  </div>
  <Content />               {/* c */}
</Grid>
```

The unified rule: if the sub-layout string has named areas, child count is inferred from the string and children are consumed from the flat list. If it's auto-flow, expect a single child div and inject into it.

### Responsive tree merging

Sub-layouts work with responsive breakpoints. Different breakpoints can have different nesting structures:

```jsx
<Grid layout="g<|ab> gc 8" sm="abc 8">
  <Sidebar /> <Nav /> <Content />
</Grid>
```

At desktop: `a` and `b` are wrapped in `g`'s container div with vertical layout.
At mobile: all three children are flat in one row.

Gridpack builds the superset DOM tree across all breakpoints. Container divs always exist, but toggle between their sub-layout styles and `display: contents` (invisible to layout) depending on the active breakpoint. No DOM remounting, no state loss — only styles change.

### Connection to repeat rows

Sub-layouts generalize the repeat row feature. A repeat zone is essentially an auto-flow sub-layout:

```
// current repeat syntax
"habf hh ab* ff 8"

// equivalent with sub-layout (conceptual)
"habf hh g<ab* 8> ff 8"
```

This opens the door to multiple repeat zones in one layout — each is a sub-layout area backed by a container div.


## Component Props Reference

| Prop | Type | Description |
|------|------|-------------|
| `layout` | `string` | The layout string |
| `col` | `boolean` | Shorthand for transpose (`\|` prefix) |
| `gap` | `number \| string` | Override gap |
| `mode` | `"grid" \| "flex" \| "auto"` | Rendering model (`<Flex>` defaults to `"flex"`) |
| `vars` | `object` | Values for `{placeholder}` substitution |
| `onVarsChange` | `function` | Callback when extensions mutate vars |
| `extensions` | `array` | Extension objects |
| `xs` `sm` `md` `lg` `xl` | `string` | Layout strings per container breakpoint |
| `breaks` | `object` | Custom breakpoint thresholds |


## Token Reference

### In the layout string

| Token | Where | Meaning |
|-------|-------|---------|
| `a-z` | legend, map | Named area |
| `A-Z` | legend | Grow area (tracks become `1fr`) |
| `.` | map | Empty cell |
| `0-9` | after letter | Char-count shorthand (`h12` → 12 h's) |
| `0-9` | standalone | Gap in pixels |
| `\|` | start | Transpose (swap cols ↔ rows) |
| `\|` | after map | Pipe separator for sizes |
| `*` | standalone | Auto-legend from child count |
| `*N` | standalone | Auto-flow with N columns |
| `*pattern` | standalone | Auto-flow with span pattern |
| `*` | after map row | Repeat this row based on child count |
| `()` | after letter | Per-area modifiers |
| `[]` | in map | Overlap cell — `[iq]` means both areas share this cell |
| `[]` | after letter | Line placement — `a[1:3,1:3]` |
| `<>` | after letter | Sub-layout — `g<\|ab 8>` *(coming soon)* |
| `+` | between rows | Layer separator for overlap |
| `{}` | anywhere | Template variable — replaced from `vars` prop |
| `?` | anywhere | Flag prefix |
| `,` | anywhere | Optional separator (interchangeable with space) |

### In the sizes section (after `|`)

| Token | Grid meaning | Flex meaning |
|-------|-------------|-------------|
| `.` | `auto` | `auto` |
| `#` | `1fr` | `flex-grow: 1` |
| number | `Npx` | `flex-basis: Npx` |
| `a~b` | `minmax(a, b)` | basis + grow/max |
| `*` trailing | Cycle pattern | Cycle pattern |
| `*` leading | `repeat(auto-fill, ...)` | — |
| `*...*` both | `repeat(auto-fit, ...)` | — |

### Flags (`?`)

| Flag | Effect |
|------|--------|
| `w` | `width: 100%` |
| `h` | `height: 100%` |
| `f` | Reverse auto-flow direction / flex-direction reverse |
| `F` | Dense packing (`grid-auto-flow: dense`) |
| `x` | Flex mode (`display: flex`) |
| `W` | `flex-wrap: wrap` (implies flex mode) |
| `s/S` | start (justify / align) |
| `e/E` | end |
| `c/C` | center |
| `b/B` | space-between |
| `a/A` | space-around |
| `g/G` | space-evenly |

### Per-area modifiers (inside `()`)

| Modifier | Effect |
|----------|--------|
| `s/e/c/l` | `justify-self`: start / end / center / baseline |
| `S/E/C/L` | `align-self`: start / end / center / baseline |
| `z` + number | `z-index` |
| `.name` | CSS class |
| `=name` | `data-area` attribute |
| number | `flex-basis` (flex mode) |
| number`!` | `flex-basis` + `flex-shrink: 0` |
| number`/`number | `flex-basis` / `flex-shrink` |


## Grammar

```
layout       = ["|"] [legend] [map-rows] [gap] [?flags] [placements] ["|" col-sizes ["|" row-sizes]]

legend       = area-def+  |  "*"  |  "*"digit+  |  "*"pattern
area-def     = letter ["("mods")"]  |  LETTER ["("mods")"]
pattern      = (letter digit*  |  "*" digit*)+

map-rows     = map-row+ ["+" map-row+]*
map-row      = cell+  |  cell+ "*"
cell         = letter  |  LETTER  |  letter digit+  |  "."  |  "[" letter+ "]"

gap          = number  |  number number
flags        = "?" flag-char+
flag-char    = w | h | f | F | x | W | s | e | c | b | a | g | S | E | C | B | A | G

mods         = mod+
mod          = s | e | c | l | S | E | C | L | "z"digit+ | "."word | "="word | digit+["!"] | digit+"/"digit+

placement    = letter ["("mods")"] "[" line","line [","z] "]"
line         = number [":"number]

col-sizes    = ["*"] size+ ["*"]
row-sizes    = ["*"] size+ ["*"]
size         = "." | "#" | number | atom"~"atom | css-literal
```

### Implicit rules

- Legend only, no map rows → legend doubles as single-row map
- Empty input + children → `*` (auto h-stack)
- `|` + empty + children → transposed `*` (auto v-stack)
- Uppercase in legend → tracks become `1fr`, implies full width/height
- Explicit `#` in pipe sizes → implies full width/height
- `?` alignment flags → auto-flow tracks default to `auto` instead of `1fr`
- Transpose swaps everything: cols ↔ rows, justify ↔ align, gaps, flow direction
- Whitespace, tabs, newlines, and commas are all valid separators
