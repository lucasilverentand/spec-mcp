# Plan Specification

## Purpose

A Plan defines the **implementation roadmap** for building your system. Plans break down work into executable tasks, define flows and test cases, specify API contracts and data models, and establish timelines.

Each plan should ideally fulfill **one acceptance criterion** from a requirement (via the `criteria_id` field), ensuring clear traceability from requirements to implementation.

Plans are created **after** requirements and components have been defined.

## Schema and Fields

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `"plan"` | ✅ | Always set to `"plan"` |
| `number` | `number` | ✅ | Auto-assigned sequential number |
| `slug` | `string` | ✅ | URL-friendly identifier (lowercase, hyphens) |
| `name` | `string` | ✅ | Display name |
| `description` | `string` | ✅ | Brief description of what this plan implements and why. Keep it concise (20-500 characters). |
| `criteria_id` | `string` | ❌ | Acceptance criteria ID this plan fulfills (format: `req-XXX-slug/crit-XXX`). Optional for orchestration/milestone plans. |
| `priority` | `"critical" \| "high" \| "medium" \| "low"` | ✅ | Priority level (default: `"medium"`) |
| `acceptance_criteria` | `string` | ✅ | Conditions that must be met for the plan to be considered complete |
| `scope` | `Scope` | ❌ | What's in and out of scope. **When to add**: Boundaries are unclear or you need to explicitly exclude functionality. **Skip**: Well-defined, small plans. |
| `depends_on` | `PlanId[]` | ✅ | Other plans this plan relies on (default: `[]`) |
| `tasks` | `Task[]` | ✅ | List of executable tasks (default: `[]`) |
| `flows` | `Flow[]` | ❌ | User/system/data flows. **When to add**: Plan involves user interactions, system processes, or data transformations. **Skip**: Simple backend tasks. (default: `[]`) |
| `test_cases` | `TestCase[]` | ❌ | Test cases to validate the plan. **When to add**: Specific test scenarios need documentation beyond acceptance criteria. **Skip**: Tasks already cover testing. (default: `[]`) |
| `api_contracts` | `ApiContract[]` | ❌ | API contracts defined/consumed. **When to add**: Creating new APIs or integrating with external services. **Skip**: UI-only or internal refactoring. (default: `[]`) |
| `data_models` | `DataModel[]` | ❌ | Data models/schemas. **When to add**: Defining database schemas or data structures. **Skip**: Plans that don't touch data. (default: `[]`) |
| `references` | `Reference[]` | ✅ | External references (default: `[]`) |
| `completed` | `boolean` | ✅ | Whether the plan is complete (default: `false`) |
| `completed_at` | `string` (ISO datetime) | ❌ | Completion timestamp |
| `approved` | `boolean` | ✅ | Whether the plan is approved (default: `false`) |
| `created_at` | `string` (ISO datetime) | ✅ | Auto-generated creation timestamp |
| `updated_at` | `string` (ISO datetime) | ✅ | Auto-generated update timestamp |

### Computed Field

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Computed from type, number, and slug (format: `pln-XXX-slug`, e.g., `pln-001-auth-implementation`) |

### Task Schema

Each task has the following structure:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | ✅ | Format: `task-XXX` (e.g., `task-001`) |
| `priority` | `"critical" \| "high" \| "medium" \| "low"` | ✅ | Task priority |
| `description` | `string` | ✅ | Detailed task description with effort estimate |
| `depends_on` | `string[]` | ✅ | Task IDs this task depends on (default: `[]`) |
| `files` | `FileChange[]` | ✅ | Files to be created/modified (default: `[]`) |
| `completed` | `boolean` | ✅ | Whether task is done (default: `false`) |
| `verified` | `boolean` | ✅ | Whether task is verified (default: `false`) |
| `considerations` | `string[]` | ✅ | Implementation considerations (default: `[]`) |
| `references` | `Reference[]` | ✅ | Task-specific references (default: `[]`) |
| `notes` | `string[]` | ✅ | Additional notes (default: `[]`) |

### Priority Values

| Priority | Description |
|----------|-------------|
| `critical` | Blocking; must be done immediately |
| `high` | Important; should be done soon |
| `medium` | Normal priority; standard workflow |
| `low` | Nice to have; can be deferred |

## Creation Flow

Plans are created using a **8-14 step flow** (depending on optional fields needed) that captures essential implementation details.

### Draft State Management

**After each step submission:**
1. The field value is validated
2. The draft is updated and saved to `.specs/.drafts/pln-{slug}-{timestamp}.draft.yml`
3. The next step is determined by reading the draft state and finding the next empty field
4. Progress can be resumed at any time by continuing with the next empty field

**Automatic finalization:**
- When all required fields are filled (saturated state), the draft is automatically finalized
- The plan is created via `operations.createPlan()`
- The draft file is removed from `.specs/.drafts/`
- This ensures drafts are temporary and only active plans persist

### Stage 1: Identity & Description (Steps 1-2)

**Step 1: slug and name**
- **Prompt**: "Provide the slug and name for this plan as an object:\n- slug: URL-friendly identifier (lowercase, hyphens only)\n- name: Display name"
- **Type**: object `{ slug: string, name: string }`
- **Example**:
  ```json
  {
    "slug": "user-registration-impl",
    "name": "User Registration Implementation"
  }
  ```
- **Validation**:
  - slug: Lowercase, hyphens only, must be unique
  - name: Non-empty, 3-100 characters
- **Next**: Draft file created at `.specs/.drafts/pln-{slug}-{timestamp}.draft.yml`. Now provide a brief description.

**Step 2: description**
- **Prompt**: "Provide a brief description of what this plan implements and why. Keep it concise (1-3 sentences)."
- **Type**: string
- **Example**: "Implements user registration with email/password to satisfy req-001-user-authentication/crit-001. Includes database schema, API endpoint, frontend form, and comprehensive testing."
- **Validation**: Non-empty, 20-500 characters
- **Next**: Draft updated with description. Now link to requirement criterion (if applicable).

### Stage 2: Requirements & Priority (Steps 3-4)

**Step 3: criteria_id**
- **Prompt**: "What acceptance criterion does this plan fulfill? Provide the criteria_id (e.g., req-001-user-auth/crit-001). Leave empty for orchestration/milestone plans."
- **Type**: string (optional)
- **Example**: `"req-001-user-authentication/crit-001"`
- **Validation**:
  - Optional field
  - If provided, must follow format: `req-XXX-slug/crit-XXX`
- **Next**: Draft updated with criteria_id. Now set priority.

**Step 4: priority**
- **Prompt**: "Assign a priority: critical (blocking), high (important), medium (normal), low (nice to have)."
- **Type**: string
- **Example**: `"high"`
- **Validation**:
  - Must be one of: "critical", "high", "medium", "low"
- **Next**: Draft updated with priority. Now define acceptance criteria.

### Stage 3: Acceptance Criteria & Dependencies (Steps 5-6)

**Step 5: acceptance_criteria**
- **Prompt**: "What conditions must be met for this plan to be considered complete? Be specific and measurable."
- **Type**: string
- **Example**: "All tasks completed and verified. Registration endpoint returns 201 on success. Password validation enforced. Email uniqueness constraint active. >90% test coverage. Code reviewed and approved. Documentation updated."
- **Validation**:
  - Non-empty string
  - Should be specific and measurable
- **Next**: Draft updated with acceptance criteria. Now list plan dependencies.

**Step 6: depends_on**
- **Prompt**: "List other plans that must complete before this one can start. Provide as an array of plan IDs. Use empty array [] if no dependencies."
- **Type**: PlanId[]
- **Example**: `["pln-002-database-setup", "pln-003-auth-service-foundation"]`
- **Validation**:
  - Can be empty array
  - Plan IDs must follow format: `pln-XXX-slug`
- **Next**: Draft updated with plan dependencies. Now break down tasks.

### Stage 4: Task Breakdown (Steps 7a-7c)

Tasks are added iteratively, allowing you to build the task list progressively.

**Step 7a: tasks (initial breakdown)**
- **Prompt**: "Break down work into specific tasks. Each task should be:\n- 0.5-3 days of effort (include estimates with 20% buffer)\n- Independently testable\n- Clearly described\n\nStart with core tasks. Provide as an array of task objects with id, priority, description, depends_on."
- **Type**: Task[]
- **Example**:
  ```json
  [
    {
      "id": "task-001",
      "priority": "critical",
      "description": "Create user registration database schema (Est: 0.5 days + 20% buffer = 0.6 days)",
      "depends_on": [],
      "files": [],
      "completed": false,
      "verified": false,
      "considerations": [],
      "references": [],
      "notes": []
    },
    {
      "id": "task-002",
      "priority": "critical",
      "description": "Implement POST /auth/register endpoint with validation (Est: 2 days + 20% buffer = 2.4 days)",
      "depends_on": ["task-001"],
      "files": [],
      "completed": false,
      "verified": false,
      "considerations": [],
      "references": [],
      "notes": []
    }
  ]
  ```
- **Validation**:
  - At least one task required
  - Task IDs must follow format: `task-XXX`
  - Each task should be granular (0.5-3 days)
  - Estimates should include 20% buffer
- **Next**: Draft updated with initial tasks. Now add file changes.

**Step 7b: tasks (with file changes)**
- **Prompt**: "For each task, specify which files will be created or modified. This helps track implementation scope."
- **Type**: Task[] (with files populated)
- **Example**:
  ```json
  [
    {
      "id": "task-001",
      "priority": "critical",
      "description": "Create user registration database schema (Est: 0.5 days + 20% buffer = 0.6 days)",
      "depends_on": [],
      "files": [
        {
          "path": "migrations/001_create_users_table.sql",
          "action": "create",
          "action_description": "Create users table migration",
          "applied": false
        }
      ],
      "completed": false,
      "verified": false,
      "considerations": [],
      "references": [],
      "notes": []
    },
    {
      "id": "task-002",
      "priority": "critical",
      "description": "Implement POST /auth/register endpoint with validation (Est: 2 days + 20% buffer = 2.4 days)",
      "depends_on": ["task-001"],
      "files": [
        {
          "path": "src/routes/auth.ts",
          "action": "create",
          "action_description": "Create auth routes with registration endpoint",
          "applied": false
        },
        {
          "path": "src/validators/auth.ts",
          "action": "create",
          "action_description": "Add email/password validation logic",
          "applied": false
        }
      ],
      "completed": false,
      "verified": false,
      "considerations": [],
      "references": [],
      "notes": []
    }
  ]
  ```
- **Validation**: File changes are optional but recommended
- **Next**: Draft updated with file changes. Now add task details (optional).

**Step 7c: tasks (with considerations, references, notes - optional)**
- **Prompt**: "Add implementation considerations, task-specific references, or notes for each task. Skip if not applicable."
- **Type**: Task[] (with considerations, references, notes populated)
- **When to add**: Tasks have specific implementation concerns, require external references, or need additional context
- **When to skip**: Tasks are straightforward without special considerations
- **Example**:
  ```json
  [
    {
      "id": "task-001",
      "priority": "critical",
      "description": "Create user registration database schema (Est: 0.5 days + 20% buffer = 0.6 days)",
      "depends_on": [],
      "files": [
        {
          "path": "migrations/001_create_users_table.sql",
          "action": "create",
          "action_description": "Create users table migration",
          "applied": false
        }
      ],
      "completed": false,
      "verified": false,
      "considerations": [
        "Use UUID for primary key to avoid sequential ID enumeration attacks",
        "Add email uniqueness constraint at database level",
        "Consider future soft-delete requirements"
      ],
      "references": [
        {
          "title": "PostgreSQL UUID Best Practices",
          "url": "https://wiki.postgresql.org/wiki/Don't_Do_This#Don.27t_use_serial",
          "description": "Why UUIDs are preferred over serial IDs"
        }
      ],
      "notes": [
        "Coordinate with DBA before running migration in production",
        "Remember to update ER diagram after schema changes"
      ]
    },
    {
      "id": "task-002",
      "priority": "critical",
      "description": "Implement POST /auth/register endpoint with validation (Est: 2 days + 20% buffer = 2.4 days)",
      "depends_on": ["task-001"],
      "files": [
        {
          "path": "src/routes/auth.ts",
          "action": "create",
          "action_description": "Create auth routes with registration endpoint",
          "applied": false
        },
        {
          "path": "src/validators/auth.ts",
          "action": "create",
          "action_description": "Add email/password validation logic",
          "applied": false
        }
      ],
      "completed": false,
      "verified": false,
      "considerations": [
        "Rate limit registration endpoint to prevent abuse",
        "Ensure password validation happens server-side (never trust client)",
        "Handle race conditions on email uniqueness check"
      ],
      "references": [],
      "notes": []
    }
  ]
  ```
- **Validation**: All three fields are optional and can be empty arrays
- **Next**: Draft updated with task details. Now add optional fields (flows, test_cases, api_contracts, data_models).

### Stage 5: Optional Fields (Steps 8-12)

**Step 8: flows (optional)**
- **Prompt**: "Define user workflows, system processes, or data flows. Skip if not applicable."
- **Type**: Flow[]
- **When to add**: Plan involves user interactions, system processes, or data transformations
- **When to skip**: Simple backend tasks
- **Example**:
  ```json
  [
    {
      "id": "flow-001",
      "name": "User Registration Flow",
      "steps": [
        "User fills registration form",
        "Frontend validates input",
        "POST /auth/register called",
        "Server validates email/password",
        "Password hashed with bcrypt",
        "User record created in DB",
        "201 response with user ID",
        "User redirected to login"
      ]
    }
  ]
  ```
- **Validation**: Can be empty array
- **Next**: Draft updated with flows. Now add test cases if needed.

**Step 9: test_cases (optional)**
- **Prompt**: "Define specific test scenarios beyond acceptance criteria. Skip if tasks already cover testing."
- **Type**: TestCase[]
- **When to add**: Specific test scenarios need documentation beyond acceptance criteria
- **When to skip**: Tasks already cover testing adequately
- **Example**:
  ```json
  [
    {
      "id": "tc-001",
      "description": "Registration with valid email and password succeeds",
      "steps": [
        "POST /auth/register with valid data",
        "Verify 201 response",
        "Verify user in database",
        "Verify password is hashed"
      ],
      "expected_result": "User created successfully with hashed password"
    }
  ]
  ```
- **Validation**: Can be empty array
- **Next**: Draft updated with test cases. Now add API contracts and data models if needed.

**Step 10: api_contracts and data_models (optional)**
- **Prompt**: "Define API contracts (if creating/consuming APIs) and data models (if defining schemas). Skip if not applicable."
- **Type**: object `{ api_contracts: ApiContract[], data_models: DataModel[] }`
- **When to add api_contracts**: Creating new APIs or integrating with external services
- **When to add data_models**: Defining database schemas or data structures
- **When to skip**: UI-only or internal refactoring plans
- **Example**:
  ```json
  {
    "api_contracts": [
      {
        "id": "api-001",
        "method": "POST",
        "path": "/auth/register",
        "description": "Register a new user",
        "request_body": {
          "email": "string",
          "password": "string"
        },
        "response": {
          "201": { "user_id": "string" },
          "400": { "error": "string" }
        }
      }
    ],
    "data_models": [
      {
        "id": "dm-001",
        "name": "User",
        "description": "User account data",
        "fields": [
          {
            "name": "id",
            "type": "uuid",
            "required": true
          },
          {
            "name": "email",
            "type": "string",
            "required": true
          },
          {
            "name": "password_hash",
            "type": "string",
            "required": true
          }
        ]
      }
    ]
  }
  ```
- **Validation**: Both can be empty arrays
- **Next**: Draft updated with API contracts and data models. Now add scope if needed.

**Step 11: scope (optional)**
- **Prompt**: "Define what's explicitly in-scope and out-of-scope. Skip if boundaries are clear."
- **Type**: Scope object
- **When to add**: Boundaries are unclear or you need to explicitly exclude functionality
- **When to skip**: Well-defined, small plans
- **Example**:
  ```json
  {
    "in_scope": [
      "User registration with email/password",
      "Email validation",
      "Password hashing"
    ],
    "out_of_scope": [
      "OAuth integration (separate plan)",
      "Email verification (future phase)",
      "User profile management"
    ]
  }
  ```
- **Validation**: Optional field
- **Next**: Draft updated with scope. Now add references if needed.

**Step 12: references (optional)**
- **Prompt**: "Add external references (documentation, articles, examples) that inform this plan. Skip if not applicable."
- **Type**: Reference[]
- **When to add**: External documentation, articles, or examples are relevant to implementation
- **When to skip**: Plan is straightforward without external context needs
- **Example**:
  ```json
  [
    {
      "title": "bcrypt Best Practices",
      "url": "https://github.com/kelektiv/node.bcrypt.js#security-issues-and-concerns",
      "description": "Password hashing recommendations"
    },
    {
      "title": "Email Validation RFC",
      "url": "https://datatracker.ietf.org/doc/html/rfc5322",
      "description": "Official email format specification"
    }
  ]
  ```
- **Validation**: Can be empty array
- **Next**: All fields complete! Finalizing plan...

### Finalization (Automatic)

Once all required fields are provided:

1. **Auto-assign number**: Next available sequential number
2. **Auto-generate timestamps**: created_at, updated_at
3. **Initialize flags**: completed = false, approved = false
4. **Create the plan** via `operations.createPlan()`
5. **Delete the draft**
6. **Return success** with the full plan spec

### Total Steps

```
Total: 8-14 steps (depending on optional fields needed)
- Steps 1-2: Identity and description
- Steps 3-4: Requirements link and priority
- Steps 5-6: Acceptance criteria and dependencies
- Steps 7a-7c: Task breakdown (initial tasks, file changes, then task details)
- Steps 8-12 (optional): Flows, test cases, API contracts/data models, scope, references
```

## Example Plan

```yaml
type: plan
number: 1
slug: user-registration-impl
name: User Registration Implementation
description: Implements user registration with email/password to satisfy req-001-user-authentication/crit-001. Includes database schema, API endpoint, frontend form, and comprehensive testing.
criteria_id: req-001-user-authentication/crit-001
priority: high
acceptance_criteria: All tasks completed and verified. Registration endpoint returns 201 on success. Password validation enforced. Email uniqueness constraint active. >90% test coverage. Code reviewed and approved. Documentation updated.
depends_on:
  - pln-002-database-setup
  - pln-003-auth-service-foundation
tasks:
  - id: task-001
    priority: critical
    description: Create user registration database schema (Est: 0.5 days + 20% buffer = 0.6 days)
    depends_on: []
    files:
      - path: migrations/001_create_users_table.sql
        action: create
        action_description: Create users table migration
        applied: false
    completed: false
    verified: false
    considerations: []
    references: []
    notes: []
  - id: task-002
    priority: critical
    description: Implement POST /auth/register endpoint with validation (Est: 2 days + 20% buffer = 2.4 days)
    depends_on:
      - task-001
    files:
      - path: src/routes/auth.ts
        action: create
        action_description: Create auth routes with registration endpoint
        applied: false
    completed: false
    verified: false
    considerations: []
    references: []
    notes: []
  - id: task-003
    priority: high
    description: Create registration form component in web app (Est: 1.5 days + 20% buffer = 1.8 days)
    depends_on:
      - task-002
    files:
      - path: src/components/auth/RegistrationForm.tsx
        action: create
        action_description: Create registration form component
        applied: false
    completed: false
    verified: false
    considerations: []
    references: []
    notes: []
flows: []
test_cases: []
api_contracts: []
data_models: []
references: []
completed: false
approved: false
created_at: "2025-01-15T10:00:00Z"
updated_at: "2025-01-15T10:00:00Z"
```

## Relationship to Other Specs

Plans define **implementation roadmaps** and relate to other specs through dependencies and traceability:

```
Constitution (con-001)
    ↓ governs principles for
Requirement (req-001)
    ├── crit-001 ← criteria_id points here
    ├── crit-002
    └── crit-003
    ↓ informs
Decision (dec-001)
    ↓ affects
Component (svc-001)
    ↓ implemented by
Plan (pln-001) ← YOU ARE HERE
    ├── depends on → Plan (pln-002)
    └── implements → req-001/crit-001
```

### Incoming References

**Other Plans** reference this plan via the `depends_on` field:
- Plans can depend on other plans completing first
- Format: `depends_on: ["pln-001-database-setup", "pln-002-auth-foundation"]`
- Creates a dependency graph for implementation ordering

**Decisions** can reference plans via `affects_plans`:
- Documents which plans are impacted by architectural decisions
- Format: `affects_plans: ["pln-001-user-registration-impl"]`
- Provides context for design choices affecting implementation

### Outgoing References

**Requirement Criteria** via the `criteria_id` field:
- Each plan implements one acceptance criterion from a requirement
- Format: `criteria_id: "req-001-user-authentication/crit-001"`
- This is the **primary traceability mechanism** from implementation to requirements
- Optional for orchestration/milestone plans that span multiple criteria

**Plans** reference other plans via `depends_on`:
- Lists plans that must complete before this one can start
- Format: `depends_on: ["pln-002-database-setup"]`
- Must follow valid plan ID format: `pln-XXX-slug`
- Creates explicit dependency relationships

**Components** (informal) are referenced in tasks and descriptions:
- Tasks often specify which components they modify
- Test cases can formally reference components via `components` field
- Example in task: "Modify svc-001-auth-service to add OAuth"

**Constitution** principles should guide plan execution:
- Plans must follow principles from constitutions with `applies_to: ["plans"]` or `applies_to: ["all"]`

### Sub-Entity References

Plans contain sub-entities that reference other specs:

**Tasks** informally reference components:
- Task descriptions mention which components are modified
- Example: `description: "Update svc-001-auth-service endpoint"`

**Test Cases** formally reference components and flows:
- `components: ["svc-001-auth-service", "app-001-web-app"]`
- `related_flows: ["flow-001", "flow-002"]`

## Best Practices

1. **Create Last** - Plans should be created after requirements and components are defined
2. **One Plan Per Criterion** - Each plan implements one acceptance criterion for clear traceability
3. **Link to Criterion** - Always set `criteria_id` unless it's an orchestration/milestone plan
4. **Brief Description** - Keep description concise (1-3 sentences, 20-500 chars); use tasks, flows, and test_cases for details
5. **Explicit Dependencies** - List prerequisite plans in `depends_on` to enable proper sequencing
6. **Granular Tasks** - Keep tasks to 0.5-3 days each for manageable execution
7. **Add 20% Buffer** - Include estimation buffer in task effort to account for unknowns
8. **Iterative Task Building** - Start with core tasks, then add file changes and details
9. **Trace to Components** - Reference which components are modified in task descriptions
10. **Optional Fields Wisely** - Only populate flows, test_cases, api_contracts, data_models, and scope when they add value
11. **Comprehensive Testing** - Include test cases for complex scenarios; aim for 90%+ coverage target
12. **Avoid Circular Dependencies** - Keep `depends_on` graph acyclic
13. **Update Status** - Mark tasks as completed and verified as work progresses
14. **Measurable Acceptance** - Define specific, testable acceptance criteria for the plan
