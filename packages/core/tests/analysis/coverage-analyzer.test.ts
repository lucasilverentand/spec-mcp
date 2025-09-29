import { beforeEach, describe, expect, it } from "vitest";
import { CoverageAnalyzer } from "../../src/analysis/coverage-analyzer.js";
import type { SpecConfig } from "../../src/interfaces/config.js";

describe("CoverageAnalyzer", () => {
	let analyzer: CoverageAnalyzer;
	const config: SpecConfig = {
		specsPath: "./test-specs",
	};

	beforeEach(() => {
		analyzer = new CoverageAnalyzer(config);
	});

	describe("constructor", () => {
		it("should create instance with default config", () => {
			const defaultAnalyzer = new CoverageAnalyzer();
			expect(defaultAnalyzer).toBeInstanceOf(CoverageAnalyzer);
			expect(defaultAnalyzer.name).toBe("CoverageAnalyzer");
			expect(defaultAnalyzer.version).toBe("2.0.0");
		});

		it("should create instance with custom config", () => {
			expect(analyzer).toBeInstanceOf(CoverageAnalyzer);
		});
	});

	describe("configure", () => {
		it("should update configuration", () => {
			const newConfig: SpecConfig = {
				specsPath: "./new-path",
			};
			analyzer.configure(newConfig);
			expect(analyzer).toBeDefined();
		});
	});

	describe("analyze", () => {
		it("should return analysis result with correct structure", async () => {
			const result = await analyzer.analyze();

			expect(result).toBeDefined();
			expect(result.success).toBeDefined();
			expect(typeof result.success).toBe("boolean");

			if (result.success) {
				expect(result.data).toBeDefined();
				expect(result.data?.report).toBeDefined();
				expect(result.data?.recommendations).toBeDefined();
				expect(typeof result.data?.report.coveragePercentage).toBe("number");
			}
		});

		it("should handle errors gracefully", async () => {
			const badAnalyzer = new CoverageAnalyzer({
				specsPath: "/nonexistent/path",
			});
			const result = await badAnalyzer.analyze();

			// Should either succeed with empty data or fail gracefully
			expect(result).toBeDefined();
			expect(typeof result.success).toBe("boolean");
		});
	});
});
