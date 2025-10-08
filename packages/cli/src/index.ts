#!/usr/bin/env node

import { resolve } from "node:path";
import { SpecManager } from "@spec-mcp/core";
import type {
	Component,
	Plan,
	Requirement,
} from "@spec-mcp/schemas";
import { Command } from "commander";
import {
	colors,
	formatEntityId,
	getTreeContinuation,
	getTreePrefix,
	getValidationIcon,
	parseValidationErrors,
} from "./validation-formatter";

const program = new Command();

program
	.name("spec-validate")
	.description("CLI tool for validating spec-mcp specifications")
	.version("0.1.0");

type AnyEntity = Requirement | Plan | Component;

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

			// Initialize the spec manager with the provided path
			const manager = new SpecManager(specsPath);

			// Ensure folders exist
			await manager.ensureFolders();

			// Load all entities and validate them
			const [requirements, plans, components] = await Promise.all([
				manager.requirements.list(),
				manager.plans.list(),
				manager.components.list(),
			]);

			// Validate each entity individually by attempting to parse them again
			const requirementValidations: EntityValidation[] = [];
			const planValidations: EntityValidation[] = [];
			const componentValidations: EntityValidation[] = [];

			// For now, since entities are already validated on load via schema.parse(),
			// we just mark them as having no errors. In the future, we can add
			// business logic validation here.
			for (const req of requirements) {
				requirementValidations.push({
					entity: req,
					errors: [],
					warnings: [],
				});
			}

			for (const plan of plans) {
				planValidations.push({
					entity: plan,
					errors: [],
					warnings: [],
				});
			}

			for (const component of components) {
				componentValidations.push({
					entity: component,
					errors: [],
					warnings: [],
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
				const entityId = formatEntityId(entity.type, entity.number, entity.slug);
				const fileName = `${entity.slug}.yaml`;
				const hasErrors = validation.errors.length > 0;
				const hasWarnings = validation.warnings.length > 0;

				const icon = getValidationIcon(hasErrors, hasWarnings);
				if (hasErrors) {
					allValid = false;
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
						const prefix = getTreePrefix(isLast);
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
							const continuation = getTreeContinuation(isLast);
							const msgPrefix = getTreePrefix(msgIsLast);
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
				const entityId = formatEntityId(entity.type, entity.number, entity.slug);
				const fileName = `${entity.slug}.yaml`;
				const hasErrors = validation.errors.length > 0;
				const hasWarnings = validation.warnings.length > 0;

				const icon = getValidationIcon(hasErrors, hasWarnings);
				if (hasErrors) {
					allValid = false;
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
						const prefix = getTreePrefix(isLast);
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
							const continuation = getTreeContinuation(isLast);
							const msgPrefix = getTreePrefix(msgIsLast);
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
				const entityId = formatEntityId(entity.type, entity.number, entity.slug);
				const fileName = `${entity.slug}.yaml`;
				const hasErrors = validation.errors.length > 0;
				const hasWarnings = validation.warnings.length > 0;

				const icon = getValidationIcon(hasErrors, hasWarnings);
				if (hasErrors) {
					allValid = false;
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
						const prefix = getTreePrefix(isLast);
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
							const continuation = getTreeContinuation(isLast);
							const msgPrefix = getTreePrefix(msgIsLast);
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
