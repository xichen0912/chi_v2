# CHI 2027 demo — visual spec (v0.1)

Keep it small. This is a demo, so the spec only fixes what makes the pages feel like one product.
The tokens live in `shared/site.css` (`:root` + the "Spec layer" at the bottom). Use them instead of new values.

## 1. Colour

| Token | Value | Use |
|---|---|---|
| `--paper` | `#f4f3ef` | Page background |
| `--card` | `#fbfaf7` | Cards, inputs, panels |
| `--ink` | `#171816` | Text, outlines of secondary buttons |
| `--muted` | `#666761` | Meta text, labels |
| `--line` | `#d8d7d1` | Borders, dividers |
| `--accent` | `#314f44` | Primary buttons, links, selected states |
| `--accent-soft` | `#dce6e0` | Tags, selected backgrounds |
| `--deep` | `#0f1f19` | Sidebar, dark highlight panels |
| `--lime` | `#d3fb63` | Highlights **on dark surfaces only** (active nav, big times) |
| `--rust` | `#a54b25` | Warnings: overlaps, conflicts |

Map keeps its own functional colours for the legend (quiet `#2b6f86`, elevator blue, restroom purple, busy amber).

## 2. Type

Headings use Manrope, everything else uses DM Sans. All UI copy, Ask CHI included, is in English.

| Role | Size / weight | Example |
|---|---|---|
| Page title (one per page) | 56px / 600, tracking −0.04em (40px on phones) | "Program", "My" |
| Section heading | 28px / 700 | "My plan", "Award Papers" |
| Card title | 20–24px / 700 | Session or paper title |
| Body | 15px / 400, line-height 1.55 | Descriptions |
| Meta | 13px / 400, muted | Time · room · authors |
| Label | 12px / 600, uppercase, +0.08em, muted | "TIME", "ROOM" |

## 3. Shape

- **Radius:** `4px` for cards, buttons, inputs and tags. `16px` only for dark highlight panels (Next up). `999px` only for the floating Ask CHI button and filter chips.
- **Cards:** `--card` background, 1px `--line` border, no shadow. On hover the border turns `--accent`.
- **Spacing:** page content is at most 1120px wide, with 48px side padding (16px on phones).

## 4. Controls

| Control | Style |
|---|---|
| Primary button | `--accent` background, white text, 40px tall, 14px / 600 |
| Secondary button | `--card` background, 1px `--ink` border, ink text |
| Toggle (on) | `--accent` background, white text, with a ✓ |
| Text link | `--accent`, underlined (3px offset) |
| Tag | 12px / 600, `--accent-soft` background, `--accent` text, 4px radius, sentence case |

## 5. Page header

Every page starts the same way: the page title, then an optional single-line lede (16px, muted, ≤ 640px). Page-specific tools sit below it.
Map is the only exception: it is a full-screen tool, so its first line is the search bar.

## 6. Words

| Action | Off | On |
|---|---|---|
| Plan a session or award paper | `+ Add to My plan` | `✓ In My plan` |
| Save a paper | `Save paper` | `✓ Saved` |
| Save a person | `Save person` | `✓ Saved` |

"My" is the one page that collects all of these: My plan, Saved papers and Saved people.
