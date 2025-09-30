# Requirement Schema

Requirements follow this exact schema structure:

```json
{
  "type": "requirement",
  "number": 1,
  "slug": "url-friendly-slug",
  "name": "Display Name",
  "description": "Detailed description focusing on WHAT and WHY, not HOW",
  "priority": "critical" | "required" | "ideal" | "optional",
  "criteria": [
    {
      "id": "req-001-slug/crit-001",
      "description": "Specific, testable acceptance criterion"
    }
  ]
}
```

## Field Rules

- **type**: Always `"requirement"`
- **number**: Sequential unique number (1, 2, 3...)
- **slug**: URL-friendly identifier (lowercase, numbers, single dashes only)
  - Example: `user-authentication`, `real-time-progress-tracking`
- **name**: Clear, descriptive display name
  - Example: "Real-Time Project Progress Tracking"
- **description**: Explains WHAT and WHY (not HOW)
  - Focus on business value and rationale
  - Include constraints and context
  - NO implementation details ("must use X technology")
- **priority**: One of four levels:
  - `"critical"`: Must have for system to function
  - `"required"`: Necessary for basic functionality
  - `"ideal"`: Important but not essential
  - `"optional"`: Nice to have
- **criteria**: Array of acceptance criteria
  - Each has `id` and `description`
  - ID format: `req-XXX-slug/crit-XXX` (must match parent requirement)
  - Each criterion is specific and testable
  - Plans link to criteria via `criteria_id`
- **id** (computed): Auto-generated as `req-XXX-slug`
  - Example: `req-001-user-authentication`

## Validation

Use `mcp__spec-mcp__guidance` with `spec_type: "requirement"` to validate against the 7-step reasoning process.