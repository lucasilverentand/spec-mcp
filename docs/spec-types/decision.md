# Decision Specification

## Purpose

A Decision documents **architectural and technical choices** made during system design and implementation. Decisions capture the context, alternatives considered, rationale, and consequences of significant choices that shape the system.

Decisions serve as institutional memory, helping teams understand why specific technologies were chosen, what alternatives were rejected, what trade-offs were accepted, and when decisions might need revisiting.

## Schema and Fields

### Core Fields

| Field                  | Type                                                       | Required | Description                                       |
| ---------------------- | ---------------------------------------------------------- | -------- | ------------------------------------------------- |
| `type`                 | `"decision"`                                               | ✅       | Always set to `"decision"`                        |
| `number`               | `number`                                                   | ✅       | Auto-assigned sequential number                   |
| `slug`                 | `string`                                                   | ✅       | URL-friendly identifier (lowercase, hyphens)      |
| `name`                 | `string`                                                   | ✅       | Display name                                      |
| `description`          | `string`                                                   | ✅       | Brief summary                                     |
| `decision`             | `string`                                                   | ✅       | Clear statement of what was decided               |
| `context`              | `string`                                                   | ✅       | Situation or problem that prompted this decision  |
| `status`               | `"proposed" \| "accepted" \| "deprecated"`                 | ✅       | Current status (default: `"proposed"`)            |
| `alternatives`         | `string[]`                                                 | ✅       | Options considered but not chosen (default: `[]`) |
| `consequences`         | `Consequences`                                             | ✅       | Positive and negative outcomes                    |
| `affects_components`   | `ComponentId[]`                                            | ✅       | Components impacted (default: `[]`)               |
| `affects_requirements` | `RequirementId[]`                                          | ✅       | Requirements related (default: `[]`)              |
| `affects_plans`        | `PlanId[]`                                                 | ✅       | Plans impacted (default: `[]`)                    |
| `informed_by_articles` | `ArticleId[]`                                              | ✅       | Constitution articles that informed this decision (default: `[]`) |
| `supersedes`           | `DecisionId`                                               | ❌       | Previous decision this replaces                   |
| `references`           | `Reference[]`                                              | ✅       | Supporting documentation (default: `[]`)          |
| `created_at`           | `string` (ISO datetime)                                    | ✅       | Auto-generated creation timestamp                 |
| `updated_at`           | `string` (ISO datetime)                                    | ✅       | Auto-generated update timestamp                   |

### Computed Field

| Field | Type     | Description                                                                                        |
| ----- | -------- | -------------------------------------------------------------------------------------------------- |
| `id`  | `string` | Computed from type, number, and slug (format: `dec-XXX-slug`, e.g., `dec-001-database-postgresql`) |

### Consequences Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `positive` | `string[]` | ✅ | Beneficial outcomes (default: `[]`) |
| `negative` | `string[]` | ✅ | Drawbacks or costs (default: `[]`) |
| `risks` | `string[]` | ✅ | Potential risks (default: `[]`) |
| `mitigation` | `string[]` | ✅ | How risks are mitigated (default: `[]`) |

### Status Values

| Status | Description |
|--------|-------------|
| `proposed` | Decision has been drafted but not yet accepted |
| `accepted` | Decision is active and should be followed |
| `deprecated` | Decision is no longer recommended |
| `superseded` | **Auto-set** when another decision references this via `supersedes` field |

### Status Lifecycle

```
proposed → accepted → deprecated
           ↑            ↓
           └────────────┘

Any status → superseded (auto-set when superseded by another decision)
```

## Creation Flow

The decision creation follows a **4-stage flow** that captures the decision context, analysis, connections, and metadata.

### Draft State Management

**After each step submission:**

1. The field value is validated
2. The draft is updated and saved to `.specs/.drafts/dec-{slug}-{timestamp}.draft.yml`
3. The next step is determined by reading the draft state and finding the next empty field
4. Progress can be resumed at any time by continuing with the next empty field

**Automatic finalization:**

- When all required fields are filled (saturated state), the draft is automatically finalized
- The decision is created via `operations.createDecision()`
- The draft file is removed from `.specs/.drafts/`
- This ensures drafts are temporary and only active decisions persist

### Stage 1: Foundation (Steps 1-3)

**Step 1: slug and name**

- **Prompt**: "Provide the slug and name for this decision as an object:\n- slug: URL-friendly identifier (lowercase, hyphens only)\n- name: Display name"
- **Type**: object `{ slug: string, name: string }`
- **Example**: `{ "slug": "database-postgresql", "name": "Choose PostgreSQL for Primary Database" }`
- **Validation**: slug must be unique, lowercase, hyphens only; name 3-100 characters
- **Next**: Draft file created. Now provide the decision statement.

**Step 2: decision**

- **Prompt**: "What was decided? Provide a clear, actionable statement of the decision."
- **Type**: string
- **Example**: "Use PostgreSQL as the primary relational database for user data and transactional workloads"
- **Validation**: Non-empty, 20-500 characters
- **Next**: Draft updated with decision. Now describe the context.

**Step 3: context and description**

- **Prompt**: "Provide the context and brief description as an object:\n- context: The situation, problem, or need that prompted this decision\n- description: Brief summary for quick reference"
- **Type**: object `{ context: string, description: string }`
- **Example**:
  ```json
  {
    "context": "We need a database that supports ACID transactions for financial data, complex queries with joins, JSON support for flexible schemas, and strong consistency guarantees.",
    "description": "Selected PostgreSQL as our primary relational database to support ACID transactions, complex queries, and flexible JSON data."
  }
  ```
- **Validation**: Both fields required, 20-1000 characters for context, 20-500 for description
- **Next**: Draft updated. Now document alternatives considered.

### Stage 2: Analysis (Steps 4-5)

**Step 4: alternatives**

- **Prompt**: "What alternatives were considered? Provide as an array of strings."
- **Type**: string[]
- **Example**: `["MongoDB", "MySQL", "DynamoDB"]`
- **Validation**: Can be empty array
- **Next**: Draft updated with alternatives. Now analyze consequences.

**Step 5: consequences**

- **Prompt**: "What are the consequences? Document positive outcomes, negative impacts, risks, and mitigation strategies."
- **Type**: object `{ positive: string[], negative: string[], risks: string[], mitigation: string[] }`
- **Example**:
  ```json
  {
    "positive": ["Strong ACID guarantees", "Advanced JSON support"],
    "negative": ["Complex horizontal scaling", "Higher operational overhead"],
    "risks": ["Single point of failure without HA"],
    "mitigation": ["Implement PgBouncer", "Set up streaming replication"]
  }
  ```
- **Validation**: Must include at least one positive and one negative; if risks listed, mitigation should be provided
- **Next**: Draft updated. Now link to affected specs.

### Stage 3: Connections (Steps 6-8)

**Step 6: affects_components, affects_requirements, and affects_plans**

- **Prompt**: "Which components, requirements, and plans are affected by this decision? Provide as an object with three arrays."
- **Type**: object `{ affects_components: ComponentId[], affects_requirements: RequirementId[], affects_plans: PlanId[] }`
- **Example**: `{ "affects_components": ["svc-001-auth-service"], "affects_requirements": ["req-001-data-integrity"], "affects_plans": ["pln-001-migration"] }`
- **Validation**: All arrays can be empty; IDs must follow correct format
- **Next**: Draft updated. Now document constitution articles that informed this decision.

**Step 7: informed_by_articles**

- **Prompt**: "Which constitution articles guided or informed this decision? Provide as an array of article IDs."
- **Type**: ArticleId[] (array of strings)
- **Example**: `["con-001-architecture/art-001", "con-001-architecture/art-003"]`
- **Validation**: Can be empty array; article IDs must follow format: `{constitution-id}/{article-id}`
- **Next**: Draft updated. Now add supporting references.

**Step 8: references**

- **Prompt**: "Add supporting references: research articles, benchmarks, documentation, or proof-of-concepts."
- **Type**: Reference[] (array of objects)
- **Example**:
  ```json
  [
    {
      "type": "url",
      "name": "PostgreSQL vs MongoDB Benchmark",
      "description": "Performance comparison",
      "url": "https://example.com/benchmark",
      "importance": "high"
    }
  ]
  ```
- **Validation**: Can be empty array; each reference must have name and description
- **Next**: Draft updated. Now set status and metadata.

### Stage 4: Finalization (Steps 9-10)

**Step 9: status**

- **Prompt**: "What is the status of this decision?"
- **Type**: string
- **Example**: `"accepted"`
- **Validation**: Must be one of: proposed, accepted, deprecated
- **Next**: Draft updated. Now specify if this supersedes another decision.

**Step 10: supersedes**

- **Prompt**: "Does this decision replace a previous decision? If so, provide the decision ID."
- **Type**: string (optional)
- **Example**: `"dec-005-database-mysql"`
- **Validation**: If provided, must be valid decision ID format
- **Next**: All required fields complete! Finalizing decision...

### Finalization (Automatic)

Once all required fields are provided:

1. **Auto-assign number**: Next available sequential number
2. **Auto-generate timestamps**: created_at, updated_at
3. **Create the decision** via `operations.createDecision()`
4. **If supersedes is set**: Automatically update the superseded decision's status to "superseded"
5. **Delete the draft**
6. **Return success** with the full decision spec

## Example Decision

```yaml
type: decision
number: 1
slug: database-postgresql
name: Choose PostgreSQL for Primary Database
description: Selected PostgreSQL as our primary relational database to support ACID transactions, complex queries, and flexible JSON data while maintaining strong consistency guarantees for financial operations.
status: accepted

decision: Use PostgreSQL as the primary relational database for user data and transactional workloads

context: |
  We need a database that supports:
  - ACID transactions for financial data
  - Complex queries with joins and aggregations
  - JSON support for flexible schemas
  - Strong consistency guarantees
  - Reliable backup and recovery

  Our application handles monetary transactions and requires data integrity above all else.

alternatives:
  - MongoDB
  - MySQL
  - DynamoDB

consequences:
  positive:
    - Strong ACID guarantees for financial transactions
    - Advanced JSONB support for flexible data modeling
    - Rich extension ecosystem (PostGIS, full-text search)
    - Excellent query optimizer for complex queries
    - Strong consistency simplifies application logic
    - Battle-tested reliability
  negative:
    - More complex horizontal scaling
    - Higher operational overhead
    - Steeper learning curve
    - Vertical scaling limitations
    - Complex backup at scale
  risks:
    - Single point of failure without HA
    - Query performance degradation
    - Connection pool exhaustion
    - Disk space management issues
  mitigation:
    - Implement PgBouncer for connection pooling
    - Set up streaming replication for HA
    - Use read replicas for scaling reads
    - Query monitoring and optimization
    - Automated backups with PITR
    - Table partitioning for large tables

affects_components:
  - svc-001-auth-service
  - svc-002-user-service
  - svc-003-payment-service

affects_requirements:
  - req-001-data-integrity
  - req-002-transaction-support

affects_plans:
  - pln-001-database-migration

informed_by_articles:
  - con-001-architecture/art-001

supersedes: null

references:
  - type: url
    name: PostgreSQL vs MongoDB Performance Benchmark
    description: Independent benchmark comparing OLTP performance
    url: https://example.com/postgres-mongo-benchmark
    importance: high
  - type: documentation
    name: PostgreSQL JSONB Documentation
    description: Official docs on JSONB performance and indexing
    library: postgresql
    search_term: JSONB
    importance: medium

created_at: "2025-01-15T10:00:00Z"
updated_at: "2025-01-15T14:30:00Z"
```

## Best Practices

1. **Document While Fresh** - Create decisions immediately after they're made, while context is clear
2. **Include Alternatives** - List other options that were considered
3. **Be Honest About Negatives** - Acknowledge trade-offs and limitations
4. **Link to Evidence** - Include benchmarks, POCs, and research that informed the decision
5. **Keep Updated** - If a decision is superseded, update the status and link to the new decision
6. **Be Specific** - Vague decisions ("use best practices") aren't helpful
7. **Focus on Significant Decisions** - Don't document every minor choice
8. **Make Searchable** - Use clear slugs and names so decisions are easy to find

## Relationship to Other Specs

Decisions document **architectural choices** and relate to other specs through reference fields:

```
Constitution (con-001)
    ↓ governs principles for
Requirement (req-001) → affects_requirements points here
    ↓ informs need for
Decision (dec-001) ← YOU ARE HERE
    ↓ affects
Component (svc-001) ← affects_components points here
    ↓ implemented by
Plan (pln-001) - references components in tasks

Decision (dec-005) ← supersedes points here (old decision)
    ↓
Decision (dec-001) ← YOU ARE HERE
```
