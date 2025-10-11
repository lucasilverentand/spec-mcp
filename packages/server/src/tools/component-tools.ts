import type { ToolResponse } from "@modelcontextprotocol/sdk/types.js";
import type { SpecManager } from "@spec-mcp/core";
import type { Component, Deployment } from "@spec-mcp/schemas";
import { type ArrayToolConfig, addSimpleItem } from "./array-tool-builder.js";

// ============================================================================
// TECH STACK TOOLS (string array)
// ============================================================================

export async function addTech(
	specManager: SpecManager,
	componentId: string,
	tech: string,
): Promise<ToolResponse> {
	const config: ArrayToolConfig<Component, string> = {
		toolName: "add_tech",
		description: "Add technology to component tech stack",
		specType: "component",
		arrayFieldName: "tech_stack",
		idPrefix: "",
		getArray: (spec) => spec.tech_stack || [],
		setArray: (_spec, items) => ({ tech_stack: items }),
	};

	return addSimpleItem(specManager, componentId, tech, config);
}

export const addTechTool = {
	name: "add_tech",
	description:
		"Add a technology or framework to a Component's tech stack (e.g., React, Node.js, PostgreSQL).",
	inputSchema: {
		type: "object",
		properties: {
			component_id: {
				type: "string",
				description: "Component identifier (e.g., cmp-001-web-app)",
			},
			tech: {
				type: "string",
				description:
					"Technology or framework name (e.g., 'React 18', 'Node.js', 'PostgreSQL')",
			},
		},
		required: ["component_id", "tech"],
	} as const,
};

export const removeTechTool = {
	name: "remove_tech",
	description:
		"Remove a technology from a Component's tech stack by its index (0-based).",
	inputSchema: {
		type: "object",
		properties: {
			component_id: {
				type: "string",
				description: "Component identifier (e.g., cmp-001-web-app)",
			},
			index: {
				type: "number",
				description: "Index of the technology to remove (0-based)",
			},
		},
		required: ["component_id", "index"],
	} as const,
};

// ============================================================================
// DEPLOYMENT TOOLS
// ============================================================================

export async function addDeployment(
	specManager: SpecManager,
	componentId: string,
	platform: string,
	url?: string,
	build_command?: string,
	deploy_command?: string,
	environment_vars?: string[],
	secrets?: string[],
	notes?: string,
): Promise<ToolResponse> {
	const config: ArrayToolConfig<Component, Deployment> = {
		toolName: "add_deployment",
		description: "Add deployment configuration to a component",
		specType: "component",
		arrayFieldName: "deployments",
		idPrefix: "",
		getArray: (spec) => spec.deployments || [],
		setArray: (_spec, items) => ({ deployments: items }),
	};

	const deployment: Deployment = {
		platform,
		...(url && { url }),
		...(build_command && { build_command }),
		...(deploy_command && { deploy_command }),
		...(environment_vars && { environment_vars }),
		...(secrets && { secrets }),
		...(notes && { notes }),
	};

	return addSimpleItem(specManager, componentId, deployment, config);
}

export const addDeploymentTool = {
	name: "add_deployment",
	description:
		"Add deployment configuration to a Component (e.g., Vercel, AWS, Railway).",
	inputSchema: {
		type: "object",
		properties: {
			component_id: {
				type: "string",
				description: "Component identifier (e.g., cmp-001-web-app)",
			},
			platform: {
				type: "string",
				description:
					"Deployment platform (e.g., 'AWS ECS', 'Vercel', 'Railway', 'Kubernetes')",
			},
			url: {
				type: "string",
				description: "Production URL or endpoint (optional)",
			},
			build_command: {
				type: "string",
				description: "Command to build the component (optional)",
			},
			deploy_command: {
				type: "string",
				description: "Command to deploy the component (optional)",
			},
			environment_vars: {
				type: "array",
				items: { type: "string" },
				description: "Required environment variables (optional)",
			},
			secrets: {
				type: "array",
				items: { type: "string" },
				description: "Required secrets (e.g., API keys, passwords) (optional)",
			},
			notes: {
				type: "string",
				description: "Additional deployment notes or instructions (optional)",
			},
		},
		required: ["component_id", "platform"],
	} as const,
};

export const removeDeploymentTool = {
	name: "remove_deployment",
	description:
		"Remove a deployment configuration from a Component by its index (0-based).",
	inputSchema: {
		type: "object",
		properties: {
			component_id: {
				type: "string",
				description: "Component identifier (e.g., cmp-001-web-app)",
			},
			index: {
				type: "number",
				description: "Index of the deployment to remove (0-based)",
			},
		},
		required: ["component_id", "index"],
	} as const,
};

// ============================================================================
// EXTERNAL DEPENDENCY TOOLS (string array)
// ============================================================================

export async function addExternalDependency(
	specManager: SpecManager,
	componentId: string,
	dependency: string,
): Promise<ToolResponse> {
	const config: ArrayToolConfig<Component, string> = {
		toolName: "add_external_dependency",
		description: "Add external dependency to a component",
		specType: "component",
		arrayFieldName: "external_dependencies",
		idPrefix: "",
		getArray: (spec) => spec.external_dependencies || [],
		setArray: (_spec, items) => ({ external_dependencies: items }),
	};

	return addSimpleItem(specManager, componentId, dependency, config);
}

export const addExternalDependencyTool = {
	name: "add_external_dependency",
	description:
		"Add an external dependency to a Component (e.g., third-party service, library, API).",
	inputSchema: {
		type: "object",
		properties: {
			component_id: {
				type: "string",
				description: "Component identifier (e.g., cmp-001-web-app)",
			},
			dependency: {
				type: "string",
				description:
					"External dependency (e.g., 'Stripe API', 'AWS S3', 'SendGrid')",
			},
		},
		required: ["component_id", "dependency"],
	} as const,
};

export const removeExternalDependencyTool = {
	name: "remove_external_dependency",
	description:
		"Remove an external dependency from a Component by its index (0-based).",
	inputSchema: {
		type: "object",
		properties: {
			component_id: {
				type: "string",
				description: "Component identifier (e.g., cmp-001-web-app)",
			},
			index: {
				type: "number",
				description: "Index of the dependency to remove (0-based)",
			},
		},
		required: ["component_id", "index"],
	} as const,
};
