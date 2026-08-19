# Personalized AI PLAN Assist — Phase 2A

## Capability boundary

AI PLAN Assist is not a generic chatbot and does not create a separate AI destination. It is an expandable workspace inside `/plans/:id/edit`:

```text
Private PLAN + saved preference profile
  → deterministic 5-axis fit assessment
  → bounded AI selection from server-owned actions/products
  → server validation + deterministic before/after preview
  → explicit human apply
  → existing PLAN mutation service
  → deterministic re-score
```

The model may select one of `KEEP / REPLACE / ADD / REMOVE` and one allowed target/product. It does not calculate prices or scores, mutate SQLite, browse, call tools, fetch URLs, inspect images, or invent catalog products. `ADD / REPLACE` accept only curated `NTR-*` products with `NITORI_OFFICIAL_SNAPSHOT` provenance. Existing furniture can never be removed by AI.

## Context and policy

`prototype-recommendation-policy-1.0` is the versioned policy. The backend sends a compact JSON context containing the structured preference profile, current PLAN item facts, deterministic fit result, and a server-controlled candidate pool. User-authored existing-furniture labels and dimensions are removed before provider context construction. Remaining catalog text is still declared untrusted data. The provider is stateless: no tools, web, files, conversation history, background job, or `previous_response_id` is used.

The provider uses the official OpenAI Python SDK, Responses API, and Pydantic Structured Outputs. The configured default model is `gpt-5.6`. Calls set `store=False`, a 30-second timeout, one retry at most, and a small output limit. `store=False` means this app does not request persistent Response storage; it is not a claim of Zero Data Retention, and provider-side handling still follows the API account's data-control settings and policy. Authentication failures are never retried by application code and are mapped to controlled error codes.

## Preference profile

One private `UserPreferenceProfile` is stored per anonymous browser session:

- room size and housing type
- budget maximum
- structured needs
- preferred style
- priority focus (`BALANCED / BUDGET / NEEDS / EXISTING_FURNITURE / STYLE`)
- preserve existing furniture

The first view is prefilled from the PLAN. Explicit saves replace that default. The profile is not public and is deleted with the local demo database by `reset-demo.cmd`.

## Deterministic fit assessment

Every assessment returns 0–100 overall plus five explainable axes. Unavailable axes display `--` and are excluded by renormalizing the remaining weights.

| Priority | Budget | Needs | Existing | Style | Composition |
|---|---:|---:|---:|---:|---:|
| BALANCED | 25 | 30 | 15 | 15 | 15 |
| BUDGET | 40 | 25 | 10 | 10 | 15 |
| NEEDS | 20 | 45 | 10 | 10 | 15 |
| EXISTING_FURNITURE | 20 | 25 | 30 | 10 | 15 |
| STYLE | 20 | 25 | 10 | 30 | 15 |

- Budget: at/below budget = 100; over budget = `max(0, round(100 - 200 × over_ratio))`. Missing budget or unknown price makes the axis unavailable.
- Needs: counts category requirements in the six existing prototype templates.
- Existing furniture: checks only structured role duplication when preservation is requested; it makes no visual compatibility claim.
- Style: uses only official Product `style_hint` verified for `NATURAL / CLEAR_COOL / DANDY`. `ELEGANT / COZY / COLORFUL`, demo products, and unverified-neutral mappings never count as evidence.
- Composition: conservative product-count, role-diversity, and duplicate-ID checks only.

## Stale and apply safety

The backend hashes the policy version, normalized profile, and PLAN item facts. Each preview is private, expires after 15 minutes, and stores that fingerprint. Apply re-reads the PLAN and profile and rejects a changed or expired preview. A successful apply invokes the same `mark_keep / replace_item / add_product / remove_product` services used by non-AI editing, then recalculates price and fit.

## API

- `GET /api/ai/status`
- `GET /api/ai/profile?plan_id=...`
- `PUT /api/ai/profile`
- `GET /api/plans/{id}/fit`
- `POST /api/plans/{id}/ai/suggestions`
- `POST /api/plans/{id}/ai/apply`

Provider errors expose controlled codes and Japanese recovery text only. Prompt text, generated prose, raw session IDs, API keys, provider payloads, and exception strings are excluded from Analytics. AI events cover workspace open, profile update, fit view, suggestion request/receipt/apply/reject, and provider unavailable; properties are limited to bounded strategy/action/status/score-bucket enums and counts.

## Key and privacy operation

`start-demo.cmd` always asks for the optional OpenAI key with hidden input. Entering nothing disables AI while preserving all Phase 1 PLAN editing and deterministic fit. The launcher removes inherited `OPENAI_API_KEY`, passes an entered key only to the backend child process as `RHC_OPENAI_API_KEY`, then clears it before launching the frontend. It never writes the key to `.env`, command arguments, state JSON, or logs.

This is runtime secret minimization for a local prototype, not a claim that process-environment memory is impossible for the same operating-system user or an administrator to inspect.

Automated browser/CI startup uses `-DisableAI` semantics and explicitly clears inherited keys. CI uses fake providers only; it never performs a live OpenAI request.

## Known limitations

- The result is an editing suggestion, not professional interior design, stock, delivery, safety, or purchase advice.
- The 18 curated official product snapshots are not a complete NITORI catalog and are not live price/inventory data.
- Style evidence covers only three verified official style labels.
- No visual room understanding, dimensions fit engine, image generation, authentication, POS/cart, or live Room Harmony integration exists.
- A live-key smoke test is manual and optional; CI verifies the same contract with fakes.

## Manual live-key checklist

1. Reset and start the demo; enter a temporary authorized key at the hidden prompt.
2. Confirm `/api/ai/status` is `READY` without displaying the key.
3. Create a Private PLAN, open AI PLAN Assist, save a preference, and request suggestions.
4. Confirm the PLAN is unchanged before clicking `この提案をPLANに反映`.
5. Apply one proposal and confirm item, price, overall score, and axis labels refresh.
6. Stop the demo and verify `.demo/processes.json`, logs, browser network responses, shell history, and repository files do not contain the key.
7. Restart with blank input or `-DisableAI`; confirm fit and ordinary editing work while AI generation is disabled.
