import { z } from "zod";

export const ApiContractIdSchema = z
	.string()
	.regex(/^api-\d{3}$/, {
		message: "API Contract ID must follow format: api-XXX",
	})
	.describe("Unique identifier for the API contract");
