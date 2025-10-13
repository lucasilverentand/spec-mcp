# Choosing Spec Types

**Goal**: Learn which spec types to use for different situations.

## Quick Decision Tree

```
Need to capture business value and stakeholder needs?
  → Business Requirement (BRD)

Need to specify technical approach or constraints?
  → Technical Requirement (PRD)

Need to document an important choice or trade-off?
  → Decision (DEC)

Need to define system architecture or components?
  → Component (CMP)

Need to break work into executable tasks?
  → Plan (PLN)

Need to establish team standards or principles?
  → Constitution (CST)

Need to organize work into a release?
  → Milestone (MLS)
```

## By Situation

### Starting a New Feature

**Minimum:**
1. **BRD** - What users need and why
2. **Plan** - Tasks to implement it

**Recommended:**
1. **BRD** - Business context and value
2. **PRD** - Technical approach
3. **Plan** - Implementation tasks
4. **Decision** - Any significant choices

### Refactoring or Tech Debt

**Minimum:**
1. **Plan** - What needs to be refactored

**Recommended:**
1. **PRD** - Technical motivation and constraints
2. **Decision** - Approach chosen (if alternatives exist)
3. **Plan** - Refactoring tasks

### Documenting Architecture

**Minimum:**
1. **Component** - For each major component

**Recommended:**
1. **Components** - All major pieces
2. **Decisions** - Why this architecture
3. **Constitution** - Architectural principles

### Planning a Release

**Minimum:**
1. **Milestone** - Release container
2. **Plans** - Linked to milestone

**Recommended:**
1. **Milestone** - With target date
2. **BRDs** - Features in release
3. **PRDs** - Technical requirements
4. **Plans** - Implementation work

## Common Combinations

### Feature Development
```
BRD (what/why)
  ↓
PRD (how technically)
  ↓
Decision (significant choices)
  ↓
Plan (implementation tasks)
```

### Bug Fix
```
PRD (technical context)
  ↓
Plan (fix tasks)
```

### New Service/Component
```
Component (architecture)
  ↓
Decisions (technology choices)
  ↓
PRD (technical requirements)
  ↓
Plan (implementation)
```

### Establishing Standards
```
Constitution (principles)
  ↓
Decisions (specific choices that follow principles)
```

## When to Skip Spec Types

### Skip BRD if:
- Internal refactoring with no user impact
- Bug fix with obvious value
- Technical debt everyone agrees on

### Skip PRD if:
- Trivial implementation (< 1 day work)
- No technical decisions to document
- Following established patterns exactly

### Skip Decision if:
- Choice is obvious with no alternatives
- Decision is temporary/experimental
- Covered by existing Constitution

### Skip Plan if:
- Work is < 1 hour
- Single, simple task
- Exploratory spike work

## Anti-Patterns

### ❌ Too Many Specs
Don't create specs for every tiny change. Use judgment.

**Bad**: Separate BRD, PRD, Decision, Plan for changing a button color
**Good**: Just make the change, or at most a simple Plan

### ❌ Wrong Spec Type
Using the wrong type creates confusion.

**Bad**: Putting implementation tasks in a BRD
**Good**: BRD for business need, Plan for tasks

### ❌ Duplicate Information
Don't repeat the same info across specs.

**Bad**: Copy-paste user stories into PRD and Plan
**Good**: Reference the BRD from PRD and Plan

## Project Type Recommendations

### Web Application
- **Start**: Constitution, Components
- **Per Feature**: BRD, PRD, Plan
- **Per Release**: Milestone

### Library/SDK
- **Start**: Constitution, Component
- **Per Feature**: PRD, Plan (skip BRD unless public API)
- **Per Release**: Milestone, Decision (for breaking changes)

### Microservices
- **Start**: Constitution, Components (per service)
- **Per Service**: BRD (capability), PRD, Plan
- **Cross-Service**: Decisions (communication patterns)

### Internal Tool
- **Start**: Component
- **Per Feature**: BRD (if user-facing), PRD, Plan
- **Standards**: Constitution

## Related Guides

- See individual spec type guides for detailed usage
- See [Spec Relationships](spec-mcp://guide/spec-relationships) for how specs connect
- See [Getting Started guides](spec-mcp://guide/getting-started) for project setup
