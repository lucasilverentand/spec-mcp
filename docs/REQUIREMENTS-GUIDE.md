# Requirements Specification Guide

## Overview

Requirements are the **first** specifications you should create. They define high-level goals, user needs, and business objectives without prescribing implementation details. Requirements form the foundation for all subsequent specifications (Components and Plans).

## Purpose

- Define **what** needs to be achieved (not **how**)
- Capture business value and user needs
- Establish success criteria
- Provide traceability for downstream specifications

## Step-by-Step Reasoning Process

### Step 1: Identify the Problem or Opportunity

**Questions to ask:**
- What problem are we solving?
- Who are the users/stakeholders?
- What is the business value?
- What are the pain points in the current state?

**Output:** A clear problem statement

**Example:**
> "Users cannot easily track their task completion progress across multiple projects, leading to missed deadlines and poor project visibility."

---

### Step 2: Define User Needs and Goals

**Questions to ask:**
- What do users want to accomplish?
- What are their workflows?
- What constraints or limitations exist?
- What are the priority levels?

**Output:** List of user needs with priority

**Example:**
```
- [HIGH] As a project manager, I need to see progress across all projects
- [MEDIUM] As a developer, I need to update task status quickly
- [LOW] As a stakeholder, I need exportable reports
```

---

### Step 3: Establish Functional Requirements

**Questions to ask:**
- What specific capabilities must the system provide?
- What inputs and outputs are required?
- What business rules must be enforced?
- What edge cases need handling?

**Output:** Specific, measurable, testable requirements

**Example:**
```
REQ-001: System shall display real-time progress percentage for each project
REQ-002: System shall support at least 5 simultaneous projects per user
REQ-003: System shall update progress within 1 second of task status change
```

---

### Step 4: Define Non-Functional Requirements

**Questions to ask:**
- What are the performance expectations?
- What are the security requirements?
- What are the scalability needs?
- What are the accessibility requirements?
- What are the compatibility constraints?

**Output:** Quality attributes and constraints

**Example:**
```
NFR-001: System shall support 10,000 concurrent users
NFR-002: System shall have 99.9% uptime
NFR-003: System shall comply with WCAG 2.1 AA standards
NFR-004: System shall work on Chrome, Firefox, Safari (last 2 versions)
```

---

### Step 5: Define Success Criteria and Acceptance Criteria

**Questions to ask:**
- How will we know if this requirement is successfully met?
- What are the measurable outcomes?
- What are the acceptance tests?

**Output:** Specific, verifiable criteria

**Example:**
```
Acceptance Criteria for REQ-001:
- Given a project with 10 tasks, 5 completed
- When viewing the project dashboard
- Then progress shows "50%" with visual indicator
- And percentage updates immediately when task status changes
```

---

### Step 6: Identify Dependencies and Constraints

**Questions to ask:**
- What other requirements must be satisfied first?
- What external systems/APIs are required?
- What technical constraints exist?
- What business constraints exist (budget, timeline)?

**Output:** List of dependencies and constraints

**Example:**
```
Dependencies:
- REQ-001 depends on REQ-002 (task status tracking)
- Requires integration with existing authentication system

Constraints:
- Must use existing PostgreSQL database
- Must complete within Q2 2025
- Budget limited to $50k
```

---

### Step 7: Validate and Refine

**Questions to ask:**
- Are requirements specific and unambiguous?
- Are they testable and measurable?
- Are they achievable and realistic?
- Have all stakeholders reviewed them?
- Are there conflicts or gaps?

**Output:** Validated, refined requirements

**Checklist:**
- [ ] Each requirement has a unique ID
- [ ] Each requirement is atomic (single concern)
- [ ] Each requirement is traceable
- [ ] All stakeholders have approved
- [ ] No conflicting requirements exist

---

## Requirement Specification Schema

Based on the system's Zod schema, each requirement follows this structure:

### Core Fields (from BaseSchema)
- **type**: `"requirement"` (literal)
- **number**: Unique sequential number (e.g., 1, 2, 3)
- **slug**: URL-friendly identifier (lowercase letters, numbers, single dashes)
- **name**: Display name of the requirement
- **description**: Detailed description of what needs to be achieved
- **created_at**: ISO 8601 datetime timestamp
- **updated_at**: ISO 8601 datetime timestamp

### Requirement-Specific Fields
- **priority**: One of `"critical"`, `"required"`, `"ideal"`, `"optional"` (default: `"required"`)
- **criteria**: Array of acceptance criteria objects, each with:
  - **id**: Format `req-XXX-slug/crit-XXX` (e.g., `req-001-auth/crit-001`)
  - **description**: What must be true for acceptance
  - **plan_id**: ID of the plan implementing this criterion (format: `pln-XXX-slug`)
  - **completed**: Boolean indicating completion status (default: `false`)

### Computed Field
- **id**: Auto-generated as `req-XXX-slug` (e.g., `req-001-user-authentication`)

### Example JSON

```json
{
  "type": "requirement",
  "number": 1,
  "slug": "real-time-progress-tracking",
  "name": "Real-Time Project Progress Tracking",
  "description": "Users must be able to view real-time completion percentage for each project based on task status, visible on the project dashboard.",
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z",
  "priority": "critical",
  "criteria": [
    {
      "id": "req-001-real-time-progress-tracking/crit-001",
      "description": "Progress percentage displays on dashboard",
      "plan_id": "pln-001-dashboard-implementation",
      "completed": false
    },
    {
      "id": "req-001-real-time-progress-tracking/crit-002",
      "description": "Updates occur within 1 second of task status change",
      "plan_id": "pln-002-real-time-updates",
      "completed": false
    }
  ]
}
```

---

## Best Practices

### DO:
✅ Write from the user's perspective
✅ Use clear, unambiguous language
✅ Make requirements testable and measurable
✅ Assign unique IDs to each requirement
✅ Prioritize requirements
✅ Include acceptance criteria
✅ Review with stakeholders

### DON'T:
❌ Prescribe implementation details
❌ Use vague terms (e.g., "user-friendly", "fast")
❌ Combine multiple concerns in one requirement
❌ Assume knowledge - be explicit
❌ Skip validation with stakeholders
❌ Create orphaned requirements (no traceability)

---

## Common Pitfalls

1. **Too Implementation-Focused**: "System shall use Redis for caching" → Should be: "System shall respond to queries within 100ms"

2. **Too Vague**: "System shall be fast" → Should be: "System shall process transactions within 2 seconds"

3. **Missing Acceptance Criteria**: Always include specific, testable criteria

4. **No Traceability**: Every requirement should trace to a business need and forward to components/plans

5. **Conflicting Requirements**: Check for contradictions between requirements

---

## Relationship to Other Specifications

```
Requirements (FIRST)
    ↓
    Defines needs for → Components (SECOND)
    ↓
    Both used to create → Plans (THIRD)
```

**Requirements answer:** What needs to be achieved and why?

**Components answer:** What are the architectural building blocks?

**Plans answer:** How will we build it and in what order?

---

## Example: Complete Requirement Specification

```json
{
  "type": "requirement",
  "number": 1,
  "slug": "real-time-progress-tracking",
  "name": "Real-Time Project Progress Tracking",
  "description": "Users must be able to view real-time completion percentage for each project based on task status, visible on the project dashboard. This is needed because project managers report spending 2+ hours daily manually calculating project progress. Automated tracking will save time and provide accurate, up-to-date visibility. Must work with existing PostgreSQL database schema, support projects with up to 10,000 tasks, and not introduce performance degradation on dashboard load.",
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-20T14:30:00Z",
  "priority": "critical",
  "criteria": [
    {
      "id": "req-001-real-time-progress-tracking/crit-001",
      "description": "System displays completion percentage calculated as (completed tasks / total tasks * 100) when user navigates to project dashboard",
      "plan_id": "pln-001-progress-calculator",
      "completed": false
    },
    {
      "id": "req-001-real-time-progress-tracking/crit-002",
      "description": "Percentage updates within 1 second of any task status change",
      "plan_id": "pln-002-real-time-updates",
      "completed": false
    },
    {
      "id": "req-001-real-time-progress-tracking/crit-003",
      "description": "Visual progress bar reflects the percentage with animation",
      "plan_id": "pln-003-dashboard-ui",
      "completed": false
    },
    {
      "id": "req-001-real-time-progress-tracking/crit-004",
      "description": "Dashboard load time remains under 500ms with accurate calculation",
      "plan_id": "pln-001-progress-calculator",
      "completed": false
    }
  ]
}
```

**Key Points:**
- **ID is computed**: `req-001-real-time-progress-tracking` (from type + number + slug)
- **Priority is critical**: Highest priority level
- **Multiple criteria**: Each criterion links to a specific plan that will implement it
- **Criteria IDs match parent**: All criteria IDs start with `req-001-real-time-progress-tracking/`
- **Rich description**: Includes rationale, constraints, and context all in the description field