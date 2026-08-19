# Repository Guidance

## Purpose

This repository contains the product definition and final local-demo implementation for the Phase 1 Functional MVP, Goal 2 Creator & Community Loop, Goal 3 Seasonal Growth Loop, and Goal 4 demo hardening. The current implementation is a synthetic/local-data prototype under final human review; it is not production-ready and does not prove business impact.

## Navigation

- `docs/sources/`: source registry and retrieval status
- `docs/audit/`: current-state audits and gap analysis
- `docs/product/`: vision, journeys, growth, differentiation, and KPI
- `docs/architecture/`: system, domain, data, and integration boundaries
- `docs/research/`: assumptions, evidence, and validation plans
- `docs/decisions/`: accepted, rejected, and deferred decisions
- `prototypes/`: optional low-fidelity artifacts only
- `frontend/`: React / TypeScript Functional MVP and browser tests
- `backend/`: FastAPI / SQLAlchemy API and pytest suite
- `scripts/`: seed generation / validation, repository-relative Windows lifecycle helpers, and isolated visual QA

`docs/index.md` is the documentation entry point. Product truth is defined by the documents above, not by this file.

## Boundaries

`https://github.com/Raiden-Blade/room-harmoney` is read-only reference material. Never add, modify, delete, commit, branch, or reconfigure anything in that repository while working here.

Goal 2 explicitly authorizes Public USER_DECLARED REAL / PLAN, Helpful, Save / Adapt lineage, local safe image upload, Report, and Creator useful-impact UI. Goal 3 additionally authorizes structured Seasonal Challenges, eligibility-checked Entry, previous-year Archive reuse, controlled Prototype Pick recognition, Creator seasonal impact, and their analytics. Goal 4 authorizes reliability, UX consistency, local asset differentiation, safe reset, visual QA isolation, and final operator documentation; it does not authorize a new product feature. Goal 4B additionally authorizes the 15 NITORI Coordinate images recorded in `data/seed/visual_asset_manifest.json`, based on user-confirmed permission for this prototype only; do not infer a general open license, add unrecorded third-party images, or hotlink them at runtime. Challenge is a reuse layer over Coordinate, not a second post system or popularity contest. Do not add Comment, Follow, DM, notification, Leaderboard, free-form recognition, AI / LLM, real NITORI APIs, live Room Harmony calls, production authentication, payment, deployment, or a next Goal without explicit human approval.

## Evidence Discipline

- Preserve every consulted source URL in `docs/sources/source-links.md`, including unavailable pages.
- Label material claims as `VERIFIED FACT`, `OBSERVATION`, `INFERENCE`, or `HYPOTHESIS`.
- Do not turn an unavailable source into an inferred fact.
- Keep product assumptions synchronized with `docs/research/evidence-map.md`.

## Documentation Updates

Keep sources, audits, product decisions, architecture, and research separate. Update linked documents together when a decision changes a domain concept, KPI, integration boundary, or MVP scope.

## Coding and Validation

Prefer small, typed modules with explicit contracts and tests at system boundaries. Validate documentation links, Mermaid syntax, schema examples, and traceability from hypothesis to required feature before implementation. Production features require separate human approval.

For current commands and module paths, treat `README.md`, `docs/architecture/implementation.md`, and `docs/operations/demo-runbook.md` as the operational source of truth. Use `reset-demo.cmd` only for the repository-local Demo DB and uploads; preserve logs and source files. Similar / Popular are user-selected comparison conditions, not randomized experiment assignment. `direct_seasonal_reuse_count` means direct child PLAN / Coordinate count from the Creator's Challenge-participating Coordinates, including same- and cross-session children; it is not an all-descendant or business-uplift KPI.
