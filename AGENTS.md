# Repository Guidance

## Purpose

This repository contains the product definition, approved Phase 1 Functional MVP, Goal 2 Creator & Community Loop, and Goal 3 Seasonal Growth Loop for a participatory Nitori coordinate platform. The current implementation is a synthetic/local-data prototype under review; it is not production-ready and does not prove business impact.

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
- `scripts/`: seed validation and repository-relative Windows launcher helpers

`docs/index.md` is the documentation entry point. Product truth is defined by the documents above, not by this file.

## Boundaries

`https://github.com/Raiden-Blade/room-harmoney` is read-only reference material. Never add, modify, delete, commit, branch, or reconfigure anything in that repository while working here.

Goal 2 explicitly authorizes Public USER_DECLARED REAL / PLAN, Helpful, Save / Adapt lineage, local safe image upload, Report, and Creator useful-impact UI. Goal 3 additionally authorizes structured Seasonal Challenges, eligibility-checked Entry, previous-year Archive reuse, controlled Prototype Pick recognition, Creator seasonal impact, and their analytics. Challenge is a reuse layer over Coordinate, not a second post system or popularity contest. Do not add Comment, Follow, DM, notification, Leaderboard, free-form recognition, AI / LLM, real NITORI APIs, live Room Harmony calls, production authentication, payment, or deployment without a new explicit Goal. Goal 4 remains out of scope.

## Evidence Discipline

- Preserve every consulted source URL in `docs/sources/source-links.md`, including unavailable pages.
- Label material claims as `VERIFIED FACT`, `OBSERVATION`, `INFERENCE`, or `HYPOTHESIS`.
- Do not turn an unavailable source into an inferred fact.
- Keep product assumptions synchronized with `docs/research/evidence-map.md`.

## Documentation Updates

Keep sources, audits, product decisions, architecture, and research separate. Update linked documents together when a decision changes a domain concept, KPI, integration boundary, or MVP scope.

## Coding and Validation

Prefer small, typed modules with explicit contracts and tests at system boundaries. Validate documentation links, Mermaid syntax, schema examples, and traceability from hypothesis to required feature before implementation. Production features require separate human approval.

For current commands and module paths, treat `README.md`, `docs/architecture/implementation.md`, and `docs/operations/demo-runbook.md` as the operational source of truth. Similar / Popular are user-selected comparison conditions, not randomized experiment assignment.
