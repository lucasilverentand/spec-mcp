import type { SpecManager } from "@spec-mcp/core";
import { validateEntity } from "@spec-mcp/core";
import { z } from "zod";

/**
 * Schema for validate_entity tool arguments
 */
export const ValidateEntityArgsSchema = z.object({
	id: z
		.string()
		.describe(
			"Entity identifier. Accepts: typ-123, typ-123-slug-here, or typ-123-slug-here.yml",
		),
});

export type ValidateEntityArgs = z.infer<typeof ValidateEntityArgsSchema>;

/**
 * Validate an entity by its ID
 */
export async function validateEntityTool(
	args: ValidateEntityArgs,
	specManager: SpecManager,
): Promise<string> {
	const result = await validateEntity(specManager, args.id);

	if (!result.valid) {
		let response = `Validation Failed\n`;
		response += `${"=".repeat(70)}\n\n`;
		response += `Entity ID: ${args.id}\n\n`;
		response += `Errors:\n`;
		for (const error of result.errors || []) {
			response += `  - ${error}\n`;
		}
		return response;
	}

	// Valid entity - show details
	const entity = result.entity!;
	let response = `Validation Successful\n`;
	response += `${"=".repeat(70)}\n\n`;
	response += `Entity ID: ${entity.type}-${entity.number}${entity.slug ? `-${entity.slug}` : ""}\n`;
	response += `Type: ${entity.type}\n`;
	response += `Number: ${entity.number}\n`;

	if (entity.slug) {
		response += `Slug: ${entity.slug}\n`;
	}

	if ("name" in entity && entity.name) {
		response += `Name: ${entity.name}\n`;
	}

	if ("draft" in entity) {
		response += `Draft: ${entity.draft ? "Yes" : "No"}\n`;
	}

	if ("priority" in entity && entity.priority) {
		response += `Priority: ${entity.priority}\n`;
	}

	if (
		"status" in entity &&
		entity.status &&
		typeof entity.status === "object"
	) {
		const status = entity.status as {
			created_at?: string;
			updated_at?: string;
			completed?: boolean;
			completed_at?: string | null;
			verified?: boolean;
			verified_at?: string | null;
		};
		response += `\nStatus:\n`;
		if (status.created_at) {
			response += `  Created: ${status.created_at}\n`;
		}
		if (status.updated_at) {
			response += `  Updated: ${status.updated_at}\n`;
		}
		if (typeof status.completed === "boolean") {
			response += `  Completed: ${status.completed ? "Yes" : "No"}\n`;
		}
		if (status.completed_at) {
			response += `  Completed At: ${status.completed_at}\n`;
		}
		if (typeof status.verified === "boolean") {
			response += `  Verified: ${status.verified ? "Yes" : "No"}\n`;
		}
		if (status.verified_at) {
			response += `  Verified At: ${status.verified_at}\n`;
		}
	}

	response += `\n✓ Entity is valid and conforms to schema\n`;

	return response;
}
