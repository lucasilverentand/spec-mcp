import z from "zod";
import { BaseSchema } from "../shared/base.js";
import { CriteriaSchema } from "../shared/criteria.js";
import { ReferenceSchema } from "../shared/reference.js";

export const BusinessRequirementIdSchema = z
	.string()
	.regex(/^brd-\d{3}-[a-z0-9-]+$/, {
		message: "Business Requirement ID must follow format: req-XXX-slug-here",
	})
	.describe("Unique identifier for the business requirement");

export const BusinessValueSchema = z.object({
	type: z
		.enum(["revenue", "cost-savings", "customer-satisfaction", "other"])
		.describe("Type of business value"),
	value: z
		.string()
		.min(1)
		.describe("The business value, ROI, or benefit this delivers"),
});

export const StakeholderRoleSchema = z
	.enum([
		"product-owner",
		"business-analyst",
		"project-manager",
		"customer",
		"end-user",
		"executive",
		"developer",
		"other",
	])
	.describe("Role of the stakeholder");

export const StakeholderSchema = z.object({
	role: StakeholderRoleSchema,
	interest: z.string().min(10).describe("Stakeholder's interest"),
	name: z.string().min(3).describe("Name of the stakeholder"),
	email: z.string().email().optional().describe("Email of the stakeholder"),
});

export const UserStorySchema = z.object({
	role: z.string().min(3).describe("The role of the user"),
	feature: z.string().min(10).describe("The feature the user wants"),
	benefit: z.string().min(10).describe("The benefit the user expects"),
});

export const BusinessRequirementSchema = BaseSchema.extend({
	type: z.literal("business-requirement").describe("Entity type"),
	business_value: z
		.array(BusinessValueSchema)
		.min(1)
		.describe("The business value, ROI, or benefit this delivers"),
	stakeholders: z
		.array(StakeholderSchema)
		.default([])
		.describe("Key stakeholders with interest in this requirement"),
	user_stories: z
		.array(UserStorySchema)
		.min(1)
		.describe("User stories that illustrate the requirement"),
	criteria: z
		.array(CriteriaSchema)
		.min(1)
		.describe("Acceptance criteria that must be met"),
	references: z
		.array(ReferenceSchema)
		.default([])
		.describe("External references, documentation, or resources"),
});

export type BusinessRequirementId = z.infer<typeof BusinessRequirementIdSchema>;
export type BusinessValue = z.infer<typeof BusinessValueSchema>;
export type StakeholderRole = z.infer<typeof StakeholderRoleSchema>;
export type Stakeholder = z.infer<typeof StakeholderSchema>;
export type UserStory = z.infer<typeof UserStorySchema>;
export type Criteria = z.infer<typeof CriteriaSchema>;
export type BusinessRequirement = z.infer<typeof BusinessRequirementSchema>;
