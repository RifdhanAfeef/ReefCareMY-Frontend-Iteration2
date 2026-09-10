# ReefCare MY Backend API Handoff

**Prepared:** 5 September 2026  
**Reference:** Backend documentation (6) and current frontend integration audit  
**Audience:** ReefCare MY backend team

## Purpose

This handoff separates frontend fixes from API changes that are still required. The frontend now supports the intended screens, filters, account-scoped drafts and user-safe error states. The items below require server data or server-owned status transitions and cannot be made reliable with browser storage.

## Priority summary

| ID | Priority | Required change | Frontend function or screen | Current impact |
|---|---|---|---|---|
| API-01 | Critical | Return all submitted reports in the coordinator queue | `getCoordinatorQueue`, Submitted reports | Claimed reports disappear from the queue |
| API-02 | Critical | Add an authenticated coordinator-owned cases list | `getCoordinatorOwnedCases`, My Cases | Claims made on another device cannot be discovered |
| API-03 | Critical | Expose the claimed-to-under-review transition | Evidence assessment / response decision | Assessment can open, but its decision cannot be recorded from `claimed` |
| API-04 | High | Add evidence-assessment persistence | Evidence assessment | Usability and credibility answers cannot be stored reliably |
| API-05 | High | Add coordinator-safe case history | Case activity/history | The UI cannot show a complete audit trail |
| API-06 | High | Verify Dive Session reference endpoints and deployed CORS | Dive Session creation | Dive sites or sessions may fail to load in the deployed frontend |
| API-07 | Medium | Extend location-source support | Epic 4 location flow / TC407 | Device/photo metadata cannot be represented as a distinct source |
| API-08 | Medium | Add private evidence retrieval | Submitted evidence | Evidence metadata is available, but secure media retrieval is incomplete |
| API-09 | Medium | Add administrator APIs | User directory and access requests | Admin screens remain frontend previews |

## API-01 — All-report coordinator queue

### Current gap

`GET /api/v1/coordinator/queue?page=1&pageSize=20` is documented as an unclaimed-only queue. The product requirement is an all-report queue containing unclaimed, claimed and in-progress reports. The frontend already filters the records returned on the current page by site and ownership.

### Required contract

Keep the existing route and return every submitted report the coordinator is permitted to see. Every item must use the same shape, including unclaimed records:

```json
{
  "items": [
    {
      "reportReference": "RC-0012",
      "threat": "Marine debris",
      "area": "Tioman Island",
      "statusCode": "claimed",
      "statusLabel": "Claimed",
      "submittedAt": "2026-08-31T14:22:54Z",
      "hoursInQueue": 110,
      "owner": { "id": 8, "displayName": "Coordinator One" },
      "claimedAt": "2026-09-04T13:00:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 12
}
```

For unclaimed reports, return `owner: null` and `claimedAt: null`; do not omit the fields. `total` must count all records matching the server query, not only the current page.

### Suggested implementation

- Remove the repository/service predicate that limits results to `received` or `owner_id IS NULL`.
- Left join the active coordinator assignment and current status.
- Continue hiding precise coordinates and private evidence from the queue response.
- Order consistently, preferably oldest waiting item first and then by report ID.
- Keep the existing atomic claim transaction and return `409` if another coordinator wins the claim.

### Acceptance checks

1. Submit three reports and claim one as Coordinator One.
2. Call the queue as Coordinator One and Coordinator Two.
3. Both users see all three reports; the claimed record contains its owner and claim time.
4. The current owner can open the claimed record. Other coordinators see it as claimed but cannot open protected details.

## API-02 — Coordinator-owned cases list

### Current gap

The current API provides only `GET /api/v1/coordinator/reports/{reportReference}`. That route verifies a known reference but cannot tell the frontend which reports the signed-in coordinator owns. Browser storage therefore cannot support another laptop or a cleared browser.

### Required contract

Add:

```http
GET /api/v1/coordinator/cases/mine?page=1&pageSize=100
Authorization: Bearer <coordinator token>
```

Recommended response:

```json
{
  "items": [
    {
      "reportReference": "RC-0012",
      "threat": "Marine debris",
      "area": "Tioman Island",
      "statusCode": "claimed",
      "statusLabel": "Claimed",
      "submittedAt": "2026-08-31T14:22:54Z",
      "claimedAt": "2026-09-04T13:00:00Z",
      "owner": { "id": 8, "displayName": "Coordinator One" }
    }
  ],
  "page": 1,
  "pageSize": 100,
  "total": 1
}
```

### Authorization and implementation notes

- Derive the coordinator ID from the access token. Do not accept a coordinator ID from the query string.
- Return all active cases owned by that coordinator, including `claimed`, `under_review`, `needs_more_info`, `evidence_accepted`, `monitoring` and `referred`.
- Confirm with the product owner whether closed cases remain in My Cases or move to a separate history filter.
- Use server claim timestamps. Do not rely on data sent by the client.

The frontend now calls this route first and paginates through the result. Until it exists, it can only fall back to references remembered on the current device.

## API-03 — Start case review

### Current gap

The claim route returns status `claimed`, while the decision route rejects `claimed` cases and accepts `under_review` or later states. The documentation mentions `set_case_under_review(...)` in the service layer but exposes no route that invokes it. This creates an unreachable state transition.

### Required contract

Recommended explicit route:

```http
POST /api/v1/coordinator/reports/{reportReference}/start-review
Authorization: Bearer <owner coordinator token>
```

Response:

```json
{
  "reportReference": "RC-0012",
  "statusCode": "under_review",
  "statusLabel": "Under Review",
  "startedAt": "2026-09-05T10:15:00Z",
  "startedBy": 8
}
```

The route must verify active ownership, transition only from `claimed` (or be idempotent when already `under_review`), create a `case_event`, and return `403` for a different coordinator and `409` for an invalid state.

An alternative is to make a successful claim transition directly to `under_review`. Use this only if the product team agrees that claiming and starting review are the same action.

## API-04 — Evidence assessment

### Current gap

The frontend collects whether evidence is usable, whether it plausibly supports the report, and whether a related report exists. There is no endpoint to store this assessment. Embedding text in a later response note is not structured or sufficient for a not-substantiated outcome.

### Required contract

Add:

```http
POST /api/v1/coordinator/reports/{reportReference}/evidence-assessment
```

Suggested body:

```json
{
  "evidenceUsable": true,
  "observationCredible": true,
  "relatedReportState": "none",
  "relatedReportReference": null,
  "notes": "Photographs and details plausibly support the reported threat."
}
```

Suggested behavior:

- Owner-only and accepted from `under_review`.
- Store the structured fields in `case_decision` or a dedicated assessment table.
- Record the actor and server time in `case_event`.
- When usable and credible, transition to `evidence_accepted`.
- When information is insufficient, keep the existing information-request route as the transition to `needs_more_info`.
- Define the valid path to `closed_not_substantiated` before enabling that closure in production.

## API-05 — Coordinator-safe case history

Add an owner-authorized route such as:

```http
GET /api/v1/coordinator/reports/{reportReference}/history
```

Return chronological events with an event code, user-safe label, occurred time and actor display name. Exclude internal notes, raw database identifiers and security-sensitive metadata. This should read from the existing `case_event` source and cover claim, review start, information request, assessment, decision, referral and closure.

## API-06 — Dive sites and Dive Sessions deployment check

### Finding

Both required routes are documented as implemented:

- `GET /api/v1/reference/dive-sites`
- `GET /api/v1/dive-sessions`

The old frontend loaded both in one `Promise.all`, so either failure produced the same message and hid the failing route. The frontend now loads them independently and shows a safe retry message.

### Backend checks

1. Test each route with a fresh Observer token in the deployed environment.
2. Confirm `dive-sites` accepts any authenticated role and `dive-sessions` accepts Observer accounts.
3. Check whether failures are `401` (missing/expired token), `403` (role rule), `5xx` (server/database) or browser-only CORS failures.
4. Ensure the backend CORS allowlist contains the exact deployed frontend origin, including `https://reefcare-frontend.vercel.app` without a trailing slash.
5. Confirm the production database contains active dive-site reference rows.

No single root cause can be proven from the screenshot alone; the response status and server log are needed.

## API-07 — TC407 location sources

The frontend now supports:

- named dive site;
- selected map pin;
- manually entered latitude and longitude using the existing `mapPin` payload; and
- unknown exact position using the named site with `locationConfidence: "unsure"`.

The current backend derives only `named_dive_site` and `manual_map_pin`. If TC407 requires a distinct audit value for every source, extend the report location schema with an explicit enum, for example:

```json
{
  "source": "named_dive_site | manual_map_pin | manual_coordinates | device_metadata | photo_metadata | unknown",
  "namedDiveSiteId": 4,
  "locationConfidence": "within_100m",
  "mapPin": { "latitude": 3.15021, "longitude": 104.21864 },
  "sourceMetadata": null
}
```

Device and photo metadata need a confirmed privacy policy, metadata extraction rules and backend validation before the frontend can safely offer them. Otherwise revise or defer those TC407 acceptance criteria.

## API-08 — Private evidence retrieval

The owned-case response currently returns evidence metadata. Add a coordinator-authorized evidence route or short-lived signed URL mechanism. It must verify active ownership on every request, use short expiry times, set the correct content type and avoid exposing storage bucket paths. The frontend can display a secure link when a safe URL field is returned.

## API-09 — Administrator operations

The current backend documentation contains no administrator endpoints for:

- listing, creating or updating user accounts;
- changing roles or account status; and
- listing, approving or rejecting role/access requests.

The matching frontend screens are explicitly previews and must not be treated as persisted administration. Define role-protected CRUD and access-request contracts before enabling those controls in production.

## Lower-priority documented gaps

- `POST /api/v1/auth/logout` is planned/deferred. The frontend clears its local token even if this call is unavailable, but server-side token revocation requires the endpoint.
- A readiness endpoint is planned and would help deployment monitoring, but it does not block the user flows above.

## Recommended implementation order

1. API-01 all-report queue.
2. API-02 My Cases list.
3. API-03 start-review transition.
4. API-04 evidence assessment.
5. API-06 deployed Dive Session verification.
6. API-05 history and API-08 private evidence.
7. Confirm TC407 scope, then implement API-07 if required.
8. Implement administrator APIs when those stories enter active scope.

## End-to-end release test

Use two browsers or devices:

1. Observer creates a Dive Session, submits a report and signs out.
2. A second Observer signs in and cannot see the first account's draft.
3. Coordinator One sees the report in the all-report queue and claims it.
4. Coordinator Two still sees the report in the queue as claimed but cannot open protected details.
5. Coordinator One signs in on another device and sees the report in My Cases.
6. Open case, start review, save the evidence assessment, record a response and verify the case history.
7. Confirm the Observer sees the appropriate status without private coordinator notes or exact-location leakage.
