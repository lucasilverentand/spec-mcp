export const constitutionGuide = {
	uri: "spec-mcp://guide/constitution",
	name: "Constitution Guide",
	description: "Guide for creating and managing specification constitutions",
	mimeType: "text/markdown",
	content: `# Constitution Guide

## Overview

The constitution defines the rules, constraints, and principles that govern your specification. It establishes conventions, validates requirements, and ensures consistency across your project.

## What is a Constitution?

A constitution is a set of enforceable rules that:
- Define naming conventions and patterns
- Enforce structural requirements
- Validate dependencies and relationships
- Ensure consistency across components
- Guide decision-making

## Constitution Structure

\`\`\`yaml
conventions:
  # Naming patterns

constraints:
  # Structural requirements

principles:
  # Guiding philosophies

validation:
  # Automated checks
\`\`\`

## Sections

### Conventions

Define patterns and standards for consistency.

\`\`\`yaml
conventions:
  naming:
    components: "kebab-case"
    milestones: "v{major}.{minor}"

  structure:
    max_dependencies: 5
    required_fields: [id, name, type, status]

  tags:
    allowed: [frontend, backend, infrastructure, security]

  status_progression:
    - draft -> active
    - active -> completed
    - active -> deprecated
\`\`\`

### Constraints

Define hard requirements that must be satisfied.

\`\`\`yaml
constraints:
  dependencies:
    no_circular: true
    max_depth: 4

  components:
    min_description_length: 50
    require_owner: true

  milestones:
    max_components: 20
    require_date: true
\`\`\`

### Principles

Define guiding philosophies and best practices.

\`\`\`yaml
principles:
  - "Components should have a single clear purpose"
  - "Dependencies should be minimized"
  - "All changes must be documented"
  - "Security components require review"
  - "Breaking changes need migration path"
\`\`\`

### Validation

Define automated checks and rules.

\`\`\`yaml
validation:
  rules:
    - name: "No orphaned components"
      check: "all components must be in a milestone or marked standalone"

    - name: "Critical components need documentation"
      check: "components with priority=critical must have detailed description"

    - name: "Deprecated components have replacement"
      check: "status=deprecated must have metadata.replacement_id"
\`\`\`

## Common Patterns

### Naming Conventions

\`\`\`yaml
conventions:
  naming:
    components:
      pattern: "^[a-z][a-z0-9-]*[a-z0-9]$"
      examples:
        - user-authentication
        - payment-gateway
        - api-v2

    milestones:
      pattern: "^v\\d+\\.\\d+(\\.\\d+)?$"
      examples:
        - v1.0
        - v2.1.3

    tags:
      pattern: "^[a-z]+$"
      allowed: [frontend, backend, database, api, security]
\`\`\`

### Dependency Rules

\`\`\`yaml
constraints:
  dependencies:
    no_circular: true
    max_per_component: 5
    max_depth: 4

    forbidden:
      - [frontend, database]  # Frontend can't depend directly on database
      - [presentation, data]  # Layer violation

    required:
      security: [authentication]  # Security components must depend on auth
\`\`\`

### Type-Specific Rules

\`\`\`yaml
constraints:
  by_type:
    feature:
      require_fields: [description, priority]
      require_tags: [frontend|backend]

    integration:
      require_fields: [description, metadata.external_system]
      require_review: security

    system:
      require_fields: [description, metadata.sla]
      priority: [critical, high]
\`\`\`

### Status Rules

\`\`\`yaml
conventions:
  status_rules:
    draft:
      allow_incomplete: true
      require_fields: [id, name, type, description]

    active:
      require_fields: [id, name, type, status, description, priority]
      require_milestone: true

    completed:
      require_fields: [id, name, type, status, description, metadata.completed_date]
      immutable: [id, type]

    deprecated:
      require_fields: [id, name, type, status, metadata.replacement_id, metadata.deprecation_date]
\`\`\`

### Priority and Criticality

\`\`\`yaml
constraints:
  priority:
    critical:
      require_owner: true
      require_review: [security, architecture]
      max_dependencies: 3
      require_monitoring: true

    high:
      require_owner: true
      require_milestone: true

    medium:
      require_milestone: true

    low:
      allow_deferred: true
\`\`\`

## Validation Strategies

### Pre-commit Validation

\`\`\`yaml
validation:
  pre_commit:
    - validate_schema
    - check_naming_conventions
    - verify_no_circular_dependencies
    - ensure_required_fields
    - validate_references
\`\`\`

### Continuous Validation

\`\`\`yaml
validation:
  continuous:
    - check_milestone_dates
    - verify_component_progress
    - validate_dependency_completion
    - check_stale_components
\`\`\`

### Release Validation

\`\`\`yaml
validation:
  pre_release:
    - all_milestone_components_complete
    - no_broken_dependencies
    - all_critical_reviews_approved
    - documentation_complete
    - tests_passing
\`\`\`

## Examples

### Basic Constitution

\`\`\`yaml
conventions:
  naming:
    components: "kebab-case"

constraints:
  dependencies:
    no_circular: true
    max_per_component: 5

principles:
  - "Keep components focused and independent"
  - "Document all architectural decisions"
\`\`\`

### Team-Specific Constitution

\`\`\`yaml
conventions:
  naming:
    components: "^(feat|fix|infra|integration)-[a-z-]+$"
    milestones: "^sprint-\\d{2}-20\\d{2}$"

  structure:
    require_fields: [id, name, type, status, description, metadata.team, metadata.owner]

  tags:
    allowed: [frontend, backend, mobile, infrastructure, security, data]
    require_min: 1
    require_max: 3

constraints:
  dependencies:
    no_circular: true
    max_per_component: 5
    max_depth: 4

  components:
    min_description_length: 100
    require_acceptance_criteria: true

  priority_rules:
    critical:
      require_fields: [metadata.on_call, metadata.runbook]
      require_review: [security, architecture]

principles:
  - "All features must have acceptance criteria"
  - "Critical components require on-call and runbook"
  - "Security review required for integrations"
  - "Breaking changes need migration guide"
  - "Deprecations require 2 release notice"

validation:
  rules:
    - name: "Features in milestone"
      check: "type=feature must be in an active milestone"
      severity: error

    - name: "Owner assigned"
      check: "status=active must have metadata.owner"
      severity: error

    - name: "Stale draft warning"
      check: "status=draft for >30 days triggers warning"
      severity: warning

    - name: "Dependencies complete"
      check: "active components with incomplete dependencies"
      severity: warning
\`\`\`

### Security-Focused Constitution

\`\`\`yaml
conventions:
  security_classification:
    levels: [public, internal, confidential, restricted]
    default: internal

constraints:
  security:
    critical_components:
      require_review: [security, architecture]
      require_fields: [metadata.threat_model, metadata.security_tests]
      require_tags: [security]

    integrations:
      require_review: security
      require_fields: [metadata.data_classification, metadata.auth_method]

    data_handling:
      pii:
        require_review: [security, legal]
        require_fields: [metadata.data_retention, metadata.encryption]

principles:
  - "Security review required for all external integrations"
  - "PII handling requires legal review"
  - "Authentication required for all user-facing features"
  - "Encryption required for sensitive data"
  - "Security incidents require immediate escalation"
\`\`\`

## Best Practices

### Start Simple
Begin with basic conventions and add rules as needs emerge.

### Make it Enforceable
Only include rules you can validate automatically or through code review.

### Document Rationale
Explain why each rule exists in comments.

### Review Regularly
Update constitution as project evolves and team learns.

### Get Team Buy-in
Involve team in creating and updating constitution.

### Balance Flexibility and Structure
Rules should guide, not constrain unnecessarily.

## Implementing Validation

### Schema Validation
\`\`\`typescript
function validateComponent(component: Component, constitution: Constitution) {
  // Check required fields
  // Validate naming conventions
  // Verify dependencies
  // Check type-specific rules
  // Return validation results
}
\`\`\`

### Dependency Validation
\`\`\`typescript
function validateDependencies(components: Component[], constitution: Constitution) {
  // Check for circular dependencies
  // Validate dependency depth
  // Verify dependency completion
  // Check forbidden dependencies
}
\`\`\`

### Custom Rules
\`\`\`typescript
function validateCustomRules(components: Component[], rules: ValidationRule[]) {
  // Run each validation rule
  // Collect errors and warnings
  // Return validation report
}
\`\`\`

## Tips

1. **Version Your Constitution**: Track changes to rules over time
2. **Automate Validation**: Integrate checks into CI/CD pipeline
3. **Provide Examples**: Show correct patterns for each rule
4. **Graduated Severity**: Use errors, warnings, and info levels
5. **Allow Exceptions**: Provide mechanism for justified rule violations
6. **Document Exceptions**: Require explanation for any overrides
7. **Review Impact**: Test rule changes against existing components

## Related Concepts

- **Components**: Entities governed by constitution rules
- **Milestones**: Subject to constitution constraints
- **Validation**: Enforces constitution rules
- **Metadata**: Extended by constitution requirements
`,
} as const;
