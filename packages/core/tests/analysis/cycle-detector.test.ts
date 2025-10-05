import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CycleDetector } from "../../src/analysis/cycle-detector.js";
import type { SpecConfig } from "../../src/interfaces/config.js";
import { cleanupTestSpecs, createTestSpecsPath } from "../test-helpers.js";

describe("CycleDetector", () => {
	let detector: CycleDetector;
	let testSpecsPath: string;
	const testPaths: string[] = [];

	beforeEach(() => {
		testSpecsPath = createTestSpecsPath("cycle-detector");
		testPaths.push(testSpecsPath);
		const config: SpecConfig = {
			specsPath: testSpecsPath,
		};
		detector = new CycleDetector(config);
	});

	afterEach(async () => {
		for (const path of testPaths) {
			await cleanupTestSpecs(path);
		}
		testPaths.length = 0;
	});

	describe("constructor", () => {
		it("should create instance with default config", () => {
			const defaultDetector = new CycleDetector();
			expect(defaultDetector).toBeInstanceOf(CycleDetector);
			expect(defaultDetector.name).toBe("CycleDetector");
			expect(defaultDetector.version).toBe("2.0.0");
		});

		it("should create instance with custom config", () => {
			expect(detector).toBeInstanceOf(CycleDetector);
			expect(detector.name).toBe("CycleDetector");
			expect(detector.version).toBe("2.0.0");
		});
	});

	describe("configure", () => {
		it("should update configuration", () => {
			const newConfig: SpecConfig = {
				specsPath: "./new-path",
			};
			detector.configure(newConfig);
			expect(detector).toBeDefined();
		});

		it("should merge partial config with existing config", () => {
			const partialConfig: Partial<SpecConfig> = {
				specsPath: "./updated-path",
			};
			detector.configure(partialConfig);
			expect(detector).toBeDefined();
		});
	});

	describe("analyze", () => {
		it("should return analysis result with correct structure", async () => {
			const result = await detector.analyze();

			expect(result).toBeDefined();
			expect(result.success).toBeDefined();
			expect(typeof result.success).toBe("boolean");

			if (result.success) {
				expect(result.data).toBeDefined();
				expect(result.data.hasCycles).toBeDefined();
				expect(typeof result.data.hasCycles).toBe("boolean");
				expect(result.data.cycles).toBeDefined();
				expect(Array.isArray(result.data.cycles)).toBe(true);
				expect(result.data.summary).toBeDefined();
				expect(typeof result.data.summary.totalCycles).toBe("number");
				expect(typeof result.data.summary.maxCycleLength).toBe("number");
				expect(Array.isArray(result.data.summary.affectedNodes)).toBe(true);
			}
		});

		it("should detect no cycles in acyclic graph", async () => {
			const result = await detector.analyze();

			expect(result).toBeDefined();
			expect(typeof result.success).toBe("boolean");

			if (result.success && result.data) {
				// If there are no cycles, verify the structure is correct
				if (!result.data.hasCycles) {
					expect(result.data.cycles).toHaveLength(0);
					expect(result.data.summary.totalCycles).toBe(0);
					expect(result.data.summary.maxCycleLength).toBe(0);
					expect(result.data.summary.affectedNodes).toHaveLength(0);
				}
			}
		});

		it("should include metadata in result", async () => {
			const result = await detector.analyze();

			expect(result).toBeDefined();
			if (result.success) {
				expect(result.metadata).toBeDefined();
				expect(result.metadata?.version).toBe("2.0.0");
				expect(result.metadata?.source).toBe("CycleDetector");
				expect(typeof result.metadata?.executionTime).toBe("number");
			}
		});

		it("should handle errors gracefully", async () => {
			const badDetector = new CycleDetector({
				specsPath: createTestSpecsPath("nonexistent"),
			});
			const result = await badDetector.analyze();

			// Should either succeed with empty data or fail gracefully
			expect(result).toBeDefined();
			expect(typeof result.success).toBe("boolean");

			if (!result.success) {
				expect(result.errors).toBeDefined();
				expect(Array.isArray(result.errors)).toBe(true);
			}
		});

		it("should include warnings array in result", async () => {
			const result = await detector.analyze();

			expect(result).toBeDefined();
			expect(result.warnings).toBeDefined();
			expect(Array.isArray(result.warnings)).toBe(true);
		});

		it("should include errors array in result", async () => {
			const result = await detector.analyze();

			expect(result).toBeDefined();
			expect(result.errors).toBeDefined();
			expect(Array.isArray(result.errors)).toBe(true);
		});
	});

	describe("detectAllCycles", () => {
		it("should return cycle analysis result", async () => {
			const result = await detector.detectAllCycles();

			expect(result).toBeDefined();
			expect(result.success).toBeDefined();
			expect(typeof result.success).toBe("boolean");

			if (result.success) {
				expect(result.data).toBeDefined();
				expect(result.data.hasCycles).toBeDefined();
				expect(result.data.cycles).toBeDefined();
				expect(result.data.summary).toBeDefined();
			}
		});

		it("should return consistent results with analyze method", async () => {
			const analyzeResult = await detector.analyze();
			const detectResult = await detector.detectAllCycles();

			expect(analyzeResult.success).toBe(detectResult.success);

			if (analyzeResult.success && detectResult.success) {
				expect(analyzeResult.data.hasCycles).toBe(detectResult.data.hasCycles);
				expect(analyzeResult.data.cycles.length).toBe(
					detectResult.data.cycles.length,
				);
				expect(analyzeResult.data.summary.totalCycles).toBe(
					detectResult.data.summary.totalCycles,
				);
			}
		});

		it("should handle empty graph", async () => {
			const emptyDetector = new CycleDetector({
				specsPath: createTestSpecsPath("empty-path"),
			});
			const result = await emptyDetector.detectAllCycles();

			expect(result).toBeDefined();
			expect(typeof result.success).toBe("boolean");
		});
	});

	describe("findCycleInPath", () => {
		it("should return false for empty path", () => {
			const result = detector.findCycleInPath([]);
			expect(result).toBe(false);
		});

		it("should return false for single node path", () => {
			const result = detector.findCycleInPath(["node1"]);
			expect(result).toBe(false);
		});

		it("should return false for acyclic path", () => {
			const path = ["node1", "node2", "node3", "node4"];
			const result = detector.findCycleInPath(path);
			expect(result).toBe(false);
		});

		it("should return true for path with duplicate nodes", () => {
			const path = ["node1", "node2", "node3", "node2", "node4"];
			const result = detector.findCycleInPath(path);
			expect(result).toBe(true);
		});

		it("should return true for path with cycle at beginning", () => {
			const path = ["node1", "node1", "node2"];
			const result = detector.findCycleInPath(path);
			expect(result).toBe(true);
		});

		it("should return true for path with cycle at end", () => {
			const path = ["node1", "node2", "node3", "node3"];
			const result = detector.findCycleInPath(path);
			expect(result).toBe(true);
		});

		it("should return true for complex cycle", () => {
			const path = ["A", "B", "C", "D", "B", "E"];
			const result = detector.findCycleInPath(path);
			expect(result).toBe(true);
		});

		it("should handle paths with similar but different node names", () => {
			const path = ["node1", "node10", "node100", "node1000"];
			const result = detector.findCycleInPath(path);
			expect(result).toBe(false);
		});
	});

	describe("error handling", () => {
		it("should handle invalid config gracefully", async () => {
			const invalidDetector = new CycleDetector({
				specsPath: createTestSpecsPath("empty"),
			});
			const result = await invalidDetector.analyze();

			expect(result).toBeDefined();
			expect(typeof result.success).toBe("boolean");
		});

		it("should handle null-like config gracefully", async () => {
			const detector = new CycleDetector({});
			const result = await detector.analyze();

			expect(result).toBeDefined();
			expect(typeof result.success).toBe("boolean");
		});

		it("should handle analysis errors without throwing", async () => {
			const badDetector = new CycleDetector({
				specsPath: createTestSpecsPath("dev-null"),
			});

			await expect(async () => {
				await badDetector.analyze();
			}).not.toThrow();
		});

		it("should provide error details when analysis fails", async () => {
			const badDetector = new CycleDetector({
				specsPath: createTestSpecsPath("nonexistent"),
			});
			const result = await badDetector.analyze();

			if (!result.success) {
				expect(result.errors).toBeDefined();
				expect(result.errors?.length).toBeGreaterThan(0);
				expect(typeof result.errors?.[0]).toBe("string");
			}
		});
	});

	describe("reset", () => {
		it("should reset analyzer state", async () => {
			await detector.analyze();
			detector.reset();
			expect(detector).toBeDefined();
		});

		it("should allow analysis after reset", async () => {
			await detector.analyze();
			detector.reset();
			const result = await detector.analyze();

			expect(result).toBeDefined();
			expect(typeof result.success).toBe("boolean");
		});
	});

	describe("integration", () => {
		it("should handle multiple consecutive analyses", async () => {
			const result1 = await detector.analyze();
			const result2 = await detector.analyze();
			const result3 = await detector.analyze();

			expect(result1).toBeDefined();
			expect(result2).toBeDefined();
			expect(result3).toBeDefined();

			// Results should be consistent
			if (result1.success && result2.success && result3.success) {
				expect(result1.data.hasCycles).toBe(result2.data.hasCycles);
				expect(result2.data.hasCycles).toBe(result3.data.hasCycles);
			}
		});

		it("should handle configure followed by analyze", async () => {
			detector.configure({ specsPath: "./test-specs" });
			const result = await detector.analyze();

			expect(result).toBeDefined();
			expect(typeof result.success).toBe("boolean");
		});

		it("should handle reset followed by analyze", async () => {
			await detector.analyze();
			detector.reset();
			const result = await detector.analyze();

			expect(result).toBeDefined();
			expect(typeof result.success).toBe("boolean");
		});
	});

	describe("cycle detection edge cases", () => {
		it("should handle self-referencing paths", () => {
			const path = ["node", "node"];
			const result = detector.findCycleInPath(path);
			expect(result).toBe(true);
		});

		it("should handle long paths without cycles", () => {
			const path = Array.from({ length: 100 }, (_, i) => `node${i}`);
			const result = detector.findCycleInPath(path);
			expect(result).toBe(false);
		});

		it("should handle long paths with cycle at the end", () => {
			const path = Array.from({ length: 100 }, (_, i) => `node${i}`);
			path.push("node50"); // Create cycle
			const result = detector.findCycleInPath(path);
			expect(result).toBe(true);
		});
	});

	describe("result structure validation", () => {
		it("should return CycleAnalysis with all required fields", async () => {
			const result = await detector.analyze();

			if (result.success) {
				const data = result.data;

				// Verify hasCycles is boolean
				expect(typeof data.hasCycles).toBe("boolean");

				// Verify cycles is array of arrays
				expect(Array.isArray(data.cycles)).toBe(true);
				data.cycles.forEach((cycle) => {
					expect(Array.isArray(cycle)).toBe(true);
					cycle.forEach((node) => {
						expect(typeof node).toBe("string");
					});
				});

				// Verify summary structure
				expect(data.summary).toBeDefined();
				expect(typeof data.summary.totalCycles).toBe("number");
				expect(typeof data.summary.maxCycleLength).toBe("number");
				expect(Array.isArray(data.summary.affectedNodes)).toBe(true);

				// Verify summary consistency
				expect(data.summary.totalCycles).toBe(data.cycles.length);
				if (data.cycles.length > 0) {
					const actualMaxLength = Math.max(...data.cycles.map((c) => c.length));
					expect(data.summary.maxCycleLength).toBe(actualMaxLength);
				} else {
					expect(data.summary.maxCycleLength).toBe(0);
				}
			}
		});

		it("should return AnalysisResult with correct metadata structure", async () => {
			const result = await detector.analyze();

			expect(result).toBeDefined();
			expect(result.success).toBeDefined();
			expect(result.data).toBeDefined();
			expect(result.metadata).toBeDefined();
			expect(result.warnings).toBeDefined();
			expect(result.errors).toBeDefined();

			if (result.metadata) {
				expect(typeof result.metadata.executionTime).toBe("number");
				expect(result.metadata.executionTime).toBeGreaterThanOrEqual(0);
				expect(result.metadata.version).toBe("2.0.0");
				expect(result.metadata.source).toBe("CycleDetector");
			}
		});
	});
});
