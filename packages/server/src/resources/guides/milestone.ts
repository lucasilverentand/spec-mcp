export const milestoneGuide = {
	uri: "spec-mcp://guide/milestone",
	name: "Milestone Guide",
	description: "Guide for creating and managing specification milestones",
	mimeType: "text/markdown",
	content: `# Milestone Guide

## Overview

Milestones group components into deliverable releases or phases. They provide structure for planning, tracking progress, and coordinating work across teams.

## What is a Milestone?

A milestone is a collection of components that:
- Represents a deliverable release or project phase
- Has a defined scope and timeline
- Tracks completion progress
- Coordinates dependencies across components

## Milestone Structure

### Required Fields

\`\`\`yaml
id: unique-identifier
name: Human-readable name
status: planned | active | completed | cancelled
components: [component-ids]
\`\`\`

### Optional Fields

\`\`\`yaml
target_date: YYYY-MM-DD
description: Purpose and goals
dependencies: [milestone-ids]  # Other milestones this depends on
metadata:
  release_notes: url-or-text
  changelog: url-or-text
  version: semantic-version
\`\`\`

## Milestone Status Lifecycle

1. **planned** - Not yet started, scheduling and scoping
2. **active** - Currently in progress
3. **completed** - All components finished, released
4. **cancelled** - Abandoned or deprioritized

## Component Organization

### Basic Milestone

\`\`\`yaml
id: v1.0
name: Initial Release
status: active
target_date: 2024-12-31
components:
  - user-authentication
  - user-profile
  - basic-dashboard
\`\`\`

### Multi-Milestone Planning

\`\`\`yaml
# Foundation
- id: phase-1-foundation
  name: Phase 1: Foundation
  status: completed
  components:
    - database-schema
    - api-framework
    - authentication

# Core Features
- id: phase-2-core
  name: Phase 2: Core Features
  status: active
  dependencies: [phase-1-foundation]
  components:
    - user-management
    - product-catalog
    - shopping-cart

# Advanced Features
- id: phase-3-advanced
  name: Phase 3: Advanced Features
  status: planned
  dependencies: [phase-2-core]
  components:
    - recommendations
    - analytics
    - admin-dashboard
\`\`\`

## Progress Tracking

### Automatic Calculation

Progress is automatically calculated based on component status:

\`\`\`typescript
// Milestone with 10 components
// 3 completed, 5 active, 2 draft
// Progress = 3/10 = 30%
\`\`\`

### Manual Review

Review progress at regular intervals:
- Are components on track?
- Are dependencies resolved?
- Should scope be adjusted?
- Is timeline realistic?

## Dependencies

### Milestone Dependencies

Define milestone-level dependencies for phased releases:

\`\`\`yaml
id: v2.0
name: Version 2.0
dependencies:
  - v1.0  # Must complete v1.0 first
  - infrastructure-upgrade
\`\`\`

### Component Dependencies

Component dependencies automatically affect milestone ordering:

\`\`\`yaml
# Milestone A
components:
  - component-x

# Milestone B
components:
  - component-y  # depends on component-x

# Milestone B implicitly depends on Milestone A
\`\`\`

## Common Patterns

### Sprint Planning

\`\`\`yaml
- id: sprint-23
  name: Sprint 23
  status: active
  target_date: 2024-06-14
  metadata:
    sprint_goals:
      - Complete checkout flow
      - Fix critical bugs
      - Improve performance
  components:
    - payment-integration
    - order-confirmation
    - cart-performance
\`\`\`

### Release Trains

\`\`\`yaml
# Regular release cadence
- id: 2024-q1
  name: Q1 2024 Release
  target_date: 2024-03-31

- id: 2024-q2
  name: Q2 2024 Release
  target_date: 2024-06-30
  dependencies: [2024-q1]

- id: 2024-q3
  name: Q3 2024 Release
  target_date: 2024-09-30
  dependencies: [2024-q2]
\`\`\`

### Feature Flags

\`\`\`yaml
- id: beta-features
  name: Beta Features
  status: active
  metadata:
    rollout_strategy: gradual
    feature_flags: enabled
  components:
    - new-ui-design
    - experimental-search
    - ai-recommendations
\`\`\`

### Technical Debt

\`\`\`yaml
- id: tech-debt-q2
  name: Q2 Technical Debt
  status: planned
  target_date: 2024-06-30
  description: |
    Address accumulated technical debt including:
    - Legacy code refactoring
    - Performance optimizations
    - Security updates
  components:
    - refactor-auth-service
    - optimize-database-queries
    - update-dependencies
\`\`\`

## Planning Strategies

### Top-Down Planning

1. Define milestone goals
2. Identify required components
3. Estimate timeline
4. Assign to milestone

\`\`\`yaml
# Start with goal
id: mobile-launch
name: Mobile App Launch
target_date: 2024-08-31

# Identify needed components
components:
  - mobile-api
  - push-notifications
  - offline-mode
  - app-store-submission
\`\`\`

### Bottom-Up Planning

1. Identify available components
2. Group related components
3. Form logical milestones
4. Set target dates

\`\`\`yaml
# Group existing components
components_ready:
  - user-authentication (completed)
  - user-profile (active)
  - settings-page (active)

# Create milestone
- id: user-management-v1
  components: [user-authentication, user-profile, settings-page]
\`\`\`

### Dependency-Driven Planning

1. Map component dependencies
2. Identify critical path
3. Form milestones around dependency layers
4. Schedule sequentially

\`\`\`yaml
# Layer 1: Infrastructure
- id: infrastructure
  components: [database, api-gateway, auth-service]

# Layer 2: Core Services (depends on Layer 1)
- id: core-services
  dependencies: [infrastructure]
  components: [user-service, product-service, order-service]

# Layer 3: User Features (depends on Layer 2)
- id: user-features
  dependencies: [core-services]
  components: [web-ui, mobile-app, admin-dashboard]
\`\`\`

## Timeline Management

### Setting Realistic Dates

\`\`\`yaml
target_date: 2024-12-31
metadata:
  estimated_effort: 12 weeks
  buffer: 2 weeks
  confidence: medium
  assumptions:
    - Team of 4 developers
    - No major blockers
    - Requirements stable
\`\`\`

### Tracking Delays

\`\`\`yaml
metadata:
  original_date: 2024-06-30
  revised_date: 2024-07-15
  delay_reason: "Integration testing revealed issues"
  impact: "Pushes Q3 release by 2 weeks"
\`\`\`

### Buffer Management

\`\`\`yaml
# Build in contingency
- id: major-release
  name: Major Release v3.0
  target_date: 2024-12-15  # External commitment
  metadata:
    internal_target: 2024-11-30  # 2-week buffer
    code_freeze: 2024-11-15
    testing_period: 2 weeks
\`\`\`

## Examples

### Basic Release

\`\`\`yaml
id: v1.0
name: Version 1.0
status: active
target_date: 2024-12-31
description: Initial public release
components:
  - user-authentication
  - product-catalog
  - shopping-cart
  - checkout-flow
\`\`\`

### Sprint Milestone

\`\`\`yaml
id: sprint-15
name: Sprint 15
status: active
target_date: 2024-06-28
metadata:
  sprint_goals:
    - Complete payment integration
    - Fix high-priority bugs
    - Improve test coverage
  velocity: 34
  capacity: 40
components:
  - stripe-integration
  - bug-fixes
  - test-improvements
\`\`\`

### Complex Release

\`\`\`yaml
id: v2.0
name: Version 2.0 - Major Update
status: planned
target_date: 2025-03-31
description: |
  Major platform update including:
  - New architecture
  - Performance improvements
  - Enhanced security
  - Mobile support
dependencies:
  - v1.5
  - infrastructure-upgrade
metadata:
  version: 2.0.0
  breaking_changes: true
  migration_guide: docs/migration-v2.md
  beta_period: 2025-02-01
components:
  - api-v2
  - new-auth-system
  - mobile-api
  - performance-optimization
  - security-hardening
\`\`\`

### Multi-Team Milestone

\`\`\`yaml
id: platform-rewrite
name: Platform Rewrite
status: active
target_date: 2024-12-31
metadata:
  teams:
    frontend: [new-ui, component-library]
    backend: [api-rewrite, database-migration]
    infrastructure: [cloud-migration, monitoring]
  coordination:
    weekly_sync: true
    shared_timeline: true
components:
  # Frontend
  - new-ui
  - component-library
  # Backend
  - api-rewrite
  - database-migration
  # Infrastructure
  - cloud-migration
  - monitoring
\`\`\`

## Querying Milestones

### By Status
\`\`\`typescript
specManager.query({
  entityType: 'milestone',
  status: 'active'
})
\`\`\`

### By Date Range
\`\`\`typescript
specManager.query({
  entityType: 'milestone',
  targetDate: {
    before: '2024-12-31'
  }
})
\`\`\`

### By Component
\`\`\`typescript
// Find milestones containing specific component
specManager.query({
  entityType: 'milestone',
  components: { includes: 'user-authentication' }
})
\`\`\`

### Progress Analysis
\`\`\`typescript
// Find milestones with low completion rate
const milestones = specManager.query({
  entityType: 'milestone',
  status: 'active'
})

milestones.filter(m => {
  const progress = calculateProgress(m)
  return progress < 0.5  // Less than 50% complete
})
\`\`\`

## Best Practices

### Scope Management
- Keep milestones focused and achievable
- Limit number of components per milestone
- Allow for scope adjustment based on progress

### Timeline Planning
- Set realistic target dates
- Build in buffer time
- Review and adjust dates regularly

### Progress Tracking
- Monitor component completion
- Identify blockers early
- Communicate status changes

### Coordination
- Align milestone dependencies
- Coordinate across teams
- Manage shared resources

### Documentation
- Document milestone goals
- Track scope changes
- Maintain release notes

## Tips

1. **Right-Size Milestones**: Not too big, not too small (typically 2-8 weeks)
2. **Clear Goals**: Define what success looks like
3. **Regular Reviews**: Check progress weekly or bi-weekly
4. **Flexibility**: Be ready to adjust scope or timeline
5. **Dependencies**: Understand and track milestone dependencies
6. **Communication**: Keep stakeholders informed of status
7. **Retrospectives**: Review completed milestones to improve planning

## Related Concepts

- **Components**: Building blocks organized into milestones
- **Dependencies**: Define milestone and component ordering
- **Progress**: Track completion status
- **Releases**: Milestones often correspond to releases
`,
} as const;
