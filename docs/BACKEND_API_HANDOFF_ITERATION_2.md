# ReefCare MY — Iteration 2 Frontend/API Handoff

**Updated:** 15 September 2026  
**Scope:** Current Iteration 2 frontend after Epics 1, 4, 5 and 7 integration

## Confirmed frontend integrations

The current frontend uses the real API for:

- login, registration, logout and current-session validation;
- administrator user listing, account creation, safe profile updates and Coordinator approval;
- threat-category and authenticated dive-site reference data;
- Dive Session listing and creation;
- report completeness, Smart Report Structuring, location checking, final review and submission;
- My Reports, report detail, observer timeline and text responses to information requests;
- coordinator queue, claim, start review, evidence assessment, information requests, decisions and closure;
- coordinator evidence retrieval;
- hotspot analysis, hotspot report drill-through and compact case context; and
- conservation action types, action creation and action history.

The report draft and selected public site are intentionally stored in the browser until submission. This is client draft behaviour, not dummy server data.

## Intentional frontend-owned content

The Reef Explorer and Reef Threat Explorer use curated static content. This is intentional for Iteration 2 and is permitted by the backend documentation, which marks the corresponding public list/detail content as frontend-owned unless a backend content service is required.

The frontend therefore does not currently require:

- `GET /api/v1/public/dive-sites`
- `GET /api/v1/public/dive-sites/{diveSiteId}`
- `GET /api/v1/public/threats`

Prepared Spot the Threat examples also remain static educational content. They must not be presented as AI analysis of user evidence.

## Remaining documented endpoints not yet integrated

### Public-safe site activity

```http
GET /api/v1/public/dive-sites/{diveSiteId}/activity
```

The endpoint is documented as verified, but curated Reef Explorer records currently do not contain canonical numeric backend dive-site IDs. The UI correctly displays the no-activity state and does not invent activity.

To integrate this safely, agree on a stable mapping from each curated site to `diveSiteId`. The response must remain public-safe and must not contain report references, Observer identity, exact coordinates or private evidence.

### Selected-site report handoff

```http
GET /api/v1/public/dive-sites/{diveSiteId}/report-handoff
```

The current frontend preserves the selected curated site across authentication and matches it against authenticated reference data. This works but relies on site names. Once stable public IDs are available, the frontend should call the handoff endpoint and retain its canonical ID instead.

### Coordinator closed-case/referral history

```http
GET /api/v1/coordinator/cases/history
```

The endpoint is documented as verified, but the supplied documentation does not define the complete response shape. The frontend cannot safely build the history table and filters until the OpenAPI schema or a complete example is provided.

Required filters are:

- `closureReason`
- `threatCategory`
- `closedFrom`
- `closedTo`
- `wasReferred`
- `page`
- `pageSize`

Please provide the item fields, pagination shape, applied-filter shape and observer-safe labels.

### Optional signed evidence access

```http
GET /api/v1/evidence/{evidenceId}/access
```

This remains optional. Coordinator evidence currently uses the authorised byte-proxy route. Do not replace that working flow until the signed-access response and consumer requirement are confirmed.

## Missing or incomplete backend contracts

### Action evidence upload

The current action endpoint accepts JSON fields for action type, state, date, responsible team and notes:

```http
POST /api/v1/coordinator/reports/{reportReference}/actions
```

US7.1 also asks for a simple evidence upload. The database/storage relationship is documented, but no browser upload request is defined. Provide one of:

1. multipart action creation containing the action JSON and file; or
2. an owner-authorised action-evidence upload endpoint that returns an evidence ID linked atomically to the action event.

The contract must define accepted types, maximum size, failure behaviour and safe evidence metadata. The frontend deliberately does not send an invented payload.

### Information-response evidence upload

Text responses are now integrated through:

```http
GET  /api/v1/reports/{reportReference}/information-request
POST /api/v1/reports/{reportReference}/information-response
```

The documented text body is supported with `evidenceIds: []`. Uploading new evidence with the response remains unavailable because the upload route/sequence is not defined. The backend documentation states that this follow-up is outside the committed Iteration 2 scope, so text response is the current baseline.

## Confirmed hotspot contract

The frontend currently calls:

- `GET /api/v1/coordinator/hotspots/options`
- `GET /api/v1/coordinator/hotspots`
- `GET /api/v1/coordinator/hotspots/reports`
- `GET /api/v1/coordinator/hotspots/reports/{reportReference}/intake`
- `GET /api/v1/coordinator/reports/{reportReference}/hotspot-context`

The latest backend documentation confirms all five routes as **I2 VERIFIED**. They are covered by frontend unit tests. Deployment smoke testing with a real Case Coordinator account remains required.

The superseded Conservation Triage Brief is not required by Iteration 2 and is not called by the frontend.

## Smart Report Structuring

The latest backend contract confirms:

```http
POST /api/v1/reports/smart-structure
```

The frontend now uses this route and accepts the documented `available`, `suggestions`, `missingInformation` and `message` fields. Manual reporting remains available when the service reports that AI is unavailable.

## My Cases contract note

The frontend currently builds active My Cases from the full coordinator queue and filters it by the authenticated coordinator ID. This depends on `/coordinator/queue` returning claimed and in-progress reports as documented for Iteration 2.

If the queue is changed back to unclaimed-only, add a dedicated endpoint:

```http
GET /api/v1/coordinator/cases/mine?page=1&pageSize=100
```

Do not use browser storage as the source of truth for case ownership.

## Current frontend verification

- ESLint: passed
- TypeScript: passed
- Vitest: 187 tests passed
- Production build: passed on Next.js 16.3.5
- Production dependency audit: zero reported vulnerabilities
