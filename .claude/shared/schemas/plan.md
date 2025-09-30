# Plan Schema

Plans follow this exact schema structure:

```json
{
  "type": "plan",
  "number": 1,
  "slug": "url-friendly-slug",
  "name": "Display Name",
  "description": "Detailed description of implementation approach",
  "criteria_id": "req-001-auth/crit-001",
  "priority": "critical" | "high" | "medium" | "low",
  "acceptance_criteria": "Clear completion conditions",
  "depends_on": ["pln-001-setup", "pln-002-database"],
  "tasks": [
    {
      "id": "task-001",
      "description": "Actionable task description",
      "priority": "critical" | "high" | "normal" | "low" | "optional",
      "depends_on": ["task-002"],
      "considerations": ["Important factor to consider"],
      "completed": false
    }
  ],
  "test_cases": [],
  "flows": [],
  "api_contracts": [],
  "data_models": []
}
```

## Field Rules

- **type**: Always `"plan"`
- **slug**: URL-friendly identifier (lowercase, numbers, single dashes)
- **name**: Plan display name
- **description**: Scope, approach, and rationale (detailed)
  - What will be built?
  - Why this approach?
  - What's the scope?
- **criteria_id**: Links to requirement criteria being fulfilled
  - Format: `req-XXX-slug/crit-XXX`
  - Example: `req-001-auth/crit-001`
  - Establishes traceability to requirements
- **priority**: Execution priority
  - `"critical"`: Must be done immediately
  - `"high"`: Should be done soon
  - `"medium"`: Standard priority
  - `"low"`: Can be deferred
- **acceptance_criteria**: How we know this plan is complete
  - Clear, measurable completion conditions
  - Example: "All tests pass, API responds within 100ms, documented"
- **depends_on**: Other plans that must complete first
  - Array of plan IDs
  - Example: `["pln-001-database-setup", "pln-002-auth-service"]`
- **tasks**: Implementation tasks
  - Each task is atomic and actionable
  - Includes id, description, priority, dependencies
  - Size: 0.5-3 days of work
  - Include 20% buffer for 5+ task plans
- **test_cases**: Test specifications (optional)
- **flows**: User/system/data flows (optional)
- **api_contracts**: API specifications (optional)
- **data_models**: Data structure definitions (optional)
- **id** (computed): Auto-generated as `pln-XXX-slug`
  - Example: `pln-001-auth-implementation`

## Task Structure

```json
{
  "id": "task-001",
  "description": "Clear, actionable description of what needs to be done",
  "priority": "critical" | "high" | "normal" | "low" | "optional",
  "depends_on": ["task-002", "task-003"],
  "considerations": [
    "Important factor to think about",
    "Edge case to handle",
    "Performance consideration"
  ],
  "completed": false
}
```

## Validation

Use `mcp__spec-mcp__guidance` with `spec_type: "plan"` to validate against the 12-step reasoning process.