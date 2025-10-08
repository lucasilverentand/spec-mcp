import { spawn } from "node:child_process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

describe("MCP E2E Tests", () => {
	let client: Client;
	let serverProcess: ReturnType<typeof spawn>;

	beforeAll(async () => {
		// Start the MCP server
		serverProcess = spawn("node", ["./dist/index.js"], {
			env: {
				...process.env,
				SPECS_ROOT: "./test-specs-e2e",
				LOG_LEVEL: "error",
			},
			stdio: ["pipe", "pipe", "inherit"],
		});

		// Give server time to start
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Create MCP client
		const transport = new StdioClientTransport({
			command: "node",
			args: ["./dist/index.js"],
			env: {
				SPECS_ROOT: "./test-specs-e2e",
				LOG_LEVEL: "error",
			},
		});

		client = new Client(
			{
				name: "test-client",
				version: "1.0.0",
			},
			{
				capabilities: {},
			},
		);

		await client.connect(transport);
	}, 10000);

	afterAll(async () => {
		if (client) {
			await client.close();
		}
		if (serverProcess) {
			serverProcess.kill();
		}
	});

	describe("Tool Discovery", () => {
		it("should list available tools", async () => {
			const tools = await client.listTools();

			expect(tools.tools).toBeDefined();
			expect(tools.tools.length).toBeGreaterThan(0);

			const toolNames = tools.tools.map((t) => t.name);
			// New draft-based tools
			expect(toolNames).toContain("create_draft");
			expect(toolNames).toContain("submit_draft_answer");
			expect(toolNames).toContain("create_requirement");
			expect(toolNames).toContain("create_component");
			expect(toolNames).toContain("create_plan");
		});
	});

	describe("Requirement Operations", () => {
		// Commented out - this test needs to be rewritten for the new Q&A-based draft flow
		// The new flow uses create_draft -> submit_draft_answer (multiple times) -> create_requirement
		it.skip("should create a requirement using creation flow", async () => {
			// Step 1: Start the draft with type, name, and slug
			const uniqueSlug = `test-requirement-${Date.now()}`;
			const startResult = await client.callTool({
				name: "start_draft",
				arguments: {
					type: "requirement",
					name: "Test Requirement for E2E Validation",
					slug: uniqueSlug,
				},
			});

			expect(startResult).toBeDefined();
			const startResponse = JSON.parse(startResult.content[0].text);
			expect(startResponse.draft_id).toBeDefined();
			expect(startResponse.question).toBeDefined();
			draftId = startResponse.draft_id;

			// The creation flow guides us through steps sequentially
			// update_draft field param should be the actual schema field name, not the step name
			// We'll provide full data objects for each step

			// Step 1: Research Similar Requirements
			let result = await client.callTool({
				name: "update_draft",
				arguments: {
					draft_id: draftId,
					data: {
						research_findings: "No similar requirements found",
					},
				},
			});
			let response = JSON.parse(result.content[0].text);

			// Step 2: Constitution Review
			result = await client.callTool({
				name: "update_draft",
				arguments: {
					draft_id: draftId,
					data: {
						no_constitutions: true,
					},
				},
			});
			response = JSON.parse(result.content[0].text);

			// Step 3: Technology Research
			result = await client.callTool({
				name: "update_draft",
				arguments: {
					draft_id: draftId,
					data: {
						technology_notes: "Standard web technologies",
					},
				},
			});
			response = JSON.parse(result.content[0].text);

			// Step 4: Identify Problem
			result = await client.callTool({
				name: "update_draft",
				arguments: {
					draft_id: draftId,
					data: {
						description:
							"A comprehensive test requirement for E2E testing. This is needed because we must validate the creation flow works correctly and handles all validation steps properly.",
					},
				},
			});
			response = JSON.parse(result.content[0].text);

			// Step 5: Avoid Implementation
			result = await client.callTool({
				name: "update_draft",
				arguments: {
					draft_id: draftId,
					data: {
						description:
							"System must complete E2E validation without implementation details",
					},
				},
			});
			response = JSON.parse(result.content[0].text);

			// Step 6: Criteria List (NEW - collect descriptions)
			result = await client.callTool({
				name: "update_draft",
				arguments: {
					draft_id: draftId,
					data: {
						criteria: [
							"System returns response in under 200ms",
							"API returns 201 status code on success",
						],
					},
				},
			});
			response = JSON.parse(result.content[0].text);

			// Step 7: Criteria Item 1 (NEW - expand first criterion)
			result = await client.callTool({
				name: "update_draft",
				arguments: {
					draft_id: draftId,
					data: {
						status: "active",
					},
				},
			});
			response = JSON.parse(result.content[0].text);

			// Step 7: Criteria Item 2 (NEW - expand second criterion)
			result = await client.callTool({
				name: "update_draft",
				arguments: {
					draft_id: draftId,
					data: {
						status: "active",
					},
				},
			});
			response = JSON.parse(result.content[0].text);

			// Step 8: Assign Priority
			result = await client.callTool({
				name: "update_draft",
				arguments: {
					draft_id: draftId,
					data: {
						priority: "required",
					},
				},
			});
			response = JSON.parse(result.content[0].text);

			// Step 9: Review and Finalize
			result = await client.callTool({
				name: "update_draft",
				arguments: {
					draft_id: draftId,
					data: {
						type: "requirement",
						number: 1,
						slug: uniqueSlug,
						name: "Test Requirement for E2E Validation",
						description: "API responds in under 200ms with 201 status code",
						priority: "required",
					},
				},
			});
			response = JSON.parse(result.content[0].text);

			const finalResponse = response;
			console.log("Final response:", finalResponse);
			expect(finalResponse.completed).toBe(true);

			// Now call finalize_draft to finalize the specification
			const createResult = await client.callTool({
				name: "finalize_draft",
				arguments: {
					draft_id: draftId,
				},
			});

			const createResponse = JSON.parse(createResult.content[0].text);
			console.log("Create response:", createResponse);
			expect(createResponse.success).toBe(true);
			expect(createResponse.spec_id).toBeDefined();
			createdId = createResponse.spec_id;
			expect(createdId).toMatch(/^req-\d{3}-test-requirement-\d+$/);
		});

		it.skip("should retrieve the created requirement", async () => {
			// Skipped - query tool not implemented in new architecture
		});

		it.skip("should list requirements", async () => {
			// Skipped - query tool not implemented in new architecture
		});

		it.skip("should delete requirement", async () => {
			// Skipped - delete_spec tool not implemented in new architecture
		});
	});

	describe("Security", () => {
		it.skip("should reject path traversal in IDs", async () => {
			// Skipped - query tool not implemented in new architecture
		});

		// 		it("should sanitize input strings", async () => {
		// 			// Start draft
		// 			const startResult = await client.callTool({
		// 				name: "start_draft",
		// 				arguments: {
		// 					type: "requirement",
		// 					slug: "test-sanitize",
		// 				},
		// 			});
		//
		// 			const startResponse = JSON.parse(startResult.content[0].text);
		// 			expect(startResponse.success).toBe(true);
		// 			const testDraftId = startResponse.data.draft_id;
		//
		// 			// The first field for requirements is "description"
		// 			// Try to set description with null bytes
		// 			const descResult = await client.callTool({
		// 				name: "update_draft",
		// 				arguments: {
		// 					draft_id: testDraftId,
		// 					field: "description",
		// 					value: "Test\x00Sanitize\x01Description that is longer than fifty characters because we need to validate the creation flow works",
		// 				},
		// 			});
		//
		// 			const descResponse = JSON.parse(descResult.content[0].text);
		// 			// Should succeed - sanitization happens before validation
		// 			expect(descResponse.success).toBe(true);
		//
		// 			// Clean up
		// 			await client.callTool({
		// 				name: "delete_spec",
		// 				arguments: { id: testDraftId },
		// 			});
		// 		});
	});

	describe("Error Handling", () => {
		it.skip("should return error for non-existent requirement", async () => {
			// Skipped - query tool not implemented in new architecture
		});

		it.skip("should validate required fields", async () => {
			// Skipped - needs to be rewritten for new draft flow
		});
	});

	describe("Query Tool Enhancements", () => {
		it.skip("should support next_task query", async () => {
			// Skipped - query tool not implemented in new architecture
		});

		it.skip("should support orphaned filter", async () => {
			// Skipped - query tool not implemented in new architecture
		});

		it.skip("should support uncovered filter", async () => {
			// Skipped - query tool not implemented in new architecture
		});
	});

	describe("Validate Tool Enhancements", () => {
		it.skip("should support reference checking", async () => {
			// Skipped - validate tool not implemented in new architecture
		});

		it.skip("should support cycle detection", async () => {
			// Skipped - validate tool not implemented in new architecture
		});

		it.skip("should support health scoring", async () => {
			// Skipped - validate tool not implemented in new architecture
		});

		it.skip("should support combined validation options", async () => {
			// Skipped - validate tool not implemented in new architecture
		});
	});
});
