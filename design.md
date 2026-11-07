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
| `kmutt-yellow` / `-dark` | `#ffc72c` / `#e8a200` | Primary stickers, default room cards, input focus ring |
| `kmutt-orange` / `-dark` | `#fa4616` / `#b3340e` | Accent, logo, doodles, input focus border, focus outline |
| `kmutt-grey` | `#7b8189` | Private-room cards, ruled lines |
| `cream` | `#fff8ee` | Page background |
| `paper` | `#fffdf8` | Header |
| `butter`, `highlight` | `#fff1c9`, `#ffe07a` | Soft fills, welcome note, highlighter swipe |
| `peach`, `peach-edge` | `#ffe4d9`, `#ffb89e` | New-room cards, tape, avatar, "ใหม่" tag |
| `mist`, `mist-ink` | `#eef0f2`, `#4f555c` | "Private" tag |
| `ink`, `ink-soft` | `#3b2a20`, `#6e625a` | Text (warm brown, not black), sticker outlines and shadows |
| `edge`, `edge-strong` | `#f0dcc8`, `#dcc2aa` | Borders, dashed dividers |

`kmutt-orange` fails contrast behind small white text. Badges and orange text
use `kmutt-orange-dark`.

## Typography

- Body: IBM Plex Sans Thai Looped (`font-sans`), weights 400/500/600.
- Display (logo, headings, card titles): Mali (`font-display`), weights 500/600.
- Thai is the primary language; both families include Thai and Latin subsets.

## Shape and surfaces

- **Page**: cream with 32px ruled lines. At 1400px and wider a red margin line
  and punch holes appear in the gutter beside the `max-w-7xl` content.
- **Ink outline**: the scrapbook look comes from a 1.5px `ink` outline on
  anything that should feel like a sticker or a card stuck onto the page.
  Inputs keep a softer `edge-strong` border.
- **Stickers**: buttons and chips with the ink outline and a hard 2px ink
  shadow (`shadow-sticker`) that they sink into when pressed (move 2px, lose
  the shadow). `primaryButtonClass` is yellow, `outlineButtonClass` white
  (Google sign-in, "สุ่มห้องเลย", log in). Toggles such as the room filters
  stay pressed in while on.
- **Cards** (`RoomCard`): white index card, `rounded-xl`, ink outline and a hard
  4px shadow in the room's color (grey = private, peach = new, yellow =
  default), taped on in that color. An emoji on a pastel tile, "ใหม่" and
  "ส่วนตัว" tags, stats with icons, dashed divider above the footer. Hover
  lifts it, tilts it about -0.6° and grows the shadow.
- **Sidebar**: an index card (ink outline, `edge-strong` shadow) with emoji
  tiles for the rooms.
- **Welcome note** (`PostBox`): butter sticky note, ink outline, 4px ink shadow
  (`shadow-sticker-lg`), tilted -0.4°, taped, with a sparkle doodle.
- **Tape** ([component/Tape.tsx](component/Tape.tsx)): washi strip over a card's
  top edge, with faint stripes and torn ends (`washi` utility).
- **Paper** ([component/Paper.tsx](component/Paper.tsx)): a white sheet with an
  ink outline on a tilted butter sheet, taped. The login and signup cards and
  the modal sheets use it.
- **Inputs** (`inputClass`): white, 1.5px `edge-strong` border, `rounded-lg`,
  orange border and soft yellow ring on focus. Search and the post box put an
  icon inside (`fieldFrameClass` plus their own padding).
- **Modal sheets** (`Sheet` inside `Modal`): `Paper` with a Mali title.
  Choices are bordered rows (`choiceClass`) that turn into a butter sticker
  when picked. Footer: quiet "ยกเลิก" (`secondaryButtonClass`) beside the
  yellow sticker, which goes flat and grey (`disabledButtonClass`) until the
  form is ready.
- **Icons** ([component/Icon.tsx](component/Icon.tsx)): a small set of inline
  line icons in the text color, no icon library. Add `fill-current` for the
  filled doodles (heart, sparkle).
- **Highlighter** (`highlightClass`): yellow swipe across the lower 45% of a
  heading, drawn in left to right. `--mark` overrides the color and
  `--mark-delay` staggers it.

Shared class strings live in [lib/styles.ts](lib/styles.ts).

## Layout

- Content is `max-w-7xl`, centered, `px-4`.
- Home is a two-column grid: sidebar (200px) and main from `md`, `1fr / 3fr`
  from `lg`; single column below `md`.
- Header is 64px, `paper`, with a 2px dashed bottom edge: logo (highlighted
  "Lonely" and a heart doodle), "+ สร้าง" sticker, notifications chip (bell and
  count, hidden at 0), then the avatar or a log-in sticker. Below `sm`,
  "สร้าง" and "โนติ" collapse to their icons so the header stays on one line.

## Motion

All motion respects `prefers-reduced-motion` (it falls back to an instant swap
or the final state).

- Highlighter draw: 500ms ease-out, once on arrival.
- Room cards on a search filter: View Transitions. Staying cards slide (250ms),
  new cards settle in (220ms), leaving cards shrink away (150ms).
- Login/signup modal: the sheet drops in tilted (260ms), lifts out faster
  (160ms); the backdrop fades with it and the page behind tints to match.
- Create and report modals use the same drop-in and lift-out. The wide sheet
  sits 6vh from the top instead of centered, so switching tabs doesn't move
  them under the pointer.
- `scrollbar-gutter: stable` keeps the page from shifting sideways when the
  scrollbar appears or goes.

## Routing

- `/` home. `/login` and `/signup` render as a modal over home through the
  `@auth` parallel route with intercepting routes. Opening them directly shows
  the full page.
- "+ สร้าง" in the header opens `CreateModal` (กระทู้ / ห้อง tabs) from page
  state, not a route. "+ สร้างห้องใหม่" in the sidebar opens it on ห้อง.
- `ReportModal` reports a comment on the board feed. It is built but not
  wired in yet: the board feed has to open it from a comment's menu.
- `/rooms/[id]` is the room page and its board feed. It is owned by a teammate,
  so keep its design changes in sync with them.

## Accessibility

- Icon-only controls carry an `aria-label` (for example the avatar login link)
  or keep their text as `sr-only` (the header's "สร้าง" and "โนติ" on phones).
- Cards are clickable through a stretched link; the join button sits above it
  (`z-10`) so it stays a separate target. The card draws the focus outline for
  the link (`has-[a:focus-visible]`).
- Links and buttons without their own focus style get a 2px
  `kmutt-orange-dark` outline (base layer in globals.css).
- Decorative elements (tape, icons, emoji tiles, doodles) are `aria-hidden`.
