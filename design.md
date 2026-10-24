# AntiLonely design

AntiLonely (ที่คุย ที่เล่า ที่ระบาย โดยไม่มีใครรู้ว่าเป็นคุณ) is an anonymous
community of topic rooms. The look is a **student's notebook**: ruled paper,
index cards, washi tape, a highlighter, in the warm KMUTT palette. It should
feel friendly and handmade, never corporate.

## Palette

Defined as Tailwind theme tokens in [app/globals.css](app/globals.css). Use the
tokens, never raw hex.

| Token | Value | Use |
| --- | --- | --- |
| `kmutt-yellow` / `-dark` | `#ffc72c` / `#e8a200` | Primary actions, focus ring, card stripe |
| `kmutt-orange` / `-dark` | `#fa4616` / `#b3340e` | Accent, logo, input focus border |
| `kmutt-grey` | `#7b8189` | Private-room stripe, ruled lines |
| `cream` | `#fff8ee` | Page background |
| `butter`, `highlight` | `#fff1c9`, `#ffe07a` | Soft fills, highlighter swipe |
| `peach`, `peach-edge` | `#ffe4d9`, `#ffb89e` | New-room stripe, tape, avatar |
| `mist`, `mist-ink` | `#eef0f2`, `#4f555c` | "Private" tag |
| `ink`, `ink-soft` | `#3b2a20`, `#6e625a` | Text (warm brown, not black) |
| `edge`, `edge-strong` | `#f0dcc8`, `#dcc2aa` | Borders |

`kmutt-orange` fails contrast behind small white text. Badges and orange text
use `kmutt-orange-dark`.

## Typography

- Body: IBM Plex Sans Thai Looped (`font-sans`), weights 400/500/600.
- Display (logo, headings, card titles): Mali (`font-display`), weights 500/600.
- Thai is the primary language; both families include Thai and Latin subsets.

## Shape and surfaces

- **Page**: cream with 32px ruled lines. At 1400px and wider a red margin line
  and punch holes appear in the gutter beside the `max-w-7xl` content.
- **Cards** (`RoomCard`): white index card, `rounded-xs`, 1px `edge` border, a
  6px colored top stripe (grey = private, peach = new, yellow = default),
  dashed divider above the footer. Hover tilts about -0.6° with `shadow-paper`.
- **Tape** ([component/Tape.tsx](component/Tape.tsx)): washi strip over a card's
  top edge.
- **Primary button** (`primaryButtonClass`): yellow sticker with a hard bottom
  shadow that sinks when pressed.
- **Inputs** (`inputClass`): white, `edge-strong` border, orange border and
  soft yellow ring on focus.
- **Highlighter** (`highlightClass`): yellow swipe across the lower 45% of a
  heading, drawn in left to right. `--mark` overrides the color and
  `--mark-delay` staggers it.

Shared class strings live in [lib/styles.ts](lib/styles.ts).

## Layout

- Content is `max-w-7xl`, centered, `px-4`.
- Home is a two-column grid: sidebar (200px) and main from `md`, `1fr / 3fr`
  from `lg`; single column below `md`.
- Header is 64px, white, with a 1.5px bottom border: logo, "+ สร้าง" button,
  notifications chip, avatar linking to login.

## Motion

All motion respects `prefers-reduced-motion` (it falls back to an instant swap
or the final state).

- Highlighter draw: 500ms ease-out, once on arrival.
- Room cards on a search filter: View Transitions. Staying cards slide (250ms),
  new cards settle in (220ms), leaving cards shrink away (150ms).
- Login/signup modal: the sheet drops in tilted (260ms), lifts out faster
  (160ms); the backdrop fades with it and the page behind tints to match.
- `scrollbar-gutter: stable` keeps the page from shifting sideways when the
  scrollbar appears or goes.

## Routing

- `/` home. `/login` and `/signup` render as a modal over home through the
  `@auth` parallel route with intercepting routes. Opening them directly shows
  the full page.
- `/rooms/[id]` is the room page and its board feed. It is owned by a teammate,
  so keep its design changes in sync with them.

## Accessibility

- Icon-only controls carry an `aria-label` (for example the avatar login link).
- Cards are clickable through a stretched link; the join button sits above it
  (`z-10`) so it stays a separate target.
- Decorative elements (tape) are `aria-hidden`.
