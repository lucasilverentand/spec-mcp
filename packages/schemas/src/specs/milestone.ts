import z from "zod";
import { BaseSchema } from "../shared/base.js";
import { ReferencesSchema } from "../shared/reference.js";
import { CompletionStatusSchema } from "../shared/task.js";

export const MilestoneIdSchema = z
	.string()
	.regex(/^mls-\d{3}-[a-z0-9-]+$/, {
		message: "Milestone ID must follow format: mls-XXX-slug-here",
	})
	.describe("Unique identifier for the milestone");

export const MilestoneSchema = BaseSchema.extend({
	type: z.literal("milestone").describe("Entity type is always 'milestone'"),
	target_date: z
		.string()
		.datetime()
		.nullable()
		.default(null)
		.describe("Target completion date for the milestone"),
	status: CompletionStatusSchema.describe("Current status of the milestone"),
	references: ReferencesSchema.describe(
		"External references for additional context",
	),
}).strict();

export type MilestoneId = z.infer<typeof MilestoneIdSchema>;
export type Milestone = z.infer<typeof MilestoneSchema>;
