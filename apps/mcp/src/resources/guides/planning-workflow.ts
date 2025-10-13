export const planningWorkflowGuide = {
	uri: "spec-mcp://guide/planning-workflow",
	name: "Planning Workflow Guide",
	description: "Transform ideas into actionable implementation plans",
	mimeType: "text/markdown",
	content: `# Planning Workflow

**Goal**: Transform ideas into actionable implementation plans through a structured process.

## Overview

\`\`\`
Idea/Request
  ↓
Business Requirement (BRD)
  ↓
Technical Requirement (PRD)
  ↓
Decisions (if needed)
  ↓
Implementation Plan
  ↓
Ready to Implement
\`\`\`

## Complete Feature Planning Flow

### Phase 1: Capture Business Need

**Create a BRD:**
\`\`\`
Create a BRD for user notifications
\`\`\`

**Example:**
\`\`\`yaml
title: User Notifications System
description: Users need timely notifications about account activity

stakeholders:
  - role: product-owner
    name: Jane Smith
    interest: Increase user engagement

business_value:
  - type: revenue
    value: Increased engagement leads to 15% higher conversion

user_stories:
  - role: registered user
    feature: receive notifications about account activity
    benefit: stay informed without checking constantly

criteria:
  - description: Users receive email notifications within 5 minutes
    rationale: Timely notifications are critical
\`\`\`

### Phase 2: Define Technical Approach

**Create a PRD:**
\`\`\`
Create a PRD for implementing the notification system from brd-001
\`\`\`

**Example:**
\`\`\`yaml
title: Push and Email Notification Infrastructure
technical_context: |
  Need scalable notification delivery supporting multiple channels.
  Must handle high volume during peak hours.

implementation_approach: |
  - Message queue (RabbitMQ) for async delivery
  - Email via SendGrid API
  - Push notifications via Firebase Cloud Messaging
  - Database table for preferences and history

constraints:
  - type: performance
    description: Deliver 95% of notifications within 5 minutes

technical_dependencies:
  - type: url
    name: SendGrid API
    url: https://sendgrid.com/docs
  - type: url
    name: Firebase Cloud Messaging
    url: https://firebase.google.com/docs/cloud-messaging
\`\`\`

### Phase 3: Document Key Decisions

**Create Decisions:**
\`\`\`
Create a decision for choosing Firebase over OneSignal
\`\`\`

**Example:**
\`\`\`yaml
title: Use Firebase Cloud Messaging for Push Notifications
decision: Implement push using Firebase Cloud Messaging (FCM)

context: |
  Need reliable push for iOS and Android.
  Evaluated Firebase, OneSignal, and AWS SNS.

alternatives:
  - OneSignal: Simpler setup but vendor lock-in
  - AWS SNS: More control but complex and costly

consequences:
  - type: positive
    description: Free tier covers expected volume
  - type: negative
    description: Vendor lock-in to Google ecosystem
    mitigation: Abstract notification logic behind interface
\`\`\`

### Phase 4: Create Implementation Plan

**Create a Plan:**
\`\`\`
Create a plan to implement the notification system from prd-001
\`\`\`

**Example:**
\`\`\`yaml
title: Implement Notification System
criteria:
  requirement: brd-001-user-notifications
  criteria: crit-001

scope:
  - type: in-scope
    description: Email and push notifications
  - type: out-of-scope
    description: SMS notifications (future phase)

tasks:
  - id: task-001
    task: Setup RabbitMQ infrastructure
    priority: critical

  - id: task-002
    task: Create notification service worker
    depends_on: [task-001]
    priority: critical

  - id: task-003
    task: Integrate SendGrid for email
    depends_on: [task-002]
    priority: high

test_cases:
  - name: Email notification delivery
    steps:
      - Trigger notification event
      - Verify message queued
      - Verify email sent
      - Verify user receives email
    expected_result: Email delivered within 5 minutes
\`\`\`

### Phase 5: Link to Milestone

\`\`\`
Add pln-001 to milestone mls-001-v2-launch
\`\`\`

## Planning Patterns by Situation

### New Feature
\`\`\`
BRD → PRD → Decision → Plan
\`\`\`

### Technical Improvement
\`\`\`
PRD → Decision → Plan
\`\`\`

### Bug Fix with Context
\`\`\`
PRD (optional) → Plan
\`\`\`

## Iterative Planning

Plans evolve as you learn:

\`\`\`
Add a task to pln-001: Implement rate limiting
Update pln-001 scope to exclude SMS notifications
Make task-004 depend on task-003
\`\`\`

## Planning Checklist

Before marking ready for implementation:

**Business Alignment**
- [ ] Links to BRD acceptance criteria
- [ ] Business value is clear
- [ ] Stakeholders identified

**Technical Clarity**
- [ ] PRD defines approach
- [ ] Key decisions documented
- [ ] Constraints identified

**Implementation Ready**
- [ ] Tasks are concrete and actionable
- [ ] Dependencies are clear
- [ ] Priorities are set
- [ ] Scope is well-defined

**Verification**
- [ ] Test cases defined
- [ ] Acceptance criteria testable
- [ ] API contracts specified (if applicable)

**Traceability**
- [ ] Links to BRD/PRD
- [ ] References supporting docs
- [ ] Connected to milestone (if applicable)

## Tips for Effective Planning

### Right-Size Tasks
❌ Too Large: "Build entire notification system"
✅ Good Size: "Integrate SendGrid for email delivery"

Aim for 0.5-2 days per task.

### Clear Dependencies
\`\`\`yaml
tasks:
  - id: task-001
    task: Setup database schema
  - id: task-002
    task: Create API endpoints
    depends_on: [task-001]
\`\`\`

### Meaningful Scope
**In-Scope**: What you're building
**Out-of-Scope**: What you're explicitly NOT building

### Test Early Planning
Write test cases during planning, not after implementation.

### Link Everything
\`\`\`yaml
criteria:
  requirement: brd-001-notifications
  criteria: crit-001

references:
  - type: other
    name: Technology Choice
    description: See dec-001-use-firebase-messaging
\`\`\`

## Common Planning Workflows

### Solo Developer
\`\`\`
1. Quick BRD (business context)
2. Skip PRD for simple features
3. Detailed Plan with tasks
4. Start implementation
\`\`\`

### Small Team
\`\`\`
1. BRD (collaborate with stakeholders)
2. PRD (technical team review)
3. Decisions (team discusses)
4. Plan (lead developer creates)
5. Review and refine
6. Start implementation
\`\`\`

### Larger Team
\`\`\`
1. BRD (product manager)
2. PRD (tech lead)
3. Decisions (architecture review)
4. Multiple Plans (one per component)
5. Team review and approval
6. Assign to developers
\`\`\`

## Adapting the Workflow

### When to Skip Steps

**Skip BRD if:**
- Internal technical work
- Bug fixes
- Obvious refactoring

**Skip PRD if:**
- Trivial implementation
- Following existing patterns
- Very small features

**Skip Decisions if:**
- Choice is obvious
- Following existing architecture
- Temporary/experimental

### When to Add Steps

**Add more BRDs:**
- Multiple stakeholder groups
- Complex business requirements
- Regulated industries

**Add more PRDs:**
- Complex technical work
- Multiple technical approaches
- High-risk implementation

**Add more Decisions:**
- New technology choices
- Architectural changes
- Trade-offs between options

## Related Guides

- See [Implementation Workflow](spec-mcp://guide/implementation-workflow) for executing plans
- See [Choosing Spec Types](spec-mcp://guide/choosing-spec-types) for when to use each type
- See [Best Practices](spec-mcp://guide/best-practices) for planning tips
- See [Spec Relationships](spec-mcp://guide/spec-relationships) for how specs connect`,
} as const;
