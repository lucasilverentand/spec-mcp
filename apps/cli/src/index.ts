#!/usr/bin/env node

import { exec as execCallback, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";
import { search } from "@inquirer/prompts";
import { DraftStore, SpecManager, validateEntity } from "@spec-mcp/core";
import { DashboardServer } from "@spec-mcp/dashboard/server";
import type {
	BusinessRequirement,
	Component,
	Constitution,
	Decision,
	Milestone,
	Plan,
	TechnicalRequirement,
} from "@spec-mcp/schemas";
import { Command } from "commander";
import {
	colors,
	formatEntityId,
	getTreeContinuation,
	getTreePrefix,
	getValidationIcon,
	parseValidationErrors,
} from "./validation-formatter.js";

const exec = promisify(execCallback);

const program = new Command();

program
	.name("spec-mcp")
	.description("CLI tool for managing spec-mcp specifications")
	.version("0.1.0");

type AnyEntity =
	| BusinessRequirement
	| TechnicalRequirement
	| Plan
	| Component
	| Decision
	| Constitution
	| Milestone;

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

			// First, scan for ALL YAML files regardless of naming pattern
			const { promises: fs } = await import("node:fs");
			const path = await import("node:path");

			interface UnloadableFile {
				folder: string;
				fileName: string;
				reason: "invalid_name" | "parse_error" | "validation_error";
				details: string;
			}

			const unloadableFiles: UnloadableFile[] = [];

			// Scan each entity folder for files
			const entityFolders = [
				{
					path: "requirements/business",
					prefix: "brd",
					type: "business-requirement",
				},
				{
					path: "requirements/technical",
					prefix: "prd",
					type: "technical-requirement",
				},
				{ path: "plans", prefix: "pln", type: "plan" },
				{ path: "components", prefix: "cmp", type: "component" },
				{ path: "decisions", prefix: "dec", type: "decision" },
				{ path: "constitutions", prefix: "cst", type: "constitution" },
				{ path: "milestones", prefix: "mls", type: "milestone" },
			];

			for (const folder of entityFolders) {
				const folderPath = path.join(specsPath, folder.path);
				try {
					const files = await fs.readdir(folderPath);
					const ymlFiles = files.filter(
						(f) => f.endsWith(".yml") || f.endsWith(".yaml"),
					);

					for (const file of ymlFiles) {
						const fileName = file.replace(/\.(yml|yaml)$/, "");

						// Check if it matches the expected pattern
						const finalizedPattern = new RegExp(
							`^${folder.prefix}-(\\d+)-([a-z0-9-]+)$`,
						);
						const draftPattern = new RegExp(
							`^${folder.prefix}-(\\d+)\\.draft$`,
						);

						const isFinalizedMatch = finalizedPattern.test(fileName);
						const isDraftMatch = draftPattern.test(fileName);

						if (!isFinalizedMatch && !isDraftMatch) {
							unloadableFiles.push({
								folder: folder.path,
								fileName: file,
								reason: "invalid_name",
								details: `File name must match pattern: ${folder.prefix}-###-lowercase-slug-with-hyphens.yml (or ${folder.prefix}-###.draft.yml for drafts)`,
							});
						}
					}
				} catch (error) {
					// Folder doesn't exist or can't be read - that's okay
					if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
						console.log(
							`${colors.yellow}Warning: Could not read folder ${folder.path}${colors.reset}`,
						);
					}
				}
			}

			// Load all entities and validate them
			const [
				businessRequirements,
				techRequirements,
				plans,
				components,
				decisions,
				constitutions,
				milestones,
			] = await Promise.all([
				manager.business_requirements.list(),
				manager.tech_requirements.list(),
				manager.plans.list(),
				manager.components.list(),
				manager.decisions.list(),
				manager.constitutions.list(),
				manager.milestones.list(),
			]);

			// Validate each entity individually by attempting to parse them again
			const businessRequirementValidations: EntityValidation[] = [];
			const techRequirementValidations: EntityValidation[] = [];
			const planValidations: EntityValidation[] = [];
			const componentValidations: EntityValidation[] = [];
			const decisionValidations: EntityValidation[] = [];
			const constitutionValidations: EntityValidation[] = [];
			const milestoneValidations: EntityValidation[] = [];

			// For now, since entities are already validated on load via schema.parse(),
			// we just mark them as having no errors. In the future, we can add
			// business logic validation here.
			for (const req of businessRequirements) {
				businessRequirementValidations.push({
					entity: req,
					errors: [],
					warnings: [],
				});
			}

			for (const req of techRequirements) {
				techRequirementValidations.push({
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

			for (const decision of decisions) {
				decisionValidations.push({
					entity: decision,
					errors: [],
					warnings: [],
				});
			}

			for (const constitution of constitutions) {
				constitutionValidations.push({
					entity: constitution,
					errors: [],
					warnings: [],
				});
			}

			for (const milestone of milestones) {
				milestoneValidations.push({
					entity: milestone,
					errors: [],
					warnings: [],
				});
			}

			// Display grouped results
			let totalErrors = 0;
			let totalWarnings = 0;
			let allValid = true;

			// Business Requirements
			console.log(`${colors.cyan}Business Requirements:${colors.reset}`);
			for (const validation of businessRequirementValidations) {
				const entity = validation.entity;
				const entityId = formatEntityId(
					entity.type,
					entity.number,
					entity.slug,
				);
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

			// Technical Requirements
			console.log(`${colors.cyan}Technical Requirements:${colors.reset}`);
			for (const validation of techRequirementValidations) {
				const entity = validation.entity;
				const entityId = formatEntityId(
					entity.type,
					entity.number,
					entity.slug,
				);
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
				const entityId = formatEntityId(
					entity.type,
					entity.number,
					entity.slug,
				);
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
				const entityId = formatEntityId(
					entity.type,
					entity.number,
					entity.slug,
				);
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

			// Decisions
			console.log(`${colors.cyan}Decisions:${colors.reset}`);
			for (const validation of decisionValidations) {
				const entity = validation.entity;
				const entityId = formatEntityId(
					entity.type,
					entity.number,
					entity.slug,
				);
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

			// Constitutions
			console.log(`${colors.cyan}Constitutions:${colors.reset}`);
			for (const validation of constitutionValidations) {
				const entity = validation.entity;
				const entityId = formatEntityId(
					entity.type,
					entity.number,
					entity.slug,
				);
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

			// Milestones
			console.log(`${colors.cyan}Milestones:${colors.reset}`);
			for (const validation of milestoneValidations) {
				const entity = validation.entity;
				const entityId = formatEntityId(
					entity.type,
					entity.number,
					entity.slug,
				);
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

			// Report unloadable files
			if (unloadableFiles.length > 0) {
				console.log(
					`${colors.red}⚠ Unloadable Files (${unloadableFiles.length}):${colors.reset}`,
				);
				console.log("");

				for (const file of unloadableFiles) {
					console.log(
						`  ${colors.red}✗${colors.reset} ${colors.dim}${file.folder}/${file.fileName}${colors.reset}`,
					);
					console.log(
						`    ${colors.yellow}Reason:${colors.reset} ${file.reason === "invalid_name" ? "Invalid file name pattern" : "Parse or validation error"}`,
					);
					console.log(`    ${colors.dim}${file.details}${colors.reset}`);
					console.log("");
				}

				allValid = false;
			}

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
			if (
				totalErrors === 0 &&
				totalWarnings === 0 &&
				unloadableFiles.length === 0
			) {
				console.log(`  ${colors.green}All validations passed!${colors.reset}`);
			}
			if (unloadableFiles.length > 0) {
				console.log(
					`  ${colors.red}Unloadable Files: ${unloadableFiles.length}${colors.reset}`,
				);
			}
			console.log(
				`  Business Requirements: ${businessRequirements.length} (${businessRequirementValidations.filter((v) => v.errors.length === 0 && v.warnings.length === 0).length} valid)`,
			);
			console.log(
				`  Technical Requirements: ${techRequirements.length} (${techRequirementValidations.filter((v) => v.errors.length === 0 && v.warnings.length === 0).length} valid)`,
			);
			console.log(
				`  Plans: ${plans.length} (${planValidations.filter((v) => v.errors.length === 0 && v.warnings.length === 0).length} valid)`,
			);
			console.log(
				`  Components: ${components.length} (${componentValidations.filter((v) => v.errors.length === 0 && v.warnings.length === 0).length} valid)`,
			);
			console.log(
				`  Decisions: ${decisions.length} (${decisionValidations.filter((v) => v.errors.length === 0 && v.warnings.length === 0).length} valid)`,
			);
			console.log(
				`  Constitutions: ${constitutions.length} (${constitutionValidations.filter((v) => v.errors.length === 0 && v.warnings.length === 0).length} valid)`,
			);
			console.log(
				`  Milestones: ${milestones.length} (${milestoneValidations.filter((v) => v.errors.length === 0 && v.warnings.length === 0).length} valid)`,
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

program
	.command("check")
	.description("Validate a specific entity by ID")
	.argument(
		"<id>",
		"Entity ID (e.g., pln-001, pln-001-user-auth, or pln-001-user-auth.yml)",
	)
	.option("-p, --path <path>", "Path to specs folder", "./specs")
	.action(async (id: string, options: { path: string }) => {
		try {
			const specsPath = resolve(process.cwd(), options.path);

			// Initialize the spec manager with the provided path
			const manager = new SpecManager(specsPath);

			// Validate the entity
			const result = await validateEntity(manager, id);

			if (!result.valid) {
				console.log(`\n${colors.red}✗ Validation Failed${colors.reset}\n`);
				console.log(`Entity ID: ${colors.dim}${id}${colors.reset}\n`);
				console.log(`${colors.red}Errors:${colors.reset}`);
				for (const error of result.errors || []) {
					console.log(`  ${colors.red}•${colors.reset} ${error}`);
				}
				console.log("");
				process.exit(1);
			}

			// Valid entity - show details
			const entity = result.entity!;
			console.log(`\n${colors.green}✓ Validation Successful${colors.reset}\n`);
			console.log(
				`Entity ID: ${colors.cyan}${formatEntityId(entity.type, entity.number, entity.slug)}${colors.reset}`,
			);
			console.log(`Type: ${entity.type}`);
			console.log(`Number: ${entity.number}`);

			if (entity.slug) {
				console.log(`Slug: ${entity.slug}`);
			}

			if ("name" in entity && entity.name) {
				console.log(`Name: ${entity.name}`);
			}

			if ("draft" in entity) {
				console.log(`Draft: ${entity.draft ? "Yes" : "No"}`);
			}

			if ("priority" in entity && entity.priority) {
				console.log(`Priority: ${entity.priority}`);
			}

			console.log(`\n${colors.cyan}Timestamps:${colors.reset}`);
			console.log(`  Created: ${entity.created_at}`);
			console.log(`  Updated: ${entity.updated_at}`);

			console.log(
				`\n${colors.green}Entity conforms to schema${colors.reset}\n`,
			);
			process.exit(0);
		} catch (error) {
			console.error(`\n${colors.red}✗ Error:${colors.reset}`);
			console.error(error instanceof Error ? error.message : String(error));
			console.log("");
			process.exit(1);
		}
	});

program
	.command("dashboard")
	.description("Start the web dashboard")
	.option("-p, --port <port>", "Port number", "3737")
	.option("-h, --host <host>", "Host address", "localhost")
	.option("--specs-path <path>", "Path to specs folder", "./specs")
	.option("--open", "Open browser automatically", false)
	.action(
		async (options: {
			port: string;
			host: string;
			specsPath: string;
			open: boolean;
		}) => {
			try {
				const port = Number.parseInt(options.port, 10);
				const specsPath = resolve(process.cwd(), options.specsPath);

				console.log(
					`\n${colors.cyan}Starting Spec MCP Dashboard...${colors.reset}`,
				);
				console.log(`${colors.dim}Specs path: ${specsPath}${colors.reset}`);

				// Initialize managers
				const specManager = new SpecManager(specsPath);
				await specManager.ensureFolders();

				const draftStore = new DraftStore(specManager);
				await draftStore.loadAll();

				// Start dashboard server
				const dashboard = new DashboardServer(specManager, draftStore, {
					port,
					host: options.host,
					autoOpen: options.open,
				});

				await dashboard.start();

				// Open browser if requested
				if (options.open) {
					setTimeout(() => {
						const url = `http://${options.host}:${port}`;
						const command =
							process.platform === "darwin"
								? "open"
								: process.platform === "win32"
									? "start"
									: "xdg-open";
						spawn(command, [url], { stdio: "ignore" });
						console.log(`\n${colors.dim}Opening browser...${colors.reset}`);
					}, 2000);
				}

				console.log(`\n${colors.cyan}Dashboard is running.${colors.reset}`);
				console.log(`${colors.dim}Press Ctrl+C to stop${colors.reset}\n`);

				// Handle shutdown
				const shutdown = async () => {
					console.log(`\n${colors.cyan}Shutting down...${colors.reset}`);
					await dashboard.stop();
					console.log(`${colors.green}✓${colors.reset} Dashboard stopped\n`);
					process.exit(0);
				};

				process.on("SIGINT", shutdown);
				process.on("SIGTERM", shutdown);

				// Keep process alive
				await new Promise(() => {});
			} catch (error) {
				console.error(
					`\n${colors.red}✗ Failed to start dashboard:${colors.reset}`,
				);
				console.error(error instanceof Error ? error.message : String(error));
				console.log("");
				process.exit(1);
			}
		},
	);

program
	.command("worktree")
	.description("Create a git worktree for a plan (interactive)")
	.argument(
		"[plan-id]",
		"Plan ID (e.g., pln-001 or pln-001-feature). If omitted, an interactive picker will be shown.",
	)
	.option("-p, --path <path>", "Path to specs folder", "./specs")
	.option(
		"--print-path",
		"Only print the worktree path (for shell integration)",
	)
	.action(
		async (
			planId: string | undefined,
			options: { path: string; printPath?: boolean },
		) => {
			try {
				const specsPath = resolve(process.cwd(), options.path);
				const repoRoot = dirname(specsPath);

				// Check if we're in a git repository
				try {
					await exec("git rev-parse --git-dir", { cwd: repoRoot });
				} catch (_error) {
					console.error(`\n${colors.red}✗ Not a git repository${colors.reset}`);
					console.error(`Current directory: ${repoRoot}`);
					console.log("");
					process.exit(1);
				}

				// Initialize spec manager and load all plans
				const manager = new SpecManager(specsPath);
				await manager.ensureFolders();

				let plan: Plan | undefined;

				try {
					const plans = await manager.plans.list();

					if (plans.length === 0) {
						console.error(`\n${colors.red}✗ No plans found${colors.reset}`);
						console.error(`Please create a plan first in: ${specsPath}`);
						console.log("");
						process.exit(1);
					}

					// If no plan ID provided, show interactive picker
					if (!planId) {
						console.log(
							`\n${colors.cyan}Select a plan to create a worktree for:${colors.reset}\n`,
						);

						const choices = plans.map((p) => {
							const id = formatEntityId(p.type, p.number, p.slug);
							return {
								name: `${id}: ${p.name}`,
								value: id,
								description: p.description || "",
							};
						});

						const selectedId = await search({
							message: "Search for a plan:",
							source: async (input) => {
								if (!input) {
									return choices;
								}

								const lowerInput = input.toLowerCase();
								return choices.filter(
									(choice) =>
										choice.value.toLowerCase().includes(lowerInput) ||
										choice.name.toLowerCase().includes(lowerInput) ||
										choice.description.toLowerCase().includes(lowerInput),
								);
							},
						});

						planId = selectedId;
						console.log("");
					}

					// Parse the plan ID to get just the base ID (e.g., pln-001)
					const match = planId.match(/^([a-z]{3})-(\d+)/);
					if (!match || !match[1] || !match[2]) {
						console.error(
							`${colors.red}✗ Invalid plan ID format${colors.reset}`,
						);
						console.error(`Expected format: pln-001 or pln-001-feature`);
						console.log("");
						process.exit(1);
					}

					const prefix = match[1];
					const number = match[2];
					if (prefix !== "pln") {
						console.error(
							`${colors.red}✗ Only plan IDs are supported${colors.reset}`,
						);
						console.error(`Expected format: pln-001 or pln-001-feature`);
						console.log("");
						process.exit(1);
					}

					// Find the plan
					const planNumber = Number.parseInt(number, 10);
					plan = plans.find((p) => p.number === planNumber);

					if (!plan) {
						console.error(`${colors.red}✗ Plan not found${colors.reset}`);
						console.error(`No plan found with ID: ${planId}`);
						console.log("");
						process.exit(1);
					}
				} catch (error) {
					console.error(`${colors.red}✗ Error loading plans${colors.reset}`);
					console.error(error instanceof Error ? error.message : String(error));
					console.log("");
					process.exit(1);
				}

				console.log(
					`${colors.cyan}Creating worktree for plan...${colors.reset}\n`,
				);

				// Create the worktree path and branch name
				const fullPlanId = formatEntityId(plan.type, plan.number, plan.slug);
				const worktreePath = resolve(repoRoot, "..", fullPlanId);
				const branchName = `plan/${fullPlanId}`;

				console.log(`${colors.dim}Plan: ${plan.name}${colors.reset}`);
				console.log(
					`${colors.dim}Worktree path: ${worktreePath}${colors.reset}`,
				);
				console.log(`${colors.dim}Branch: ${branchName}${colors.reset}\n`);

				// Check if worktree already exists
				if (existsSync(worktreePath)) {
					// Verify it's actually a git worktree
					try {
						await exec("git rev-parse --git-dir", { cwd: worktreePath });

						// If --print-path is used, just print the path for shell integration
						if (options.printPath) {
							console.log(worktreePath);
							process.exit(0);
						}

						console.log(
							`${colors.cyan}Worktree already exists!${colors.reset}`,
						);
						console.log(
							`\n${colors.green}✓ Found existing worktree${colors.reset}\n`,
						);
						console.log(`${colors.cyan}Path:${colors.reset} ${worktreePath}`);
						console.log(`${colors.dim}Branch: ${branchName}${colors.reset}`);
						console.log("");
						console.log(
							`${colors.cyan}To change to the worktree directory:${colors.reset}`,
						);
						console.log(`  cd "${worktreePath}"`);
						console.log("");
						console.log(
							`${colors.cyan}Or use the shell integration:${colors.reset}`,
						);
						console.log(
							`  cd "$(spec-mcp worktree ${planId || ""} --print-path)"`,
						);
						console.log("");
						console.log(
							`${colors.cyan}To remove the worktree when done:${colors.reset}`,
						);
						console.log(`  git worktree remove "${worktreePath}"`);
						console.log("");
						process.exit(0);
					} catch (_error) {
						console.error(
							`${colors.red}✗ Directory exists but is not a git worktree${colors.reset}`,
						);
						console.error(`Path: ${worktreePath}`);
						console.log("");
						process.exit(1);
					}
				}

				// Check if branch already exists
				try {
					await exec(`git rev-parse --verify ${branchName}`, { cwd: repoRoot });
					// Branch exists, use it
					console.log(
						`${colors.cyan}Branch ${branchName} already exists, using it...${colors.reset}`,
					);
				} catch {
					// Branch doesn't exist, will be created by git worktree
					console.log(
						`${colors.cyan}Creating new branch ${branchName}...${colors.reset}`,
					);
				}

				// Create the git worktree
				try {
					const { stdout, stderr } = await exec(
						`git worktree add ${worktreePath} -b ${branchName} 2>&1 || git worktree add ${worktreePath} ${branchName}`,
						{ cwd: repoRoot },
					);

					if (stderr && !stderr.includes("Preparing worktree")) {
						console.log(`${colors.dim}${stderr}${colors.reset}`);
					}
					if (stdout) {
						console.log(`${colors.dim}${stdout}${colors.reset}`);
					}

					// If --print-path is used, just print the path for shell integration
					if (options.printPath) {
						console.log(worktreePath);
						process.exit(0);
					}

					console.log(
						`\n${colors.green}✓ Worktree created successfully!${colors.reset}\n`,
					);
					console.log(`${colors.cyan}Path:${colors.reset} ${worktreePath}`);
					console.log(`${colors.dim}Branch: ${branchName}${colors.reset}`);
					console.log("");
					console.log(
						`${colors.cyan}To change to the worktree directory:${colors.reset}`,
					);
					console.log(`  cd "${worktreePath}"`);
					console.log("");
					console.log(
						`${colors.cyan}Or use the shell integration:${colors.reset}`,
					);
					console.log(
						`  cd "$(spec-mcp worktree ${planId || ""} --print-path)"`,
					);
					console.log("");
					console.log(
						`${colors.cyan}To remove the worktree when done:${colors.reset}`,
					);
					console.log(`  git worktree remove "${worktreePath}"`);
					console.log("");
				} catch (error) {
					console.error(
						`${colors.red}✗ Failed to create worktree${colors.reset}`,
					);
					console.error(error instanceof Error ? error.message : String(error));
					console.log("");
					process.exit(1);
				}
			} catch (error) {
				console.error(`${colors.red}✗ Error:${colors.reset}`);
				console.error(error instanceof Error ? error.message : String(error));
				console.log("");
				process.exit(1);
			}
		},
	);

program.parse();
