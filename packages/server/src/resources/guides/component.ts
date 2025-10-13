export const componentGuide = {
	uri: "spec-mcp://guide/component",
	name: "Component Guide",
	description: "Guide for creating and managing specification components",
	mimeType: "text/markdown",
	content: `# Component Guide

## Overview

Components are the fundamental building blocks of specifications. They represent distinct features, modules, or logical units of your system that can be developed and tracked independently.

## What is a Component?

A component is a self-contained unit that:
- Has clear boundaries and responsibilities
- Can be developed independently
- Has measurable completion criteria
- Relates to other components through explicit relationships

## Component Structure

### Required Fields

\`\`\`yaml
id: unique-identifier
name: Human-readable name
status: draft | active | completed | deprecated
type: feature | module | system | integration
description: Clear explanation of purpose and scope
\`\`\`

### Optional Fields

\`\`\`yaml
dependencies: [component-ids]  # Components this depends on
priority: critical | high | medium | low
tags: [tag1, tag2]  # For categorization
metadata:  # Custom fields
  team: team-name
  estimate: duration
\`\`\`

## Component Types

### Feature
User-facing functionality or capability
\`\`\`yaml
type: feature
name: User Authentication
\`\`\`

### Module
Internal system component or service
\`\`\`yaml
type: module
name: Payment Processing Engine
\`\`\`

### System
Infrastructure or platform component
\`\`\`yaml
type: system
name: Database Cluster
\`\`\`

### Integration
External system connection
\`\`\`yaml
type: integration
name: Stripe Payment Gateway
\`\`\`

## Component Status Lifecycle

1. **draft** - Initial planning phase
2. **active** - Currently in development
3. **completed** - Implementation finished
4. **deprecated** - No longer in use

## Dependencies

Define dependencies to establish build order:

\`\`\`yaml
id: shopping-cart
dependencies:
  - user-authentication
  - product-catalog
\`\`\`

This means:
- Shopping cart cannot start until dependencies are completed
- Dependency graph prevents circular references
- Build order is automatically determined

## Best Practices

### Naming
- Use clear, descriptive names
- Follow consistent naming conventions
- Avoid abbreviations unless universally understood

### Scope
- Keep components focused and cohesive
- Split large components into smaller ones
- Each component should have a single clear purpose

### Dependencies
- Minimize dependencies where possible
- Make dependencies explicit
- Avoid circular dependencies

### Status Updates
- Keep status current
- Update status when work state changes
- Use consistent criteria for status changes

## Common Patterns

### Layered Architecture
\`\`\`yaml
# Presentation Layer
- id: web-ui
  dependencies: [api-gateway]

# Application Layer
- id: api-gateway
  dependencies: [business-logic]

# Domain Layer
- id: business-logic
  dependencies: [data-access]

# Data Layer
- id: data-access
  dependencies: []
\`\`\`

### Microservices
\`\`\`yaml
- id: user-service
  type: module

- id: order-service
  type: module
  dependencies: [user-service]

- id: notification-service
  type: module
  dependencies: [user-service, order-service]
\`\`\`

### Feature Flags
\`\`\`yaml
- id: new-checkout-flow
  type: feature
  metadata:
    feature_flag: checkout_v2
    rollout_percentage: 10
\`\`\`

## Examples

### Basic Component
\`\`\`yaml
id: user-profile
name: User Profile Management
type: feature
status: active
description: |
  Allows users to view and edit their profile information
  including name, email, avatar, and preferences.
\`\`\`

### Component with Dependencies
\`\`\`yaml
id: order-history
name: Order History
type: feature
status: draft
description: Display past orders with filtering and search
dependencies:
  - user-authentication
  - order-service
priority: high
tags: [ecommerce, user-facing]
\`\`\`

### Complex Component
\`\`\`yaml
id: payment-processing
name: Payment Processing System
type: module
status: active
description: |
  Handles all payment transactions including:
  - Credit card processing
  - Refunds and cancellations
  - Payment method management
  - Transaction history
dependencies:
  - user-authentication
  - order-service
priority: critical
metadata:
  team: payments
  security_review: required
  compliance: PCI-DSS
tags: [payments, critical, security]
\`\`\`

## Querying Components

### By Status
\`\`\`typescript
specManager.query({
  status: 'active'
})
\`\`\`

### By Type
\`\`\`typescript
specManager.query({
  type: 'feature'
})
\`\`\`

### By Dependencies
\`\`\`typescript
// Find components that depend on a specific component
specManager.query({
  dependencies: { includes: 'user-authentication' }
})
\`\`\`

### Complex Queries
\`\`\`typescript
specManager.query({
  status: ['active', 'draft'],
  type: 'feature',
  priority: ['critical', 'high']
})
\`\`\`

## Tips

1. **Start Small**: Begin with high-level components and refine
2. **Review Regularly**: Update components as understanding evolves
3. **Document Decisions**: Use description field for context
4. **Track Progress**: Keep status field current
5. **Manage Dependencies**: Review and optimize dependency chains
6. **Use Metadata**: Add custom fields for team-specific needs
7. **Tag Consistently**: Establish tagging conventions early

## Related Concepts

- **Milestones**: Group components into releases
- **Constitution**: Define rules and constraints for components
- **Queries**: Filter and analyze component relationships
`,
} as const;
