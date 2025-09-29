import z from "zod";

export const ScopeItemPrioritySchema = z.enum([
	"critical",
	"high",
	"medium",
	"low",
	"nice-to-have",
]);

export const ScopeItemSchema = z.object({
	description: z
		.string()
		.min(1)
		.describe("Description of what this scope item includes or excludes"),
	priority: ScopeItemPrioritySchema.optional().describe(
		"Priority or importance level of this scope item",
	),
	rationale: z
		.string()
		.optional()
		.describe("Explanation for why this item is in or out of scope"),
});

export const ScopeSchema = z.object({
	in_scope: z
		.array(ScopeItemSchema)
		.default([])
		.describe("Items explicitly included in the scope"),
	out_of_scope: z
		.array(ScopeItemSchema)
		.default([])
		.describe("Items explicitly excluded from the scope"),
	boundaries: z
		.array(z.string().min(1))
		.default([])
		.describe("Edge cases or boundary conditions that define scope limits"),
	assumptions: z
		.array(z.string().min(1))
		.default([])
		.describe("Assumptions made when defining the scope"),
	constraints: z
		.array(z.string().min(1))
		.default([])
		.describe("Limitations or constraints that affect the scope"),
	notes: z
		.array(z.string().min(1))
		.default([])
		.describe("Additional notes or clarifications about the scope"),
});

export type ScopeItemPriority = z.infer<typeof ScopeItemPrioritySchema>;
export type ScopeItem = z.infer<typeof ScopeItemSchema>;
export type Scope = z.infer<typeof ScopeSchema>;
