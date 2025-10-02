# Components Specification Guide

## Overview

Components are the **second** specifications you should create, after Requirements. They define the architectural building blocks, modules, and system elements needed to fulfill requirements. Components are **independent** but must be created **before** Plans.

## Purpose

- Define the **architectural structure** of the solution
- Identify reusable building blocks
- Establish component boundaries and responsibilities
- Define interfaces and interactions between components
- Bridge the gap between "what" (Requirements) and "how" (Plans)

## Step-by-Step Reasoning Process

### Step 1: Analyze Requirements for Architectural Needs

**Questions to ask:**
- What requirements have we defined?
- What major functional areas exist?
- What are the logical groupings of functionality?
- What are the system boundaries?

**Output:** Initial list of potential component areas

**Example:**
From requirements about project progress tracking:
- User Interface components
- Data management components
- Calculation/business logic components
- Integration components

---

### Step 2: Identify Component Boundaries

**Questions to ask:**
- What is the single responsibility of each component?
- Where are the natural separation points?
- What needs to be independently deployable/testable?
- What needs to be reusable across different contexts?

**Output:** Clear component boundaries with defined responsibilities

**Example:**
```
Instead of: "Project Management System"
Break into:
- ProjectDashboardUI (presents project data)
- ProjectProgressCalculator (computes progress metrics)
- TaskStateManager (manages task lifecycle)
- DataAccessLayer (handles persistence)
```

---

### Step 3: Define Component Responsibilities

**Questions to ask:**
- What is this component's primary purpose?
- What operations must it perform?
- What data does it own?
- What decisions does it make?
- What does it NOT do? (important!)

**Output:** Clear responsibility statement for each component

**Example:**
```
Component: ProjectProgressCalculator

Responsibilities:
✅ Calculate completion percentage from task states
✅ Compute progress metrics (velocity, burndown)
✅ Handle edge cases (empty projects, all tasks blocked)
✅ Validate task data before calculation

NOT Responsible For:
❌ Storing task data (DataAccessLayer's job)
❌ Displaying progress (ProjectDashboardUI's job)
❌ Changing task states (TaskStateManager's job)
```

---

### Step 4: Define Component Interfaces

**Questions to ask:**
- What inputs does this component need?
- What outputs does it produce?
- What operations does it expose?
- What contracts/protocols must it honor?
- What error conditions can occur?

**Output:** Formal interface definitions

**Example:**
```typescript
interface IProjectProgressCalculator {
  // Calculate progress for a single project
  calculateProgress(projectId: string): Promise<ProgressMetrics>;

  // Calculate progress for multiple projects
  calculateBatchProgress(projectIds: string[]): Promise<Map<string, ProgressMetrics>>;

  // Subscribe to real-time progress updates
  subscribeToProgressUpdates(projectId: string, callback: ProgressCallback): Subscription;
}

interface ProgressMetrics {
  completionPercentage: number;  // 0-100
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  lastUpdated: Date;
}
```

---

### Step 5: Map Component Dependencies

**Questions to ask:**
- What other components does this one depend on?
- What data flows between components?
- Are there circular dependencies? (should eliminate)
- What external systems/APIs are needed?
- What shared resources exist?

**Output:** Dependency graph and data flow

**Example:**
```
ProjectDashboardUI
  ↓ depends on
ProjectProgressCalculator
  ↓ depends on
TaskStateManager
  ↓ depends on
DataAccessLayer
  ↓ depends on
[PostgreSQL Database]

Data Flow:
User Action → UI → Calculator requests data → TaskStateManager → DataAccessLayer
Result: Calculator ← receives tasks ← computes progress → returns to UI → displays
```

---

### Step 6: Define Component State and Data Ownership

**Questions to ask:**
- What data does this component own?
- Is the component stateful or stateless?
- What is the lifecycle of the data?
- Who has authority to modify this data?
- What caching strategy applies?

**Output:** Clear data ownership and state management rules

**Example:**
```
Component: TaskStateManager

Owned Data:
- Task states (pending, in_progress, completed, blocked)
- Task transition rules
- Task lifecycle metadata

State Management:
- Stateful: maintains in-memory cache of active tasks
- Cache TTL: 5 minutes
- Invalidation: on task update events
- Authority: Only this component can modify task states

Persistence:
- Writes through to DataAccessLayer
- Reads from cache-first, database fallback
```

---

### Step 7: Identify Component Patterns and Types

**Questions to ask:**
- What architectural pattern does this follow?
- Is this a service, repository, controller, utility?
- Is this component synchronous or asynchronous?
- Does it need to be horizontally scalable?
- What design patterns apply?

**Output:** Component classification and pattern identification

**Example:**
```
Component: ProjectProgressCalculator
Pattern: Service Layer (Business Logic)
Type: Stateless service
Concurrency: Thread-safe, supports parallel execution
Scalability: Horizontally scalable
Design Patterns:
- Strategy Pattern (different calculation strategies)
- Observer Pattern (progress update notifications)
```

---

### Step 8: Define Component Quality Attributes

**Questions to ask:**
- What are the performance requirements?
- What are the reliability requirements?
- What are the security requirements?
- What are the testability requirements?
- What are the maintainability requirements?

**Output:** Quality attribute requirements per component

**Example:**
```
Component: ProjectProgressCalculator

Performance:
- Response time: < 100ms for single project
- Throughput: > 1000 calculations/second
- Batch operations: < 500ms for 50 projects

Reliability:
- Graceful degradation on data errors
- No data loss on calculation failures
- Circuit breaker for downstream dependencies

Security:
- Input validation on all parameters
- Authorization check before calculations
- No sensitive data in logs

Testability:
- 90%+ code coverage
- All dependencies injectable
- Integration test support
```

---

### Step 9: Trace to Requirements

**Questions to ask:**
- Which requirements does this component satisfy?
- Are all requirements covered by components?
- Are there any orphaned components? (remove them)
- Is there redundancy? (consolidate if appropriate)

**Output:** Traceability matrix

**Example:**
```
Component: ProjectProgressCalculator
Satisfies:
- REQ-001: Real-time progress calculation
- REQ-003: Sub-second progress updates
- NFR-001: Support 10,000 concurrent users
- NFR-002: 99.9% uptime

Requirements Not Satisfied:
- REQ-002: Task assignment (TaskStateManager)
- REQ-004: Export reports (ReportGenerator)
```

---

### Step 10: Validate and Refine

**Questions to ask:**
- Is each component cohesive (single responsibility)?
- Are components loosely coupled?
- Are interfaces clear and minimal?
- Is the architecture scalable and maintainable?
- Have we avoided over-engineering?

**Output:** Validated, refined component specifications

**Checklist:**
- [ ] Each component has a unique ID
- [ ] Each component has clear responsibilities
- [ ] All interfaces are documented
- [ ] Dependencies are explicit and justified
- [ ] Traceability to requirements exists
- [ ] No circular dependencies
- [ ] Quality attributes defined

---

## Component Specification Schema

Based on the system's Zod schema, components have three types: **app**, **service**, and **library**.

### Core Fields (from BaseSchema)
- **type**: One of `"app"`, `"service"`, or `"library"`
- **number**: Unique sequential number (e.g., 1, 2, 3)
- **slug**: URL-friendly identifier (lowercase letters, numbers, single dashes)
- **name**: Display name of the component
- **description**: Detailed description of the component's purpose
- **created_at**: ISO 8601 datetime timestamp
- **updated_at**: ISO 8601 datetime timestamp

### Common Component Fields
- **folder**: Relative path from repository root (default: `"."`)
- **depends_on**: Array of component IDs this component relies on (format: `app-XXX-slug`, `svc-XXX-slug`, etc.)
- **external_dependencies**: Array of third-party services or libraries
- **capabilities**: Array of key functionalities provided
- **constraints**: Array of technical and business constraints
- **tech_stack**: Array of technologies and frameworks used

### Type-Specific Fields

#### App Components (`type: "app"`)
- **deployment_targets**: Array of `"ios"`, `"android"`, `"web"`, `"desktop"`, or `"api"`
- **environments**: Array of `"development"`, `"staging"`, `"production"` (default: all three)

#### Service Components (`type: "service"`)
- **dev_port**: Local development port number (1-65535, optional)

#### Library Components (`type: "library"`)
- **package_name**: NPM/package manager name (optional)

### Computed Field
- **id**: Auto-generated based on type:
  - Apps: `app-XXX-slug`
  - Services: `svc-XXX-slug`
  - Libraries: `lib-XXX-slug`

---

## Best Practices

### DO:
✅ Keep components focused (single responsibility)
✅ Define clear, minimal interfaces
✅ Make dependencies explicit
✅ Document data ownership clearly
✅ Trace every component to requirements
✅ Consider testability from the start
✅ Think about scalability and deployment
✅ Use standard architectural patterns

### DON'T:
❌ Create "God" components with too many responsibilities
❌ Allow circular dependencies
❌ Mix concerns (e.g., UI logic in data layer)
❌ Create orphaned components (not tied to requirements)
❌ Over-engineer (YAGNI principle)
❌ Tightly couple components
❌ Hide dependencies (be explicit)

---

## Common Pitfalls

1. **Too Granular**: Creating components for every tiny function
   - BAD: `AddTaskComponent`, `DeleteTaskComponent`, `UpdateTaskComponent`
   - GOOD: `TaskManager` with all CRUD operations

2. **Too Coarse**: Creating monolithic components
   - BAD: `ProjectManagementSystem` that does everything
   - GOOD: Separate UI, business logic, data access components

3. **Unclear Boundaries**: Components with overlapping responsibilities
   - Symptom: Confusion about where to add new features
   - Fix: Clearly document what each component does NOT do

4. **Missing Interfaces**: Assuming how components will communicate
   - Fix: Define explicit interfaces with contracts

5. **Ignoring Non-Functional Requirements**: Focusing only on functionality
   - Fix: Include performance, security, scalability in component design

---

## Relationship to Other Specifications

```
Requirements (FIRST)
    ↓ informs architecture
Components (SECOND - independent)
    ↓ both used by
Plans (THIRD)
```

**Requirements answer:** What needs to be achieved?

**Components answer:** What are the building blocks?

**Plans answer:** How do we build and assemble the components?

---

## Example: Complete Service Component Specification

```json
{
  "type": "service",
  "number": 3,
  "slug": "progress-calculator",
  "name": "Project Progress Calculator Service",
  "description": "A stateless service responsible for calculating and providing project completion metrics based on task states. Supports both single and batch calculations with real-time update capabilities. Handles edge cases (empty projects, all blocked tasks) and validates task data integrity. Does NOT store or persist data (DataAccessLayer's responsibility) or manage task transitions (TaskStateManager's responsibility).",
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-20T16:45:00Z",
  "folder": "services/progress-calculator",
  "dev_port": 3003,
  "depends_on": [
    "svc-004-task-state-manager",
    "svc-006-data-access-layer"
  ],
  "external_dependencies": [
    "Redis (caching)",
    "PostgreSQL (via DataAccessLayer)"
  ],
  "capabilities": [
    "Calculate completion percentage for single projects",
    "Batch calculate progress for multiple projects",
    "Provide real-time progress update subscriptions",
    "Compute velocity and burndown metrics",
    "Validate task data integrity"
  ],
  "constraints": [
    "Must be stateless (no session affinity)",
    "Single calculation must complete < 100ms (p95)",
    "Batch calculation (50 projects) must complete < 500ms (p95)",
    "Must handle 1000+ calculations/second per instance",
    "Must integrate with existing PostgreSQL schema",
    "Results cached in Redis for 30 seconds (managed externally)"
  ],
  "tech_stack": [
    "TypeScript",
    "Node.js 18+",
    "Redis (client)",
    "Jest (testing)"
  ]
}
```

**Key Points:**
- **ID is computed**: `svc-003-progress-calculator` (from type="service" + number=3 + slug)
- **Service-specific field**: `dev_port: 3003` for local development
- **Component dependencies**: References other components by their computed IDs
- **Rich constraints**: Performance, scalability, and technical constraints included