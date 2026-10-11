# Leaf Track — landing

Built from **Living Leaf Action Plan › Company Profile › LANDING PAGE**
(`figma.com/design/V5NwuAGslmACPAWC4dG3QJ`, frame `551-1655`, 1440×3975).

Open `index.html` — no server, no build step, no dependencies.

```bash
node validate.test.js         # dropzone rules
```

Four files.

| | |
|---|---|
| `index.html` | Markup. Copy lives in `data-en` / `data-id` pairs. |
| `styles.css` | Tokens, a named **motion layer**, components, responsive. |
| `app.js` | The five microinteractions, one block each. |
| `validate.js` | Dropzone rules. A plain script, so it loads over `file://` and still `require`s under node. |

## Microinteractions

Each block in `app.js` is one contained moment — trigger, rules, feedback, loop.

| | Trigger | Loop / mode |
|---|---|---|
| **M1** Nav scroll state | system, `scrollY > 16` with hysteresis | open |
| **M2** Nav link underline | hover / focus, wipes from the left | — |
| **M3** Language EN / ID | manual | **mode** — `aria-pressed`, `<html lang>`, persisted |
| **M4** Buttons | hover lift, press scale, arrow leads | — |
| **M5** Hero mosaic | 4s timer, or hover | long — auto-advance **stops for good** on first hover |
| **M9** Tile profile | hover / focus-within | pure CSS, so it works with the script dead |
| **M11** Active card wash | active or hover | brand gradient over the render, ramped top→bottom |
| **M7** Dropzone | drag-and-drop **and** a visible `<label for>` | modes: idle · over · reading · ready · error |
| **M8** Scroll reveal | 12% into view | closed — fires once, then unobserves |
| **M10** Reduced motion | `prefers-reduced-motion` | collapses every `--dur-*` at `:root` |

Rules held to:

- **Progress is honest.** The bar is driven by `FileReader.onprogress` bytes, never a timer.
- **Errors say what → why → next action**, in both languages. See `validate.js`.
- **Colour is never the only signal** — every status dot carries a word.
- **The focus ring never varies**, and it is an `outline`, not a `box-shadow`: a
  shadow-based ring loses the cascade to any component with its own shadow
  (`.btn--grad` has one).
- **No invisible-only gesture.** Drag-and-drop is paired with a visible control.
- **Nothing readable depends on JavaScript.** No stylesheet rule hides content.
  `app.js` adds `.reveal--pending` itself, and only to elements below the fold,
  one frame before it starts watching them. If the script never runs the page is
  plain and completely readable.

  This took two attempts. First `.reveal { opacity: 0 }` applied unconditionally,
  so any JS failure blanked everything below the fold. The fix gated it on a
  `.js` class set by an inline script — which still failed over `file://`,
  because inline script runs there but `type="module"` is CORS-blocked, so the
  gate said "JS is alive" while the script that lifts the veil never loaded. The
  scripts are now plain `<script defer>`, and the hiding is done by the same code
  that undoes it. A gate has to test the thing it is actually gating.

  Tile profiles live in the markup for the same reason, and CSS `:hover` shows
  them; the script only advances the highlight.

## Hero mosaic geometry

Measured off **Frame 427318526** (710x470, clip content on), because the first
pass guessed at it and guessed wrong:

| | |
|---|---|
| Tiles | **223.25 square** — all seven identical, not a masonry of mixed spans |
| Columns | three, ~20px apart |
| Rows | ~23.5px apart, so two tiles fill the 470px frame exactly |
| Column 2 | holds **three** tiles and sits **137px higher**, bleeding past the top and bottom edges |
| Frame | clips, which is what makes the middle column read as a moving strip |

`.mosaic` is a container (`container-type: inline-size`) so the offset and row
gap are in `cqw` — 1% of the mosaic's own width. A px offset would drift as the
tiles shrink; at any width the stagger stays proportional. Below 560px the
stagger is dropped and it becomes a plain two-column grid, since the clip needs
width to read as deliberate rather than broken.

The active card is not merely outlined. The render is washed in the brand
gradient — red left, violet right — behind a mask that ramps from 8% opacity at
the top to 95% at the bottom. That ramp is the whole effect: the top of the
model keeps its own colours while the base dissolves into the gradient, which
is what makes the fan read as a wireframe. There is no separate wireframe
asset; the fill under it is the same `fan.webp` the plain tile uses.

## Still to do

**All the art is now the real thing**, pulled out of the Figma file itself:
seven 3D renders and Aruman H.'s avatar for the hero mosaic, four photos for
How It Works, and the FAQ render (which is the same fan that opens the mosaic).
216 KB of WebP for the lot.

How, if you need more: open the file in Chrome, start a network capture, reload
with the section you want in view, and take the `s3-alpha-sig.figma.com/img/…`
URLs — the newly-visible node's images arrive first. Those are the original
image fills, signed and good until 2026-09-28. `cwebp -q 82` takes a 300 KB PNG
to about 15 KB. Each image's own backdrop colour is set as `background-color`
beside it, so a tile is the right colour before the image lands and stays right
if it never does.

Six of the seven artist names on the tiles are invented — only **Aruman H.** is
in the design, and only he has a photo. The others fall back to an initial.

## Two things in the design worth a decision

1. ~~**The file-size limit contradicts itself.**~~ Resolved 2026-10-11: the
   100MB FAQ item was replaced, so 10MB (`MAX_BYTES` in `validate.js`) is the
   only limit on the page.

2. **The Figma is half-translated.** The Live Demo section is Indonesian; every
   other section is English — with an EN/ID switch in the nav. Both languages
   are now written out in full, but the Indonesian outside the Live Demo
   section is mine, not the studio's. Have someone who owns the voice read it.
