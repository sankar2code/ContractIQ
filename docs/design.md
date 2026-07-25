# ContractIQ Design System

> Original design system — no prior brand/codebase existed; built from the product brief. See `readme.md` for full context, caveats, and asks.

## Product

ContractIQ: upload a contract PDF, get a clause-by-clause breakdown in ~30 seconds — what each clause says, an AI confidence score, and a link back to the source sentence. Plain-English Q&A grounded in the document. Covers two surfaces: a marketing website and the app itself.

## Color

### Primitive palette

| Family | 900 | 700 | 500 (base) | 300 | 100 | 50 |
|---|---|---|---|---|---|---|
| Ink/Neutral | `#1C1F26` | `#454A56` | `#767C8A` | `#C4C8D0` | `#EEEFF2` | `#F5F5F3` |
| Indigo (brand) | `#1B2266` | `#2B3AAE` | `#3B4FE0` | `#A3AEF3` | `#E4E7FC` | `#F1F2FE` |
| Green (high confidence) | `#0F5C3D` | — | `#1B8A5A` | — | `#E7F6EE` | `#F2FAF5` |
| Amber (medium confidence) | `#8A5A12` | — | `#B7791F` | — | `#FDF3E0` | `#FEF8ED` |
| Red (low confidence) | `#8F2C2C` | — | `#C23B3B` | — | `#FBEAEA` | `#FDF4F4` |

Paper surfaces: `--paper-0 #FAFAF7` (page bg, warm off-white, not stark white), `--paper-white #FFFFFF` (cards/elevated surfaces).

### Semantic tokens

| Token | Value | Usage |
|---|---|---|
| `--text-primary` | `#12141B` (ink-900) | Body text, headings |
| `--text-secondary` | `#5C616F` (neutral-600) | Supporting copy, captions |
| `--brand` | `#3B4FE0` | CTAs, links, focus rings |
| `--confidence-high` | `#1B8A5A` | Score ≥ 90% |
| `--confidence-medium` | `#B7791F` | Score 60–89% |
| `--confidence-low` | `#C23B3B` | Score < 60% |
| `--bg-page` | `#FAFAF7` | Page background |
| `--bg-surface` | `#FFFFFF` | Cards, modals |
| `--border-default` | `#DFE1E6` (neutral-200) | Hairlines |

**The confidence scale (green/amber/red) is the system's real semantic layer** — every clause is colored by AI confidence, not generic success/error. Color is never the only signal: always paired with the numeric % and a tier word.

### Dark theme

Added post-MVP as a user-toggleable theme (top-right toggle on every surface — marketing header, app header, auth screens). Same semantic roles as the light palette (900 = strongest emphasis, 50 = subtlest tint) recalibrated for a dark surface — **not** a literal inversion of the light hex values, since a token used as text (needs to go light-on-dark) and one used as a background tint (needs to stay a dark, low-contrast surface) require different treatment even though both are "900" or "50" in the light scale.

| Family | 900 | 700 | 500 (base) | 300 | 100 | 50 |
|---|---|---|---|---|---|---|
| Ink/Neutral | `#F5F6F8` | `#C6CAD3` | `#8B93A3` | `#545B6C` | `#2A2E38` | `#1C1F27` |
| Indigo (brand) | `#D6DAFB` | `#B7C0F8` | `#7C89F2` | `#4A5490` | `#262C52` | `#1E2340` |
| Green (high confidence) | `#6FCF97` | — | `#34A66C` | — | `#1F3A2C` | `#142A1E` |
| Amber (medium confidence) | `#F0B94D` | — | `#D99A2B` | — | `#3D2F13` | `#2B2110` |
| Red (low confidence) | `#F28B8B` | — | `#E05252` | — | `#3D1E1E` | `#2B1616` |

Paper surfaces (dark): page bg `#12141A`, card/elevated surface `#1B1E26` (slightly lighter than page bg, same "elevation via lightness" logic as the light theme's paper-0 → paper-white step).

Two components are deliberately **exempt** from theme-flipping — Tooltip (fixed dark bg / white text in both themes; a tooltip is a high-contrast overlay, not page chrome) and the Dialog backdrop scrim (fixed black at 50% opacity in both themes; a modal backdrop should always dim toward black). Implementation: every color above is a CSS custom property (`app/globals.css`, `:root` / `:root.dark`) that the same Tailwind utility classes (`bg-ink-900`, `text-indigo-500`, ...) resolve through — components never branch on theme directly.

## Typography

No brand font files supplied — nearest Google Fonts matches used (flagged in `readme.md`).

- **Display:** `Newsreader` (serif, often italic) — marketing headlines only.
- **UI:** `Instrument Sans` — all in-app copy, controls, dense tables.
- **Mono:** `JetBrains Mono` — document citations only ("§4.2 · Page 3"), confidence %.

| Role | Size/Line-height | Weight |
|---|---|---|
| Display | 56/1.08, italic | 500 |
| H1 | 40/48 | 600 |
| H2 | 32/40 | 600 |
| H3 | 24/32 | 600 |
| H4 | 20/28 | 600 |
| Body Large | 17/26 | 400 |
| Body | 15/24 | 400 |
| Body Small | 13/20 | 400 |
| Caption | 12/16 | 500 |
| Mono citation | 13/18 | 500 |

Letter-spacing: 0 (tight, `-0.01em` on display only). Sentence case everywhere in UI copy — no title case except product/proper nouns.

## Spacing & layout

4px base grid: 4·8·12·16·20·24·32·40·48·64·80·96·128.

- Marketing site: generous rhythm, 96/112px page padding, breathes.
- App: tighter, 16–24px — dense clause tables can't waste vertical space.

## Radius, shadow, motion

| Context | Radius |
|---|---|
| Inputs, badges | 6px |
| Buttons, cards | 10px |
| Modals, panels | 16px |
| Chips, confidence badge | pill (999px) |
| Document-page card, confidence bars | 4px (deliberately sharp — "official document" nod) |

Shadows are soft/shallow (`--shadow-sm/md/lg`), never decorative — elevation only. Motion: 120ms ease-out hover/focus, 280ms panel/modal entry, no bounce/spring (a legal tool shouldn't feel bouncy). Confidence bars fill on load as progress, not decoration.

## Voice & content

Direct, calm, competent — "a sharp associate, not a chatbot." No exclamation points, no emoji. Second person ("your contract"). Numbers over adjectives ("94% confidence" not "highly confident"). Uncertainty stated plainly, never hidden ("Low confidence — this clause may need your review").

Examples: *"Upload a contract. See what it says, where, and how sure we are — in under 30 seconds."* / *"87% confidence — matches similar termination clauses across 40+ contracts."* / *"That file didn't parse. Try a text-based PDF (not a scanned image)."*

## Iconography

No icon set supplied — **Lucide** (thin 1.5px stroke, MIT, CDN) substituted. No emoji, no unicode-as-icon.

## Components

- **Forms:** Button, Input, Select, Checkbox, Switch
- **Feedback:** Badge, ConfidenceBadge (signature component — score → tier dot + % + label), Toast, Tooltip
- **Surfaces:** Card, Modal, Tabs
- **Navigation:** Sidebar, TopBar (the system's one blurred-glass surface)
- **Data (product-specific):** ClauseRow (clause + confidence + source citation), ChatMessage (grounded Q&A bubble + citation chips)

## UI kits

- **Marketing site** — hero, feature grid, how-it-works, footer.
- **App** — upload → analyzing → clause breakdown (clause list + source pane) + grounded chat tab.

## Caveats

No existing brand/codebase/Figma to draw from — every value above is an original proposal for ContractIQ, not extracted. No logo exists; a Newsreader-italic wordmark stands in. Font files are Google Fonts substitutes pending real brand type.
