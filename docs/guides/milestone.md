# Milestone Guide

**Goal**: Understand when and how to use Milestones to organize releases.

## What is a Milestone?

A Milestone represents a release or deliverable that groups related work together. It provides a target date, organizes plans and specs, and tracks progress toward a release goal.

## When to Use a Milestone

✅ **Use a Milestone for:**
- Planning releases (v1.0, v2.0, Q1 Release)
- Organizing sprints or iterations
- Grouping related work into deliverables
- Tracking progress toward a launch date
- Setting deadlines for features

❌ **Don't use a Milestone for:**
- Individual features (use Plan instead)
- Technical decisions (use Decision instead)
- Ongoing work with no target date

## Key Components

### Required Fields
- **Title**: Name of the milestone
- **Description**: What this milestone represents

### Optional But Valuable
- **Target Date**: When you aim to complete this
- **References**: Release plans, marketing docs, roadmaps

## Common Patterns

### Version Release Milestone
```yaml
title: Version 2.0 Launch
description: |
  Major platform release including:
  - New authentication system with OAuth
  - API v2 with improved rate limiting
  - Performance improvements (50% faster)
  - New user dashboard UI
  - Mobile app support
target_date: "2024-12-31T23:59:59Z"
references:
  - type: url
    name: V2 Launch Plan
    url: https://docs.example.com/v2-launch
    description: Detailed launch plan and timeline
  - type: file
    name: Marketing Plan
    path: docs/marketing/v2-launch.md
    description: Marketing and communications plan
```

### Quarterly Release Milestone
```yaml
title: Q1 2024 Release
description: |
  First quarter release focusing on:
  - Bug fixes from Q4
  - Performance optimizations
  - Minor feature improvements
target_date: "2024-03-31T23:59:59Z"
```

### Feature Bundle Milestone
```yaml
title: Enterprise Features Pack
description: |
  Bundle of enterprise features for enterprise tier:
  - SSO integration
  - Advanced analytics
  - Team management
  - API access controls
target_date: "2024-06-30T23:59:59Z"
```

### Sprint Milestone
```yaml
title: Sprint 23 - Authentication
description: |
  Two-week sprint focused on authentication improvements:
  - Password reset flow
  - Email verification
  - Session management
target_date: "2024-02-15T23:59:59Z"
```

## Linking Plans to Milestones

Plans reference milestones:

```yaml
# In a Plan
title: Implement OAuth Integration
milestones:
  - mls-001-v2-launch  # ← Links to milestone
```

This creates the connection between implementation work and releases.

## Tracking Progress

Use the `query_specs` tool to track milestone progress:

```typescript
// Find all plans for a milestone
query_specs({
  objects: ["plan"],
  milestone: "mls-001-v2-launch"
})

// Check completion status
query_specs({
  objects: ["plan"],
  milestone: "mls-001-v2-launch",
  completed: true
})

// Find blocked work
query_specs({
  objects: ["plan"],
  milestone: "mls-001-v2-launch",
  status: ["blocked"]
})
```

## Target Dates

Use ISO 8601 format:

```yaml
# End of day
target_date: "2024-12-31T23:59:59Z"

# Specific time
target_date: "2024-06-15T14:00:00Z"

# No specific date yet
target_date: null
```

## Best Practices

### Keep Milestones Focused
❌ Bad: One milestone for the entire year
✅ Good: Quarterly or monthly milestones

### Set Realistic Dates
Consider:
- Dependencies between work items
- Team capacity
- Buffer time for unexpected issues
- Testing and deployment time

### Include Buffer Time
```yaml
# Feature work: Feb 1-28
# Testing: Mar 1-7
# Launch prep: Mar 8-14
target_date: "2024-03-15T23:59:59Z"  # ← Includes 2-week buffer
```

### Update as Needed
If timeline slips, update the milestone:
```yaml
# Original
target_date: "2024-06-30T23:59:59Z"

# Updated after scope change
target_date: "2024-07-31T23:59:59Z"
```

### Link to External Plans
```yaml
references:
  - type: url
    name: Release Checklist
    url: https://docs.example.com/release-checklist
    description: Step-by-step release process

  - type: file
    name: Go-to-Market Plan
    path: docs/gtm/v2-launch.md
    description: Marketing and sales plan for launch
```

### Group Related Work
A milestone should group work that:
- Ships together
- Depends on each other
- Targets the same date
- Serves a common goal

## Milestone Hierarchy

Milestones can represent different levels:

### Release Milestones
```yaml
mls-001-v2-0-launch
mls-002-v2-1-patch
mls-003-v3-0-launch
```

### Sprint Milestones
```yaml
mls-101-sprint-23
mls-102-sprint-24
mls-103-sprint-25
```

### Theme Milestones
```yaml
mls-201-performance-quarter
mls-202-security-hardening
mls-203-mobile-experience
```

## Completing Milestones

When all linked plans are completed:

1. Verify all work is done:
```typescript
query_specs({
  objects: ["plan"],
  milestone: "mls-001-v2-launch",
  completed: false  // Should return 0
})
```

2. Mark milestone as completed (via system or manually)

3. Create retrospective documentation:
```yaml
references:
  - type: file
    name: V2 Launch Retrospective
    path: docs/retros/v2-launch.md
    description: Lessons learned from v2 launch
```

## Common Milestone Patterns

### Major Version Release
- 3-6 months timeline
- Multiple features and improvements
- Breaking changes possible
- Marketing push
- Documentation overhaul

### Minor Version Release
- 1-2 months timeline
- New features, no breaking changes
- Bug fixes
- Performance improvements

### Patch Release
- 1-2 weeks timeline
- Bug fixes only
- Security patches
- Small improvements

### Sprint Release
- 1-2 weeks timeline
- Agile/Scrum sprint
- Incremental progress
- Regular cadence

## Related Guides

- See [Plan Guide](spec-mcp://guide/plan) for linking plans to milestones
- See [Choosing Spec Types](spec-mcp://guide/choosing-spec-types) for when to use Milestones
- View the [Milestone Schema](spec-mcp://schema/milestone) for complete field reference
