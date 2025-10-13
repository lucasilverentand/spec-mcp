import type { Base } from "@spec-mcp/schemas";
import { parseEntityId } from "@spec-mcp/utils";
import type { SpecManager } from "./spec-manager.js";

/**
 * Result of validating an entity
 */
export interface ValidationResult<T extends Base = Base> {
	valid: boolean;
	entity?: T;
	errors?: string[];
}

/**
 * Validate an entity by its ID
 *
 * @param specManager - The SpecManager instance
 * @param id - Entity identifier (e.g., "pln-001", "pln-001-user-auth", "pln-001-user-auth.yml")
 * @returns Validation result with entity if valid
 */
export async function validateEntity(
	specManager: SpecManager,
	id: string,
): Promise<ValidationResult> {
	const errors: string[] = [];

	// Parse the ID
	const parsed = parseEntityId(id);
	if (!parsed) {
		return {
			valid: false,
			errors: [
				`Invalid entity ID format: "${id}". Expected format: typ-123 or typ-123-slug-here`,
			],
		};
	}

	// Check if prefix is valid
	const entityType = parsed.entityType;
	if (!entityType) {
		return {
			valid: false,
			errors: [
				`Unknown entity prefix: "${parsed.prefix}". Use a valid entity prefix like pln, brd, prd, etc.`,
			],
		};
	}

	// Get the appropriate manager
	const manager =
		specManager[
			entityType === "business-requirement"
				? "business_requirements"
				: entityType === "technical-requirement"
					? "tech_requirements"
					: entityType === "plan"
						? "plans"
						: entityType === "component"
							? "components"
							: entityType === "constitution"
								? "constitutions"
								: entityType === "milestone"
									? "milestones"
									: "decisions"
		];

	// Fetch the entity
	let entity: Base | null = null;

	// Try to get by slug first if provided
	if (parsed.slug && "getBySlug" in manager) {
		entity = await manager.getBySlug(parsed.slug);
		if (entity && entity.number !== parsed.number) {
			errors.push(
				`Entity with slug "${parsed.slug}" exists but has number ${entity.number}, not ${parsed.number}`,
			);
		}
	}

	// If slug didn't work or wasn't provided, try by number
	if (!entity) {
		entity = await manager.get(parsed.number);
	}

	// Check if entity exists
	if (!entity) {
		return {
			valid: false,
			errors: [
				`Entity not found: ${parsed.prefix}-${parsed.number}${parsed.slug ? `-${parsed.slug}` : ""}`,
			],
		};
	}

	// Validate the entity against its schema
	try {
		// The entity is already validated when loaded from disk,
		// but we can perform additional checks here
		const validationErrors: string[] = [];

		// Check if slug matches (if provided)
		if (parsed.slug && entity.slug !== parsed.slug) {
			validationErrors.push(
				`Slug mismatch: expected "${parsed.slug}", found "${entity.slug}"`,
			);
		}

		// Validate references to other entities
		const referenceErrors = await validateReferences(entity, specManager);
		validationErrors.push(...referenceErrors);

		if (validationErrors.length > 0) {
			return {
				valid: false,
				entity,
				errors: validationErrors,
			};
		}

		return {
			valid: true,
			entity,
		};
	} catch (error) {
		return {
			valid: false,
			entity,
			errors: [
				`Schema validation failed: ${error instanceof Error ? error.message : String(error)}`,
			],
		};
	}
}

/**
 * Validate that all referenced entities exist
 */
async function validateReferences(
	entity: Base,
	specManager: SpecManager,
): Promise<string[]> {
	const errors: string[] = [];

	// Check depends_on references
	if ("depends_on" in entity && Array.isArray(entity.depends_on)) {
		for (const refId of entity.depends_on) {
			if (typeof refId === "string") {
				const refResult = await validateEntity(specManager, refId);
				if (!refResult.valid) {
					errors.push(`Referenced entity not found in depends_on: ${refId}`);
				}
			}
		}
	}

	// Check criteria references (for plans)
	if (
		"criteria" in entity &&
		entity.criteria &&
		typeof entity.criteria === "object"
	) {
		const criteria = entity.criteria as {
			requirement?: string;
			criteria?: string;
		};
		if (criteria.requirement) {
			const refResult = await validateEntity(specManager, criteria.requirement);
			if (!refResult.valid) {
				errors.push(
					`Referenced requirement not found: ${criteria.requirement}`,
				);
			}
		}
	}

	// Check supersedes references (for decisions)
	if ("supersedes" in entity && typeof entity.supersedes === "string") {
		const refResult = await validateEntity(specManager, entity.supersedes);
		if (!refResult.valid) {
			errors.push(
				`Referenced decision not found in supersedes: ${entity.supersedes}`,
			);
		}
	}

	// Check technical_dependencies (for requirements)
	if (
		"technical_dependencies" in entity &&
		Array.isArray(entity.technical_dependencies)
	) {
		for (const depId of entity.technical_dependencies) {
			if (typeof depId === "string") {
				const refResult = await validateEntity(specManager, depId);
				if (!refResult.valid) {
					errors.push(
						`Referenced entity not found in technical_dependencies: ${depId}`,
					);
				}
			}
		}
	}

	return errors;
}
