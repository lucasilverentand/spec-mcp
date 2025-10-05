# Query Guide

## Overview

The `query` tool is a powerful unified interface for searching, filtering, and analyzing specs. This guide covers all query capabilities.

## Basic Queries

### Get Spec by ID

```
query({
  entity_id: "req-001-user-auth"
})
```

**Response**: Full spec details.

### Get Multiple Specs by IDs

```
query({
  entity_ids: ["req-001-user-auth", "req-002-data-storage"]
})
```

**Response**: Array of specs.

### Get Sub-Entity (Task, Test Case, Flow, etc.)

```
query({
  entity_id: "pln-001-auth-impl",
  sub_entity_id: "task-001"
})
```

**Sub-entity IDs**:
- `task-XXX` - Tasks
- `tc-XXX` - Test cases
- `flow-XXX` - Flows
- `api-XXX` - API contracts
- `dm-XXX` - Data models
- `crit-XXX` - Acceptance criteria

## Search Queries

### Full-Text Search

```
query({
  search_terms: "authentication security",
  types: ["requirement", "plan"]
})
```

**Search fields** (default): `name`, `description`

**Customize search fields**:
```
query({
  search_terms: "oauth",
  search_fields: ["name", "description"]
})
```

### Fuzzy Search

```
query({
  search_terms: "authetication",  // Typo
  fuzzy: true
})
```

Uses Levenshtein distance to find close matches.

### Search with Sorting

```
query({
  search_terms: "user",
  sort_by: [
    { field: "relevance", order: "desc" },  // Best matches first
    { field: "created_at", order: "desc" }
  ]
})
```

**Sort fields**:
- `relevance` - Search score (only for searches)
- `created_at` - Creation date
- `updated_at` - Last update
- `priority` - Priority level
- `name` - Alphabetical
- `type` - Spec type

## Filtering

### By Type

```
query({
  types: ["requirement", "plan"]
})
```

**Available types**: `requirement`, `plan`, `app`, `service`, `library`, `constitution`, `decision`

### By Priority

**Requirements**:
```
query({
  types: ["requirement"],
  filters: {
    requirement_priority: ["critical", "required"]
  }
})
```

**Plans**:
```
query({
  types: ["plan"],
  filters: {
    plan_priority: ["critical", "high"]
  }
})
```

### By Completion Status

**Incomplete plans**:
```
query({
  types: ["plan"],
  filters: {
    plan_completed: false
  }
})
```

**Completed and approved plans**:
```
query({
  types: ["plan"],
  filters: {
    plan_completed: true,
    plan_approved: true
  }
})
```

**Incomplete requirements**:
```
query({
  types: ["requirement"],
  filters: {
    requirement_completed: false
  }
})
```

### By Date Range

**Created after date**:
```
query({
  filters: {
    created_after: "2025-01-01T00:00:00Z"
  }
})
```

**Updated in date range**:
```
query({
  filters: {
    updated_after: "2025-01-01T00:00:00Z",
    updated_before: "2025-01-31T23:59:59Z"
  }
})
```

### By Folder

```
query({
  filters: {
    folder: "authentication"
  }
})
```

Matches folder and all subfolders hierarchically.

### By Criteria ID

**Plans for specific criterion**:
```
query({
  types: ["plan"],
  filters: {
    criteria_id: "req-001-user-auth/crit-001"
  }
})
```

**Plans linked to any requirement criteria**:
```
query({
  types: ["plan"],
  filters: {
    has_criteria_id: true
  }
})
```

### Find Gaps: Uncovered and Orphaned

**Uncovered requirements** (no plans):
```
query({
  types: ["requirement"],
  filters: {
    uncovered: true
  }
})
```

**Orphaned specs** (no references):
```
query({
  filters: {
    orphaned: true
  }
})
```

## Output Modes

### Summary Mode (Default)

```
query({
  entity_id: "req-001-user-auth",
  mode: "summary"
})
```

**Returns**: id, type, name, description, priority, status, dates

### Full Mode

```
query({
  entity_id: "req-001-user-auth",
  mode: "full"
})
```

**Returns**: All fields including tasks, flows, test cases, etc.

### Custom Mode

```
query({
  entity_id: "req-001-user-auth",
  mode: "custom",
  include_fields: ["id", "name", "criteria", "priority"]
})
```

**Or exclude fields**:
```
query({
  entity_id: "req-001-user-auth",
  mode: "custom",
  exclude_fields: ["created_at", "updated_at"]
})
```

## Pagination

### Offset and Limit

```
query({
  types: ["plan"],
  limit: 20,
  offset: 40  // Skip first 40, get next 20
})
```

**Response includes pagination metadata**:
```json
{
  "results": [...],
  "pagination": {
    "total": 156,
    "limit": 20,
    "offset": 40,
    "has_more": true
  }
}
```

### Return All Results

```
query({
  types: ["requirement"],
  return_all: true
})
```

**Warning**: Use cautiously for large datasets.

## Facets

### Get Facet Counts

```
query({
  types: ["plan"],
  include_facets: true,
  facet_fields: ["priority", "status"]
})
```

**Response**:
```json
{
  "results": [...],
  "facets": {
    "priority": {
      "critical": 5,
      "high": 12,
      "medium": 23,
      "low": 8
    },
    "status": {
      "completed": 15,
      "in_progress": 18,
      "pending": 15
    }
  }
}
```

**Available facet fields**: `type`, `priority`, `status`, `folder`

## Dependency Expansion

### Include Dependencies

```
query({
  entity_id: "pln-001-auth-impl",
  expand: {
    dependencies: true
  }
})
```

**Returns**: Full dependency specs inline.

### Include Dependency Metrics

```
query({
  entity_id: "pln-001-auth-impl",
  expand: {
    dependency_metrics: true
  }
})
```

**Metrics**:
- **fan_in**: How many specs depend on this
- **fan_out**: How many specs this depends on
- **coupling**: Total dependencies (fan_in + fan_out)
- **stability**: Resistance to change (fan_in / coupling)

### Multi-Level Expansion

```
query({
  entity_id: "pln-001-auth-impl",
  expand: {
    dependencies: true,
    dependency_metrics: true,
    depth: 2  // Expand 2 levels deep
  }
})
```

**Depth options**: 1-3 (default: 1)

### Include References

```
query({
  entity_id: "pln-001-auth-impl",
  expand: {
    references: true
  }
})
```

**Returns**: Specs that reference this spec.

### Include Parent

```
query({
  entity_id: "pln-001-auth-impl",
  sub_entity_id: "task-001",
  expand: {
    parent: true
  }
})
```

**Returns**: Parent plan for the task.

## Next Task Detection

### Get Next Recommended Task

```
query({
  next_task: true
})
```

**Returns**: Highest priority unblocked task across all plans.

**Algorithm**:
1. Filter to incomplete, unverified tasks
2. Check task dependencies (must be unblocked)
3. Check plan dependencies (plan must be unblocked)
4. Sort by: task priority > plan priority > creation date
5. Return first task

**Response**:
```json
{
  "task": {
    "id": "task-001",
    "priority": "high",
    "description": "Create User model - 2 hours",
    "completed": false,
    "verified": false,
    "depends_on": [],
    "files": [...]
  },
  "plan": {
    "id": "pln-001-auth-impl",
    "name": "Authentication Implementation",
    "priority": "critical",
    "criteria_id": "req-001-user-auth/crit-001"
  },
  "requirement": {
    "id": "req-001-user-auth",
    "name": "User Authentication",
    "priority": "critical"
  }
}
```

## Multi-Field Sorting

### Sort by Multiple Fields

```
query({
  types: ["plan"],
  filters: { plan_completed: false },
  sort_by: [
    { field: "priority", order: "desc" },    // Highest priority first
    { field: "created_at", order: "asc" }    // Then oldest first
  ]
})
```

**Default sorting**:
- Search queries: `relevance desc`
- List queries: `created_at desc`

## Advanced Query Examples

### Find High-Priority Incomplete Work

```
query({
  types: ["plan"],
  filters: {
    plan_priority: ["critical", "high"],
    plan_completed: false
  },
  sort_by: [
    { field: "priority", order: "desc" }
  ],
  mode: "summary"
})
```

### Find Recent Changes

```
query({
  filters: {
    updated_after: "2025-01-15T00:00:00Z"
  },
  sort_by: [
    { field: "updated_at", order: "desc" }
  ],
  limit: 10
})
```

### Find Orphaned High-Priority Items

```
query({
  filters: {
    orphaned: true,
    requirement_priority: ["critical", "required"]
  }
})
```

### Deep Dependency Analysis

```
query({
  entity_id: "req-001-user-auth",
  mode: "full",
  expand: {
    dependencies: true,
    dependency_metrics: true,
    references: true,
    depth: 3
  }
})
```

### Search with Filters and Facets

```
query({
  search_terms: "authentication",
  types: ["requirement", "plan"],
  filters: {
    plan_priority: ["critical", "high"],
    created_after: "2025-01-01T00:00:00Z"
  },
  include_facets: true,
  facet_fields: ["type", "priority"],
  sort_by: [
    { field: "relevance", order: "desc" },
    { field: "priority", order: "desc" }
  ],
  limit: 20
})
```

### Find Work by Component Type

```
query({
  types: ["service", "library"],
  filters: {
    component_type: ["service"]
  }
})
```

### Find Active Constitutions

```
query({
  types: ["constitution"],
  filters: {
    constitution_status: ["active"]
  }
})
```

## Query Performance Tips

### Use Specific Filters

```
# Faster
query({
  types: ["plan"],
  filters: { plan_priority: ["critical"] },
  limit: 10
})

# Slower
query({
  return_all: true
})
```

### Limit Expansion Depth

```
# Faster
expand: { dependencies: true, depth: 1 }

# Slower
expand: { dependencies: true, depth: 3 }
```

### Use Summary Mode When Possible

```
# Faster
mode: "summary"

# Slower
mode: "full"
```

### Use Pagination

```
# Better for large datasets
limit: 50,
offset: 0

# Avoid for large datasets
return_all: true
```

## Common Query Patterns

### Daily Workflow

**Morning**: What should I work on?
```
query({ next_task: true })
```

**Mid-day**: How's my progress?
```
query({
  types: ["plan"],
  filters: { plan_completed: false },
  include_facets: true,
  facet_fields: ["priority", "status"]
})
```

**Evening**: What did I complete?
```
query({
  types: ["plan"],
  filters: {
    updated_after: "2025-01-20T00:00:00Z",
    plan_completed: true
  },
  sort_by: [{ field: "updated_at", order: "desc" }]
})
```

### Sprint Planning

**What's in the backlog?**
```
query({
  types: ["requirement"],
  filters: { requirement_completed: false },
  sort_by: [{ field: "priority", order: "desc" }]
})
```

**What's uncovered?**
```
query({
  types: ["requirement"],
  filters: { uncovered: true }
})
```

**What's the team velocity?**
```
query({
  types: ["plan"],
  filters: {
    plan_completed: true,
    completed_after: "2025-01-01T00:00:00Z"
  },
  include_facets: true,
  facet_fields: ["priority"]
})
```

### Code Review

**What changed recently?**
```
query({
  filters: {
    updated_after: "2025-01-19T00:00:00Z"
  },
  sort_by: [{ field: "updated_at", order: "desc" }]
})
```

**What's been completed but not approved?**
```
query({
  types: ["plan"],
  filters: {
    plan_completed: true,
    plan_approved: false
  }
})
```

## Next Steps

- Read [Getting Started](spec-mcp://guide/getting-started) for quick setup
- Read [Planning Workflow](spec-mcp://guide/planning-workflow) for creating specs
- Read [Implementation Workflow](spec-mcp://guide/implementation-workflow) for development
- Read [Best Practices](spec-mcp://guide/best-practices) for patterns and tips
