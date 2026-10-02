import { z } from "zod";

export const ErrorType = z.enum(["error", "warning", "info"]);
export type ErrorType = z.infer<typeof ErrorType>;
export const SectionType = z.enum(["map", "layers", "tilesets", "entities", "script"]);
export type SectionType = z.infer<typeof SectionType>;

export const ValidationError = z.object({
    type: ErrorType,
    message: z.string(),
    details: z.string(),
    link: z.string().optional(),
});
export type ValidationError = z.infer<typeof ValidationError>;

// The server only sends the sections that have errors (zod 4's z.record with an enum key requires every key)
export const OrganizedErrors = z.partialRecord(SectionType, ValidationError.array());
export type OrganizedErrors = z.infer<typeof OrganizedErrors>;

export const MapValidationErrors = z.record(z.string(), OrganizedErrors);
