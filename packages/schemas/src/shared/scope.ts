import z from "zod";

export const ScopeItemTypeSchema = z.enum(["in-scope", "out-of-scope"]);

export const ScopeItemSchema = z.object({
	type: ScopeItemTypeSchema,
	description: z
		.string()
		.min(1)
		.describe("Description of what this scope item includes or excludes"),
	rationale: z
		.string()
		.optional()
		.describe("Explanation for why this item is in or out of scope"),
});

export const ScopeSchema = z
	.array(ScopeItemSchema)
	.default([])
	.describe("Scope items");

export type ScopeItemType = z.infer<typeof ScopeItemTypeSchema>;
export type ScopeItem = z.infer<typeof ScopeItemSchema>;
export type Scope = z.infer<typeof ScopeSchema>;
