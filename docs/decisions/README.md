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
