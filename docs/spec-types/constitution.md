# Constitution Specification

## Purpose

A Constitution defines **project-wide principles** that guide all development decisions. Constitutions establish core principles through articles and help maintain consistency as the project evolves.

## Schema and Fields

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `"constitution"` | ✅ | Always set to `"constitution"` |
| `number` | `number` | ✅ | Auto-assigned sequential number |
| `slug` | `string` | ✅ | URL-friendly identifier (lowercase, hyphens) |
| `name` | `string` | ✅ | Display name |
| `description` | `string` | ✅ | Detailed description of the constitution's purpose |
| `articles` | `Article[]` | ✅ | Core principles (minimum 1 required) |
| `created_at` | `string` (ISO datetime) | ✅ | Auto-generated creation timestamp |
| `updated_at` | `string` (ISO datetime) | ✅ | Auto-generated update timestamp |

### Computed Field

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Computed from type, number, and slug (format: `con-XXX-slug`, e.g., `con-001-architecture-principles`) |

### Article Schema

Articles define the core principles of the constitution.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | ✅ | Article ID (format: `art-XXX`, e.g., `art-001`) |
| `title` | `string` | ✅ | Article title (e.g., "Library-First Principle") |
| `principle` | `string` | ✅ | The core principle or rule this article establishes |
| `rationale` | `string` | ✅ | Explanation of why this principle exists and its benefits |
| `examples` | `string[]` | ✅ | Concrete examples demonstrating the principle (default: `[]`) |
| `exceptions` | `string[]` | ✅ | Situations where this principle may not apply (default: `[]`) |
| `status` | `"needs-review" \| "active" \| "archived"` | ✅ | Article status (default: `"needs-review"`) |

### Article Status Values

| Value | Description |
|-------|-------------|
| `needs-review` | Article is drafted but not yet approved |
| `active` | Article is approved and in effect |
| `archived` | Article is no longer in effect |

## Creation Flow

The constitution creation follows a **dynamic multi-stage flow** where the total number of steps depends on how many articles are defined.

### Draft State Management

**After each step submission:**
1. The field value is validated
2. The draft is updated and saved to `.specs/.drafts/con-{slug}-{timestamp}.draft.yml`
3. The next step is determined by reading the draft state and finding the next empty field
4. Progress can be resumed at any time by continuing with the next empty field

**Automatic finalization:**
- When all required fields are filled (saturated state), the draft is automatically finalized
- The constitution is created via `operations.createConstitution()`
- The draft file is removed from `.specs/.drafts/`
- This ensures drafts are temporary and only active constitutions persist

### Stage 1: Foundation (Steps 1-3)

**Step 1: slug and name**
- **Prompt**: "Provide the slug and name for this constitution as an object:\n- slug: URL-friendly identifier (lowercase, hyphens only)\n- name: Display name"
- **Type**: object `{ slug: string, name: string }`
- **Example**:
  ```json
  {
    "slug": "architecture-principles",
    "name": "Architecture Principles"
  }
  ```
- **Validation**:
  - slug: Lowercase, hyphens only, must be unique
  - name: Non-empty, 3-100 characters
- **Next**: Draft file created at `.specs/.drafts/con-{slug}-{timestamp}.draft.yml`. Now describe the constitution's purpose.

**Step 2: description**
- **Prompt**: "Describe the purpose and scope of this constitution. What principles will it establish?"
- **Type**: string
- **Example**: "Core architectural principles governing all system design decisions"
- **Validation**: Non-empty, 20-500 characters
- **Next**: Draft updated with description. Now define article titles.

**Step 3: article_titles**
- **Prompt**: "Provide article titles as an array. Each article will establish one core principle. Recommended: 3-7 articles.\n\nExample: ['Library-First Principle', 'API-First Design', 'Test Coverage Standard']"
- **Type**: string[] (array of strings)
- **Example**: `["Library-First Principle", "API-First Design", "Test Coverage Standard"]`
- **Validation**:
  - Minimum 1 article required
  - Each title 5-100 characters
  - Recommended 3-7 articles (warning if outside range)
- **Next**: Draft updated with article titles. Total steps recalculated. Now fill in details for article 1: '{first_title}'

### Stage 2: Article Details (Steps 4-N)

For each article defined in step 3, cycle through 3 substeps:

**Step 4 + (article_index × 3): article_{i}_principle_and_rationale**
- **Prompt**: "Article {i+1} of {total}: '{article_title}'\n\nDefine the core principle and explain why it exists. Provide as an object with two fields:\n- principle: The rule or guideline this article establishes\n- rationale: Why this principle exists and its benefits"
- **Type**: object `{ principle: string, rationale: string }`
- **Example**:
  ```json
  {
    "principle": "Prefer libraries over services when functionality can be shared as code",
    "rationale": "Libraries reduce operational overhead, simplify deployment, and promote code reuse. Services should only be used when independent deployment or scaling is required."
  }
  ```
- **Validation**:
  - Both fields required and non-empty
  - principle: 10-300 characters
  - rationale: 20-1000 characters
- **Next**: Draft updated with principle and rationale. Now provide concrete examples for '{article_title}'

**Step 5 + (article_index × 3): article_{i}_examples**
- **Prompt**: "Article {i+1} of {total}: '{article_title}'\n\nProvide concrete examples that demonstrate when and how to apply this principle. Provide as an array of strings."
- **Type**: string[]
- **Example**:
  ```json
  ["Use @company/auth-lib for authentication logic in multiple apps", "Use @company/validation-lib for shared validation rules"]
  ```
- **Validation**:
  - Can be empty array
  - Each example 10-200 characters
  - Recommended: 2-5 examples
- **Next**: Draft updated with examples. Now document any exceptions for '{article_title}'

**Step 6 + (article_index × 3): article_{i}_exceptions**
- **Prompt**: "Article {i+1} of {total}: '{article_title}'\n\nDocument situations where this principle may not apply or should be overridden. Provide as an array of strings. Use empty array [] if no exceptions."
- **Type**: string[]
- **Example**:
  ```json
  ["When functionality requires separate deployment lifecycle", "When service needs independent scaling"]
  ```
- **Validation**:
  - Can be empty array
  - Each exception 10-200 characters
- **Next**:
  - Draft updated with exceptions
  - If more articles remain: "Article {i+1} complete! Moving to article {i+2}: '{next_article_title}'"
  - If last article: "All articles complete! Finalizing constitution..."

### Stage 3: Finalization (Automatic)

Once all article details are provided:

1. **Auto-assign article IDs**: art-001, art-002, etc.
2. **Set all article statuses**: "needs-review" (default)
3. **Auto-generate timestamps**: created_at, updated_at
4. **Auto-assign constitution number**: Next available number
5. **Create the constitution** via `operations.createConstitution()`
6. **Delete the draft**
7. **Return success** with the full constitution spec

### Total Steps Calculation

```
total_steps = 3 + (number_of_articles × 3)
```

Examples:
- 3 articles: 3 + 9 = **12 steps**
- 5 articles: 3 + 15 = **18 steps**
- 7 articles: 3 + 21 = **24 steps**

## Example Constitution

```yaml
type: constitution
number: 1
slug: architecture-principles
name: Architecture Principles
description: Core architectural principles governing all system design decisions
articles:
  - id: art-001
    title: Library-First Principle
    principle: Prefer libraries over services when functionality can be shared as code
    rationale: |
      Libraries reduce operational overhead, simplify deployment, and promote code reuse.
      Services should only be used when independent deployment or scaling is required.
    examples:
      - "Use @company/auth-lib for authentication logic in multiple apps"
      - "Use @company/validation-lib for shared validation rules"
    exceptions:
      - "When functionality requires separate deployment lifecycle"
      - "When service needs independent scaling"
      - "When strong isolation is required for security"
    status: active

  - id: art-002
    title: API-First Design
    principle: All public interfaces must be defined as API contracts before implementation
    rationale: Ensures clear contracts, enables parallel development, improves testing
    examples:
      - "Define OpenAPI spec before implementing REST endpoints"
      - "Define GraphQL schema before implementing resolvers"
    exceptions: []
    status: active

  - id: art-003
    title: Test Coverage Standard
    principle: All production code must have minimum 90% test coverage
    rationale: High test coverage prevents regressions and ensures code quality
    examples:
      - "Unit tests for all business logic functions"
      - "Integration tests for all API endpoints"
    exceptions:
      - "Generated code (migrations, schemas)"
      - "Third-party library wrappers with minimal logic"
    status: active
created_at: "2025-01-15T10:00:00Z"
updated_at: "2025-01-15T10:00:00Z"
```

## Relationship to Other Specs

Constitutions are **standalone principles** that guide development decisions across the project. They don't formally reference other specs, nor are they formally referenced by them.

**Usage Pattern:**
- Constitutions establish principles
- Developers reference these principles when creating requirements, components, and plans
- Think of constitutions as project documentation that provides guidance, not enforcement

## Best Practices

1. **Start with 3-7 Core Principles** - Don't create too many articles initially
2. **Be Specific** - Vague principles like "write good code" are not useful
3. **Include Examples** - Concrete examples help developers understand application
4. **Document Exceptions** - No rule is absolute; document when principles don't apply
5. **Use Article Status** - Start articles with `needs-review`, activate when approved, archive when obsolete
6. **Edit Articles Directly** - Update articles as needed; no complex amendment tracking
7. **Create Early or Late** - Can be created at project start or evolved over time
8. **Reference in Documentation** - Mention relevant constitution articles when creating other specs
