# PHANET KNUST design system

Kente and paper: white and cream pages, black ink, gold and royal blue, and kente cloth drawn in code. Display type is big, heavy and narrow; everything else is quiet. The 2026/27 theme words, "Let No Man Despise Thy Youth" (1 Timothy 4:12), still appear in text.

Everything below lives in `packages/ui/src/theme.css` (tokens and CSS classes) and `packages/ui/src/components/*` (React).

## Rules
- **Paper first, cloth as accent.** Pages are white or cream. Kente appears as a thin bar along the top, as stoles, as a band above the footer, as the woven edge under a hero, and as the dark background of heroes and login screens. Never behind long lists or forms.
- **Dark grounds are woven.** `.ground-blue` is now dark cloth (`#141210`) under a soft shade; put `<Blobs />` or `<KenteGround />` inside. White text and light-gold (`peach`) labels on it.
- **Type: Bricolage Grotesque** (variable: weight, optical size, width). Headings use `opsz 96` and a narrow width (`wdth` 75–85). Body is 17–18px. The old script font is gone: the accent word in a heading (`<Script>`, `.script`) is the same face, narrower, in blue on white or light gold on dark.
- **Type scale:** `.t-display`, `.t-h1`, `.t-h2`, `.t-h3`, `.t-lead`, `.t-body`, `.t-small`, plus `.t-word` (the giant blue word, e.g. "phanerōsis"), `.kicker` (the line above a name), `.t-ref` (scripture, gold text), `.t-quote`.
- **Square corners** on cards, fields, badges and images. Only buttons, pills and avatars are round.
- **Edges carry colour:** cards are white with a hairline (`line`); emphasis cards get a 6px top edge (gold on black `.card-blue`, navy on blue `.card-orange`, gold on cream `.card-gold`).
- **Buttons:** gold (`orange` variant) is the main call to action, black (`black`) and blue (`blue`) for strong secondary actions, outlined black (`ice`) for quiet ones, white-outlined (`ghost`) on dark.
- **Lists of facts** use `.facts` (a 3px black rule, then label/value rows). Tables use the same: a 3px rule under the header.
- **Contrast:** gold is never used for small text on white; use `gold-text` (#8A6400). On dark, use `peach` (#F6D77A) for labels.
- **Event photos** stay black and white until hover, focus or tap (`.photo-bw`). Leader portraits stay in colour.
- **No empty showcases.** Hide sections with no data.
- **Copy:** short, warm, second person. Currency `GH₵` (`money()`).

## Tokens (Tailwind v4 `@theme`)
Names were kept from the earlier system so every app restyled from one file.

| token | value | use |
|---|---|---|
| `deep` / `ink` | #141414 | body text, black panels |
| `royal` | #1F3FFF | blue accent, links, blue buttons |
| `navy` | #0B1F5C | deep blue band (`.stage`), button hover |
| `tangerine` / `gold` | #E8AD12 | gold buttons, rules, selected chips |
| `ember-ink` / `gold-text` | #8A6400 | small gold text on white (labels, references) |
| `peach` | #F6D77A | light gold on dark |
| `ice` | #F3EFE4 | soft fills (badges, hover) |
| `cream` / `row` | #FBF8F1 | alternate page sections, portal background |
| `line` | #E4E0D6 | hairlines and card borders |
| `field` | #D9D4C7 | input borders |
| `loom` | #141210 | the dark under the cloth |
| `muted` | #5F5F5F | secondary copy |

## Kente components (`kente.tsx`, `stoles.tsx`)
The cloth is painted thread by thread on a canvas in the browser (warp stripes, weft motifs, shading, selvedge) and used as a background image. Same seed, same cloth.

| component | use |
|---|---|
| `<KenteStrip seed>` | one vertical strip (stole beside a photo, swatch) |
| `<KenteEdge seed>` | a horizontal strip |
| `<KenteCloth seed stripWidth motion>` | strips sewn side by side; drifts gently on scroll |
| `<KenteBar>` | the 10px woven bar at the top of pages and the sidebar |
| `<KenteGround>` | dark woven background with a shade (heroes, login) |
| `<StoleRack items>` | stoles hanging from a rail as a section menu; they unroll, lengthen on hover and sway with the pointer |

Main-site only (`apps/web/src/components`): `WeaveIntro` (the opening: photos weave into one, once per browser session, with Skip and Escape) and `LoomGallery` (photos unweave into cloth and reweave as the next one).

All motion is turned off for people who ask their device for reduced motion.
