# ReefCare MY — Iteration 2 frontend

This repository is the Iteration 2 starting point for the ReefCare MY
frontend preserving the Iteration 1 baseline.

## Run locally

Requirements: Node.js 20.9 or newer and npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

On Windows PowerShell, replace the copy command with:

```powershell
Copy-Item .env.example .env.local
```

Open `http://localhost:3000`. Keep `.env.local` on your own machine; it is ignored
by Git and must not be committed.

## Quality checks

```bash
npm run check      # lint, TypeScript and automated tests
npm run build      # production build
```

Run both commands before opening a pull request.

## Project structure

- `app/` — Next.js routes and layouts.
- `features/` — feature UI, state and tests grouped by epic.
- `components/` — shared navigation, layout and form components.
- `config/` — shared application configuration.
- `lib/api/` — typed backend request functions and API models.
- `public/` — static images and other public assets.
- `docs/` — current cross-team technical handoff material only.

Route-group folders in parentheses do not appear in the URL. For example,
`app/(observer)/my-reports/page.tsx` is served at `/my-reports`.


