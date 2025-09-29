# Plans Specification Guide

## Overview

Plans are the **third** and final specifications you should create, after Requirements and Components. Plans define the implementation roadmap, breaking down work into executable tasks and establishing the sequence of development activities needed to build the components that satisfy requirements.

## Purpose

- Define **how** the system will be built
- Break down work into actionable tasks
- Establish implementation sequence and dependencies
- Allocate resources and estimate effort
- Create a roadmap for development
- Bridge the gap between design (Components) and execution (Development)

## Step-by-Step Reasoning Process

### Step 1: Review Requirements and Components

**Questions to ask:**
- What requirements must we satisfy?
- What components have been defined?
- How do components relate to requirements?
- What is the scope of this plan?

**Output:** Complete understanding of what needs to be built

**Example:**
```
Requirements to Satisfy:
- REQ-001: Real-time progress tracking
- REQ-003: Sub-second updates
- NFR-001: Support 10k concurrent users

Components to Build:
- COMP-001: ProjectDashboardUI
- COMP-003: ProjectProgressCalculator
- COMP-004: TaskStateManager
- COMP-006: DataAccessLayer
```

---

### Step 2: Identify Major Phases

**Questions to ask:**
- What are the natural stages of development?
- What needs to be built first vs. later?
- What can be developed in parallel?
- What are the major milestones?

**Output:** High-level phase breakdown

**Example:**
```
Phase 1: Foundation (Weeks 1-2)
- Setup infrastructure
- Implement data layer
- Create base component structure

Phase 2: Core Logic (Weeks 3-4)
- Implement business logic components
- Add calculation engine
- Build state management

Phase 3: Integration (Weeks 5-6)
- Connect components
- Add event handling
- Implement real-time updates

Phase 4: UI & Polish (Weeks 7-8)
- Build user interface
- Add visualizations
- Performance optimization

Phase 5: Testing & Deployment (Weeks 9-10)
- Integration testing
- Load testing
- Deployment and monitoring
```

---

### Step 3: Analyze Dependencies and Ordering

**Questions to ask:**
- What must be built before other things?
- What can be built in parallel?
- What are the critical path items?
- What external dependencies exist?
- What risks could block progress?

**Output:** Dependency graph and task ordering

**Example:**
```
Critical Path:
DataAccessLayer → TaskStateManager → ProjectProgressCalculator → ProjectDashboardUI

Parallel Work Possible:
- Authentication setup (independent)
- UI component library setup (independent)
- Documentation (can happen throughout)

Blockers/Risks:
- Database schema approval (needs by Week 1)
- Redis cluster provisioning (needs by Week 3)
- Design mockups (needs by Week 6)
```

---

### Step 4: Break Down Tasks

**Questions to ask:**
- What are the concrete, actionable work items?
- How granular should tasks be? (typically 0.5-3 days each)
- What is the deliverable for each task?
- How will we verify task completion?

**Output:** Detailed task breakdown with clear deliverables

**Example:**
```
Component: COMP-006 (DataAccessLayer)

Tasks:
1. [TASK-001] Design database schema
   - Deliverable: Schema diagram and DDL scripts
   - Effort: 1 day
   - Verification: DBA review approved

2. [TASK-002] Implement base repository pattern
   - Deliverable: BaseRepository class with CRUD operations
   - Effort: 2 days
   - Verification: Unit tests passing (>90% coverage)

3. [TASK-003] Implement ProjectRepository
   - Deliverable: ProjectRepository with all project queries
   - Effort: 1.5 days
   - Verification: Integration tests passing

4. [TASK-004] Implement TaskRepository
   - Deliverable: TaskRepository with task CRUD and state queries
   - Effort: 2 days
   - Verification: Integration tests passing + performance benchmarks met
```

---

### Step 5: Estimate Effort and Resources

**Questions to ask:**
- How long will each task take?
- Who will work on each task?
- What skills are required?
- What is the team's velocity?
- What buffer should we include?

**Output:** Effort estimates and resource allocation

**Example:**
```
Task: TASK-004 (Implement TaskRepository)

Effort Estimate:
- Development: 12 hours (1.5 days)
- Testing: 4 hours (0.5 days)
- Code review: 2 hours
- Total: 18 hours (2.25 days)
- With buffer (20%): 2.7 days → round to 3 days

Resources:
- Primary: Backend Developer (Senior)
- Reviewer: Lead Engineer
- Required Skills: TypeScript, PostgreSQL, Repository Pattern

Dependencies:
- TASK-002 must complete first
- Database schema approved
- Dev environment configured
```

---

### Step 6: Define Acceptance Criteria per Task

**Questions to ask:**
- What does "done" mean for this task?
- What are the quality gates?
- What tests must pass?
- What documentation is required?
- What reviews are needed?

**Output:** Clear definition of done for each task

**Example:**
```
Task: TASK-004 (Implement TaskRepository)

Acceptance Criteria:
✅ All CRUD operations implemented (Create, Read, Update, Delete)
✅ Query methods for filtering by state, project, assignee
✅ Batch operations for bulk updates
✅ Unit tests: 95%+ coverage
✅ Integration tests: all scenarios passing
✅ Performance: queries < 50ms (p95)
✅ Code review approved by Lead Engineer
✅ Documentation: API docs and usage examples
✅ No linter errors or warnings
✅ Merged to main branch
```

---

### Step 7: Identify Milestones and Deliverables

**Questions to ask:**
- What are the major checkpoints?
- What can be demonstrated to stakeholders?
- What are the release points?
- What dependencies do external teams have?

**Output:** Milestone definitions with criteria

**Example:**
```
Milestone 1: Foundation Complete (End of Week 2)
Deliverables:
- Database schema deployed to dev environment
- DataAccessLayer fully implemented and tested
- Base infrastructure (Redis, EventBus) configured
- CI/CD pipeline operational
Acceptance:
- All foundation components deployed
- Integration tests passing
- Performance benchmarks met
- Demo to stakeholders

Milestone 2: Core Logic Complete (End of Week 4)
Deliverables:
- TaskStateManager implemented
- ProjectProgressCalculator implemented
- Real-time event system functional
- All business logic tested
Acceptance:
- End-to-end calculation working
- Real-time updates functional
- Load tests passing (1000 concurrent users)
- API documentation complete
```

---

### Step 8: Plan Testing Strategy

**Questions to ask:**
- What types of testing are needed?
- When will testing occur?
- What are the test coverage goals?
- What performance benchmarks must be met?
- What is the test data strategy?

**Output:** Comprehensive testing plan

**Example:**
```
Testing Strategy:

Unit Testing:
- When: Continuous (with each task)
- Coverage: 90%+ per component
- Tools: Jest, Testing Library
- Responsibility: Component developer

Integration Testing:
- When: After component completion
- Scope: Component interactions
- Tools: Supertest, TestContainers
- Responsibility: QA + Developer

Performance Testing:
- When: End of Phase 3 (Integration)
- Scope: Load, stress, endurance
- Targets: 10k concurrent users, <500ms response
- Tools: k6, Grafana
- Responsibility: Performance engineer

End-to-End Testing:
- When: Phase 4 (UI complete)
- Scope: Full user workflows
- Tools: Playwright, Cypress
- Responsibility: QA team

Security Testing:
- When: Before production deployment
- Scope: OWASP Top 10, penetration testing
- Tools: OWASP ZAP, manual review
- Responsibility: Security team
```

---

### Step 9: Plan Risk Mitigation

**Questions to ask:**
- What could go wrong?
- What are the technical risks?
- What are the resource risks?
- What are the external dependencies?
- What are the contingency plans?

**Output:** Risk register with mitigation strategies

**Example:**
```
Risk Register:

RISK-001: Database performance issues
- Probability: Medium
- Impact: High
- Mitigation:
  - Conduct early load testing (Week 2)
  - Design with caching from start
  - Have DBA review schema before implementation
  - Budget for database scaling if needed
- Contingency: Switch to read replicas if needed

RISK-002: Third-party API rate limits
- Probability: Low
- Impact: Medium
- Mitigation:
  - Implement request queuing
  - Add circuit breakers
  - Design for graceful degradation
- Contingency: Implement local caching layer

RISK-003: Key developer unavailable
- Probability: Medium
- Impact: High
- Mitigation:
  - Cross-train team members
  - Document architecture decisions
  - Pair programming on critical components
- Contingency: Reassign tasks, extend timeline if needed
```

---

### Step 10: Create Timeline and Schedule

**Questions to ask:**
- When does each phase start and end?
- What is the critical path?
- Where is there slack time?
- When are the milestones?
- What is the final delivery date?

**Output:** Detailed project timeline

**Example:**
```
Project Timeline: 10 Weeks

Week 1-2: Phase 1 (Foundation)
├─ Week 1
│  ├─ Day 1-2: TASK-001 (Database schema)
│  ├─ Day 3-5: TASK-002 (Base repository)
│  └─ Milestone: Schema approved
├─ Week 2
│  ├─ Day 1-2: TASK-003 (ProjectRepository)
│  ├─ Day 3-5: TASK-004 (TaskRepository)
│  └─ Milestone 1: Foundation Complete

Week 3-4: Phase 2 (Core Logic)
├─ Week 3
│  ├─ Day 1-3: TASK-005 (TaskStateManager)
│  └─ Day 4-5: TASK-006 (EventBus integration)
├─ Week 4
│  ├─ Day 1-3: TASK-007 (ProjectProgressCalculator)
│  └─ Day 4-5: TASK-008 (Real-time subscriptions)
│  └─ Milestone 2: Core Logic Complete

Week 5-6: Phase 3 (Integration)
├─ Integration work and testing
└─ Milestone 3: System Integrated

Week 7-8: Phase 4 (UI & Polish)
├─ UI implementation
└─ Milestone 4: Feature Complete

Week 9-10: Phase 5 (Testing & Deployment)
├─ Final testing and fixes
└─ Milestone 5: Production Ready

Critical Path: TASK-001 → TASK-002 → TASK-004 → TASK-005 → TASK-007 → UI → Deploy
```

---

### Step 11: Trace to Requirements and Components

**Questions to ask:**
- Does this plan build all required components?
- Does this plan satisfy all requirements?
- Are there any orphaned tasks?
- Are there gaps in coverage?

**Output:** Traceability matrix

**Example:**
```
Traceability Matrix:

REQ-001 (Real-time progress tracking)
  → COMP-003 (ProjectProgressCalculator)
    → TASK-007 (Implement calculator)
    → TASK-008 (Add real-time subscriptions)
  → COMP-001 (ProjectDashboardUI)
    → TASK-015 (Build dashboard)
    → TASK-016 (Add progress visualization)

REQ-003 (Sub-second updates)
  → COMP-009 (EventBus)
    → TASK-006 (EventBus integration)
  → COMP-003 (ProjectProgressCalculator)
    → TASK-008 (Real-time subscriptions)

NFR-001 (10k concurrent users)
  → Performance Testing Phase
    → TASK-022 (Load testing)
    → TASK-023 (Performance optimization)

Coverage Check:
✅ All requirements mapped to tasks
✅ All components have implementation tasks
✅ No orphaned tasks
```

---

### Step 12: Validate and Refine

**Questions to ask:**
- Is the plan realistic and achievable?
- Are estimates reasonable?
- Have all stakeholders reviewed?
- Are dependencies clear?
- Is there adequate buffer for unknowns?

**Output:** Validated, approved plan

**Checklist:**
- [ ] All tasks have clear deliverables
- [ ] All tasks have effort estimates
- [ ] All dependencies identified
- [ ] All milestones defined
- [ ] Testing strategy complete
- [ ] Risk mitigation planned
- [ ] Resource allocation confirmed
- [ ] Stakeholder approval received
- [ ] Traceability to requirements complete
- [ ] Buffer included for uncertainties (typically 20%)

---

## Plan Specification Schema

Based on the system's Zod schema, each plan follows this structure:

### Core Fields (from BaseSchema)
- **type**: `"plan"` (literal)
- **number**: Unique sequential number (e.g., 1, 2, 3)
- **slug**: URL-friendly identifier (lowercase letters, numbers, single dashes)
- **name**: Display name of the plan
- **description**: Detailed description of what the plan will deliver
- **created_at**: ISO 8601 datetime timestamp
- **updated_at**: ISO 8601 datetime timestamp

### Plan-Specific Fields
- **priority**: One of `"critical"`, `"high"`, `"medium"`, `"low"` (default: `"medium"`)
  - Critical plans must be completed before high, high before medium, medium before low
- **acceptance_criteria**: String describing conditions for plan completion
- **scope**: Optional Scope object with:
  - **in_scope**: Array of scope items (description, priority, rationale)
  - **out_of_scope**: Array of scope items
  - **boundaries**: Array of boundary conditions
  - **assumptions**: Array of assumptions
  - **constraints**: Array of constraints
  - **notes**: Array of additional notes
- **depends_on**: Array of plan IDs this plan relies on (format: `pln-XXX-slug`)
- **tasks**: Array of Task objects (see Task schema below)
- **flows**: Array of Flow objects (user flows, system flows, data flows)
- **test_cases**: Array of TestCase objects for validation
- **api_contracts**: Array of API contract specifications
- **data_models**: Array of data models/schemas defined or used
- **references**: Array of related references (documentation, designs, etc.)

### State Management Fields
- **completed**: Boolean (default: `false`)
- **completed_at**: ISO 8601 datetime (optional)
- **approved**: Boolean (default: `false`)

### Computed Field
- **id**: Auto-generated as `pln-XXX-slug` (e.g., `pln-001-dashboard-implementation`)

### Task Schema (within tasks array)
Each task has:
- **id**: Format `task-XXX` (e.g., `task-001`)
- **priority**: One of `"critical"`, `"high"`, `"normal"`, `"low"`, `"optional"` (default: `"normal"`)
- **depends_on**: Array of task IDs this task depends on
- **description**: Detailed explanation of how to complete the task
- **considerations**: Array of things to consider
- **references**: Array of external references
- **files**: Array of file actions:
  - **path**: Relative file path
  - **action**: One of `"create"`, `"modify"`, `"delete"`
  - **action_description**: What changes will be made
  - **applied**: Boolean tracking if action is done
- **completed**: Boolean (default: `false`)
- **completed_at**: ISO 8601 datetime (optional)
- **verified**: Boolean (default: `false`)
- **verified_at**: ISO 8601 datetime (optional)
- **notes**: Array of execution notes

---

## Best Practices

### DO:
✅ Break work into small, manageable tasks (0.5-3 days)
✅ Define clear acceptance criteria for every task
✅ Identify and document all dependencies
✅ Include buffer time (typically 20%)
✅ Plan testing throughout, not just at the end
✅ Trace all tasks back to requirements/components
✅ Identify critical path items
✅ Plan for risks and have contingencies
✅ Get stakeholder buy-in early
✅ Update the plan as you learn

### DON'T:
❌ Create overly optimistic estimates
❌ Skip dependency analysis
❌ Plan testing only at the end
❌ Create tasks that are too large (>3 days)
❌ Ignore risks or assume everything will go smoothly
❌ Create orphaned tasks (not tied to requirements)
❌ Plan in too much detail too far out (rolling wave planning is OK)
❌ Forget to include documentation and deployment tasks

---

## Common Pitfalls

1. **Waterfall Thinking**: Planning everything upfront in perfect detail
   - Fix: Use rolling wave planning - detail near-term, high-level for future

2. **Ignoring Dependencies**: Starting tasks before prerequisites are done
   - Fix: Create explicit dependency graph, validate before starting

3. **No Buffer**: Planning with zero slack time
   - Fix: Add 20% buffer minimum, more for high-uncertainty tasks

4. **Forgetting Non-Coding Tasks**: Only planning implementation
   - Fix: Include testing, documentation, deployment, reviews, meetings

5. **Unclear "Done"**: Vague task completion criteria
   - Fix: Define specific, measurable acceptance criteria for every task

6. **Resource Conflicts**: Assuming people are 100% available
   - Fix: Account for meetings, holidays, other work (typically 60-70% utilization)

7. **No Risk Planning**: Assuming everything will go perfectly
   - Fix: Identify risks early, plan mitigation, have contingencies

---

## Relationship to Other Specifications

```
Requirements (FIRST)
    ↓ defines what to build
Components (SECOND)
    ↓ defines building blocks
Plans (THIRD)
    ↓ defines how and when
Implementation (FOURTH)
```

**Requirements answer:** What needs to be achieved?

**Components answer:** What are the building blocks?

**Plans answer:** How do we build it and in what order?

**Implementation delivers:** The actual working system

---

## Example: Complete Plan Specification (Abbreviated)

Given the extensive schema, here's an abbreviated but complete example showing the key structure:

```json
{
  "type": "plan",
  "number": 1,
  "slug": "progress-tracking-implementation",
  "name": "Project Progress Tracking Implementation",
  "description": "Implement real-time project progress tracking feature, including calculation engine, data layer, event system, and user interface. Delivers REQ-001, REQ-003, and related requirements within 10-week timeline.",
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-22T09:15:00Z",
  "priority": "critical",
  "acceptance_criteria": "All requirements satisfied (REQ-001, REQ-003), all components deployed to production, performance targets met (10k concurrent users, <500ms response time), 95%+ test coverage, no critical bugs in first 2 weeks post-launch.",
  "scope": {
    "in_scope": [
      {
        "description": "Real-time progress calculation for projects",
        "priority": "critical",
        "rationale": "Core feature requirement"
      },
      {
        "description": "Dashboard UI with progress visualization",
        "priority": "high"
      }
    ],
    "out_of_scope": [
      {
        "description": "Historical progress analytics",
        "rationale": "Deferred to Phase 2"
      }
    ],
    "boundaries": [
      "System handles up to 10,000 concurrent users",
      "Response time < 500ms for 95% of requests"
    ],
    "assumptions": [
      "PostgreSQL database available and properly sized",
      "Redis cluster provisioned by infrastructure team"
    ],
    "constraints": [
      "Must complete within 10-week timeline",
      "Must use existing tech stack (TypeScript, React, PostgreSQL)"
    ],
    "notes": []
  },
  "depends_on": [],
  "tasks": [
    {
      "id": "task-001",
      "priority": "critical",
      "depends_on": [],
      "description": "Design and implement PostgreSQL database schema including all entities (projects, tasks, users, states), relationships, and indexes optimized for performance with 10k projects and 100k tasks.",
      "considerations": [
        "Ensure proper indexing for query performance",
        "Foreign key constraints for data integrity",
        "Consider partitioning strategy for large datasets"
      ],
      "references": [],
      "files": [
        {
          "path": "db/schema.sql",
          "action": "create",
          "action_description": "Create DDL for all tables, indexes, and constraints",
          "applied": false
        },
        {
          "path": "db/migrations/001_initial_schema.ts",
          "action": "create",
          "action_description": "Create migration script",
          "applied": false
        }
      ],
      "completed": false,
      "verified": false,
      "notes": []
    },
    {
      "id": "task-002",
      "priority": "high",
      "depends_on": ["task-001"],
      "description": "Implement progress calculator service with single and batch calculation capabilities, real-time subscriptions, and performance optimization.",
      "considerations": [
        "Handle edge cases (empty projects, all blocked tasks)",
        "Implement caching strategy for frequently accessed data",
        "Ensure stateless design for horizontal scaling"
      ],
      "references": [],
      "files": [
        {
          "path": "services/progress-calculator/src/calculator.ts",
          "action": "create",
          "action_description": "Implement core calculation logic",
          "applied": false
        }
      ],
      "completed": false,
      "verified": false,
      "notes": []
    }
  ],
  "flows": [
    {
      "id": "flow-001",
      "type": "user",
      "name": "View Project Progress",
      "description": "User navigates to dashboard and views real-time project progress",
      "steps": [
        {
          "id": "step-001",
          "name": "User navigates to dashboard",
          "description": "User clicks on Projects menu item",
          "next_steps": ["step-002"]
        },
        {
          "id": "step-002",
          "name": "Dashboard loads project list",
          "description": "System fetches and displays all projects with progress",
          "next_steps": ["step-003"]
        },
        {
          "id": "step-003",
          "name": "Real-time updates activated",
          "description": "WebSocket connection established for live updates",
          "next_steps": []
        }
      ]
    }
  ],
  "test_cases": [
    {
      "id": "tc-001",
      "name": "Progress Calculation Accuracy",
      "description": "Verify progress percentage is calculated correctly for various task distributions",
      "steps": [
        "Create project with 10 tasks",
        "Mark 5 tasks as completed",
        "Navigate to dashboard"
      ],
      "expected_result": "Progress shows 50% with visual indicator",
      "implemented": false,
      "passing": false,
      "components": ["svc-003-progress-calculator"],
      "related_flows": ["flow-001"]
    }
  ],
  "api_contracts": [
    {
      "id": "api-001",
      "name": "Progress API",
      "description": "REST API for retrieving project progress metrics",
      "contract_type": "rest",
      "specification": "{\n  \"openapi\": \"3.0.0\",\n  \"paths\": {\n    \"/projects/{id}/progress\": {\n      \"get\": {\n        \"summary\": \"Get project progress\",\n        \"parameters\": [{\"name\": \"id\", \"in\": \"path\", \"required\": true}],\n        \"responses\": {\"200\": {\"description\": \"Progress metrics\"}}\n      }\n    }\n  }\n}",
      "dependencies": [],
      "examples": [
        {
          "name": "Get single project progress",
          "description": "Retrieve progress for project ID 123",
          "code": "GET /api/projects/123/progress",
          "language": "http"
        }
      ]
    }
  ],
  "data_models": [
    {
      "id": "dm-001",
      "name": "Project",
      "description": "Core project entity with metadata and relationships",
      "model_type": "database",
      "format": "sql",
      "schema": "CREATE TABLE projects (id UUID PRIMARY KEY, name VARCHAR(255) NOT NULL, created_at TIMESTAMP, updated_at TIMESTAMP);",
      "version": "1.0.0",
      "fields": [
        {
          "name": "id",
          "type": "UUID",
          "description": "Unique identifier",
          "required": true,
          "constraints": ["PRIMARY KEY"]
        },
        {
          "name": "name",
          "type": "VARCHAR(255)",
          "description": "Project name",
          "required": true,
          "constraints": ["NOT NULL"]
        }
      ],
      "relationships": [
        {
          "name": "tasks",
          "target_model": "Task",
          "relationship_type": "one-to-many",
          "description": "A project has many tasks"
        }
      ],
      "constraints": [],
      "indexes": ["CREATE INDEX idx_projects_name ON projects(name)"],
      "validations": [],
      "examples": [],
      "migrations": [],
      "metadata": {}
    }
  ],
  "references": [],
  "completed": false,
  "approved": false
}
```

**Key Points:**
- **ID is computed**: `pln-001-progress-tracking-implementation` (from type + number + slug)
- **Rich scope definition**: Includes in_scope, out_of_scope, boundaries, assumptions, constraints
- **Detailed tasks**: Each task has file actions, dependencies, considerations, and tracking fields
- **Comprehensive planning**: Includes flows, test cases, API contracts, and data models
- **State tracking**: completed, completed_at, approved fields for progress management
- **Priority-based**: Critical priority ensures this plan is executed before lower priority plans

---

## Appendix

### Glossary
- **p95:** 95th percentile - 95% of requests faster than this value
- **CRUD:** Create, Read, Update, Delete operations
- **DDL:** Data Definition Language (database schema)
- **UAT:** User Acceptance Testing
- **E2E:** End-to-End
- **DBA:** Database Administrator
- **ADR:** Architecture Decision Record

### Related Documents
- Architecture Design Document: `/docs/architecture.md`
- API Specification: `/docs/api-spec.yaml`
- Database Schema: `/docs/database-schema.md`
- UI Design Mockups: `/designs/project-progress/`

### Change Log
| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-01-15 | 1.0 | Initial plan | Jane Doe |
```