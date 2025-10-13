# Decision Interview Process

This document describes the interview process for creating a Decision entity.

## Overview

A Decision entity represents an architectural or technical decision record (ADR). It documents what was decided, why, and the consequences of that decision.

## Interview Stages

### Stage 1: Main Questions

These questions gather the core information about the decision:

#### Q-001: Title
**Question:** What is the title of this decision?

**Example Answer:** "Use PostgreSQL for Primary Database"

---

#### Q-002: Description
**Question:** Provide a detailed description of this decision.

**Example Answer:** "We have decided to use PostgreSQL as our primary relational database for all application data storage, replacing our previous MySQL setup."

---

#### Q-003: Decision Statement
**Question:** What was decided? (clear statement)

**Example Answer:** "We will migrate from MySQL to PostgreSQL 15 for all application databases and standardize on PostgreSQL for all future services."

---

#### Q-004: Context
**Question:** What situation or problem prompted this decision?

**Example Answer:** "Our MySQL setup was experiencing performance issues with complex queries, and we needed better support for JSON data types and full-text search. Additionally, the team has more expertise with PostgreSQL."

---

#### Q-005: Status
**Question:** What is the status of this decision? (proposed, accepted, deprecated, superseded)

**Example Answer:** "accepted"

---

#### Q-006: Supersedes
**Question:** Does this supersede a previous decision? (provide decision ID or leave blank)

**Example Answer:** "dec-003-mysql-database" or leave blank if this is a new decision

---

### Stage 2: Array Fields

After answering the main questions, you'll be asked about collection fields.

#### Consequences Collection

**Collection Question:** List the consequences of this decision (comma-separated descriptions, e.g., 'faster development', 'increased complexity')

**Example Answer:** "Better query performance, Improved JSON support, Migration effort required, Team training needed"

For each consequence listed, you'll answer:

1. **What type of consequence is this? (positive, negative, risk)**
   - Example: "positive" (for "Better query performance")
   - Example: "negative" (for "Migration effort required")
   - Example: "risk" (for "Team training needed")

2. **Describe this consequence**
   - Example: "Complex queries run 3-5x faster due to better query optimizer and indexing capabilities"
   - Example: "Requires 2-3 weeks of developer time to migrate existing MySQL databases and update application code"
   - Example: "Some team members may need training on PostgreSQL-specific features and best practices"

3. **What is the mitigation strategy? (optional, for negative/risk)**
   - For negative: "Schedule migration during low-traffic periods and implement feature flags for gradual rollout"
   - For risk: "Provide PostgreSQL training sessions and create internal documentation with best practices"
   - For positive: Leave blank

---

### Stage 3: Finalization

After all questions are answered and all array items are finalized, the system will generate the complete Decision entity with:
- Computed fields (type, number, slug)
- Status tracking (created_at, updated_at, completed, verified)
- All provided data structured according to the Decision schema
- References and alternatives (if provided)

## Tips

1. **Clear Statement**: The decision statement should be specific and actionable
2. **Context**: Explain the "why" - what problem are you solving?
3. **Status**: Most new decisions start as "proposed" and become "accepted" after review
4. **Consequences**: Include both positive and negative consequences for balanced view
5. **Mitigation**: For negative consequences and risks, always provide mitigation strategies
6. **Alternatives**: Consider documenting alternatives that were considered but not chosen
7. **Supersedes**: Reference previous decisions when this decision replaces or updates them

## Example Full Interview

**Title:** "Use React Query for Data Fetching"

**Description:** "Adopt React Query as our standard library for server state management and data fetching in all React applications."

**Decision:** "We will use React Query (TanStack Query) v4 for all data fetching, caching, and synchronization with backend APIs."

**Context:** "Our applications had inconsistent data fetching patterns, leading to stale data, unnecessary refetches, and complex loading state management. Each team was implementing their own solutions."

**Status:** "accepted"

**Supersedes:** "" (blank)

**Consequences:** "Automatic caching, Reduced boilerplate code, Learning curve, Bundle size increase"

For each consequence:
1. Automatic caching - positive - "React Query automatically caches data and handles revalidation, reducing API calls by 60-70%" - (no mitigation)
2. Reduced boilerplate - positive - "Eliminates need for custom hooks and state management for data fetching, reducing code by ~40%" - (no mitigation)
3. Learning curve - risk - "Team members need to learn React Query patterns and best practices" - "Conduct training workshop and create code examples repository"
4. Bundle size increase - negative - "Adds ~40KB to production bundle" - "Enable tree-shaking and lazy-load queries only when needed"
