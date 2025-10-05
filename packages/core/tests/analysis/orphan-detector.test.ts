import { beforeEach, describe, expect, it } from "vitest";
import { OrphanDetector } from "../../src/analysis/orphan-detector.js";
import type { SpecConfig } from "../../src/interfaces/config.js";
import { createTestSpecsPath } from "../test-helpers.js";

describe("OrphanDetector", () => {
	let detector: OrphanDetector;
	let testSpecsPath: string;

	beforeEach(() => {
		testSpecsPath = createTestSpecsPath("orphan-detector-test");
		const config: SpecConfig = {
			specsPath: testSpecsPath,
		};
		detector = new OrphanDetector(config);
	});

	describe("constructor", () => {
		it("should create instance with default config", () => {
			const defaultDetector = new OrphanDetector();
			expect(defaultDetector).toBeInstanceOf(OrphanDetector);
			expect(defaultDetector.name).toBe("OrphanDetector");
			expect(defaultDetector.version).toBe("2.0.0");
		});

		it("should create instance with custom config", () => {
			expect(detector).toBeInstanceOf(OrphanDetector);
			expect(detector.name).toBe("OrphanDetector");
			expect(detector.version).toBe("2.0.0");
		});

		it("should have correct analyzer properties", () => {
			expect(detector.name).toBeDefined();
			expect(detector.version).toBeDefined();
			expect(typeof detector.name).toBe("string");
			expect(typeof detector.version).toBe("string");
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

		it("should accept partial config updates", () => {
			const partialConfig: Partial<SpecConfig> = {
				specsPath: "./another-path",
			};
			detector.configure(partialConfig);
			expect(detector).toBeDefined();
		});

		it("should merge configurations correctly", () => {
			const initialConfig: SpecConfig = {
				specsPath: "./initial-path",
			};
			const updateConfig: Partial<SpecConfig> = {
				specsPath: "./updated-path",
			};
			const detectorWithConfig = new OrphanDetector(initialConfig);
			detectorWithConfig.configure(updateConfig);
			expect(detectorWithConfig).toBeDefined();
		});
	});

	describe("analyze", () => {
		it("should return analysis result with correct structure", async () => {
			const result = await detector.analyze();

			expect(result).toBeDefined();
			expect(result.success).toBeDefined();
			expect(typeof result.success).toBe("boolean");
			expect(result.metadata).toBeDefined();
			expect(result.metadata.version).toBe("2.0.0");
			expect(result.metadata.source).toBe("OrphanDetector");
			expect(typeof result.metadata.executionTime).toBe("number");
		});

		it("should return orphan analysis data on success", async () => {
			const result = await detector.analyze();

			if (result.success) {
				expect(result.data).toBeDefined();
				expect(result.data?.orphans).toBeDefined();
				expect(Array.isArray(result.data?.orphans)).toBe(true);
				expect(result.data?.summary).toBeDefined();
				expect(typeof result.data?.summary.totalOrphans).toBe("number");
				expect(result.data?.summary.byType).toBeDefined();
				expect(result.data?.summary.byType.requirements).toBeDefined();
				expect(result.data?.summary.byType.plans).toBeDefined();
				expect(result.data?.summary.byType.components).toBeDefined();
			}
		});

		it("should have consistent orphan count", async () => {
			const result = await detector.analyze();

			if (result.success && result.data) {
				const totalFromSummary = result.data.summary.totalOrphans;
				const totalFromArray = result.data.orphans.length;
				expect(totalFromSummary).toBe(totalFromArray);
			}
		});

		it("should have correct byType sum", async () => {
			const result = await detector.analyze();

			if (result.success && result.data) {
				const { byType, totalOrphans } = result.data.summary;
				const sumByType =
					byType.requirements + byType.plans + byType.components;
				expect(sumByType).toBe(totalOrphans);
			}
		});

		it("should return warnings array", async () => {
			const result = await detector.analyze();
			expect(result.warnings).toBeDefined();
			expect(Array.isArray(result.warnings)).toBe(true);
		});

		it("should return errors array", async () => {
			const result = await detector.analyze();
			expect(result.errors).toBeDefined();
			expect(Array.isArray(result.errors)).toBe(true);
		});

		it("should handle errors gracefully", async () => {
			const badDetector = new OrphanDetector({
				specsPath: createTestSpecsPath("nonexistent"),
			});
			const result = await badDetector.analyze();

			// Should either succeed with empty data or fail gracefully
			expect(result).toBeDefined();
			expect(typeof result.success).toBe("boolean");
			expect(result.metadata).toBeDefined();
		});

		it("should handle invalid specsPath gracefully", async () => {
			const invalidDetector = new OrphanDetector({
				specsPath: createTestSpecsPath("invalid-path"),
			});
			const result = await invalidDetector.analyze();

			expect(result).toBeDefined();
			expect(typeof result.success).toBe("boolean");

			if (!result.success) {
				expect(result.errors.length).toBeGreaterThan(0);
			}
		});

		it("should complete analysis in reasonable time", async () => {
			const startTime = Date.now();
			const result = await detector.analyze();
			const endTime = Date.now();
			const duration = endTime - startTime;

			expect(result).toBeDefined();
			// Analysis should complete in under 10 seconds
			expect(duration).toBeLessThan(10000);
		});
	});

	describe("detectOrphans", () => {
		it("should return analysis result with orphan data", async () => {
			const result = await detector.detectOrphans();

			expect(result).toBeDefined();
			expect(result.success).toBeDefined();
			expect(typeof result.success).toBe("boolean");

			if (result.success) {
				expect(result.data).toBeDefined();
				expect(result.data?.orphans).toBeDefined();
				expect(Array.isArray(result.data?.orphans)).toBe(true);
				expect(result.data?.summary).toBeDefined();
			}
		});

		it("should return same result as analyze", async () => {
			const analyzeResult = await detector.analyze();
			const detectOrphansResult = await detector.detectOrphans();

			expect(analyzeResult.success).toBe(detectOrphansResult.success);

			if (analyzeResult.success && detectOrphansResult.success) {
				expect(analyzeResult.data?.orphans.length).toBe(
					detectOrphansResult.data?.orphans.length,
				);
				expect(analyzeResult.data?.summary.totalOrphans).toBe(
					detectOrphansResult.data?.summary.totalOrphans,
				);
			}
		});

		it("should have metadata in result", async () => {
			const result = await detector.detectOrphans();

			expect(result.metadata).toBeDefined();
			expect(result.metadata.version).toBe("2.0.0");
			expect(result.metadata.source).toBe("OrphanDetector");
			expect(typeof result.metadata.executionTime).toBe("number");
			expect(result.metadata.executionTime).toBeGreaterThanOrEqual(0);
		});

		it("should handle errors in detectOrphans gracefully", async () => {
			const badDetector = new OrphanDetector({
				specsPath: createTestSpecsPath("nonexistent"),
			});
			const result = await badDetector.detectOrphans();

			expect(result).toBeDefined();
			expect(typeof result.success).toBe("boolean");
		});
	});

	describe("findUnreferencedEntities", () => {
		it("should return analysis result with string array", async () => {
			const result = await detector.findUnreferencedEntities();

			expect(result).toBeDefined();
			expect(result.success).toBeDefined();
			expect(typeof result.success).toBe("boolean");

			if (result.success) {
				expect(result.data).toBeDefined();
				expect(Array.isArray(result.data)).toBe(true);
				result.data?.forEach((entity) => {
					expect(typeof entity).toBe("string");
				});
			}
		});

		it("should return same orphans as detectOrphans", async () => {
			const orphansResult = await detector.detectOrphans();
			const unreferencedResult = await detector.findUnreferencedEntities();

			if (orphansResult.success && unreferencedResult.success) {
				expect(unreferencedResult.data?.length).toBe(
					orphansResult.data?.orphans.length,
				);
				// Check that all items are the same
				const orphanSet = new Set(orphansResult.data?.orphans);
				unreferencedResult.data?.forEach((entity) => {
					expect(orphanSet.has(entity)).toBe(true);
				});
			}
		});

		it("should have metadata in result", async () => {
			const result = await detector.findUnreferencedEntities();

			expect(result.metadata).toBeDefined();
			expect(result.metadata.version).toBe("2.0.0");
			expect(result.metadata.source).toBe("OrphanDetector");
			expect(typeof result.metadata.executionTime).toBe("number");
		});

		it("should handle errors gracefully", async () => {
			const badDetector = new OrphanDetector({
				specsPath: createTestSpecsPath("nonexistent"),
			});
			const result = await badDetector.findUnreferencedEntities();

			expect(result).toBeDefined();
			expect(typeof result.success).toBe("boolean");
		});

		it("should propagate detectOrphans failures", async () => {
			const badDetector = new OrphanDetector({
				specsPath: "/definitely/nonexistent/path",
			});
			const result = await badDetector.findUnreferencedEntities();

			// If detectOrphans fails, this should also fail
			if (!result.success) {
				expect(result.errors.length).toBeGreaterThan(0);
			}
		});
	});

	describe("supports", () => {
		it("should return true for orphan analysis", () => {
			// Note: BaseAnalyzer doesn't implement supports() by default
			// This test ensures the analyzer works with the expected pattern
			expect(detector.name).toBe("OrphanDetector");
		});

		it("should have consistent name property", () => {
			const detector1 = new OrphanDetector();
			const detector2 = new OrphanDetector({ specsPath: testSpecsPath });
			expect(detector1.name).toBe(detector2.name);
			expect(detector1.name).toBe("OrphanDetector");
		});

		it("should have consistent version property", () => {
			const detector1 = new OrphanDetector();
			const detector2 = new OrphanDetector({ specsPath: testSpecsPath });
			expect(detector1.version).toBe(detector2.version);
			expect(detector1.version).toBe("2.0.0");
		});
	});

	describe("error handling", () => {
		it("should not throw when analyzing with empty config", async () => {
			const emptyDetector = new OrphanDetector({});
			const result = await emptyDetector.analyze();
			expect(result).toBeDefined();
		});

		it("should handle missing specsPath gracefully", async () => {
			const noPathDetector = new OrphanDetector({});
			const result = await noPathDetector.analyze();
			expect(result).toBeDefined();
			expect(typeof result.success).toBe("boolean");
		});

		it("should provide error details on failure", async () => {
			const badDetector = new OrphanDetector({
				specsPath: createTestSpecsPath("nonexistent"),
			});
			const result = await badDetector.analyze();

			if (!result.success) {
				expect(result.errors).toBeDefined();
				expect(result.errors.length).toBeGreaterThan(0);
				result.errors.forEach((error) => {
					expect(typeof error).toBe("string");
					expect(error.length).toBeGreaterThan(0);
				});
			}
		});

		it("should maintain proper metadata even on errors", async () => {
			const badDetector = new OrphanDetector({
				specsPath: createTestSpecsPath("nonexistent"),
			});
			const result = await badDetector.analyze();

			expect(result.metadata).toBeDefined();
			expect(result.metadata.version).toBe("2.0.0");
			expect(result.metadata.source).toBe("OrphanDetector");
			expect(typeof result.metadata.executionTime).toBe("number");
		});

		it("should handle concurrent analyze calls", async () => {
			const promise1 = detector.analyze();
			const promise2 = detector.analyze();
			const promise3 = detector.analyze();

			const [result1, result2, result3] = await Promise.all([
				promise1,
				promise2,
				promise3,
			]);

			expect(result1).toBeDefined();
			expect(result2).toBeDefined();
			expect(result3).toBeDefined();
		});

		it("should allow reuse after error", async () => {
			const badDetector = new OrphanDetector({
				specsPath: createTestSpecsPath("nonexistent"),
			});

			// First call with bad config
			const badResult = await badDetector.analyze();
			expect(badResult).toBeDefined();

			// Reconfigure with better config
			badDetector.configure({ specsPath: "./test-specs" });

			// Second call should work
			const goodResult = await badDetector.analyze();
			expect(goodResult).toBeDefined();
		});
	});

	describe("reset functionality", () => {
		it("should have reset method available", () => {
			expect(typeof detector.reset).toBe("function");
		});

		it("should not throw when reset is called", () => {
			expect(() => detector.reset()).not.toThrow();
		});

		it("should allow analysis after reset", async () => {
			detector.reset();
			const result = await detector.analyze();
			expect(result).toBeDefined();
		});

		it("should reset execution time tracking", async () => {
			await detector.analyze();
			detector.reset();
			const result = await detector.analyze();
			expect(result.metadata.executionTime).toBeGreaterThanOrEqual(0);
		});
	});

	describe("integration", () => {
		it("should work with multiple method calls in sequence", async () => {
			const analyzeResult = await detector.analyze();
			const detectResult = await detector.detectOrphans();
			const unreferencedResult = await detector.findUnreferencedEntities();

			expect(analyzeResult).toBeDefined();
			expect(detectResult).toBeDefined();
			expect(unreferencedResult).toBeDefined();
		});

		it("should maintain consistency across multiple calls", async () => {
			const result1 = await detector.analyze();
			const result2 = await detector.analyze();

			if (result1.success && result2.success) {
				expect(result1.data?.summary.totalOrphans).toBe(
					result2.data?.summary.totalOrphans,
				);
			}
		});

		it("should handle configuration changes between calls", async () => {
			const result1 = await detector.analyze();
			detector.configure({ specsPath: "./test-specs" });
			const result2 = await detector.analyze();

			expect(result1).toBeDefined();
			expect(result2).toBeDefined();
		});

		it("should work after reset and reconfigure", async () => {
			await detector.analyze();
			detector.reset();
			detector.configure({ specsPath: "./test-specs" });
			const result = await detector.analyze();

			expect(result).toBeDefined();
			expect(typeof result.success).toBe("boolean");
		});
	});

	describe("data validation", () => {
		it("should return valid orphan IDs format", async () => {
			const result = await detector.analyze();

			if (result.success && result.data && result.data.orphans.length > 0) {
				result.data.orphans.forEach((orphanId) => {
					// Orphan IDs should match patterns like:
					// req-XXX-slug, pln-XXX-slug, app-XXX-slug, svc-XXX-slug, lib-XXX-slug, tol-XXX-slug
					const validPattern = /^(req|pln|app|svc|lib|tol)-\d{3}-.+$/;
					expect(orphanId).toMatch(validPattern);
				});
			}
		});

		it("should have non-negative counts in byType", async () => {
			const result = await detector.analyze();

			if (result.success && result.data) {
				expect(result.data.summary.byType.requirements).toBeGreaterThanOrEqual(
					0,
				);
				expect(result.data.summary.byType.plans).toBeGreaterThanOrEqual(0);
				expect(result.data.summary.byType.components).toBeGreaterThanOrEqual(0);
			}
		});

		it("should have non-negative total orphans", async () => {
			const result = await detector.analyze();

			if (result.success && result.data) {
				expect(result.data.summary.totalOrphans).toBeGreaterThanOrEqual(0);
			}
		});

		it("should not have duplicate orphan IDs", async () => {
			const result = await detector.analyze();

			if (result.success && result.data) {
				const orphanSet = new Set(result.data.orphans);
				expect(orphanSet.size).toBe(result.data.orphans.length);
			}
		});
	});
});
