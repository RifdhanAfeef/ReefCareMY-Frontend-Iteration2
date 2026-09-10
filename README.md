# ReefCare MY — Iteration 2 frontend

This repository is the clean Iteration 2 starting point for the ReefCare MY
Next.js frontend. It preserves the tested Iteration 1 baseline while the team
develops the new public, observer and coordinator experiences.

## Iteration 2 focus

The planned work is centred on these outcomes:

- help public visitors explore reef and dive-site information before registering;
- help observers recognise possible reef threats and prepare clearer reports;
- use AI-assisted suggestions and summaries with explicit human confirmation;
- give coordinators a simpler claim, review and decision workflow;
- reduce repeated work by identifying and linking possible duplicate reports; and
- support clear information requests and traceable follow-up for observers.

AI output must remain advisory. Users must be able to review, correct and confirm
suggested categories, summaries and structured fields before anything is saved or
submitted.

## Baseline available now

The repository already includes:

- public landing and learning pages;
- observer registration, login and role-protected routes;
- guided reef reporting, draft storage, location privacy and submission review;
- observer report status and detail views;
- coordinator queue, claim, case review, information-request, response and closure UI;
- administrator preview screens; and
- component, API-boundary and usability tests.

Some coordinator and administrator behaviour still depends on backend contracts.
The active backend requirements are documented in
[`docs/BACKEND_API_HANDOFF_ITERATION_2.md`](docs/BACKEND_API_HANDOFF_ITERATION_2.md).

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

## Data, privacy and integration rules

- The backend remains responsible for authentication, authorisation, ownership,
  exact locations, private evidence and permanent records.
- Never include exact coordinates, private evidence or internal notes in public UI,
  analytics or logs.
- Keep all backend calls in `lib/api/`; do not hard-code API URLs in components.
- Keep prototype or fallback data clearly labelled and isolated inside its feature.
- Preserve human review and correction for every AI-assisted result.

Current account role codes are `observer`, `case_coordinator` and
`system_administrator`. A public visitor is unauthenticated, not a fourth role.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the team workflow.
