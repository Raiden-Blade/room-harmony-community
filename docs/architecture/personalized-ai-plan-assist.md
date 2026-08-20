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

Current PLAN product IDs
  → local 2D drag / rotate / limited scale composition
  → explicit image-review action
  → server image + exact PLAN mapping validation
  → bounded visual Structured Output (no PLAN mutation)
```

For adjustment suggestions, the model may select one of `KEEP / REPLACE / ADD / REMOVE` and one allowed target/product. It does not calculate prices or scores, mutate SQLite, browse, call tools, fetch URLs, or invent catalog products. `ADD / REPLACE` accept only curated `NTR-*` products with `NITORI_OFFICIAL_SNAPSHOT` provenance. Existing furniture can never be removed by AI.

The optional visual flow inspects only the user-confirmed 760×480 2D composition image plus server-owned PLAN context. It may discuss color harmony, visual balance, perceived whitespace, and style coherence. It must not infer measurements, passage width, door clearance, safety, installation feasibility, inventory, delivery, or professional correctness. It cannot change the PLAN.

## Context and policy

`prototype-recommendation-policy-1.1` is the versioned policy. The backend sends a compact JSON context containing the structured preference profile, current PLAN item facts, deterministic fit result, and a server-controlled candidate pool. User-authored existing-furniture labels and dimensions are removed before provider context construction. Remaining catalog text is still declared untrusted data. The provider is stateless: no tools, web, files, conversation history, background job, or `previous_response_id` is used.

The provider uses the official OpenAI Python SDK, Responses API, and Pydantic Structured Outputs. The configured default model is `gpt-5.6`. Calls set `store=False`, a 30-second timeout, one retry at most, and a small output limit. `store=False` means this app does not request persistent Response storage; it is not a claim of Zero Data Retention, and provider-side handling still follows the API account's data-control settings and policy. Authentication failures are never retried by application code and are mapped to controlled error codes.

The visual request uses one `input_image` data URL at low detail and the separate `prototype-recommendation-policy-1.1-visual-1` policy. The server accepts only decodable JPEG/PNG/WebP data URLs within byte and dimension limits. It requires exactly one layout record for every current catalog product in the PLAN, rejects duplicate or stale item/product mappings before provider use, and sends no reference-room image. The generated composition image is kept only in current browser state by this feature; it is not written to the repository, upload directory, or SQLite.

Each returned suggestion is validated and simulated independently. Invalid alternatives are discarded without exposing their Product IDs or provider prose; the request fails with `AI_INVALID_RESPONSE` only when no safe suggestion remains. `REPLACE` requires a different allowed NTR Product with both the same Product category and compatible role, and the category rule is checked again at apply time.

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
- Existing furniture: checks only reliably normalized category duplication when preservation is requested. Broad `SUPPORT_FURNITURE` does not imply that a desk, chair, side table, or floor chair duplicates another; it makes no visual compatibility claim.
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
- `POST /api/plans/{id}/ai/visual-review`

Provider errors expose controlled codes and Japanese recovery text only. Prompt text, generated prose, raw session IDs, API keys, provider payloads, and exception strings are excluded from Analytics. AI events cover workspace open, profile update, fit view, suggestion request/receipt/apply/reject, and provider unavailable; properties are limited to bounded strategy/action/status/score-bucket enums and counts.

`GET /api/ai/status` distinguishes configuration from a verified request. A newly configured provider reports `NOT_CHECKED` with `verified: false`; only a successful structured-output response reports `READY` with `verified: true`. Authentication, provider rate limit, quota, model access/name, request configuration, connection/timeout, and upstream failures are mapped separately. Logs contain only the controlled reason, HTTP status, and provider request ID when available—not the key, prompt, response body, or raw exception message. Transient provider failures remain retryable; authentication and model/request configuration failures require configuration correction.

## Key and privacy operation

`start-demo.cmd` first offers OpenAI official, the reviewed VectorEngine preset, or disabled mode. VectorEngine uses `https://api.vectorengine.ai/v1` with `gpt-4o-mini`; the user does not type the URL or model. Entering nothing at the service prompt disables AI while preserving all Phase 1 PLAN editing and deterministic fit. The launcher removes inherited `OPENAI_API_KEY`, passes an entered key only to the backend child process as `RHC_OPENAI_API_KEY`, and passes the selected endpoint/model as `RHC_OPENAI_BASE_URL` / `RHC_OPENAI_MODEL`. All three values are cleared before launching the frontend. It never writes the key to `.env`, command arguments, state JSON, or logs.

This is runtime secret minimization for a local prototype, not a claim that process-environment memory is impossible for the same operating-system user or an administrator to inspect.

VectorEngine is a third-party OpenAI-compatible gateway, not an OpenAI service. The preset is approved only for this synthetic local demo. Real NITORI or customer data requires separate provider, contract, retention, and data-transfer approval before use.

Automated browser/CI startup uses `-DisableAI` semantics and explicitly clears inherited keys. CI uses fake providers only; it never performs a live OpenAI request.

## Known limitations

- The result is an editing suggestion, not professional interior design, stock, delivery, safety, or purchase advice.
- The 18 curated official product snapshots are not a complete NITORI catalog and are not live price/inventory data.
- Style evidence covers only three verified official style labels.
- The 2D canvas uses product image tiles rather than photorealistic cutouts, depth, collision, or true-scale geometry. Visual feedback is qualitative and may be unavailable on providers/models without image-input support.
- No dimensions fit engine, image generation, authentication, POS/cart, or live Room Harmony integration exists.
- A live-key smoke test is manual and optional; CI verifies the same contract with fakes.

## Manual live-key checklist

1. Reset and start the demo; select the intended service and enter its temporary authorized key at the hidden prompt.
2. Confirm `/api/ai/status` is `NOT_CHECKED` and `verified: false` without displaying the key. This confirms configuration only, not connectivity.
3. Create a Private PLAN, confirm the reference-coordinate image, current-product strip, fit distribution, and evidence-based three-part review. Open `AIと一緒に配置イメージを試す`, verify every PLAN product appears unchanged, move/rotate/scale one product, save and reopen it, and request `この配置をAIと一緒に見直す`.
4. After a successful response, confirm `/api/ai/status` is `READY` and `verified: true`.
5. Confirm the bounded visual observations appear in the same workspace and the PLAN is unchanged. Preview a bounded layout change, explicitly save or discard it, then open `希望条件から商品候補を見直す` and request `この条件でAI調整案をつくる`.
6. Confirm the PLAN is unchanged before clicking `この提案をPLANに反映`; apply one proposal and confirm item, price, overall score, and axis evidence refresh.
7. Stop the demo and verify `.demo/processes.json`, logs, browser network responses, shell history, and repository files do not contain the key.
8. Restart with blank input or `-DisableAI`; confirm fit and ordinary editing work while AI generation is disabled.
