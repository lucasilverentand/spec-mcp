# MCP Resources

This directory contains static resources exposed via the MCP (Model Context Protocol) server.

## Resource Types

### Guides (guides.ts)
Documentation guides that explain concepts, workflows, and best practices.

**Available Guides:**
- `spec-mcp://guide/spec-types` - Complete guide to all spec types
- `spec-mcp://guide/getting-started` - Quick start guide (placeholder)
- `spec-mcp://guide/planning-workflow` - Planning workflow guide (placeholder)
- `spec-mcp://guide/implementation-workflow` - Implementation workflow guide (placeholder)
- `spec-mcp://guide/best-practices` - Best practices guide (placeholder)
- `spec-mcp://guide/query-guide` - Query guide (placeholder)

**Format:** Markdown (`text/markdown`)

### JSON Schemas (json-schemas.ts)
Pure JSON Schema definitions for each spec type, generated from Zod schemas.

**Available Schemas:**
- `spec-mcp://schema/plan` - Plan JSON Schema
- `spec-mcp://schema/business-requirement` - Business Requirement (BRD) JSON Schema
- `spec-mcp://schema/technical-requirement` - Technical Requirement (PRD) JSON Schema
- `spec-mcp://schema/decision` - Decision (DEC) JSON Schema
- `spec-mcp://schema/component` - Component (CMP) JSON Schema
- `spec-mcp://schema/constitution` - Constitution (CON) JSON Schema
- `spec-mcp://schema/milestone` - Milestone (MLS) JSON Schema

**Format:** JSON Schema (`application/schema+json`)

**Note:** These are pure schemas with no additional documentation. For usage examples and explanations, see the guides.

## Usage

These resources are automatically registered when the MCP server starts. Claude can access them via the MCP protocol:

```typescript
// List all resources
const resources = await server.resources.list();

// Read a JSON schema
const planSchema = await server.resources.read({
  uri: "spec-mcp://schema/plan"
});

// Read a guide
const specTypesGuide = await server.resources.read({
  uri: "spec-mcp://guide/spec-types"
});
```

## Adding New Resources

### Guides
1. Create the markdown file in `/docs/guides/`
2. Add an entry to the `guides` array in `scripts/embed-guides.ts`
3. Run `pnpm embed-guides` to regenerate `guides.ts`

### JSON Schemas
Schemas are automatically generated from Zod schemas:
1. Update the Zod schema in `packages/schemas/src/specs/`
2. Run `pnpm generate-schemas` to regenerate `json-schemas.ts`
3. Schemas are generated using `zod-to-json-schema`

## Build Process

- **Guides**: Embedded at build time via the `embed-guides` script
- **JSON Schemas**: Generated at build time via the `generate-schemas` script
- **Both**: Registered in `src/register-resources.ts`
- **Prebuild**: Both scripts run automatically before building (`pnpm prebuild`)
