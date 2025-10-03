# Requirement Specification

## Purpose

A Requirement defines **what** needs to be built, focusing on the problem or opportunity without specifying implementation details. Requirements are implementation-agnostic and include measurable acceptance criteria that define success.

Requirements are the **first specifications** you should create in your project, as they establish the foundation for components and plans.

## Schema and Fields

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `"requirement"` | ✅ | Always set to `"requirement"` |
| `number` | `number` | ✅ | Auto-assigned sequential number |
| `slug` | `string` | ✅ | URL-friendly identifier (lowercase, hyphens) |
| `name` | `string` | ✅ | Display name |
| `description` | `string` | ✅ | Brief description of what needs to be built and why |
| `priority` | `"critical" \| "required" \| "ideal" \| "optional"` | ✅ | Priority level (default: `"required"`) |
| `criteria` | `AcceptanceCriteria[]` | ✅ | Array of acceptance criteria (minimum 1 required) |
| `created_at` | `string` (ISO datetime) | ✅ | Auto-generated creation timestamp |
| `updated_at` | `string` (ISO datetime) | ✅ | Auto-generated update timestamp |

### Computed Field

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Computed from type, number, and slug (format: `req-XXX-slug`, e.g., `req-001-user-authentication`) |

### Acceptance Criteria Schema

Each acceptance criterion has the following structure:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | ✅ | Format: `crit-XXX` (e.g., `crit-001`, `crit-002`) |
| `description` | `string` | ✅ | Clear, measurable description of the acceptance criterion |
| `status` | `"needs-review" \| "active" \| "archived"` | ✅ | Criterion status (default: `"needs-review"`) |

### Criterion Status Values

| Status | Description |
|--------|-------------|
| `needs-review` | Criterion is drafted but not yet approved |
| `active` | Criterion is approved and should be tested |
| `archived` | Criterion is no longer applicable |

**Example:**
```yaml
criteria:
  - id: crit-001
    description: User can complete registration with email and password in under 30 seconds
    status: active
  - id: crit-002
    description: User can authenticate via OAuth (Google, GitHub) within 10 seconds
    status: active
  - id: crit-003
    description: System enforces password requirements (8+ chars, mixed case, number)
    status: active
```

### Priority Values

| Priority | Description |
|----------|-------------|
| `critical` | Must-have for launch; blocking |
| `required` | Needed soon; important for product success |
| `ideal` | Nice to have; enhances user experience |
| `optional` | Future consideration; low priority |

## Creation Flow

Requirements are created using a **simple 5-step guided flow** that ensures measurable requirements.

### Draft State Management

**After each step submission:**
1. The field value is validated
2. The draft is updated and saved to `.specs/.drafts/draft-req-{slug}-{timestamp}.draft.yml`
3. The next step is determined by reading the draft state and finding the next empty field
4. Progress can be resumed at any time by continuing with the next empty field

**Automatic finalization:**
- When all required fields are filled (saturated state), the draft is automatically finalized
- The requirement is created via `operations.createRequirement()`
- The draft file is removed from `.specs/.drafts/`
- This ensures drafts are temporary and only active requirements persist

### Stage 1: Identity & Description (Steps 1-2)

**Step 1: slug and name**
- **Prompt**: "Provide the slug and name for this requirement as an object:\n- slug: URL-friendly identifier (lowercase, hyphens only)\n- name: Display name"
- **Type**: object `{ slug: string, name: string }`
- **Example**:
  ```json
  {
    "slug": "user-authentication",
    "name": "User Authentication System"
  }
  ```
- **Validation**:
  - slug: Lowercase, hyphens only, must be unique
  - name: Non-empty, 3-100 characters
- **Next**: Draft file created at `.specs/.drafts/draft-req-{slug}-{timestamp}.draft.yml`. Now provide a description.

**Step 2: description**
- **Prompt**: "Provide a brief description of what needs to be built and why. Keep it concise."
- **Type**: string
- **Example**: "Users need a secure authentication system to protect user data and comply with security regulations. Enables users to safely access their personalized content."
- **Validation**: Non-empty, 20-500 characters
- **Next**: Draft updated with description. Now define measurable acceptance criteria.

### Stage 2: Acceptance Criteria (Step 3)

**Step 3: criteria**
- **Prompt**: "Define measurable acceptance criteria. Each should be specific, testable, and define what success looks like. Provide as an array of criterion descriptions (IDs will be auto-generated)."
- **Type**: string[]
- **Example**:
  ```json
  [
    "User can complete registration with email and password in under 30 seconds",
    "User can authenticate via OAuth (Google, GitHub) within 10 seconds",
    "System enforces password requirements: 8+ chars with uppercase, lowercase, and number"
  ]
  ```
- **Validation**:
  - At least 1 criterion required (2-4 recommended)
  - Each must be measurable and testable
- **Next**: Draft updated with criteria. Now assign priority.

### Stage 3: Prioritization (Step 4)

**Step 4: priority**
- **Prompt**: "Assign a priority: critical (must-have for launch), required (needed soon), ideal (nice to have), optional (future consideration)."
- **Type**: string
- **Example**: `"critical"`
- **Validation**:
  - Must be one of: "critical", "required", "ideal", "optional"
- **Next**: All required fields complete! Finalizing requirement...

### Finalization (Automatic)

Once all required fields are provided:

1. **Auto-assign number**: Next available sequential number
2. **Auto-generate criterion IDs**: Format `crit-001`, `crit-002`, etc.
3. **Set all criterion statuses**: "needs-review" (default)
4. **Auto-generate timestamps**: created_at, updated_at
5. **Create the requirement** via `operations.createRequirement()`
6. **Delete the draft**
7. **Return success** with the full requirement spec

### Total Steps

```
Total: 4 steps
- Steps 1-2: Identity and description
- Step 3: Acceptance criteria
- Step 4: Prioritization
```

## Example Requirement

```yaml
type: requirement
number: 1
slug: user-authentication
name: User Authentication System
description: Users need a secure authentication system to protect user data and comply with security regulations. Enables users to safely access their personalized content.
priority: critical
criteria:
  - id: crit-001
    description: User can complete registration with email and password in under 30 seconds
    status: active
  - id: crit-002
    description: User can authenticate via OAuth (Google, GitHub) within 10 seconds
    status: active
  - id: crit-003
    description: System enforces password requirements: 8+ chars with uppercase, lowercase, and number
    status: active
  - id: crit-004
    description: Failed login attempts are rate-limited (max 5 attempts per 15 minutes)
    status: active
created_at: "2025-01-15T10:00:00Z"
updated_at: "2025-01-15T10:00:00Z"
```

## Relationship to Other Specs

Requirements are **foundational specifications** that define what needs to be built. They relate to other specs through dependencies and traceability:

```
Constitution (con-001)
    ↓ governs principles for
Requirement (req-001) ← YOU ARE HERE
    ↓ informs
Decision (dec-001) - documents why choices were made
    ↓ affects
Component (svc-001) - implements the structure
    ↓ implemented by
Plan (pln-001) - executes via criteria_id
```

### Incoming References

**Plans** reference requirement criteria via `criteria_id`:
- Each plan implements one acceptance criterion from a requirement
- Format: `criteria_id: "req-001-user-authentication/crit-001"` (full path with parent requirement)
- Creates direct traceability from implementation back to requirements

**Decisions** reference requirements via `affects_requirements`:
- Documents which requirements influenced or are affected by a decision
- Format: `affects_requirements: ["req-001-user-authentication"]`
- Helps understand why certain architectural choices were made

**Components** (informal) reference requirements in their `description`:
- Components explain which requirements they satisfy
- No formal FK relationship, but strong convention
- Example: "This auth service satisfies req-001-user-authentication..."

### Outgoing References

Requirements are **foundational** and don't formally reference other spec types. However:

**Constitution** (informal): Requirements should follow principles defined in active constitutions
- Constitutions can apply to requirements via `applies_to: ["requirements"]`
- No formal reference field, but strong guidance relationship

## Best Practices

1. **Create First** - Requirements should be created before components and plans
2. **Brief Description** - Keep description concise (1-3 sentences); focus on what and why
3. **Measurable Criteria** - Each criterion should be testable and specific with concrete success conditions
4. **2-4 Criteria per Requirement** - Keep requirements focused; break large ones into multiple requirements
5. **One Plan Per Criterion** - Each criterion gets its own implementation plan for clear traceability
6. **Quantify When Possible** - Use specific numbers (e.g., "within 2 seconds" instead of "fast")
7. **Independent Criteria** - Each criterion should be testable independently
8. **Link Back** - Ensure all plans and components trace back to requirements
