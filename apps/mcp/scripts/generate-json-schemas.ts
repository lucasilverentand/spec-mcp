#!/usr/bin/env tsx
/**
 * Generates JSON Schema resources from Zod schemas
 * Outputs pure JSON Schema for each spec type
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
	BusinessRequirementSchema,
	ComponentSchema,
	ConstitutionSchema,
	DecisionSchema,
	MilestoneSchema,
	PlanSchema,
	TechnicalRequirementSchema,
} from "@spec-mcp/schemas";
import { zodToJsonSchema } from "zod-to-json-schema";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

interface SchemaResource {
	uri: string;
	name: string;
	description: string;
	schema: unknown;
}

// Generate JSON schemas from Zod schemas
const schemas: SchemaResource[] = [
	{
		uri: "spec-mcp://schema/plan",
		name: "Plan Schema",
		description: "JSON Schema for Plan specifications",
		schema: zodToJsonSchema(PlanSchema, {
			name: "Plan",
			$refStrategy: "none",
		}),
	},
	{
		uri: "spec-mcp://schema/business-requirement",
		name: "Business Requirement Schema",
		description: "JSON Schema for Business Requirement (BRD) specifications",
		schema: zodToJsonSchema(BusinessRequirementSchema, {
			name: "BusinessRequirement",
			$refStrategy: "none",
		}),
	},
	{
		uri: "spec-mcp://schema/technical-requirement",
		name: "Technical Requirement Schema",
		description: "JSON Schema for Technical Requirement (PRD) specifications",
		schema: zodToJsonSchema(TechnicalRequirementSchema, {
			name: "TechnicalRequirement",
			$refStrategy: "none",
		}),
	},
	{
		uri: "spec-mcp://schema/decision",
		name: "Decision Schema",
		description: "JSON Schema for Decision (DEC) specifications",
		schema: zodToJsonSchema(DecisionSchema, {
			name: "Decision",
			$refStrategy: "none",
		}),
	},
	{
		uri: "spec-mcp://schema/component",
		name: "Component Schema",
		description: "JSON Schema for Component (CMP) specifications",
		schema: zodToJsonSchema(ComponentSchema, {
			name: "Component",
			$refStrategy: "none",
		}),
	},
	{
		uri: "spec-mcp://schema/constitution",
		name: "Constitution Schema",
		description: "JSON Schema for Constitution (CON) specifications",
		schema: zodToJsonSchema(ConstitutionSchema, {
			name: "Constitution",
			$refStrategy: "none",
		}),
	},
	{
		uri: "spec-mcp://schema/milestone",
		name: "Milestone Schema",
		description: "JSON Schema for Milestone (MLS) specifications",
		schema: zodToJsonSchema(MilestoneSchema, {
			name: "Milestone",
			$refStrategy: "none",
		}),
	},
];

// Generate TypeScript source with JSON schemas
const output = `/**
 * Generated JSON Schema resources - DO NOT EDIT
 * Run 'pnpm generate-schemas' to regenerate
 */

interface SchemaResource {
	uri: string;
	name: string;
	description: string;
	schema: unknown;
}

/**
 * Pure JSON Schema resources for each spec type
 * These are generated from Zod schemas and contain no additional documentation
 */
export const JSON_SCHEMA_RESOURCES: SchemaResource[] = ${JSON.stringify(schemas, null, 2)};
`;

// Write to src/resources/json-schemas.ts
const outputPath = join(__dirname, "../src/resources/json-schemas.ts");
writeFileSync(outputPath, output, "utf-8");

console.log("✓ Generated JSON schemas from Zod schemas");
console.log(`  Written to: ${outputPath}`);
console.log(`  Schemas generated: ${schemas.length}`);
