# Query Guide

**Goal**: Learn how to query, filter, and analyze specs to find information and track progress.

## Overview

The `query_specs` tool provides powerful filtering and searching capabilities across all your specs.

```typescript
query_specs({
  objects: ["plan", "task"],
  priority: ["high", "critical"],
  status: ["pending", "in-progress"],
  orderBy: "next-to-do"
})
```

## Basic Queries

### List All Specs

**All plans:**
```
Show me all plans
```

**All business requirements:**
```
Show me all BRDs
```

**All specs:**
```
Show me all specs
```

### Get Specific Spec

**By ID:**
```
Show me pln-001
Show me brd-002-user-auth
Get spec pln-001
```

**With relationships:**
```
Show me pln-001 with all related specs
What requirements does pln-001 fulfill?
```

## Filtering

### By Object Type

**Single type:**
```typescript
query_specs({
  objects: ["plan"]
})
```

**Multiple types:**
```typescript
query_specs({
  objects: ["plan", "business-requirement"]
})
```

**Sub-items:**
```typescript
query_specs({
  objects: ["task", "test-case", "criterion"]
})
```

### By Status

**Completion status:**
```typescript
query_specs({
  completed: false  // Only incomplete
})

query_specs({
  completed: true  // Only completed
})
```

**Verification status:**
```typescript
query_specs({
  verified: true  // Only verified work
})
```

**Task status:**
```typescript
query_specs({
  objects: ["task"],
  status: ["pending", "in-progress"]
})
```

**Status values:**
- `not-started`: Not begun
- `in-progress`: Currently working
- `completed`: Finished
- `verified`: Tested and confirmed

### By Priority

```typescript
query_specs({
  priority: ["critical", "high"]
})
```

**Priority levels:**
- `critical`: Blocks everything
- `high`: Important
- `medium`: Standard (default)
- `low`: Can defer
- `nice-to-have`: Optional

### By Milestone

```typescript
query_specs({
  milestone: "mls-001-v2-launch"
})
```

Returns all specs linked to that milestone.

### By ID

**Single ID:**
```typescript
query_specs({
  id: "pln-001-user-auth"
})
```

**Multiple IDs:**
```typescript
query_specs({
  id: ["pln-001", "pln-002", "brd-001"]
})
```

### By Draft Status

**Only drafts:**
```typescript
query_specs({
  draft: true
})
```

**Only finalized:**
```typescript
query_specs({
  draft: false
})
```

## Sorting

### Next-To-Do (Priority-Based)

```typescript
query_specs({
  orderBy: "next-to-do",
  direction: "asc"
})
```

Returns work ordered by:
1. Priority (critical → high → medium → low → nice-to-have)
2. Within same priority, by created date

**Best for:** "What should I work on next?"

### By Creation Date

```typescript
query_specs({
  orderBy: "created",
  direction: "desc"  // Newest first
})
```

**Best for:** "What was added recently?"

### By Update Date

```typescript
query_specs({
  orderBy: "updated",
  direction: "desc"  // Most recently changed
})
```

**Best for:** "What changed recently?"

## Common Query Patterns

### Work Planning

**What can I start now?**
```typescript
query_specs({
  objects: ["task"],
  status: ["pending"],
  priority: ["critical", "high"],
  orderBy: "next-to-do"
})
```

**What's in progress?**
```typescript
query_specs({
  status: ["in-progress"]
})
```

**What's blocked?**
```typescript
query_specs({
  objects: ["task"],
  // Tasks with active blockers
})
```

### Progress Tracking

**Completion rate:**
```typescript
// All tasks
query_specs({ objects: ["task"] })

// Completed tasks
query_specs({
  objects: ["task"],
  completed: true
})
```

**Milestone progress:**
```typescript
query_specs({
  milestone: "mls-001-v2-launch",
  completed: false  // Remaining work
})
```

**This week's completions:**
```typescript
query_specs({
  completed: true,
  orderBy: "updated",
  direction: "desc"
})
```

### Quality Assurance

**Unverified work:**
```typescript
query_specs({
  completed: true,
  verified: false
})
```

**Test cases:**
```typescript
query_specs({
  objects: ["test-case"],
  // Filter by implemented/passing status
})
```

**High-priority criteria:**
```typescript
query_specs({
  objects: ["criterion"],
  priority: ["high", "critical"]
})
```

### Team Coordination

**High-priority pending work:**
```typescript
query_specs({
  priority: ["critical", "high"],
  status: ["pending"]
})
```

**Work by milestone:**
```typescript
query_specs({
  milestone: "mls-001-v2-launch",
  orderBy: "next-to-do"
})
```

**Recently updated specs:**
```typescript
query_specs({
  orderBy: "updated",
  direction: "desc"
})
```

## Natural Language Queries

You can also ask in natural language:

```
"Show me all high-priority pending tasks"
"What work is in the v2.0 milestone?"
"Which plans are incomplete?"
"Show me recently completed work"
"What's the next task I should work on?"
"Which tests are failing?"
```

Claude translates these to `query_specs` calls.

## Example Workflows

### Daily Standup

```
1. "What did I complete yesterday?"
   query_specs({
     completed: true,
     orderBy: "updated",
     direction: "desc"
   })

2. "What am I working on today?"
   query_specs({
     status: ["in-progress"]
   })

3. "What's blocked?"
   query_specs({
     objects: ["task"],
     // Filter for blocked tasks
   })
```

### Sprint Planning

```
1. "Show available work for next sprint"
   query_specs({
     status: ["pending"],
     priority: ["high", "medium"],
     orderBy: "next-to-do"
   })

2. "What's the milestone progress?"
   query_specs({
     milestone: "mls-002-sprint-5"
   })

3. "Any dependencies to resolve?"
   query_specs({
     objects: ["task"],
     // Check dependency chains
   })
```

### Status Reports

```
1. "Completion metrics"
   query_specs({ completed: true })   // Done
   query_specs({ completed: false })  // Remaining

2. "High-priority work status"
   query_specs({
     priority: ["critical", "high"]
   })

3. "What changed this week?"
   query_specs({
     orderBy: "updated",
     direction: "desc"
   })
```

### Quality Review

```
1. "Unverified completed work"
   query_specs({
     completed: true,
     verified: false
   })

2. "Test coverage"
   query_specs({
     objects: ["test-case"]
   })

3. "Acceptance criteria status"
   query_specs({
     objects: ["criterion"]
   })
```

## Combining Filters

Filters combine with AND logic:

```typescript
query_specs({
  objects: ["task"],              // Tasks only
  priority: ["high"],             // AND high priority
  status: ["pending"],            // AND pending status
  milestone: "mls-001-v2-launch"  // AND in milestone
})
```

Returns: High-priority pending tasks in the v2 launch milestone.

## Pagination

Results are automatically paginated if there are many matches.

## Query Response Format

```typescript
{
  specs: [
    {
      id: "pln-001-user-auth",
      type: "plan",
      name: "Implement User Authentication",
      priority: "high",
      status: {
        completed: false,
        verified: false,
        ...
      },
      ...
    },
    // More specs
  ],
  stats: {
    total: 15,
    completed: 8,
    verified: 5
  }
}
```

## Tips for Effective Querying

### Start Broad, Then Narrow

```
1. "Show all plans"
2. "Show incomplete plans"
3. "Show high-priority incomplete plans"
4. "Show high-priority incomplete plans in milestone mls-001"
```

### Use Sorting Strategically

**For planning:**
```typescript
orderBy: "next-to-do"  // Priority-based
```

**For status:**
```typescript
orderBy: "updated"  // Recently changed
```

**For history:**
```typescript
orderBy: "created"  // Chronological
```

### Combine Object Types

```typescript
query_specs({
  objects: ["plan", "business-requirement", "decision"]
})
```

Returns all specs involved in planning a feature.

### Check Related Items

```
"Show me pln-001 with all its tasks"
"What BRD does pln-001 fulfill?"
"Which decisions influenced pln-001?"
```

## Common Query Examples

### Find Next Work

```
Show me next tasks to work on
```
```typescript
query_specs({
  objects: ["task"],
  status: ["pending"],
  orderBy: "next-to-do"
})
```

### Milestone Status

```
Show all work in milestone mls-001
```
```typescript
query_specs({
  milestone: "mls-001-v2-launch"
})
```

### Recent Activity

```
What changed in the last week?
```
```typescript
query_specs({
  orderBy: "updated",
  direction: "desc"
})
```

### High-Priority Items

```
Show all critical and high-priority work
```
```typescript
query_specs({
  priority: ["critical", "high"]
})
```

### Incomplete Work

```
What's not done yet?
```
```typescript
query_specs({
  completed: false
})
```

### Specific Types

```
Show all decisions
Show all BRDs
Show all components
```
```typescript
query_specs({ objects: ["decision"] })
query_specs({ objects: ["business-requirement"] })
query_specs({ objects: ["component"] })
```

## Advanced Patterns

### Dependency Analysis

```
Which tasks depend on task-001?
Which plans depend on pln-001?
```

Query a spec and examine its `depends_on` and related specs.

### Test Coverage

```typescript
query_specs({
  objects: ["test-case"]
})
```

Then analyze:
- `implemented: true/false`
- `passing: true/false`

### Criteria Fulfillment

```
What criteria is pln-001 fulfilling?
Which plans fulfill crit-001?
```

Check `criteria` field in plans.

### Blocked Work

```
Show all blocked tasks
```

Query tasks and check `blocked` array for active blockers.

## Performance Tips

### Limit Scope

```typescript
// More efficient
query_specs({
  objects: ["task"],
  milestone: "mls-001"
})

// Less efficient
query_specs({})  // Returns everything
```

### Use Appropriate Sorting

```typescript
// Fast
orderBy: "created"

// Slower (calculates priority)
orderBy: "next-to-do"
```

### Filter Early

```typescript
// Better
query_specs({
  objects: ["task"],
  priority: ["high"]
})

// Worse
query_specs({})  // Then filter in code
```

## Related Guides

- See [Getting Started](spec-mcp://guide/getting-started) for basic usage
- See [Implementation Workflow](spec-mcp://guide/implementation-workflow) for tracking work
- See [Planning Workflow](spec-mcp://guide/planning-workflow) for creating specs
- See [Best Practices](spec-mcp://guide/best-practices) for query patterns
