# Planning Workflow

**Goal**: Learn the complete workflow for planning features using specs, from initial idea to ready-to-implement plans.

## Overview

The planning workflow transforms ideas into actionable implementation plans through a structured process:

```
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
```

## Complete Feature Planning Flow

### Phase 1: Capture Business Need

**Create a Business Requirement (BRD)**

```
Create a BRD for user notifications
```

Claude will guide you through:

**Questions:**
- What's the business need?
- Who are the stakeholders?
- What's the business value?
- What are the user stories?
- What are the acceptance criteria?

**Example Answers:**
```yaml
title: User Notifications System
description: Users need to receive timely notifications about account activity

stakeholders:
  - role: product-owner
    name: Jane Smith
    interest: Increase user engagement and retention

business_value:
  - type: customer-satisfaction
    value: Users stay informed of important events
  - type: revenue
    value: Increased engagement leads to 15% higher conversion

user_stories:
  - role: registered user
    feature: receive notifications about account activity
    benefit: I stay informed without checking the app constantly

  - role: premium user
    feature: customize notification preferences
    benefit: I only get notifications I care about

criteria:
  - description: Users receive email notifications within 5 minutes
    rationale: Timely notifications are critical for user experience

  - description: Users can disable notifications per category
    rationale: User control improves satisfaction
```

**Result:** `./specs/business-requirements/brd-001-user-notifications.yml`

### Phase 2: Define Technical Approach

**Create a Technical Requirement (PRD)**

```
Create a PRD for implementing the notification system from brd-001
```

Claude will ask:

**Questions:**
- What's the technical context?
- What's the implementation approach?
- What are the technical constraints?
- What are the technical dependencies?
- What are the acceptance criteria?

**Example Answers:**
```yaml
title: Push and Email Notification Infrastructure
description: Technical implementation of notification system

technical_context: |
  Need scalable notification delivery supporting multiple channels
  (email, push, SMS). Must handle high volume during peak hours.

implementation_approach: |
  - Use message queue (RabbitMQ) for async delivery
  - Email via SendGrid API
  - Push notifications via Firebase Cloud Messaging
  - Database table for notification preferences and history

constraints:
  - type: performance
    description: Deliver 95% of notifications within 5 minutes

  - type: scalability
    description: Handle 10,000 notifications per minute

technical_dependencies:
  - type: url
    name: SendGrid API
    url: https://sendgrid.com/docs
    description: Email delivery service

  - type: url
    name: Firebase Cloud Messaging
    url: https://firebase.google.com/docs/cloud-messaging
    description: Push notification service

criteria:
  - description: Notification queue processes without data loss
    rationale: Reliability is critical for user trust

  - description: Failed deliveries retry with exponential backoff
    rationale: Handle temporary service outages gracefully
```

**Result:** `./specs/technical-requirements/prd-001-notification-infrastructure.yml`

### Phase 3: Document Key Decisions

**Create Decisions for significant choices**

```
Create a decision for choosing Firebase over OneSignal for push notifications
```

**Example:**
```yaml
title: Use Firebase Cloud Messaging for Push Notifications
decision: Implement push notifications using Firebase Cloud Messaging (FCM)

context: |
  Need a reliable push notification service for iOS and Android.
  Evaluated Firebase, OneSignal, and AWS SNS.

alternatives:
  - OneSignal: Simpler setup but vendor lock-in concerns
  - AWS SNS: More control but complex setup and higher cost

consequences:
  - type: positive
    description: Free tier covers expected volume for first year

  - type: positive
    description: Excellent documentation and community support

  - type: negative
    description: Vendor lock-in to Google ecosystem
    mitigation: Abstract notification logic behind interface

  - type: risk
    description: Future pricing changes could impact costs
    mitigation: Monitor usage and have migration plan ready
```

**Result:** `./specs/decisions/dec-001-use-firebase-messaging.yml`

### Phase 4: Create Implementation Plan

**Create a Plan linking to requirements**

```
Create a plan to implement the notification system from prd-001
```

Claude will ask:

**Questions:**
- What's the scope?
- What tasks are needed?
- What are the dependencies?
- What test cases verify it works?
- What API contracts are involved?
- What data models are needed?

**Example Answers:**
```yaml
title: Implement Notification System
description: Build notification infrastructure with email and push support

criteria:
  requirement: brd-001-user-notifications
  criteria: crit-001

scope:
  - type: in-scope
    description: Email notifications via SendGrid

  - type: in-scope
    description: Push notifications via Firebase

  - type: in-scope
    description: User preference management

  - type: out-of-scope
    description: SMS notifications (future phase)

  - type: out-of-scope
    description: In-app notification UI (separate plan)

tasks:
  - id: task-001
    task: Setup RabbitMQ message queue infrastructure
    priority: critical

  - id: task-002
    task: Create notification service worker
    depends_on: [task-001]
    priority: critical

  - id: task-003
    task: Integrate SendGrid for email delivery
    depends_on: [task-002]
    priority: high

  - id: task-004
    task: Integrate Firebase for push notifications
    depends_on: [task-002]
    priority: high

  - id: task-005
    task: Build user notification preferences API
    priority: high

  - id: task-006
    task: Create notification templates
    depends_on: [task-003, task-004]
    priority: medium

  - id: task-007
    task: Implement retry logic and error handling
    depends_on: [task-003, task-004]
    priority: high

test_cases:
  - name: Email notification delivery
    description: Verify emails are sent and delivered
    steps:
      - Trigger notification event
      - Verify message queued
      - Verify email sent via SendGrid
      - Verify user receives email
    expected_result: Email delivered within 5 minutes

  - name: User preference respect
    description: Verify preferences are honored
    steps:
      - User disables email notifications
      - Trigger notification event
      - Verify no email sent
      - Verify push notification still sent
    expected_result: Only enabled channels receive notification

api_contracts:
  - name: POST /api/notifications/preferences
    contract_type: rest
    specification: |
      POST /api/notifications/preferences

      Request:
      {
        "userId": "string",
        "email": { "enabled": boolean, "categories": ["string"] },
        "push": { "enabled": boolean, "categories": ["string"] }
      }

      Response: 200 OK
      { "success": true }

data_models:
  - name: NotificationPreference
    format: typescript
    schema: |
      interface NotificationPreference {
        id: string;
        userId: string;
        email: {
          enabled: boolean;
          categories: string[];
        };
        push: {
          enabled: boolean;
          categories: string[];
        };
        updatedAt: Date;
      }
```

**Result:** `./specs/plans/pln-001-implement-notification-system.yml`

### Phase 5: Link to Milestone

**Add plan to release milestone**

```
Add pln-001 to milestone mls-001-v2-launch
```

This connects the work to your release planning.

## Planning Patterns by Situation

### New Feature

```
1. BRD: Business need
2. PRD: Technical approach
3. Decision: Key technology choices
4. Plan: Implementation tasks
```

**Example: Password Reset**
```
brd-002-password-reset → "Users need to reset forgotten passwords"
prd-002-email-reset-flow → "Use email-based reset with time-limited tokens"
dec-002-use-jwt-tokens → "Use JWT for reset tokens"
pln-002-implement-reset → "Tasks to build reset flow"
```

### Technical Improvement

```
1. PRD: Technical motivation
2. Decision: Approach choice
3. Plan: Refactoring tasks
```

**Example: Database Migration**
```
prd-003-migrate-to-postgres → "Move from MongoDB to PostgreSQL"
dec-003-use-prisma-orm → "Use Prisma for database access"
pln-003-database-migration → "Migration tasks and rollback plan"
```

### Bug Fix with Context

```
1. PRD (optional): Technical context
2. Plan: Fix tasks
```

**Example: Performance Issue**
```
prd-004-api-performance → "API response time > 2 seconds"
pln-004-optimize-queries → "Add indexes and optimize queries"
```

## Iterative Planning

Plans evolve as you learn more:

### Add Tasks

```
Add a task to pln-001: Implement rate limiting on notification API
```

### Update Scope

```
Update pln-001 scope to exclude SMS notifications
```

### Add Dependencies

```
Make task-004 depend on task-003 in pln-001
```

### Supersede Items

When requirements change:

```
Supersede task-003 in pln-001 with a new approach
```

This creates a new version while preserving history.

## Planning Checklist

Before marking a plan ready for implementation:

**Business Alignment**
- [ ] Links to BRD acceptance criteria
- [ ] Business value is clear
- [ ] Stakeholders identified

**Technical Clarity**
- [ ] PRD defines technical approach
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

Aim for tasks that take 0.5-2 days.

### Clear Dependencies

```yaml
tasks:
  - id: task-001
    task: Setup database schema

  - id: task-002
    task: Create API endpoints
    depends_on: [task-001]  # ← Clear dependency
```

### Meaningful Scope

**In-Scope:** What you're building
**Out-of-Scope:** What you're explicitly NOT building

This prevents scope creep and aligns expectations.

### Test Early Planning

Write test cases during planning, not after implementation.

```yaml
test_cases:
  - name: Notification delivery
    description: User receives notification
    # ← Written during planning
```

### Link Everything

```yaml
# Plan links to BRD
criteria:
  requirement: brd-001-notifications
  criteria: crit-001

# References related decisions
references:
  - type: other
    name: Technology Choice
    description: See dec-001-use-firebase-messaging
```

## Common Planning Workflows

### Solo Developer

```
1. Quick BRD (business context)
2. Skip PRD for simple features
3. Detailed Plan with tasks
4. Start implementation
```

### Small Team

```
1. BRD (collaborate with stakeholders)
2. PRD (technical team review)
3. Decisions (team discusses)
4. Plan (lead developer creates)
5. Review and refine
6. Start implementation
```

### Larger Team

```
1. BRD (product manager)
2. PRD (tech lead)
3. Decisions (architecture review)
4. Multiple Plans (one per component)
5. Team review and approval
6. Assign to developers
```

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
- Multiple technical approaches possible
- High-risk implementation

**Add more Decisions:**
- New technology choices
- Architectural changes
- Trade-offs between options

## Related Guides

- See [Implementation Workflow](spec-mcp://guide/implementation-workflow) for executing plans
- See [Choosing Spec Types](spec-mcp://guide/choosing-spec-types) for when to use each type
- See [Best Practices](spec-mcp://guide/best-practices) for planning tips
- See [Spec Relationships](spec-mcp://guide/spec-relationships) for how specs connect
