# Specification Schemas

This directory contains the schema definitions for all specification entity types.

## Schema Files

- **[requirement.md](./requirement.md)** - Requirements schema (WHAT needs to be achieved)
- **[component.md](./component.md)** - Component architecture schema (system building blocks)
- **[plan.md](./plan.md)** - Implementation plan schema (HOW it will be built)

## ID Format Reference

| Entity Type | ID Format | Example | Schema File |
|------------|-----------|---------|-------------|
| Requirement | `req-XXX-slug` | `req-001-user-auth` | requirement.md |
| App | `app-XXX-slug` | `app-001-dashboard` | component.md |
| Service | `svc-XXX-slug` | `svc-002-api` | component.md |
| Library | `lib-XXX-slug` | `lib-003-utils` | component.md |
| Tool | `tol-XXX-slug` | `tol-001-cli` | component.md |
| Plan | `pln-XXX-slug` | `pln-001-implementation` | plan.md |

## Sub-Entity ID Formats

| Sub-Entity | ID Format | Example | Parent |
|------------|-----------|---------|--------|
| Criteria | `req-XXX-slug/crit-XXX` | `req-001-auth/crit-001` | Requirement |
| Task | `task-XXX` | `task-001` | Plan |
| Test Case | `tc-XXX` | `tc-001` | Plan |
| Flow | `flow-XXX` | `flow-001` | Plan |
| API Contract | `api-XXX` | `api-001` | Plan |
| Data Model | `dm-XXX` | `dm-001` | Plan |

## Schema Validation

All specifications are automatically validated against these schemas when created or updated.

**To validate a specific spec:**
```
Use mcp__spec-mcp__guidance tool with:
- spec_type: "requirement" | "component" | "plan"
- id: "the-spec-id"
```

This will validate the spec against:
- Requirements: 7-step reasoning process
- Components: 10-step reasoning process
- Plans: 12-step reasoning process

## Workflow

1. **Requirements First** - Define WHAT needs to be achieved
2. **Components Second** - Design system architecture
3. **Plans Third** - Detail HOW it will be implemented

Each stage links to the previous for full traceability.