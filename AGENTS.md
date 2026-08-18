# Repository Guidance

## Purpose

This repository defines the product, evidence, domain, data, UX, and architecture for a participatory Nitori coordinate platform. It is a product-definition repository until Phase 1 implementation is explicitly approved.

## Navigation

- `docs/sources/`: source registry and retrieval status
- `docs/audit/`: current-state audits and gap analysis
- `docs/product/`: vision, journeys, growth, differentiation, and KPI
- `docs/architecture/`: system, domain, data, and integration boundaries
- `docs/research/`: assumptions, evidence, and validation plans
- `docs/decisions/`: accepted, rejected, and deferred decisions
- `prototypes/`: optional low-fidelity artifacts only

`docs/index.md` is the documentation entry point. Product truth is defined by the documents above, not by this file.

## Boundaries

`https://github.com/Raiden-Blade/room-harmoney` is read-only reference material. Never add, modify, delete, commit, branch, or reconfigure anything in that repository while working here.

## Evidence Discipline

- Preserve every consulted source URL in `docs/sources/source-links.md`, including unavailable pages.
- Label material claims as `VERIFIED FACT`, `OBSERVATION`, `INFERENCE`, or `HYPOTHESIS`.
- Do not turn an unavailable source into an inferred fact.
- Keep product assumptions synchronized with `docs/research/evidence-map.md`.

## Documentation Updates

Keep sources, audits, product decisions, architecture, and research separate. Update linked documents together when a decision changes a domain concept, KPI, integration boundary, or MVP scope.

## Future Coding and Validation

Prefer small, typed modules with explicit contracts and tests at system boundaries. Validate documentation links, Mermaid syntax, schema examples, and traceability from hypothesis to required feature before implementation. Production features require separate human approval.
