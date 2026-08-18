# Decision Log

## D-001 — Independent repository

- Decision: All deliverables live in `room-harmony-community`; Existing `room-harmoney` is read-only.
- Reason: Community and in-store execution have different lifecycle, ownership, and risk.
- Consequence: Integration is contract-based; no shared code change in this Goal.

## D-002 — Coordinate is the aggregate root

- Decision: Use `Coordinate`, not `Post`, as the core domain.
- Reason: Room context、Product roles、PLAN / REAL、lineage、action state are not ordinary social-post metadata.
- Consequence: Feed / profile are projections over Coordinate.

## D-003 — PLAN and REAL are one entity with different kind / lifecycle

- Decision: `Coordinate.kind = PLAN | REAL`.
- Reason: Shared content and transition are easier to preserve than duplicate PLAN / REAL tables.
- Consequence: Status / provenance rules prevent misrepresentation.

## D-004 — My Coordinate is not a separate entity

- Decision: My Coordinate is the current user’s Coordinate collection / view.
- Reason: Avoid duplicate fields and PLAN→REAL migration complexity.

## D-005 — Remix is a derivation edge

- Decision: Store parent→child and change summary; call the user action “自分向けに変更” in MVP.
- Reason: The value is explainable transformation, not image copy.
- Consequence: Single parent now; multi-parent merge deferred.

## D-006 — Existing furniture is a Coordinate item role/source

- Decision: Represent catalog-owned and external existing items alongside TO_BUY items.
- Reason: Avoid assuming full replacement and support realistic buy-more plans.

## D-007 — Similar-to-me is deterministic in MVP

- Decision: Rule-based weighted match with reasons and fallback.
- Reason: Data is small, evidence is not established, explainability is required.
- Consequence: No ML / embedding in Phase 1.

## D-008 — Challenge stays under Explore

- Decision: Seasonal collections are not top-level initially.
- Reason: Existing seasonal content exists; recurring participation is unproven.
- Revisit: After two seasons with repeat participation and action signal.

## D-009 — Social features are deferred

- Decision: MVP includes Save but not Like / Comment / Follow / public upload.
- Reason: They do not need to be built to test the core causal chain and introduce moderation cost.

## D-010 — NITORI systems retain commerce / store truth

- Decision: Community stores Product references and time-stamped snapshots only.
- Reason: Avoid stale price / inventory / floor data and duplicated checkout.

## D-011 — Room Harmony is an execution service, not Community backend

- Decision: Community hands over selected Product IDs and intent via a versioned contract.
- Reason: Preserve QR / recommendation / route ownership and independent deployability.
- Consequence: No live integration in current Goal.

## D-012 — North Star is multi-product exploration, not social volume

- Decision: Propose CAMPER as the MVP North Star; final goal remains assisted multi-item purchase.
- Reason: Measurable before POS while closer to the business causal chain than likes / posts.
- Caveat: Correlation with purchase remains a hypothesis.

## D-013 — MVP tests three hypotheses

- Decision: H1 similar discovery、H2 structured detail、H3 private PLAN/action.
- Reason: Smallest coherent chain from user value to store / EC action.
- Consequence: Full community / public content / challenge engine excluded.

## D-014 — No Phase 1 implementation in this Goal

- Decision: Stop after Product Definition, Architecture, Evidence Map, MVP, Phase 1 plan, and review.
- Reason: Explicit Goal stop condition.

## D-015 — Human authorization supersedes the Phase 0 stop

- Context: D-014 correctly stopped the prior Product Definition Goal. A later explicit Goal requested a complete Functional MVP in this Repository and publication as a draft PR.
- Decision: Implement Phase 1 on an isolated branch while preserving all production / live-integration exclusions.
- Alternatives: Keep documentation-only; modify Existing Room Harmony; build a public community immediately.
- Why: The new authorization is explicit, bounded, and testable. The other alternatives either ignore the current Goal or violate repository / scope boundaries.
- Consequence: D-014 remains historical evidence, but no longer describes current status.

## D-016 — Synthetic 36 Coordinate / 60 Product seed

- Context: Rights for official / staff / user content are not approved. The current Goal requires 30〜50 Coordinates and 50〜100 Products.
- Decision: Generate 36 Coordinates and 60 `DEMO-*` Product references with original local SVG assets.
- Alternatives: Scrape public images; block implementation until real data; reuse unknown-rights media.
- Why: It meets functional breadth without misrepresenting provenance or redistributing third-party content.
- Consequence: Product / price / image quality cannot be evaluated as production content. Import contracts remain replaceable.

## D-017 — Local three-layer functional prototype

- Context: The MVP needs real state transitions, contract visibility, and novice-friendly Windows execution.
- Decision: React / TypeScript / Vite frontend, FastAPI / Pydantic / SQLAlchemy backend, local SQLite, anonymous Browser Session.
- Alternatives: Static mock; frontend-only localStorage; share Existing Room Harmony backend.
- Why: This is the smallest architecture that tests Save / PLAN mutation / analytics while preserving service ownership.
- Consequence: No production auth, deployment, horizontal scale, or multi-device sync.

## D-018 — Room Harmony remains preview-only

- Context: Product IDs, owner review, short-lived token, and approved runtime are not agreed.
- Decision: Validate and render Handoff payload v1, set `live_integration=false`, and make no network call.
- Alternatives: Deep-link the current prototype; write directly to Existing Room Harmony data; remove the integration concept.
- Why: Preview enables contract review without creating a false connected state.
- Consequence: In-store routing and real product recommendation remain out of this MVP.

## D-019 — Creator impact is schema-first, UI-later

- Context: Official creator / seasonal recognition may later explain why users imitate a Coordinate, but public reaction mechanics are unvalidated.
- Decision: Reserve creator metadata, recognition, attribution event names, and aggregate response slots; do not expose Like / Follow / ranking / upload UI.
- Alternatives: Build creator competition now; omit future slots entirely.
- Why: This preserves a migration path without letting engagement mechanics distort H1〜H3.
- Consequence: Creator impact remains unmeasured and must be activated by a future Decision.

## D-020 — Similar / Popular is a comparison condition, not an experiment group

- Context: The Functional MVP lets the User choose Similar, Popular, or New-life display. No randomized assignment or sticky group exists.
- Decision: Expose `comparison_condition` in API / Frontend / Analytics and reserve formal experiment semantics for a later approved design.
- Reason: Calling a User-selected mode an `experiment_group` can falsely imply causal A/B evidence; it also misclassified New-life as Popular.
- Consequence: Current logs support instrumentation review only. They do not prove uplift, significance, sales, or co-purchase improvement.

## D-021 — Add low-cost PR CI, keep browser and Windows gates local

- Context: Backend pytest, Frontend Vitest, and production build are deterministic and platform-neutral; Playwright, Windows launcher, fresh-clone, and second-PC checks have heavier environment requirements.
- Decision: Run backend tests, frontend tests, and frontend build in GitHub Actions on Pull Requests. Keep Playwright and Windows lifecycle as explicit local gates for this Goal.
- Consequence: CI is a fast regression signal, not a replacement for rendered UI review, fresh-clone verification, or the manual second-PC checklist.
