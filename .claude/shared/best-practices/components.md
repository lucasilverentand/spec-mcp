# Component Best Practices

## Core Principles

Define clear boundaries, maintain single responsibility, and document all dependencies.

## ✅ DO

- Define clear boundaries and responsibilities
- Keep components focused (single responsibility)
- Document interfaces explicitly
- Map dependencies (internal and external)
- Define what component does NOT do
- Consider coupling and cohesion
- Specify tech stack and constraints
- Plan for testability
- Document setup and deployment

## ❌ DON'T

- Create "god components" that do everything
- Hide dependencies or implicit coupling
- Ignore non-functional requirements
- Skip interface definitions
- Forget about maintainability
- Over-engineer for unclear future needs
- Create circular dependencies

## Common Anti-Patterns

### Too Many Responsibilities
❌ **Bad:** Component handles auth, data access, UI rendering, validation, caching  
✅ **Good:** Component focuses on single concern (e.g., authentication only)

### High Coupling
❌ **Bad:** Component depends on 10+ other components  
✅ **Good:** Component has 2-5 focused dependencies

### Unclear Interfaces
❌ **Bad:** No API documentation or interface definition  
✅ **Good:** Clear interface definition with types and examples

### Missing Constraints
❌ **Bad:** No performance or security requirements  
✅ **Good:** "Must support 10K concurrent users, OAuth 2.0 required"

### No Traceability
❌ **Bad:** Component not linked to requirements  
✅ **Good:** Component traces to specific requirements

### Circular Dependencies
❌ **Bad:** A → B → C → A  
✅ **Good:** Clear acyclic dependency graph

## Success Patterns

- Research architectural patterns before designing
- Use `analyze` (analysis_type: "dependencies") to check for cycles
- Validate with `guidance` tool (10-step process)
- Keep capabilities list to 3-5 items max
- Document ALL dependencies (internal and external)
