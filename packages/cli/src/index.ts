#!/usr/bin/env node

import { resolve } from "node:path";
import type { AnyEntity } from "@spec-mcp/core";
import { SpecService } from "@spec-mcp/core";
import { Command } from "commander";

const program = new Command();

// ANSI color codes
const colors = {
	reset: "\x1b[0m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	red: "\x1b[31m",
	cyan: "\x1b[36m",
	dim: "\x1b[2m",
};

// Parse and format validation errors grouped by field
function parseValidationErrors(errors: string[]): Map<string, string[]> {
	const fieldErrors = new Map<string, string[]>();

	for (const error of errors) {
		// Check if error contains multiple field errors separated by commas
		if (error.includes(",") && error.includes(":")) {
			// Split by comma and process each part
			const parts = error.split(",").map((p) => p.trim());

			for (const part of parts) {
				// Extract field path and message
				const match = part.match(/^(.+?):\s*(.+)$/);
				if (match?.[1] && match[2]) {
					const field = match[1];
					const message = match[2];
					if (!fieldErrors.has(field)) {
						fieldErrors.set(field, []);
					}
					fieldErrors.get(field)?.push(message);
				}
			}
		} else {
			// Single error, try to extract field
			const match = error.match(/^(.+?):\s*(.+)$/);
			if (match?.[1] && match[2]) {
				const field = match[1];
				const message = match[2];
				if (!fieldErrors.has(field)) {
					fieldErrors.set(field, []);
				}
				fieldErrors.get(field)?.push(message);
			} else {
				// No field, use generic key
				if (!fieldErrors.has("_general")) {
					fieldErrors.set("_general", []);
				}
				fieldErrors.get("_general")?.push(error);
			}
		}
	}

	return fieldErrors;
}

program
	.name("spec-validate")
	.description("CLI tool for validating spec-mcp specifications")
	.version("0.1.0");

interface EntityValidation {
	entity: AnyEntity;
	errors: string[];
	warnings: string[];
}

program
	.command("validate")
	.description("Validate all specifications in the specs folder")
	.option("-p, --path <path>", "Path to specs folder", "./specs")
	.action(async (options: { path: string }) => {
		try {
			const specsPath = resolve(process.cwd(), options.path);

			console.log(
				`\n${colors.cyan}Validating specs in: ${specsPath}${colors.reset}\n`,
			);

			// Initialize the spec service with the provided path
			const service = new SpecService({
				specsPath,
			});

			await service.initialize();

			// Get all entities
			const entitiesResult = await service.getAllEntities();
			if (!entitiesResult.success || !entitiesResult.data) {
				throw new Error("Failed to load entities");
			}

			const { requirements, plans, components } = entitiesResult.data;

			// Validate each entity individually
			const requirementValidations: EntityValidation[] = [];
			const planValidations: EntityValidation[] = [];
			const componentValidations: EntityValidation[] = [];

			for (const req of requirements as AnyEntity[]) {
				const result = await service.validateEntity(req);
				requirementValidations.push({
					entity: req,
					errors: result.errors ?? [],
					warnings: result.warnings ?? [],
				});
			}

			for (const plan of plans as AnyEntity[]) {
				const result = await service.validateEntity(plan);
				planValidations.push({
					entity: plan,
					errors: result.errors ?? [],
					warnings: result.warnings ?? [],
				});
			}

			for (const component of components as AnyEntity[]) {
				const result = await service.validateEntity(component);
				componentValidations.push({
					entity: component,
					errors: result.errors ?? [],
					warnings: result.warnings ?? [],
				});
			}

			// Display grouped results
			let totalErrors = 0;
			let totalWarnings = 0;
			let allValid = true;

			// Requirements
			console.log(`${colors.cyan}Requirements:${colors.reset}`);
			for (const validation of requirementValidations) {
				const entity = validation.entity;
				const entityId = `${entity.type}-${entity.number.toString().padStart(3, "0")}-${entity.slug}`;
				const fileName = `${entity.slug}.yaml`;
				const hasErrors = validation.errors.length > 0;
				const hasWarnings = validation.warnings.length > 0;

				let icon = `${colors.green}✓${colors.reset}`;
				if (hasErrors) {
					icon = `${colors.red}✗${colors.reset}`;
					allValid = false;
				} else if (hasWarnings) {
					icon = `${colors.yellow}!${colors.reset}`;
				}

				console.log(
					`${icon} ${colors.dim}${fileName}${colors.reset} ${colors.dim}(${entityId})${colors.reset}`,
				);

				const hasIssues =
					validation.errors.length > 0 || validation.warnings.length > 0;
				if (hasIssues) {
					const errorFields = parseValidationErrors(validation.errors);
					const warningFields = parseValidationErrors(validation.warnings);
					const allFields = new Set([
						...errorFields.keys(),
						...warningFields.keys(),
					]);
					const fieldArray = Array.from(allFields);

					for (let i = 0; i < fieldArray.length; i++) {
						const field = fieldArray[i];
						if (!field) continue;

						const isLast = i === fieldArray.length - 1;
						const prefix = isLast ? "└─" : "├─";
						const fieldName = field === "_general" ? "general" : field;

						console.log(`${colors.dim}${prefix}${colors.reset} ${fieldName}`);

						const errors = errorFields.get(field) || [];
						const warnings = warningFields.get(field) || [];

						totalErrors += errors.length;
						totalWarnings += warnings.length;

						const allMessages = [
							...errors.map((e) => ({ type: "error" as const, message: e })),
							...warnings.map((w) => ({
								type: "warning" as const,
								message: w,
							})),
						];

						for (let j = 0; j < allMessages.length; j++) {
							const msg = allMessages[j];
							if (!msg) continue;

							const msgIsLast = j === allMessages.length - 1;
							const continuation = isLast ? "  " : "│ ";
							const msgPrefix = msgIsLast ? "└─" : "├─";
							const color = msg.type === "error" ? colors.red : colors.yellow;

							console.log(
								`${colors.dim}${continuation}${msgPrefix}${colors.reset} ${color}${msg.message}${colors.reset}`,
							);
						}
					}
				}
			}
			console.log("");

			// Plans
			console.log(`${colors.cyan}Plans:${colors.reset}`);
			for (const validation of planValidations) {
				const entity = validation.entity;
				const entityId = `${entity.type}-${entity.number.toString().padStart(3, "0")}-${entity.slug}`;
				const fileName = `${entity.slug}.yaml`;
				const hasErrors = validation.errors.length > 0;
				const hasWarnings = validation.warnings.length > 0;

				let icon = `${colors.green}✓${colors.reset}`;
				if (hasErrors) {
					icon = `${colors.red}✗${colors.reset}`;
					allValid = false;
				} else if (hasWarnings) {
					icon = `${colors.yellow}!${colors.reset}`;
				}

				console.log(
					`${icon} ${colors.dim}${fileName}${colors.reset} ${colors.dim}(${entityId})${colors.reset}`,
				);

				const hasIssues =
					validation.errors.length > 0 || validation.warnings.length > 0;
				if (hasIssues) {
					const errorFields = parseValidationErrors(validation.errors);
					const warningFields = parseValidationErrors(validation.warnings);
					const allFields = new Set([
						...errorFields.keys(),
						...warningFields.keys(),
					]);
					const fieldArray = Array.from(allFields);

					for (let i = 0; i < fieldArray.length; i++) {
						const field = fieldArray[i];
						if (!field) continue;

						const isLast = i === fieldArray.length - 1;
						const prefix = isLast ? "└─" : "├─";
						const fieldName = field === "_general" ? "general" : field;

						console.log(`${colors.dim}${prefix}${colors.reset} ${fieldName}`);

						const errors = errorFields.get(field) || [];
						const warnings = warningFields.get(field) || [];

						totalErrors += errors.length;
						totalWarnings += warnings.length;

						const allMessages = [
							...errors.map((e) => ({ type: "error" as const, message: e })),
							...warnings.map((w) => ({
								type: "warning" as const,
								message: w,
							})),
						];

						for (let j = 0; j < allMessages.length; j++) {
							const msg = allMessages[j];
							if (!msg) continue;

							const msgIsLast = j === allMessages.length - 1;
							const continuation = isLast ? "  " : "│ ";
							const msgPrefix = msgIsLast ? "└─" : "├─";
							const color = msg.type === "error" ? colors.red : colors.yellow;

							console.log(
								`${colors.dim}${continuation}${msgPrefix}${colors.reset} ${color}${msg.message}${colors.reset}`,
							);
						}
					}
				}
			}
			console.log("");

			// Components
			console.log(`${colors.cyan}Components:${colors.reset}`);
			for (const validation of componentValidations) {
				const entity = validation.entity;
				const entityId = `${entity.type}-${entity.number.toString().padStart(3, "0")}-${entity.slug}`;
				const fileName = `${entity.slug}.yaml`;
				const hasErrors = validation.errors.length > 0;
				const hasWarnings = validation.warnings.length > 0;

				let icon = `${colors.green}✓${colors.reset}`;
				if (hasErrors) {
					icon = `${colors.red}✗${colors.reset}`;
					allValid = false;
				} else if (hasWarnings) {
					icon = `${colors.yellow}!${colors.reset}`;
				}

				console.log(
					`${icon} ${colors.dim}${fileName}${colors.reset} ${colors.dim}(${entityId})${colors.reset}`,
				);

				const hasIssues =
					validation.errors.length > 0 || validation.warnings.length > 0;
				if (hasIssues) {
					const errorFields = parseValidationErrors(validation.errors);
					const warningFields = parseValidationErrors(validation.warnings);
					const allFields = new Set([
						...errorFields.keys(),
						...warningFields.keys(),
					]);
					const fieldArray = Array.from(allFields);

					for (let i = 0; i < fieldArray.length; i++) {
						const field = fieldArray[i];
						if (!field) continue;

						const isLast = i === fieldArray.length - 1;
						const prefix = isLast ? "└─" : "├─";
						const fieldName = field === "_general" ? "general" : field;

						console.log(`${colors.dim}${prefix}${colors.reset} ${fieldName}`);

						const errors = errorFields.get(field) || [];
						const warnings = warningFields.get(field) || [];

						totalErrors += errors.length;
						totalWarnings += warnings.length;

						const allMessages = [
							...errors.map((e) => ({ type: "error" as const, message: e })),
							...warnings.map((w) => ({
								type: "warning" as const,
								message: w,
							})),
						];

						for (let j = 0; j < allMessages.length; j++) {
							const msg = allMessages[j];
							if (!msg) continue;

							const msgIsLast = j === allMessages.length - 1;
							const continuation = isLast ? "  " : "│ ";
							const msgPrefix = msgIsLast ? "└─" : "├─";
							const color = msg.type === "error" ? colors.red : colors.yellow;

							console.log(
								`${colors.dim}${continuation}${msgPrefix}${colors.reset} ${color}${msg.message}${colors.reset}`,
							);
						}
					}
				}
			}
			console.log("");

			// Summary
			console.log(`${colors.cyan}Summary:${colors.reset}`);
			if (totalErrors > 0) {
				console.log(
					`  ${colors.red}Total Errors: ${totalErrors}${colors.reset}`,
				);
			}
			if (totalWarnings > 0) {
				console.log(
					`  ${colors.yellow}Total Warnings: ${totalWarnings}${colors.reset}`,
				);
			}
			if (totalErrors === 0 && totalWarnings === 0) {
				console.log(`  ${colors.green}All validations passed!${colors.reset}`);
			}
			console.log(
				`  Requirements: ${requirements.length} (${requirementValidations.filter((v) => v.errors.length === 0 && v.warnings.length === 0).length} valid)`,
			);
			console.log(
				`  Plans: ${plans.length} (${planValidations.filter((v) => v.errors.length === 0 && v.warnings.length === 0).length} valid)`,
			);
			console.log(
				`  Components: ${components.length} (${componentValidations.filter((v) => v.errors.length === 0 && v.warnings.length === 0).length} valid)`,
			);
			console.log("");

			// Exit with appropriate code
			process.exit(allValid ? 0 : 1);
		} catch (error) {
			console.error(`${colors.red}✗ Error running validation:${colors.reset}`);
			console.error(error instanceof Error ? error.message : String(error));
			process.exit(1);
		}
	});

program.parse();
