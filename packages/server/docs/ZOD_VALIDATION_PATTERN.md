# Zod Validation Pattern

This document describes the Zod validation pattern used in the MCP server tools.

## Overview

All tool inputs are validated using Zod schemas in two places:
1. **Schema Definition**: MCP SDK uses the schema for client-side validation and documentation
2. **Runtime Validation**: Tool wrapper validates inputs at runtime before processing

## Pattern Structure

### 1. Schema File (`src/tools/schemas/[entity].ts`)

Create separate Zod schemas for each tool input:

```typescript
import { z } from "zod";

// Define reusable schemas
export const EntityIdSchema = z.string().regex(/^entity-\d{3}-[a-z0-9-]+$/);

// MCP SDK Input Schema (ZodRawShape - plain object with Zod values)
export const CreateEntityInputSchema = {
  name: z.string().describe("Entity name"),
  description: z.string().describe("Entity description"),
  priority: z.enum(["high", "medium", "low"]).describe("Priority level"),
};

// Zod Object Schema for runtime validation
export const CreateEntitySchema = z.object(CreateEntityInputSchema);

// Export TypeScript types
export type CreateEntityInput = z.infer<typeof CreateEntitySchema>;
```

**Key Points:**
- **InputSchema**: Plain object (ZodRawShape) for MCP SDK's `inputSchema` field
- **Schema**: Zod object schema for runtime validation in `wrapToolHandler`
- Both reference the same definitions to ensure consistency

### 2. Tool Registration (`src/tools/[entity].ts`)

Register tools using the schemas:

```typescript
import {
  CreateEntityInputSchema,
  CreateEntitySchema,
  type CreateEntityInput,
} from "./schemas/entity.js";

export function registerEntityTools(
  server: McpServer,
  operations: SpecOperations,
  context: ToolContext,
) {
  server.registerTool(
    "create-entity",
    {
      title: "Create Entity",
      description: "Create a new entity",
      inputSchema: CreateEntityInputSchema, // MCP SDK schema (ZodRawShape)
    },
    wrapToolHandler(
      "create-entity",
      async (input: CreateEntityInput) => {
        // Input is already validated by wrapToolHandler
        // Additional sanitization if needed
        const sanitized = context.inputValidator.sanitizeString(input.name);

        const result = await operations.createEntity({
          ...input,
          name: sanitized,
        });

        return formatResult(result);
      },
      context,
      CreateEntitySchema, // Runtime validation schema (ZodObject)
    ),
  );
}
```

### 3. Tool Wrapper (`src/utils/tool-wrapper.ts`)

The wrapper performs runtime validation:

```typescript
export function wrapToolHandler<TInput>(
  toolName: string,
  handler: (input: TInput) => Promise<CallToolResult>,
  context: ToolContext,
  schema?: z.ZodSchema<TInput>, // Optional Zod schema for validation
): (input: TInput) => Promise<CallToolResult> {
  return async (input: TInput): Promise<CallToolResult> => {
    try {
      context.rateLimiter.check(toolName);

      // Validate input with Zod schema if provided
      let validatedInput = input;
      if (schema) {
        try {
          validatedInput = schema.parse(input);
          log.debug({ input: validatedInput }, "Input validated");
        } catch (error) {
          throw new McpError(
            ErrorCode.INVALID_INPUT,
            `Invalid input for tool ${toolName}`,
            { validationError: error },
          );
        }
      }

      return await handler(validatedInput);
    } catch (error) {
      // Error handling...
    }
  };
}
```

## Benefits

1. **Type Safety**: TypeScript types are inferred from Zod schemas
2. **Runtime Validation**: Invalid inputs are caught before processing
3. **Self-Documenting**: Schema descriptions appear in MCP Inspector
4. **Consistent**: Same schema definition used for both SDK and runtime
5. **DRY**: Reusable schema components (e.g., ID patterns, enums)
6. **Error Reporting**: Zod provides detailed validation error messages

## Example: Requirements Tool

See `/Users/luca/Developer/Personal/spec-mcp/packages/server/src/tools/requirements.ts` and
`/Users/luca/Developer/Personal/spec-mcp/packages/server/src/tools/schemas/requirements.ts` for a complete implementation.

### Schema Definition

```typescript
// Reusable criterion schema
export const CriterionSchema = z.object({
  id: z.string().regex(/^req-\d{3}-[a-z0-9-]+\/crit-\d{3}$/),
  description: z.string(),
  plan_id: z.string().regex(/^pln-\d{3}-[a-z0-9-]+$/),
  completed: z.boolean().default(false),
});

// MCP SDK input schema
export const CreateRequirementInputSchema = {
  slug: z.string().describe("URL-friendly identifier"),
  name: z.string().describe("Display name"),
  description: z.string().describe("Detailed description"),
  priority: z.enum(["critical", "required", "ideal", "optional"]),
  criteria: z.array(CriterionSchema).min(1),
};

// Runtime validation schema
export const CreateRequirementSchema = z.object(CreateRequirementInputSchema);
```

### Tool Usage

```typescript
server.registerTool(
  "create-requirement",
  {
    title: "Create Requirement",
    description: "Create a new requirement specification",
    inputSchema: CreateRequirementInputSchema, // For MCP SDK
  },
  wrapToolHandler(
    "create-requirement",
    async ({ slug, name, description, priority, criteria }) => {
      // Input already validated by wrapper
      // ... process validated input
    },
    context,
    CreateRequirementSchema, // For runtime validation
  ),
);
```

## Migration Guide

To add Zod validation to an existing tool:

1. **Create schema file**: `src/tools/schemas/[toolname].ts`
2. **Define InputSchema**: Plain object with Zod properties (ZodRawShape)
3. **Define Schema**: Wrap in `z.object()` for runtime validation
4. **Export types**: Use `z.infer<>` for TypeScript types
5. **Update tool**: Import both schemas
6. **Pass to registerTool**: Use `InputSchema` in `inputSchema` field
7. **Pass to wrapToolHandler**: Use `Schema` as 4th argument
8. **Remove manual validation**: Zod handles it automatically

## Testing

All tool inputs are validated automatically. To test:

1. **Valid Input**: Should pass through successfully
2. **Invalid Type**: Should return `INVALID_INPUT` error
3. **Missing Required**: Should return `INVALID_INPUT` error
4. **Invalid Format**: Should return `INVALID_INPUT` error (e.g., regex)

See `tests/integration/server.test.ts` for validation test examples.