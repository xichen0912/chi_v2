# CHI 2027 — prototype website

The repository root **is the website**. GitHub Pages serves it as-is, so open
`https://<user>.github.io/<repo>/` and you land on Program.

```
chi_full/
├── index.html          → opens Program
├── program/            ┐
├── map/                │
├── people/             │  the website (generated — do not edit by hand)
├── awards/             │
├── accessibility/      │
├── my/                 │
├── shared/             ┘  shared CSS/JS + data used by every page
│
├── source/             ← edit here
│   ├── app/            React app for Program + Ask CHI (Vite). app/src/data = all shared data
│   ├── pages/          map/ people/ awards/ accessibility/ my/ (static HTML)
│   ├── shared/         site.css (palette + visual spec), shell.js (sidebar + My store), awards-data.js …
│   └── scripts/        assemble.mjs: copies pages + shared to the root after the build
│
└── design/
    ├── VISUAL_SPEC.md  colours, type, shapes, controls, wording
    └── original-notes/ notes from the original Program prototype
```

## Where the parts came from

| Page | Original repository |
|---|---|
| Program, Ask CHI | `zayyyseuc/chi-prototyping` |
| Map | `xichen0912/map_test` |
| People, Recommendations | `dengyixin2026-lang/CHI-2027` |
| Awards, Accessibility | `Huanggedv/CHI-Website-optimization-Accessibility-Award` |
| My | new, merged from the "My …" lists of the four |

## Change something

1. Edit files under `source/` (static pages: `source/pages/…`, shared look: `source/shared/site.css`, data: `source/app/src/data/…`).
2. Rebuild the website at the root:
   ```bash
   cd source/app
   npm install        # first time only
   npm run build      # updates program/, map/, people/ … at the repo root
   npm run preview    # optional: check it locally, open /program/
   ```
3. Commit everything (the source and the regenerated root folders).

`npm run dev` runs only Program, for quick iteration on the React part.

## GitHub Pages

Settings → Pages → *Deploy from a branch* → `main` / `(root)`. That's all; there is no build step on GitHub.

## Notes

- The prototype runs at a fixed **demo time: Mon, May 10, 11:20** (`source/app/src/data/now.ts`). Program, Map and My all use it.
- Ask CHI runs in **Demo mode** on GitHub Pages (there is no server). For the live AI route, host the `/api/chat` handler from `source/app/vite.config.ts` and build with `VITE_CHAT_API=/api/chat`.
- Sessions, papers and people are fictional. Venue layout, the accessibility FAQ and the award list are adapted from CHI 2026.
