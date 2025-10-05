# Getting Started with Spec-Driven Development

## Overview

Spec MCP enables a structured approach to software development where you define **what** to build (requirements), **how** it's structured (components), and **how** to implement it (plans) before writing code.

## Quick Start

### 1. Initialize Your Specs Directory

```bash
mkdir -p specs/{requirements,plans,components,constitutions,decisions}
```

### 2. Create Your First Requirement

Ask your AI assistant: "Create a requirement for [feature name]"

The guided Q&A flow will:
1. Search for similar specs (avoid duplicates)
2. Review project constitutions (align with principles)
3. Define the requirement (name, description, priority)
4. Establish acceptance criteria (measurable success conditions)

### 3. Create a Plan

Once you have a requirement with criteria, create an implementation plan:

"Create a plan for requirement req-001-[slug] criterion crit-001"

Plans break down work into:
- **Tasks**: Executable steps with file changes
- **Test Cases**: Validation scenarios
- **Flows**: User/system interactions
- **API Contracts**: Endpoint specifications
- **Data Models**: Schema definitions

### 4. Find What to Work On

```
query({ next_task: true })
```

This returns the highest priority unblocked task across all plans.

### 5. Implement and Track Progress

As you complete tasks, update the plan:

```
update_spec({
  id: "pln-001-implementation",
  updates: {
    tasks: [{ id: "task-001", completed: true, verified: true }]
  }
})
```

## Workflow Summary

1. **Plan**: Create requirements with acceptance criteria
2. **Design**: Create components to model your architecture
3. **Implement**: Create plans linked to requirement criteria
4. **Execute**: Work on tasks, mark them complete
5. **Validate**: Run validation to check system health

## Key Concepts

### Spec Types

- **Requirement**: What needs to be built (problem-focused, implementation-agnostic)
- **Component**: System architecture (apps, services, libraries)
- **Plan**: Implementation roadmap (tasks, test cases, flows, APIs, data models)
- **Constitution**: Project principles and guidelines
- **Decision**: Architectural decisions with rationale

### Linking Specs

- Plans link to requirements via `criteria_id` (format: `req-XXX-slug/crit-XXX`)
- Plans depend on other plans via `depends_on` (format: `["pln-XXX-slug"]`)
- Components reference each other via `depends_on`

### Priority Levels

**Requirements**: `critical` | `required` | `ideal` | `optional`
**Plans**: `critical` | `high` | `medium` | `low`

## Next Steps

- Read [Planning Workflow](spec-mcp://guide/planning-workflow) for detailed feature planning
- Read [Implementation Workflow](spec-mcp://guide/implementation-workflow) for development process
- Read [Best Practices](spec-mcp://guide/best-practices) for common patterns
- Read [Query Guide](spec-mcp://guide/query-guide) for advanced querying
