# Shared Specification Documentation

This directory contains reusable documentation referenced by agents and commands.

## Directory Structure

### 📐 [schemas/](./schemas/)
Entity schema specifications

- **[requirement.md](./schemas/requirement.md)** - Requirement schema and field rules
- **[component.md](./schemas/component.md)** - Component schema and field rules
- **[plan.md](./schemas/plan.md)** - Plan schema and field rules
- **[README.md](./schemas/README.md)** - ID format reference and overview

### ✅ [best-practices/](./best-practices/)
Best practices and guidelines

- **[universal.md](./best-practices/universal.md)** - Universal practices (all spec types) + research + tools
- **[requirements.md](./best-practices/requirements.md)** - Requirement-specific practices + anti-patterns
- **[components.md](./best-practices/components.md)** - Component-specific practices + anti-patterns
- **[plans.md](./best-practices/plans.md)** - Plan-specific practices + anti-patterns

## Quick Reference

### For Requirement Work
- Schema: `schemas/requirement.md`
- Practices: `best-practices/universal.md` + `best-practices/requirements.md`

### For Component Work
- Schema: `schemas/component.md`
- Practices: `best-practices/universal.md` + `best-practices/components.md`

### For Plan Work
- Schema: `schemas/plan.md`
- Practices: `best-practices/universal.md` + `best-practices/plans.md`

## Validation

Use MCP tools to validate specifications:
- `guidance` - Validates against reasoning processes (7/10/12-step)
- `analyze` - System-wide analysis (dependencies, coverage, health, etc.)

See `best-practices/universal.md` for complete tool documentation.
