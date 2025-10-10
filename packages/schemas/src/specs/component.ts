import z from "zod";
import { BaseSchema } from "../shared/base";
import { ScopeSchema } from "../shared/scope";

export const ComponentTypeSchema = z.enum(["app", "service", "library"]);

export const ComponentIdSchema = z.string().regex(/^cmp-\d{3}-[a-z0-9-]+$/, {
	message: "Component ID must follow format: cmp-XXX-slug-here",
});

export const DeploymentSchema = z.object({
	platform: z
		.string()
		.min(1)
		.describe(
			"Deployment platform (e.g., 'AWS ECS', 'Vercel', 'Railway', 'Kubernetes', 'npm', 'App Store', 'Google Play')",
		),
	url: z.string().min(1).optional().describe("Production URL or endpoint"),
	build_command: z
		.string()
		.min(1)
		.optional()
		.describe("Command to build the component"),
	deploy_command: z
		.string()
		.min(1)
		.optional()
		.describe("Command to deploy the component"),
	environment_vars: z
		.array(z.string())
		.optional()
		.default([])
		.describe("Required environment variables"),
	secrets: z
		.array(z.string())
		.optional()
		.default([])
		.describe("Required secrets (e.g., API keys, passwords)"),
	notes: z
		.string()
		.min(1)
		.optional()
		.describe("Additional deployment notes or instructions"),
});

export const ComponentSchema = BaseSchema.extend({
	type: z.literal("component"),
	component_type: ComponentTypeSchema.describe(
		"Type of the component (app, service, library)",
	),
	folder: z
		.string()
		.min(1)
		.default(".")
		.describe("Relative path from repository root"),
	tech_stack: z
		.array(z.string())
		.default([])
		.describe("Technologies and frameworks used in this component"),
	deployments: z
		.array(DeploymentSchema)
		.default([])
		.optional()
		.describe(
			"Deployment configuration including platform, URLs, commands, and environment variables",
		),
	scope: ScopeSchema.describe(
		"Explicit scope definition with in-scope and out-of-scope items with reasoning",
	),
	depends_on: z
		.array(ComponentIdSchema)
		.default([])
		.describe("Other components this component relies on"),
	external_dependencies: z
		.array(z.string())
		.default([])
		.describe("Third-party services or libraries used"),
	dev_port: z.number().min(1).max(65535).optional().describe("Dev server port"),
	notes: z
		.string()
		.min(1)
		.optional()
		.describe("Additional notes or comments about the component"),
});

export type Component = z.infer<typeof ComponentSchema>;
export type Deployment = z.infer<typeof DeploymentSchema>;
export type ComponentId = z.infer<typeof ComponentIdSchema>;
export type ComponentType = z.infer<typeof ComponentTypeSchema>;
