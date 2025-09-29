import { z } from "zod";

// NOTE: These schemas are duplicated from @spec-mcp/data because:
// 1. @spec-mcp/data uses Zod v4
// 2. @spec-mcp/server uses Zod v3 (required by MCP SDK)
// 3. Zod v3 and v4 have incompatible types
// Source of truth remains in @spec-mcp/data - keep these in sync manually

// Criterion schema - matches AcceptanceCriteriaSchema from data package
export const CriterionSchema = z.object({
	id: z.string().regex(/^req-\d{3}-[a-z0-9-]+\/crit-\d{3}$/),
	description: z.string(),
	plan_id: z.string().regex(/^pln-\d{3}-[a-z0-9-]+$/),
	completed: z.boolean().default(false),
});

// Create requirement input schema (as ZodRawShape for MCP SDK)
export const CreateRequirementInputSchema = {
	slug: z.string().describe("URL-friendly identifier"),
	name: z.string().describe("Display name of the requirement"),
	description: z.string().describe("Detailed description"),
	priority: z
		.enum(["critical", "required", "ideal", "optional"])
		.describe("Priority level"),
	criteria: z
		.array(CriterionSchema)
		.min(1)
		.describe("Acceptance criteria (at least one required)"),
};

// Zod object version for validation
export const CreateRequirementSchema = z.object(CreateRequirementInputSchema);

// Get requirement input schema
export const GetRequirementInputSchema = {
	id: z.string().describe("Requirement ID (e.g., 'req-001-slug')"),
};
export const GetRequirementSchema = z.object(GetRequirementInputSchema);

// Update requirement input schema
export const UpdateRequirementInputSchema = {
	id: z.string().describe("Requirement ID to update"),
	name: z.string().optional().describe("Updated name"),
	description: z.string().optional().describe("Updated description"),
	priority: z
		.enum(["critical", "required", "ideal", "optional"])
		.optional()
		.describe("Updated priority"),
	criteria: z
		.array(CriterionSchema)
		.optional()
		.describe("Updated criteria"),
};
export const UpdateRequirementSchema = z.object(UpdateRequirementInputSchema);

// Delete requirement input schema
export const DeleteRequirementInputSchema = {
	id: z.string().describe("Requirement ID to delete"),
};
export const DeleteRequirementSchema = z.object(DeleteRequirementInputSchema);

// List requirements input schema
export const ListRequirementsInputSchema = {
	priority: z
		.enum(["critical", "required", "ideal", "optional"])
		.optional()
		.describe("Filter by priority"),
	search: z.string().optional().describe("Search in name and description"),
};
export const ListRequirementsSchema = z.object(ListRequirementsInputSchema);

// Export types
export type CreateRequirementInput = z.infer<typeof CreateRequirementSchema>;
export type GetRequirementInput = z.infer<typeof GetRequirementSchema>;
export type UpdateRequirementInput = z.infer<typeof UpdateRequirementSchema>;
export type DeleteRequirementInput = z.infer<typeof DeleteRequirementSchema>;
export type ListRequirementsInput = z.infer<typeof ListRequirementsSchema>;
