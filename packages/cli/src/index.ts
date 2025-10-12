#!/usr/bin/env node

import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { DraftStore, SpecManager, validateEntity } from "@spec-mcp/core";
import { DashboardServer } from "@spec-mcp/dashboard/server";
import type {
	BusinessRequirement,
	Component,
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

const program = new Command();

program
	.name("spec-validate")
	.description("CLI tool for validating spec-mcp specifications")
	.version("0.1.0");

type AnyEntity = BusinessRequirement | TechnicalRequirement | Plan | Component;

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
			const [businessRequirements, techRequirements, plans, components] =
				await Promise.all([
					manager.business_requirements.list(),
					manager.tech_requirements.list(),
					manager.plans.list(),
					manager.components.list(),
				]);

			const requirements = [...businessRequirements, ...techRequirements];

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

				// Start dashboard WebSocket server
				const dashboard = new DashboardServer(specManager, draftStore, {
					port,
					host: options.host,
					autoOpen: options.open,
					specsPath,
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

program.parse();
