import z from "zod";
import { BaseSchema, computeEntityId } from "../../core/base-entity.js";

export const ComponentIdSchema = z
	.string()
	.regex(/^(app|svc|lib|tol)-\d{3}-[a-z0-9-]+$/, {
		message: "Component ID must follow format: (app|svc|lib|tol)-XXX-slug",
	})
	.describe("Unique identifier for the component");

export const ComponentTypeSchema = z.enum([
	"app",
	"service",
	"library",
	"tool",
]);

const _BaseComponentStorageSchema = BaseSchema.extend({
	type: ComponentTypeSchema.describe("Type of the component"),
	folder: z
		.string()
		.min(1)
		.default(".")
		.describe("Relative path from repository root"),
	depends_on: z
		.array(ComponentIdSchema)
		.default([])
		.describe("Other components this component relies on"),
	external_dependencies: z
		.array(z.string())
		.default([])
		.describe("Third-party services or libraries used"),
	capabilities: z
		.array(z.string())
		.default([])
		.describe("Key functionalities provided by the component"),
	constraints: z
		.array(z.string())
		.default([])
		.describe("Technical and business constraints"),
	tech_stack: z
		.array(z.string())
		.default([])
		.describe("Technologies and frameworks used in this component"),
});

// Storage schemas (no ID field)
export const AppComponentStorageSchema = _BaseComponentStorageSchema.extend({
	type: z.literal("app"),
	deployment_targets: z
		.array(z.enum(["ios", "android", "web", "desktop", "api"]))
		.default([])
		.describe("Deployment targets for the application"),
	environments: z
		.array(z.enum(["development", "staging", "production"]))
		.default(["development", "staging", "production"])
		.describe("Environment-specific configuration"),
});

export const ServiceComponentStorageSchema = _BaseComponentStorageSchema.extend(
	{
		type: z.literal("service"),
		dev_port: z
			.number()
			.min(1)
			.max(65535)
			.optional()
			.describe("Local development port"),
	},
);

export const LibraryComponentStorageSchema = _BaseComponentStorageSchema.extend(
	{
		type: z.literal("library"),
		package_name: z.string().nonempty().optional(),
	},
);

export const ToolComponentStorageSchema = _BaseComponentStorageSchema.extend({
	type: z.literal("tool"),
});

// Runtime schemas (with computed ID)
export const AppComponentSchema = AppComponentStorageSchema.transform(
	(data) => ({
		...data,
		id: computeEntityId(data.type, data.number, data.slug),
	}),
);

export const ServiceComponentSchema = ServiceComponentStorageSchema.transform(
	(data) => ({
		...data,
		id: computeEntityId(data.type, data.number, data.slug),
	}),
);

export const LibraryComponentSchema = LibraryComponentStorageSchema.transform(
	(data) => ({
		...data,
		id: computeEntityId(data.type, data.number, data.slug),
	}),
);

export const ToolComponentSchema = ToolComponentStorageSchema.transform(
	(data) => ({
		...data,
		id: computeEntityId(data.type, data.number, data.slug),
	}),
);

export type ComponentId = z.infer<typeof ComponentIdSchema>;
export type ComponentType = z.infer<typeof ComponentTypeSchema>;
export type AppComponent = z.infer<typeof AppComponentSchema>;
export type ServiceComponent = z.infer<typeof ServiceComponentSchema>;
export type LibraryComponent = z.infer<typeof LibraryComponentSchema>;
export type ToolComponent = z.infer<typeof ToolComponentSchema>;

export type AnyComponent =
	| AppComponent
	| ServiceComponent
	| LibraryComponent
	| ToolComponent;
