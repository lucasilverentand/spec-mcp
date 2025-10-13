import z from "zod";
import { createSupersessionSchema } from "./supersession.js";

export const FlowStepIdSchema = z.string().regex(/^step-\d{3}$/, {
	message: "ID must follow the format step-000",
});

export const FlowStepSchema = z.object({
	id: FlowStepIdSchema,
	name: z.string().min(1).describe("Display name of the step"),
	description: z
		.string()
		.optional()
		.describe("High-level description of the step"),
	next_steps: z
		.array(FlowStepIdSchema)
		.default([])
		.describe("IDs of subsequent steps in the flow"),
});

export const FlowIdSchema = z
	.string()
	.regex(/^flw-\d{3}$/, {
		message: "ID must follow the format flw-XXX",
	})
	.describe("Unique identifier for a flow");

export const FlowSchema = z.object({
	id: FlowIdSchema,
	type: z.string().describe("Type of flow, e.g., user, system, data"),
	name: z.string().min(1).describe("Display name of the flow"),
	description: z
		.string()
		.optional()
		.describe("High-level description of the flow's purpose"),
	steps: z
		.array(FlowStepSchema)
		.min(1)
		.describe("Ordered list of steps in the flow"),
	...createSupersessionSchema(FlowIdSchema),
});

export const FlowsSchema = z
	.array(FlowSchema)
	.default([])
	.describe("Array of flows");

export type FlowStepId = z.infer<typeof FlowStepIdSchema>;
export type FlowStep = z.infer<typeof FlowStepSchema>;
export type FlowId = z.infer<typeof FlowIdSchema>;
export type Flow = z.infer<typeof FlowSchema>;
export type Flows = z.infer<typeof FlowsSchema>;
