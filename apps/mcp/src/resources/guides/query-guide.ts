export const queryGuide = {
	uri: "spec-mcp://guide/query-guide",
	name: "Query Guide",
	description:
		"Query, filter, and analyze specs to find information and track progress",
	mimeType: "text/markdown",
	content: `# Query Guide

**Goal**: Learn how to query, filter, and analyze specs to find information and track progress.

## Overview

The \`query_specs\` tool provides powerful filtering and searching:

\`\`\`typescript
query_specs({
  objects: ["plan", "task"],
  priority: ["high", "critical"],
  status: ["pending", "in-progress"],
  orderBy: "next-to-do"
})
\`\`\`

## Basic Queries

### List All Specs

\`\`\`
Show me all plans
Show me all BRDs
Show me all specs
\`\`\`

### Get Specific Spec

\`\`\`
Show me pln-001
Show me brd-002-user-auth
Show me pln-001 with all related specs
\`\`\`

## Filtering

### By Object Type

\`\`\`typescript
// Single type
query_specs({
  objects: ["plan"]
})

// Multiple types
query_specs({
  objects: ["plan", "business-requirement"]
})

// Sub-items
query_specs({
  objects: ["task", "test-case", "criterion"]
})
\`\`\`

### By Status

\`\`\`typescript
// Completion status
query_specs({
  completed: false  // Incomplete only
})

// Task status
query_specs({
  objects: ["task"],
  status: ["pending", "in-progress"]
})
\`\`\`

**Status values:**
- \`not-started\`: Not begun
- \`in-progress\`: Currently working
- \`completed\`: Finished
- \`verified\`: Tested and confirmed

### By Priority

\`\`\`typescript
query_specs({
  priority: ["critical", "high"]
})
\`\`\`

**Priority levels:**
- \`critical\`: Blocks everything
- \`high\`: Important
- \`medium\`: Standard (default)
- \`low\`: Can defer
- \`nice-to-have\`: Optional

### By Milestone

\`\`\`typescript
query_specs({
  milestone: "mls-001-v2-launch"
})
\`\`\`

### By ID

\`\`\`typescript
// Single
query_specs({
  id: "pln-001-user-auth"
})

// Multiple
query_specs({
  id: ["pln-001", "pln-002", "brd-001"]
})
\`\`\`

### By Draft Status

\`\`\`typescript
// Only drafts
query_specs({
  draft: true
})

// Only finalized
query_specs({
  draft: false
})
\`\`\`

## Sorting

### Next-To-Do (Priority-Based)

\`\`\`typescript
query_specs({
  orderBy: "next-to-do",
  direction: "asc"
})
\`\`\`

Returns work ordered by priority, then created date.
**Best for:** "What should I work on next?"

### By Creation Date

\`\`\`typescript
query_specs({
  orderBy: "created",
  direction: "desc"  // Newest first
})
\`\`\`

**Best for:** "What was added recently?"

### By Update Date

\`\`\`typescript
query_specs({
  orderBy: "updated",
  direction: "desc"
})
\`\`\`

**Best for:** "What changed recently?"

## Common Query Patterns

### Work Planning

**What can I start now?**
\`\`\`typescript
query_specs({
  objects: ["task"],
  status: ["pending"],
  priority: ["critical", "high"],
  orderBy: "next-to-do"
})
\`\`\`

**What's in progress?**
\`\`\`typescript
query_specs({
  status: ["in-progress"]
})
\`\`\`

### Progress Tracking

**Completion rate:**
\`\`\`typescript
// All tasks
query_specs({ objects: ["task"] })

// Completed tasks
query_specs({
  objects: ["task"],
  completed: true
})
\`\`\`

**Milestone progress:**
\`\`\`typescript
query_specs({
  milestone: "mls-001-v2-launch",
  completed: false  // Remaining work
})
\`\`\`

**This week's completions:**
\`\`\`typescript
query_specs({
  completed: true,
  orderBy: "updated",
  direction: "desc"
})
\`\`\`

### Quality Assurance

**Unverified work:**
\`\`\`typescript
query_specs({
  completed: true,
  verified: false
})
\`\`\`

**Test cases:**
\`\`\`typescript
query_specs({
  objects: ["test-case"]
})
\`\`\`

### Team Coordination

**High-priority pending work:**
\`\`\`typescript
query_specs({
  priority: ["critical", "high"],
  status: ["pending"]
})
\`\`\`

**Work by milestone:**
\`\`\`typescript
query_specs({
  milestone: "mls-001-v2-launch",
  orderBy: "next-to-do"
})
\`\`\`

**Recently updated:**
\`\`\`typescript
query_specs({
  orderBy: "updated",
  direction: "desc"
})
\`\`\`

## Natural Language Queries

Ask in natural language:

\`\`\`
"Show me all high-priority pending tasks"
"What work is in the v2.0 milestone?"
"Which plans are incomplete?"
"Show me recently completed work"
"What's the next task I should work on?"
\`\`\`

Claude translates these to \`query_specs\` calls.

## Example Workflows

### Daily Standup

\`\`\`
1. "What did I complete yesterday?"
   query_specs({ completed: true, orderBy: "updated" })

2. "What am I working on today?"
   query_specs({ status: ["in-progress"] })

3. "What's blocked?"
   query_specs({ objects: ["task"] })
\`\`\`

### Sprint Planning

\`\`\`
1. "Show available work for next sprint"
   query_specs({
     status: ["pending"],
     priority: ["high", "medium"],
     orderBy: "next-to-do"
   })

2. "What's the milestone progress?"
   query_specs({ milestone: "mls-002-sprint-5" })
\`\`\`

### Status Reports

\`\`\`
1. "Completion metrics"
   query_specs({ completed: true })   // Done
   query_specs({ completed: false })  // Remaining

2. "High-priority work status"
   query_specs({ priority: ["critical", "high"] })

3. "What changed this week?"
   query_specs({ orderBy: "updated" })
\`\`\`

### Quality Review

\`\`\`
1. "Unverified completed work"
   query_specs({ completed: true, verified: false })

2. "Test coverage"
   query_specs({ objects: ["test-case"] })

3. "Acceptance criteria status"
   query_specs({ objects: ["criterion"] })
\`\`\`

## Combining Filters

Filters combine with AND logic:

\`\`\`typescript
query_specs({
  objects: ["task"],              // Tasks only
  priority: ["high"],             // AND high priority
  status: ["pending"],            // AND pending status
  milestone: "mls-001-v2-launch"  // AND in milestone
})
\`\`\`

Returns: High-priority pending tasks in the v2 launch milestone.

## Common Query Examples

**Find next work:**
\`\`\`
Show me next tasks to work on
\`\`\`

**Milestone status:**
\`\`\`
Show all work in milestone mls-001
\`\`\`

**Recent activity:**
\`\`\`
What changed in the last week?
\`\`\`

**High-priority items:**
\`\`\`
Show all critical and high-priority work
\`\`\`

**Incomplete work:**
\`\`\`
What's not done yet?
\`\`\`

**Specific types:**
\`\`\`
Show all decisions
Show all BRDs
Show all components
\`\`\`

## Performance Tips

### Limit Scope

\`\`\`typescript
// More efficient
query_specs({
  objects: ["task"],
  milestone: "mls-001"
})

// Less efficient
query_specs({})  // Returns everything
\`\`\`

### Use Appropriate Sorting

\`\`\`typescript
// Fast
orderBy: "created"

// Slower (calculates priority)
orderBy: "next-to-do"
\`\`\`

### Filter Early

\`\`\`typescript
// Better
query_specs({
  objects: ["task"],
  priority: ["high"]
})

// Worse
query_specs({})  // Then filter in code
\`\`\`

## Related Guides

- See [Getting Started](spec-mcp://guide/getting-started) for basic usage
- See [Implementation Workflow](spec-mcp://guide/implementation-workflow) for tracking work
- See [Planning Workflow](spec-mcp://guide/planning-workflow) for creating specs
- See [Best Practices](spec-mcp://guide/best-practices) for query patterns`,
} as const;
