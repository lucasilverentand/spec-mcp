import { describe, expect, it } from "vitest";
import * as DataPackage from "../src/index.js";

describe("Package Exports", () => {
	it("should export all entity types and schemas", () => {
		// Check that main exports are available
		expect(DataPackage.SpecsManager).toBeDefined();
		expect(DataPackage.SpecsManagerConfig).toBeDefined();

		// Check entity schemas
		expect(DataPackage.RequirementSchema).toBeDefined();
		expect(DataPackage.PlanSchema).toBeDefined();
		expect(DataPackage.AppComponentSchema).toBeDefined();
		expect(DataPackage.ServiceComponentSchema).toBeDefined();
		expect(DataPackage.LibraryComponentSchema).toBeDefined();
		expect(DataPackage.ToolComponentSchema).toBeDefined();

		// Check utility functions
		expect(DataPackage.shortenEntityType).toBeDefined();
		expect(typeof DataPackage.shortenEntityType).toBe("function");
	});

	it("should have working SpecsManager export", () => {
		const manager = new DataPackage.SpecsManager({
			path: "/tmp/test",
			autoDetect: false,
		});

		expect(manager).toBeInstanceOf(DataPackage.SpecsManager);
		expect(manager.config.path).toBe("/tmp/test");
		expect(manager.config.autoDetect).toBe(false);
	});

	it("should have working config validation", () => {
		const validConfig = {
			path: "/custom/path",
			autoDetect: true,
		};

		expect(() =>
			DataPackage.SpecsManagerConfig.parse(validConfig),
		).not.toThrow();
	});

	it("should have working utility functions", () => {
		expect(DataPackage.shortenEntityType("requirement")).toBe("req");
		expect(DataPackage.shortenEntityType("plan")).toBe("pln");
		expect(DataPackage.shortenEntityType("app")).toBe("app");
		expect(DataPackage.shortenEntityType("service")).toBe("svc");
		expect(DataPackage.shortenEntityType("library")).toBe("lib");
		expect(DataPackage.shortenEntityType("tool")).toBe("tol");
	});
});
