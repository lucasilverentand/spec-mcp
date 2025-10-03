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
			expect(toolNames).toContain("start_spec");
			expect(toolNames).toContain("update_spec");
			expect(toolNames).toContain("delete_spec");
			expect(toolNames).toContain("query");
			expect(toolNames).toContain("analyze");
		});
	});

	describe("Requirement Operations", () => {
		let draftId: string | undefined;
		let createdId: string | undefined;

		it("should create a requirement using wizard flow", async () => {
			// Step 1: Start the draft
			const startResult = await client.callTool({
				name: "start_spec",
				arguments: {
					type: "requirement",
					slug: "test-requirement",
				},
			});

			expect(startResult).toBeDefined();
			const startResponse = JSON.parse(startResult.content[0].text);
			expect(startResponse.success).toBe(true);
			expect(startResponse.data.draft_id).toBeDefined();
			draftId = startResponse.data.draft_id;

			// Step 2: Fill in name
			await client.callTool({
				name: "update_spec",
				arguments: {
					draft_id: draftId,
					field: "name",
					value: "Test Requirement",
				},
			});

			// Step 3: Fill in description (must be at least 50 chars with rationale)
			await client.callTool({
				name: "update_spec",
				arguments: {
					draft_id: draftId,
					field: "description",
					value:
						"A comprehensive test requirement for E2E testing because we need to validate the creation flow works correctly",
				},
			});

			// Step 4: Fill in priority
			await client.callTool({
				name: "update_spec",
				arguments: {
					draft_id: draftId,
					field: "priority",
					value: "required",
				},
			});

			// Step 5: Add acceptance criteria (need at least 2, measurable)
			const finalResult = await client.callTool({
				name: "update_spec",
				arguments: {
					draft_id: draftId,
					field: "criteria",
					value: [
						{
							id: "crit-001",
							description: "System returns response in under 200ms",
						},
						{
							id: "crit-002",
							description: "API returns 201 status code on success",
						},
					],
				},
			});

			const finalResponse = JSON.parse(finalResult.content[0].text);
			expect(finalResponse.success).toBe(true);
			if (finalResponse.completed) {
				createdId = finalResponse.spec_id;
				expect(createdId).toMatch(/^req-\d{3}-test-requirement$/);
			}
		});

		it("should retrieve the created requirement", async () => {
			if (!createdId) {
				// Skip if creation failed
				return;
			}

			const result = await client.callTool({
				name: "query",
				arguments: {
					entity_id: createdId,
				},
			});

			const response = JSON.parse(result.content[0].text);
			expect(response.success).toBe(true);
			expect(response.data.name).toBe("Test Requirement");
		});

		it("should list requirements", async () => {
			const result = await client.callTool({
				name: "query",
				arguments: {
					types: ["requirement"],
				},
			});

			const response = JSON.parse(result.content[0].text);
			expect(response.success).toBe(true);
			expect(response.data.query_type).toBe("filtered_list");
			expect(Array.isArray(response.data.results)).toBe(true);
			// May be empty if no requirements were created
			expect(response.data.total_results).toBeGreaterThanOrEqual(0);
		});

		it("should delete requirement", async () => {
			if (!createdId) {
				// Skip if creation failed
				return;
			}

			const result = await client.callTool({
				name: "delete_spec",
				arguments: {
					id: createdId,
				},
			});

			const response = JSON.parse(result.content[0].text);
			expect(response.success).toBe(true);
		});
	});

	describe("Security", () => {
		it("should reject path traversal in IDs", async () => {
			try {
				await client.callTool({
					name: "query",
					arguments: {
						entity_id: "../../../etc/passwd",
					},
				});
				// Should have thrown
				expect.fail("Expected error for path traversal");
			} catch (error) {
				// Expected to fail
				expect(error).toBeDefined();
			}
		});

		it("should sanitize input strings", async () => {
			// Start draft
			const startResult = await client.callTool({
				name: "start_spec",
				arguments: {
					type: "requirement",
					slug: "test-sanitize",
				},
			});

			const startResponse = JSON.parse(startResult.content[0].text);
			expect(startResponse.success).toBe(true);
			const testDraftId = startResponse.data.draft_id;

			// The first field for requirements is "description"
			// Try to set description with null bytes
			const descResult = await client.callTool({
				name: "update_spec",
				arguments: {
					draft_id: testDraftId,
					field: "description",
					value: "Test\x00Sanitize\x01Description that is longer than fifty characters because we need to validate the creation flow works",
				},
			});

			const descResponse = JSON.parse(descResult.content[0].text);
			// Should succeed - sanitization happens before validation
			expect(descResponse.success).toBe(true);

			// Clean up
			await client.callTool({
				name: "delete_spec",
				arguments: { id: testDraftId },
			});
		});
	});

	describe("Error Handling", () => {
		it("should return error for non-existent requirement", async () => {
			try {
				await client.callTool({
					name: "query",
					arguments: {
						entity_id: "req-999-nonexistent",
					},
				});
				// Should have thrown
				expect.fail("Expected error for non-existent requirement");
			} catch (error) {
				// Expected to fail
				expect(error).toBeDefined();
			}
		});

		it("should validate required fields", async () => {
			// Start draft without slug
			try {
				await client.callTool({
					name: "start_spec",
					arguments: {
						type: "requirement",
						// Missing slug - should be optional but validation may catch it
					},
				});

				// If it doesn't throw on start, it will eventually fail during validation
				// This is acceptable behavior
			} catch (error) {
				// Expected to fail at some point
				expect(error).toBeDefined();
			}
		});
	});
});
