import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpecManager } from "@spec-mcp/core";
import { z } from "zod";
import {
	// Decision tools
	addAlternative,
	addAlternativeTool,
	addApiContract,
	addApiContractTool,
	addBusinessValue,
	addBusinessValueTool,
	addConsequence,
	addConsequenceTool,
	// Technical Requirement tools
	addConstraint,
	addConstraintTool,
	// Criteria tools
	addCriteria,
	addCriteriaTool,
	addDataModel,
	addDataModelTool,
	addDeployment,
	addDeploymentTool,
	addExternalDependency,
	addExternalDependencyTool,
	// Plan Array tools
	addFlow,
	addFlowTool,
	addReferenceToBrd,
	addReferenceToBrdTool,
	addReferenceToDecision,
	addReferenceToDecisionTool,
	// Milestone tools
	addReferenceToMilestone,
	addReferenceToMilestoneTool,
	// Reference tools
	addReferenceToPlan,
	addReferenceToPlanTool,
	addReferenceToPrd,
	addReferenceToPrdTool,
	addStakeholder,
	addStakeholderTool,
	// Component tools
	addTech,
	addTechnicalDependency,
	addTechnicalDependencyTool,
	addTechTool,
	// Test Case tools
	addTestCase,
	addTestCaseTool,
	// Business Requirement tools
	addUserStory,
	addUserStoryTool,
	// Milestone status tools
	completeMilestone,
	completeMilestoneTool,
	startMilestone,
	startMilestoneTool,
	updateBusinessRequirement,
	updateBusinessRequirementTool,
	updateComponent,
	updateComponentTool,
	updateDecision,
	updateDecisionTool,
	// Update tools
	updatePlan,
	updatePlanTool,
	updateTechnicalRequirement,
	updateTechnicalRequirementTool,
	verifyMilestone,
	verifyMilestoneTool,
} from "./tools/index.js";
import { logger } from "./utils/logger.js";

/**
 * Register all array manipulation and update tools (41 tools)
 */
export function registerArrayManipulationTools(
	server: McpServer,
	specManager: SpecManager,
) {
	// CRITERIA TOOLS (1)
	server.tool(
		addCriteriaTool.name,
		addCriteriaTool.description,
		{
			spec_id: z.string(),
			description: z.string(),
			rationale: z.string(),
			supersede_id: z.string().optional(),
		},
		async (args) => {
			try {
				return await addCriteria(
					specManager,
					args.spec_id,
					args.description,
					args.rationale,
					args.supersede_id,
				);
			} catch (error) {
				logger.error({ error, tool: "add_criteria" }, "Tool execution failed");
				throw error;
			}
		},
	);

	// BUSINESS REQUIREMENT TOOLS (6)
	server.tool(
		addUserStoryTool.name,
		addUserStoryTool.description,
		{
			spec_id: z.string(),
			role: z.string(),
			feature: z.string(),
			benefit: z.string(),
		},
		async (args) => {
			try {
				return await addUserStory(
					specManager,
					args.spec_id,
					args.role,
					args.feature,
					args.benefit,
				);
			} catch (error) {
				logger.error(
					{ error, tool: "add_user_story" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	server.tool(
		addBusinessValueTool.name,
		addBusinessValueTool.description,
		{
			spec_id: z.string(),
			type: z.enum([
				"revenue",
				"cost-savings",
				"customer-satisfaction",
				"other",
			]),
			value: z.string(),
		},
		async (args) => {
			try {
				return await addBusinessValue(
					specManager,
					args.spec_id,
					args.type,
					args.value,
				);
			} catch (error) {
				logger.error(
					{ error, tool: "add_business_value" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	server.tool(
		addStakeholderTool.name,
		addStakeholderTool.description,
		{
			spec_id: z.string(),
			role: z.enum([
				"product-owner",
				"business-analyst",
				"project-manager",
				"customer",
				"end-user",
				"executive",
				"developer",
				"other",
			]),
			name: z.string(),
			interest: z.string(),
			email: z.string().optional(),
		},
		async (args) => {
			try {
				return await addStakeholder(
					specManager,
					args.spec_id,
					args.role,
					args.name,
					args.interest,
					args.email,
				);
			} catch (error) {
				logger.error(
					{ error, tool: "add_stakeholder" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	// TECHNICAL REQUIREMENT TOOLS (2)
	server.tool(
		addConstraintTool.name,
		addConstraintTool.description,
		{
			requirement_id: z.string(),
			type: z.enum([
				"performance",
				"security",
				"scalability",
				"compatibility",
				"infrastructure",
				"other",
			]),
			description: z.string(),
		},
		async (args) => {
			try {
				return await addConstraint(
					specManager,
					args.requirement_id,
					args.type,
					args.description,
				);
			} catch (error) {
				logger.error(
					{ error, tool: "add_constraint" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	// TEST CASE TOOLS (1)
	server.tool(
		addTestCaseTool.name,
		addTestCaseTool.description,
		{
			plan_id: z.string(),
			name: z.string(),
			description: z.string(),
			steps: z.array(z.string()),
			expected_result: z.string(),
			implemented: z.boolean().optional(),
			passing: z.boolean().optional(),
			supersede_id: z.string().optional(),
		},
		async (args) => {
			try {
				return await addTestCase(
					specManager,
					args.plan_id,
					args.name,
					args.description,
					args.steps,
					args.expected_result,
					{
						implemented: args.implemented,
						passing: args.passing,
						supersede_id: args.supersede_id,
					},
				);
			} catch (error) {
				logger.error({ error, tool: "add_test_case" }, "Tool execution failed");
				throw error;
			}
		},
	);

	// PLAN ARRAY TOOLS (9)
	server.tool(
		addFlowTool.name,
		addFlowTool.description,
		{
			plan_id: z.string(),
			name: z.string(),
			description: z.string(),
			steps: z.array(z.string()),
		},
		async (args) => {
			try {
				return await addFlow(
					specManager,
					args.plan_id,
					args.name,
					args.description,
					args.steps,
				);
			} catch (error) {
				logger.error({ error, tool: "add_flow" }, "Tool execution failed");
				throw error;
			}
		},
	);

	server.tool(
		supersedeFlowTool.name,
		supersedeFlowTool.description,
		{
			plan_id: z.string(),
			flow_id: z.string(),
			name: z.string().optional(),
			description: z.string().optional(),
			steps: z.array(z.string()).optional(),
		},
		async (args) => {
			try {
				const updates: Record<string, unknown> = {};
				if (args.name !== undefined) updates.name = args.name;
				if (args.description !== undefined)
					updates.description = args.description;
				if (args.steps !== undefined) updates.steps = args.steps;
				return await supersedeFlow(
					specManager,
					args.plan_id,
					args.flow_id,
					updates,
				);
			} catch (error) {
				logger.error(
					{ error, tool: "supersede_flow" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	server.tool(
		addApiContractTool.name,
		addApiContractTool.description,
		{
			plan_id: z.string(),
			endpoint: z.string(),
			method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
			description: z.string(),
			request_schema: z.string().optional(),
			response_schema: z.string().optional(),
		},
		async (args) => {
			try {
				return await addApiContract(
					specManager,
					args.plan_id,
					args.endpoint,
					args.method,
					args.description,
					args.request_schema,
					args.response_schema,
				);
			} catch (error) {
				logger.error(
					{ error, tool: "add_api_contract" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	server.tool(
		supersedeApiContractTool.name,
		supersedeApiContractTool.description,
		{
			plan_id: z.string(),
			contract_id: z.string(),
			endpoint: z.string().optional(),
			method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).optional(),
			description: z.string().optional(),
			request_schema: z.string().optional(),
			response_schema: z.string().optional(),
		},
		async (args) => {
			try {
				const updates: Record<string, unknown> = {};
				if (args.endpoint !== undefined) updates.endpoint = args.endpoint;
				if (args.method !== undefined) updates.method = args.method;
				if (args.description !== undefined)
					updates.description = args.description;
				if (args.request_schema !== undefined)
					updates.request_schema = args.request_schema;
				if (args.response_schema !== undefined)
					updates.response_schema = args.response_schema;
				return await supersedeApiContract(
					specManager,
					args.plan_id,
					args.contract_id,
					updates,
				);
			} catch (error) {
				logger.error(
					{ error, tool: "supersede_api_contract" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	server.tool(
		addDataModelTool.name,
		addDataModelTool.description,
		{
			plan_id: z.string(),
			name: z.string(),
			description: z.string(),
			fields: z.array(z.string()),
		},
		async (args) => {
			try {
				return await addDataModel(
					specManager,
					args.plan_id,
					args.name,
					args.description,
					args.fields,
				);
			} catch (error) {
				logger.error(
					{ error, tool: "add_data_model" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	server.tool(
		supersedeDataModelTool.name,
		supersedeDataModelTool.description,
		{
			plan_id: z.string(),
			model_id: z.string(),
			name: z.string().optional(),
			description: z.string().optional(),
			fields: z.array(z.string()).optional(),
		},
		async (args) => {
			try {
				const updates: Record<string, unknown> = {};
				if (args.name !== undefined) updates.name = args.name;
				if (args.description !== undefined)
					updates.description = args.description;
				if (args.fields !== undefined) updates.fields = args.fields;
				return await supersedeDataModel(
					specManager,
					args.plan_id,
					args.model_id,
					updates,
				);
			} catch (error) {
				logger.error(
					{ error, tool: "supersede_data_model" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	// DECISION TOOLS (6)
	server.tool(
		addAlternativeTool.name,
		addAlternativeTool.description,
		{
			decision_id: z.string(),
			title: z.string(),
			description: z.string(),
			pros: z.array(z.string()),
			cons: z.array(z.string()),
		},
		async (args) => {
			try {
				return await addAlternative(
					specManager,
					args.decision_id,
					args.title,
					args.description,
					args.pros,
					args.cons,
				);
			} catch (error) {
				logger.error(
					{ error, tool: "add_alternative" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	server.tool(
		addConsequenceTool.name,
		addConsequenceTool.description,
		{
			decision_id: z.string(),
			type: z.enum(["positive", "negative", "neutral"]),
			description: z.string(),
		},
		async (args) => {
			try {
				return await addConsequence(
					specManager,
					args.decision_id,
					args.type,
					args.description,
				);
			} catch (error) {
				logger.error(
					{ error, tool: "add_consequence" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	server.tool(
		addReferenceToDecisionTool.name,
		addReferenceToDecisionTool.description,
		{
			decision_id: z.string(),
			url: z.string(),
			description: z.string().optional(),
		},
		async (args) => {
			try {
				return await addReferenceToDecision(
					specManager,
					args.decision_id,
					args.url,
					args.description,
				);
			} catch (error) {
				logger.error(
					{ error, tool: "add_reference_to_decision" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	// COMPONENT TOOLS (6)
	server.tool(
		addTechTool.name,
		addTechTool.description,
		{
			component_id: z.string(),
			name: z.string(),
			version: z.string().optional(),
			purpose: z.string(),
		},
		async (args) => {
			try {
				return await addTech(
					specManager,
					args.component_id,
					args.name,
					args.version,
					args.purpose,
				);
			} catch (error) {
				logger.error({ error, tool: "add_tech" }, "Tool execution failed");
				throw error;
			}
		},
	);

	server.tool(
		addDeploymentTool.name,
		addDeploymentTool.description,
		{
			component_id: z.string(),
			environment: z.enum(["development", "staging", "production", "other"]),
			platform: z.string(),
			configuration: z.string().optional(),
		},
		async (args) => {
			try {
				return await addDeployment(
					specManager,
					args.component_id,
					args.environment,
					args.platform,
					args.configuration,
				);
			} catch (error) {
				logger.error(
					{ error, tool: "add_deployment" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	server.tool(
		addExternalDependencyTool.name,
		addExternalDependencyTool.description,
		{
			component_id: z.string(),
			name: z.string(),
			type: z.enum(["api", "service", "library", "database", "other"]),
			description: z.string(),
		},
		async (args) => {
			try {
				return await addExternalDependency(
					specManager,
					args.component_id,
					args.name,
					args.type,
					args.description,
				);
			} catch (error) {
				logger.error(
					{ error, tool: "add_external_dependency" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	// REFERENCE TOOLS (8)
	server.tool(
		addReferenceToPlanTool.name,
		addReferenceToPlanTool.description,
		{
			plan_id: z.string(),
			url: z.string(),
			description: z.string().optional(),
		},
		async (args) => {
			try {
				return await addReferenceToPlan(
					specManager,
					args.plan_id,
					args.url,
					args.description,
				);
			} catch (error) {
				logger.error(
					{ error, tool: "add_reference_to_plan" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	server.tool(
		addReferenceToBrdTool.name,
		addReferenceToBrdTool.description,
		{
			brd_id: z.string(),
			url: z.string(),
			description: z.string().optional(),
		},
		async (args) => {
			try {
				return await addReferenceToBrd(
					specManager,
					args.brd_id,
					args.url,
					args.description,
				);
			} catch (error) {
				logger.error(
					{ error, tool: "add_reference_to_brd" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	server.tool(
		addTechnicalDependencyTool.name,
		addTechnicalDependencyTool.description,
		{
			requirement_id: z.string(),
			spec_id: z.string(),
		},
		async (args) => {
			try {
				return await addTechnicalDependency(
					specManager,
					args.requirement_id,
					args.spec_id,
				);
			} catch (error) {
				logger.error(
					{ error, tool: "add_technical_dependency" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	server.tool(
		addReferenceToPrdTool.name,
		addReferenceToPrdTool.description,
		{
			prd_id: z.string(),
			url: z.string(),
			description: z.string().optional(),
		},
		async (args) => {
			try {
				return await addReferenceToPrd(
					specManager,
					args.prd_id,
					args.url,
					args.description,
				);
			} catch (error) {
				logger.error(
					{ error, tool: "add_reference_to_prd" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	// UPDATE TOOLS (5)
	server.tool(
		updatePlanTool.name,
		updatePlanTool.description,
		{
			plan_id: z.string(),
			title: z.string().optional(),
			description: z.string().optional(),
			scope: z
				.object({
					in_scope: z.array(z.string()),
					out_of_scope: z.array(z.string()),
				})
				.optional(),
		},
		async (args) => {
			try {
				const updates: Record<string, unknown> = {};
				if (args.title !== undefined) updates.title = args.title;
				if (args.description !== undefined)
					updates.description = args.description;
				if (args.scope !== undefined) updates.scope = args.scope;
				return await updatePlan(specManager, args.plan_id, updates);
			} catch (error) {
				logger.error({ error, tool: "update_plan" }, "Tool execution failed");
				throw error;
			}
		},
	);

	server.tool(
		updateBusinessRequirementTool.name,
		updateBusinessRequirementTool.description,
		{
			brd_id: z.string(),
			title: z.string().optional(),
			description: z.string().optional(),
			business_goals: z.array(z.string()).optional(),
		},
		async (args) => {
			try {
				const updates: Record<string, unknown> = {};
				if (args.title !== undefined) updates.title = args.title;
				if (args.description !== undefined)
					updates.description = args.description;
				if (args.business_goals !== undefined)
					updates.business_goals = args.business_goals;
				return await updateBusinessRequirement(
					specManager,
					args.brd_id,
					updates,
				);
			} catch (error) {
				logger.error(
					{ error, tool: "update_business_requirement" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	server.tool(
		updateTechnicalRequirementTool.name,
		updateTechnicalRequirementTool.description,
		{
			requirement_id: z.string(),
			title: z.string().optional(),
			description: z.string().optional(),
			priority: z.enum(["critical", "high", "medium", "low"]).optional(),
		},
		async (args) => {
			try {
				const updates: Record<string, unknown> = {};
				if (args.title !== undefined) updates.title = args.title;
				if (args.description !== undefined)
					updates.description = args.description;
				if (args.priority !== undefined) updates.priority = args.priority;
				return await updateTechnicalRequirement(
					specManager,
					args.requirement_id,
					updates,
				);
			} catch (error) {
				logger.error(
					{ error, tool: "update_technical_requirement" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	server.tool(
		updateDecisionTool.name,
		updateDecisionTool.description,
		{
			decision_id: z.string(),
			title: z.string().optional(),
			context: z.string().optional(),
			decision: z.string().optional(),
			status: z
				.enum(["proposed", "accepted", "rejected", "deprecated"])
				.optional(),
		},
		async (args) => {
			try {
				const updates: Record<string, unknown> = {};
				if (args.title !== undefined) updates.title = args.title;
				if (args.context !== undefined) updates.context = args.context;
				if (args.decision !== undefined) updates.decision = args.decision;
				if (args.status !== undefined) updates.status = args.status;
				return await updateDecision(specManager, args.decision_id, updates);
			} catch (error) {
				logger.error(
					{ error, tool: "update_decision" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	server.tool(
		updateComponentTool.name,
		updateComponentTool.description,
		{
			component_id: z.string(),
			title: z.string().optional(),
			description: z.string().optional(),
			type: z
				.enum(["service", "library", "application", "database", "other"])
				.optional(),
		},
		async (args) => {
			try {
				const updates: Record<string, unknown> = {};
				if (args.title !== undefined) updates.title = args.title;
				if (args.description !== undefined)
					updates.description = args.description;
				if (args.type !== undefined) updates.type = args.type;
				return await updateComponent(specManager, args.component_id, updates);
			} catch (error) {
				logger.error(
					{ error, tool: "update_component" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	// MILESTONE TOOLS (4)
	server.tool(
		startMilestoneTool.name,
		startMilestoneTool.description,
		{
			milestone_id: z.string(),
		},
		async (args) => {
			try {
				return await startMilestone(specManager, args.milestone_id);
			} catch (error) {
				logger.error(
					{ error, tool: "start_milestone" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	server.tool(
		completeMilestoneTool.name,
		completeMilestoneTool.description,
		{
			milestone_id: z.string(),
		},
		async (args) => {
			try {
				return await completeMilestone(specManager, args.milestone_id);
			} catch (error) {
				logger.error(
					{ error, tool: "complete_milestone" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	server.tool(
		verifyMilestoneTool.name,
		verifyMilestoneTool.description,
		{
			milestone_id: z.string(),
			note: z.string().optional(),
		},
		async (args) => {
			try {
				return await verifyMilestone(
					specManager,
					args.milestone_id,
					args.note,
				);
			} catch (error) {
				logger.error(
					{ error, tool: "verify_milestone" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	server.tool(
		addReferenceToMilestoneTool.name,
		addReferenceToMilestoneTool.description,
		{
			milestone_id: z.string(),
			reference: z.object({
				type: z.enum(["url", "documentation", "file", "code", "other"]),
				name: z.string(),
				description: z.string(),
				importance: z.enum(["low", "medium", "high", "critical"]).optional(),
			}),
		},
		async (args) => {
			try {
				return await addReferenceToMilestone(
					specManager,
					args.milestone_id,
					args.reference,
				);
			} catch (error) {
				logger.error(
					{ error, tool: "add_reference_to_milestone" },
					"Tool execution failed",
				);
				throw error;
			}
		},
	);

	logger.info("Registered 26 array manipulation and update tools");
}
