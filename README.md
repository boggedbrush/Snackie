# Snackie

Snackie helps people pick better snacks between meals. A lightweight quiz collects your meal times, nutrition preference, and optional restrictions, then builds time-targeted snack windows with combos and stand-alone bites. Everything runs on a simple React front end backed by serverless functions that compose snacks from curated data.

## Demo
- Live app: https://snackie.pages.dev/

## Features
- Time-aware snack planner that calculates mid-meal windows from your daily routine.
- Preference-aware recommendations (balanced, high-protein, keto, or low-carb) that respect basic ingredient restrictions.
- Snack combos and single items generated from curated JSON datasets, with automatic uniqueness filtering.
- Serverless API for quiz submissions, session storage, and on-demand snack alternatives, deployable on Cloudflare Pages Functions.
- Accessible React UI with keyboard-friendly time pickers, shareable result links, and local/session storage for continuity.

## Tech Stack
- Vite + React 18 + TypeScript for the client UI.
- React Router for routing and nested layouts.
- Tailwind via CDN for styling primitives.
- Jest + ts-jest for unit tests on recommendation utilities.
- Cloudflare Pages Functions (`functions/api/*`) mirroring the local server handlers in `api/*`.

## Project Structure
```
.
├── api/                 # Serverless handlers used during local dev and Cloudflare Pages builds
├── data/                # Snack components, combo rules, and catalog metadata
├── functions/api/       # Cloudflare Pages Functions entry points
├── src/                 # React application (pages, components, lib helpers)
├── dist/                # Production build output (generated)
├── package.json         # Scripts and dependency manifest
└── vite.config.ts       # Vite configuration with local API middleware
```

## Getting Started
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Run the development server**
   ```bash
   npm run dev
   ```
   Vite prints a local URL (defaults to http://localhost:5173). The dev server proxies `/api/*` requests to the in-repo handlers so the quiz and results pages work without extra setup.
3. **Run the test suite**
   ```bash
   npm test
   ```
4. **Create a production build**
   ```bash
   npm run build
   ```
   The static assets and serverless bundles land in `dist/` and `functions/` respectively.

## Available Scripts
- `npm run dev` – Launch Vite with hot module reload and API middleware.
- `npm run build` – Type-check via `tsc -b` and produce an optimized production build.
- `npm run preview` – Serve the built assets locally.
- `npm test` – Execute Jest tests for domain logic.

## API Overview
| Endpoint | Description |
| --- | --- |
| `POST /api/quiz` | Accepts meal times, preference, and restrictions; returns a generated session with snack windows and recommended items. |
| `GET /api/session/:id` | Retrieves a previously generated session stored in-memory during the function lifecycle. |
| `GET /api/snacks` | Fetches snack suggestions (combos or singles) with query params for preference, limits, exclusions, and restriction filters. |
| `GET /api/health` | Simple health check responder used by deployment platforms. |

For Cloudflare Pages, copy the handlers under `api/` into `functions/api/` (already set up) so the same logic runs at the edge.

## Data & Images
Snack metadata lives in JSON files under `data/`. Images are fetched on demand from Wikimedia Commons and Open Food Facts with automatic caching (`api/_images.ts`). When remote lookups fail, the UI falls back to generated SVG placeholders, keeping the planner self-contained.

## Contributing
Issues and pull requests are welcome. Consider adding or adjusting snack data in `data/` and extending tests in `src/lib/*.test.ts` when tweaking recommendation logic.

## License
Snackie is released under the terms of the [MIT License](LICENSE.md).
