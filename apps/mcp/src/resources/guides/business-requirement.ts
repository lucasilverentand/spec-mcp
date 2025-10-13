export const businessRequirementGuide = {
	uri: "spec-mcp://guide/business-requirement",
	name: "Business Requirement Guide",
	description:
		"When and how to use Business Requirements to capture stakeholder needs and product features",
	mimeType: "text/markdown",
	content: `# Business Requirement Guide

**Goal**: Understand when and how to use Business Requirements (BRDs) to capture stakeholder needs and product features.

## What is a Business Requirement?

A Business Requirement captures **what** needs to be built and **why** it matters to users, customers, or the business—without prescribing implementation details.

## When to Use a Business Requirement

✅ **Use a Business Requirement when:**
- Defining a new feature or product capability
- Documenting user needs or pain points
- Setting acceptance criteria for a feature
- Communicating requirements to technical teams
- Planning product roadmaps or releases

❌ **Don't use a Business Requirement for:**
- Technical implementation details (use Technical Requirement or Plan)
- Architecture decisions (use Decision)
- System components (use Component)
- Task tracking (use Plan)

## Key Components

### Required Fields
- **Title**: Clear, concise feature name (e.g., "User Profile Management")
- **Description**: What the feature does and why it matters
- **Stakeholders**: Who requested or benefits from this
- **Success Metrics**: How you'll measure success
- **Acceptance Criteria**: Conditions that must be met

### Optional Fields
- **User Stories**: Specific user scenarios
- **Priority**: Business priority (critical, high, medium, low)
- **Target Release**: Planned release version or date
- **Dependencies**: Other BRDs this depends on
- **Assumptions**: What you're assuming is true
- **Constraints**: Limitations or restrictions
- **Risks**: Potential issues or concerns

## Common Patterns

### New Feature
\`\`\`yaml
title: Social Media Login
description: Allow users to sign in using their Google, Facebook, or GitHub accounts
stakeholders:
  - Product Team (faster onboarding)
  - Users (convenience)
success_metrics:
  - 40% of new users use social login
  - 15% reduction in signup abandonment
acceptance_criteria:
  - Users can sign in with Google, Facebook, or GitHub
  - Email addresses from social accounts are verified
  - Users can link/unlink social accounts from profile
  - Terms of service are displayed before first login
\`\`\`

### User Experience Improvement
\`\`\`yaml
title: Search with Filters
description: Enable users to filter search results by category, date, and price
stakeholders:
  - End Users (better search experience)
  - Customer Success (fewer support tickets)
success_metrics:
  - 50% of searches use at least one filter
  - 20% increase in search-to-purchase conversion
acceptance_criteria:
  - Filter panel shows on search results page
  - Users can filter by category, date range, and price range
  - Filters update results instantly without page reload
  - Selected filters persist across navigation
\`\`\`

### Business Process Change
\`\`\`yaml
title: Automated Invoice Reminders
description: Send automatic email reminders for unpaid invoices
stakeholders:
  - Finance Team (reduce manual follow-up)
  - Customers (avoid missed payments)
success_metrics:
  - 30% reduction in overdue invoices
  - 60% of reminders result in payment within 7 days
acceptance_criteria:
  - First reminder sent 3 days before due date
  - Second reminder sent on due date
  - Final reminder sent 3 days after due date
  - Reminders stop when invoice is paid
  - Admins can disable reminders per customer
\`\`\`

## User Stories

User stories follow the format: **"As a [role], I want to [action], so that [benefit]"**

\`\`\`yaml
user_stories:
  - story: As a shopper, I want to save items to a wishlist, so that I can purchase them later
    acceptance_criteria:
      - Users can add/remove items from wishlist
      - Wishlist persists across sessions
      - Users can view wishlist from any page
  - story: As a store admin, I want to see wishlist analytics, so that I can identify popular products
    acceptance_criteria:
      - Dashboard shows most wishlisted items
      - Data refreshes daily
\`\`\`

## Success Metrics

Define measurable outcomes to validate the requirement's business value:

\`\`\`yaml
success_metrics:
  - metric: Increase user engagement
    target: 25% more daily active users
    measurement: Google Analytics DAU
  - metric: Reduce support tickets
    target: 40% fewer password reset requests
    measurement: Zendesk ticket volume
  - metric: Improve conversion
    target: 15% higher checkout completion rate
    measurement: Funnel analysis in Mixpanel
\`\`\`

## Acceptance Criteria

Clear, testable conditions that define when the requirement is complete:

### Good Acceptance Criteria
✅ **Specific**: "Users can upload images up to 10MB in JPG, PNG, or GIF format"
✅ **Testable**: "Search results appear within 2 seconds for 95% of queries"
✅ **User-focused**: "Users receive email confirmation within 5 minutes of signup"

### Poor Acceptance Criteria
❌ **Vague**: "System should be fast"
❌ **Technical**: "Use Redis for caching"
❌ **Implementation detail**: "Create a UserService class"

## Dependencies and Relationships

### Depends On
Link to other BRDs that must be completed first:
\`\`\`yaml
depends_on:
  - brd-045-user-authentication
  - brd-067-payment-gateway
\`\`\`

### Related Technical Requirements
Link to TRDs that implement this BRD:
\`\`\`yaml
related_specs:
  - trd-101-oauth-integration
  - trd-102-session-management
\`\`\`

### Related Plans
Link to implementation plans:
\`\`\`yaml
related_specs:
  - plan-023-social-login-implementation
\`\`\`

## Priority Levels

- **critical**: Must have for launch, blocks other work
- **high**: Important for success, schedule early
- **medium**: Valuable but not urgent (default)
- **low**: Nice to have, can defer
- **deferred**: Decided not to do now

## Best Practices

### Focus on Outcomes, Not Solutions
**Good**: "Users need to find products quickly"
**Bad**: "Implement Elasticsearch for search"

### Make Criteria Measurable
**Good**: "Load time < 3 seconds for 95% of requests"
**Bad**: "Application should be performant"

### Write from User Perspective
**Good**: "As a customer, I want to track my order so I know when it will arrive"
**Bad**: "System shall update tracking_status field in orders table"

### Keep It Business-Focused
Avoid technical jargon. Write so stakeholders, designers, and developers all understand.

### Link to Context
\`\`\`yaml
references:
  - User research findings (Oct 2024)
  - Competitor analysis: Shopify, BigCommerce
  - Support ticket analysis #234
\`\`\`

### Validate Assumptions
\`\`\`yaml
assumptions:
  - Users have valid email addresses
  - Payment gateway supports recurring billing
  - Legal has approved terms of service changes
\`\`\`

### Document Constraints
\`\`\`yaml
constraints:
  - Must comply with GDPR data privacy rules
  - Cannot store credit card numbers
  - Mobile app must support iOS 14+ and Android 10+
\`\`\`

### Identify Risks Early
\`\`\`yaml
risks:
  - Third-party API may have rate limits
  - Users may resist two-factor authentication
  - Peak traffic could exceed current infrastructure
\`\`\`

## Complete Example

\`\`\`yaml
title: Multi-Language Support
description: Enable users to view the application in their preferred language
stakeholders:
  - International users (better experience)
  - Product team (expand to new markets)
  - Support team (reduce language-related tickets)
priority: high
target_release: v2.5
success_metrics:
  - 60% of non-English users switch to their language
  - 25% reduction in language-related support tickets
  - 50% increase in signups from target markets
acceptance_criteria:
  - Users can select language from account settings
  - Interface text updates immediately without reload
  - Language preference persists across sessions
  - Support for English, Spanish, French, German, Japanese
  - All user-facing text is translated (UI, emails, notifications)
user_stories:
  - story: As a Spanish-speaking user, I want to use the app in Spanish, so I can understand all features
    acceptance_criteria:
      - Language selector visible in header
      - All UI elements translated
      - Date/time formats use locale conventions
depends_on:
  - brd-089-user-preferences
assumptions:
  - Professional translations will be provided by external vendor
  - RTL languages (Arabic, Hebrew) deferred to v2.6
constraints:
  - Must support Unicode UTF-8 encoding
  - Translation files must be under 500KB per language
risks:
  - Some technical terms may not translate well
  - Third-party libraries may not support all languages
references:
  - User survey: 78% of international users want native language
  - Market research: Spanish and German are top priorities
\`\`\`

## Related Guides

- [Choosing Spec Types](spec-mcp://guide/choosing-spec-types) - When to use BRDs vs other types
- [Technical Requirement Guide](spec-mcp://guide/technical-requirement) - For implementation requirements
- [Spec Relationships](spec-mcp://guide/spec-relationships) - How BRDs connect to TRDs and Plans
- [Business Requirement Schema](spec-mcp://schema/business-requirement) - Complete field reference`,
} as const;
