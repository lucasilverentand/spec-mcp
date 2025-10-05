import { z } from "zod";

/**
 * Generic step submission schema for Q&A-based creation flow
 *
 * In the Q&A flow, we collect data generically without enforcing
 * specific fields. Final validation happens during finalization
 * using the actual entity schemas from @spec-mcp/data.
 */

/**
 * Generic schema for collecting data during creation flow steps
 * Allows any data structure to be submitted
 */
export const GenericStepDataSchema = z.record(z.unknown()).describe(
	"Generic data collection for creation flow steps",
);

/**
 * Schema for step submission with flexible data
 */
export const StepSubmissionSchema = z.object({
	data: GenericStepDataSchema.describe(
		"Data collected during this step - can be any structure",
	),
});

export type GenericStepData = z.infer<typeof GenericStepDataSchema>;
export type StepSubmission = z.infer<typeof StepSubmissionSchema>;
