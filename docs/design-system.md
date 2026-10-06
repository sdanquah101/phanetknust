# PHANET KNUST design system

The flyer's world turned into a product: a royal‑blue fluid atmosphere, a glossy tangerine "stage" that lifts things up, and bubbly white 3D type. Joyful, youthful, confident. The 2026/27 theme "Let No Man Despise Thy Youth" (1 Tim 4:12) is the brand voice: hero headline, portal badge, verse of the day.

Everything below is implemented in `packages/ui/src/theme.css` (tokens + CSS classes) and `packages/ui/src/components/*` (React).

## Rules
- **Hero = the flyer's world.** On the home page a blurred copy of the flyer is the backdrop and the crisp artwork dissolves into it (CSS mask). The theme words appear once, in the artwork; the HTML headline says something else.
- **Contrast first.** Body text on blue is pure white. Small labels on blue are white, never peach/orange. Small orange text on white uses `ember-ink` (#C2410C). Orange buttons use the deep gradient `#E0530A → #BF3C00` so white text passes AA.
- **Type scale (7 sizes):** `.t-display`, `.t-h1`, `.t-h2`, `.t-h3`, `.t-lead`, `.t-body`, `.t-small` (+ `.label-caps` 12px, `.t-ref` for scripture references, `.t-quote` for verses). No arbitrary `text-[NNpx]` headings.
- **Script is an accent.** At most one Pacifico word per section, flat with soft depth (`.script-puffy` / `.script`). Never for verses or paragraphs: those use `.t-quote` (Poppins italic).
- **One orange block per screen.** Hero edges use `<HeroCurve />` (ice curve with a thin tangerine rim), not a full orange band.
- **Logo** is the PHANET crest (`<Crest />`, lifted from the flyer; swap `CREST_SRC` for a high-res file). The orange dot is no longer a logo or a bullet.
- **No empty showcases.** Hide sections and stats that have no data instead of showing zeros or "coming soon" bars.
- **Rhythm:** only the hero and footer are full-bleed blue. Other blue panels are inset rounded cards on the ice page.
- **Public site** = blue ground (`.ground-blue`), orange accent. **Portals** = ice ground (`.ground-ice`), white cards, blue + orange as paint.
- Never more than **one orange gradient block per viewport**.
- Pacifico (`.script` / `<Script>`) for **one word or phrase per headline**, always white or peach, ~1.1–1.5× the Poppins size. Never a whole sentence.
- Nothing square: pills `999px`, cards 24–36px, phones 44px.
- Backgrounds are never flat: `<Blobs />` inside a relative container.
- Numbers large (`.num-lg` / `.num-xl`, 28–44px) with small tracked labels above (`<Label>`, `.label-caps`).
- Copy: short, warm, second person. "Akwaaba, Ama", "Sow where you're planted", "I'm coming". Currency `GH₵` (`money()` helper). Rails: MTN MoMo, Telecel Cash.

## Tokens (Tailwind v4 `@theme`)
| token | value | use |
|---|---|---|
| `royal` | #1F5EFF | primary ground, primary buttons, active states |
| `deep` | #0B3BD1 | 3D text shadow, dark end of gradients, portal body text |
| `sky` / `sky-light` | #4D8BFF / #7FB2FF | glow blobs, light end of gradients |
| `tangerine` / `ember` / `ember-2` / `peach` | #FF7A00 / #FF4D00 / #FF5A00 / #FFB36B | CTAs, the stage, highlighted words, progress, small labels |
| `ice` | #EAF1FF | portal page background, inactive chips, dividers |
| `peach-tint` | #FFF0E3 | warning / outstanding badges with `ember-2` text |
| `muted` | #4a5a86 | secondary copy on white |
| `row` | #F5F8FF | unselected option rows, inputs |

Tailwind utilities: `bg-royal`, `text-deep`, `text-muted`, `bg-ice`, `rounded-card`, `rounded-pill`, `shadow-card`, `font-script`, etc.

## CSS classes (theme.css)
- Grounds: `.ground-blue`, `.ground-ice`, `.blob .blob-sky|blob-deep|blob-orange .blob-drift`, `.stage`, `.stage-lip`
- Type: `.h3d` (white 3D headline on blue), `.script`, `.wordmark`, `.label-caps(-orange|-peach)`, `.num-xl`, `.num-lg`
- Buttons: `.btn` + `.btn-orange|btn-white|btn-blue|btn-ice|btn-ghost|btn-outline-blue|btn-danger`, sizes `.btn-sm|.btn-lg`
- Pills/chips: `.pill-glass|pill-ice|pill-white|pill-orange|pill-outline|pill-blue`, `.chip[data-selected]`, `.verse-badge`
- Badges: `.badge-good` (ice/blue), `.badge-warn` (peach/ember), `.badge-mint`, `.badge-orange`, `.badge-white`, `.badge-glass`
- Surfaces: `.card`, `.card-lg`, `.card-blue`, `.card-orange`, `.card-ice`, `.glass`, `.tilt-2|tilt-3|tilt-n2`, `.dot-orange`
- Forms: `.field`, `.field-label`, `.input`, `.select`, `.textarea`, `.input-glass`, `.option-row[data-selected]` (+ `.radio`), `.check`
- Data: `.table` (+ `.amt-in`, `.amt-out`), `.ring` / `.ring-ice` with `--pct`, `.chain-dot.claimed|.mine`
- Nav: `.nav-glass` + `.nav-item[aria-current=page]`, `.sidebar` (+ `.sidebar-exec` for orange active pill), `.sidebar-item`, `.tabbar`
- Misc: `.avatar`, `.stack`, `.notice-ice|peach|orange|mint`, `.ticker`, `.floaty`, `.fade-up`, `container-page` (1440 max, 22/48px gutters)

## React components (`@phanet/ui`)
`Logo`, `Script`, `Button`, `ButtonLink`, `Badge`, `Label`, `VerseBadge`, `Card`, `StatCard`, `ProgressRing`, `Blobs`, `Ticker`, `Avatar`, `initials`, `Field`, `Input`, `Select`, `Textarea`, `EmptyState`, `Notice`, `PageHeader`, `Table`, `PillNav`, `SidebarNav`, `TabBar`, `PublicHeader`, `PortalShell`, `SidebarPromo`, `SidebarUser`, `BlueHero`, `Footer`, `SubmitButton`, `ConfirmSubmit`, `Toast`, `LoginScreen`, `NoAccess`, `cn`.

Fonts: `import { fontClassName } from "@phanet/ui/fonts"` on `<html>`.
