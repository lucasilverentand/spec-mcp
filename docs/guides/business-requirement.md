# Business Requirement Guide

**Goal**: Understand when and how to use Business Requirements (BRDs) to capture business needs.

## What is a Business Requirement?

A BRD captures what the business needs, why it matters, who cares about it, and what value it delivers. It's written for stakeholders and focuses on outcomes, not implementation details.

## When to Use a BRD

✅ **Use a BRD when:**
- Capturing stakeholder needs and business goals
- Defining user-facing features or capabilities
- Justifying investment in a project
- Documenting business value (revenue, cost savings, satisfaction)
- Tracking multiple stakeholders with different interests

❌ **Don't use a BRD for:**
- Technical implementation details (use PRD instead)
- Architectural decisions (use Decision instead)
- Task breakdowns (use Plan instead)

## Key Components

### Required Fields
- **Business Value**: What business benefit this delivers (revenue, cost savings, satisfaction)
- **User Stories**: Who needs this and why ("As a..., I want..., so that...")
- **Acceptance Criteria**: What must be true for this to be complete

### Optional But Valuable
- **Stakeholders**: Who cares about this and why
- **References**: Market research, competitor analysis, user feedback

## Common Patterns

### Feature BRD
```yaml
title: User Authentication System
description: Users need secure account access for personalized experience
business_value:
  - type: customer-satisfaction
    value: Reduces friction in accessing personalized features
  - type: cost-savings
    value: Reduces support tickets for account access by 40%
user_stories:
  - role: registered user
    feature: securely log into my account
    benefit: I can access my personalized dashboard
stakeholders:
  - role: product-owner
    name: Jane Smith
    interest: Improve user retention and security
criteria:
  - description: Users can log in with email and password
    rationale: Core authentication requirement
```

### Improvement BRD
```yaml
title: Faster Page Load Times
description: Reduce page load times to improve user experience
business_value:
  - type: customer-satisfaction
    value: Every 100ms improvement increases conversion by 1%
  - type: revenue
    value: Estimated $50k annual revenue increase
user_stories:
  - role: website visitor
    feature: see content load quickly
    benefit: I don't get frustrated and leave
```

### Capability BRD
```yaml
title: Export Data to CSV
description: Users need to export their data for external analysis
business_value:
  - type: customer-satisfaction
    value: Power users can integrate with their own tools
user_stories:
  - role: power user
    feature: export my data to CSV format
    benefit: I can analyze it in Excel or other tools
```

## User Stories

Follow the format: **As a [role], I want [feature], so that [benefit]**

Good user stories:
- **Specific role**: "registered user" not just "user"
- **Clear feature**: "reset my password via email"
- **Obvious benefit**: "I can regain access to my account"

Examples:
```yaml
user_stories:
  - role: admin user
    feature: bulk update user permissions
    benefit: I can manage access efficiently

  - role: free tier user
    feature: upgrade to paid plan
    benefit: I can access premium features
```

## Stakeholders

Document who cares and why:

```yaml
stakeholders:
  - role: product-owner
    name: Jane Smith
    email: jane@example.com
    interest: Drive user adoption and retention

  - role: end-user
    name: App Users
    interest: Secure and convenient access

  - role: executive
    name: CEO
    interest: Reduce churn and increase revenue
```

## Acceptance Criteria

What must be true for this to be complete?

```yaml
criteria:
  - id: crit-001
    description: Users can log in with valid credentials within 3 seconds
    rationale: Performance requirement for good UX

  - id: crit-002
    description: Failed login shows clear error message
    rationale: User needs to understand what went wrong

  - id: crit-003
    description: Passwords are stored securely (bcrypt with salt)
    rationale: Security requirement for user data protection
```

## Best Practices

### Focus on Outcomes, Not Solutions
❌ Bad: "Use JWT tokens for authentication"
✅ Good: "Users can securely access their accounts"

### Quantify Business Value
❌ Bad: "Improves user experience"
✅ Good: "Reduces support tickets by 40%, saving $20k annually"

### Write for Stakeholders
- Use business language, not technical jargon
- Explain "why" before "what"
- Show ROI and business impact

### Link to Evidence
```yaml
references:
  - type: url
    name: User Survey Results
    url: https://docs.example.com/survey-2024
    description: 73% of users requested password reset feature
```

### Keep Criteria Testable
❌ Bad: "System should be fast"
✅ Good: "Page loads in under 2 seconds on 3G connection"

## BRD → PRD → Plan Flow

1. **BRD**: "Users need to reset forgotten passwords"
2. **PRD**: "Use email-based reset flow with time-limited tokens"
3. **Plan**: "Task 1: Email service, Task 2: Reset endpoint, Task 3: UI"

## Related Guides

- See [Technical Requirement Guide](spec-mcp://guide/technical-requirement) for technical specifications
- See [Choosing Spec Types](spec-mcp://guide/choosing-spec-types) for when to use BRDs
- View the [Business Requirement Schema](spec-mcp://schema/business-requirement) for complete field reference
