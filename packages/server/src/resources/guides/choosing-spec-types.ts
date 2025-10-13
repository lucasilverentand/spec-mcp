export const choosingSpecTypesGuide = {
	uri: "spec-mcp://guide/choosing-spec-types",
	name: "Choosing Spec Types Guide",
	description: "Learn which spec types to use for different situations",
	mimeType: "text/markdown",
	content: `# Choosing Spec Types

**Goal**: Learn which spec types to use for different situations.

## Quick Decision Tree

\`\`\`
Business value/stakeholder needs? → BRD
Technical approach/constraints? → PRD
Important choice/trade-off? → Decision
System architecture/components? → Component
Implementation tasks? → Plan
Team standards/principles? → Constitution
Release organization? → Milestone
\`\`\`

## By Situation

### Starting a New Feature

**Minimum:** BRD (what/why) + Plan (tasks)

**Recommended:** BRD → PRD (technical approach) → Plan + Decision (key choices)

### Refactoring or Tech Debt

**Minimum:** Plan (refactoring tasks)

**Recommended:** PRD (technical motivation) → Decision (approach) → Plan

### Documenting Architecture

**Minimum:** Component (per major component)

**Recommended:** Components + Decisions (why this architecture) + Constitution (principles)

### Planning a Release

**Minimum:** Milestone + Plans

**Recommended:** Milestone + BRDs + PRDs + Plans

## Common Combinations

### Feature Development
\`\`\`
BRD (what/why) → PRD (how) → Decision (choices) → Plan (tasks)
\`\`\`

### Bug Fix
\`\`\`
PRD (context) → Plan (fix tasks)
\`\`\`

### New Service/Component
\`\`\`
Component → Decisions → PRD → Plan
\`\`\`

### Establishing Standards
\`\`\`
Constitution → Decisions (specific choices following principles)
\`\`\`

## When to Skip Spec Types

**Skip BRD if:**
- Internal refactoring with no user impact
- Bug fix with obvious value
- Technical debt everyone agrees on

**Skip PRD if:**
- Trivial implementation (< 1 day)
- No technical decisions
- Following established patterns exactly

**Skip Decision if:**
- Choice is obvious with no alternatives
- Decision is temporary/experimental
- Covered by existing Constitution

**Skip Plan if:**
- Work is < 1 hour
- Single, simple task
- Exploratory spike work

## Anti-Patterns

### ❌ Too Many Specs
Don't spec every tiny change. Use judgment.

**Bad**: Separate BRD, PRD, Decision, Plan for button color change
**Good**: Just make the change, or at most a simple Plan

### ❌ Wrong Spec Type
**Bad**: Implementation tasks in a BRD
**Good**: BRD for business need, Plan for tasks

### ❌ Duplicate Information
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

- See [Spec Relationships](spec-mcp://guide/spec-relationships) for how specs connect
- See [Getting Started](spec-mcp://guide/getting-started) for project setup`,
} as const;
