import z from "zod";

export const DeploymentSchema = z.object({
	platform: z
		.string()
		.min(1)
		.describe(
			"Deployment platform (e.g., 'AWS ECS', 'Vercel', 'Kubernetes', 'npm')",
		),
	url: z
		.string()
		.min(1)
		.optional()
		.describe("Production URL or endpoint"),
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
		.default([])
		.describe("Required environment variables"),
	secrets: z
		.array(z.string())
		.default([])
		.describe("Required secrets (e.g., API keys, passwords)"),
	notes: z
		.string()
		.min(1)
		.optional()
		.describe("Additional deployment notes or instructions"),
});

export type Deployment = z.infer<typeof DeploymentSchema>;
