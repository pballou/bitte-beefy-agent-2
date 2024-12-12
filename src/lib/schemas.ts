import { z } from "zod";

export const KarmaRequestParamsSchema = z.object({
  account: z
    .string()
    .describe(
      "The identifier for the account to get karma and badges for, e.g. ref-finance.near"
    ),
});

export const BadgeSchema = z.object({
  name: z.string(),
  description: z.string(),
  contractId: z.string().optional(),
  minBalance: z.number().optional(),
  karma: z.number(),
});

export const KarmaResponseSchema = z.object({
  accountId: z.string(),
  badges: z.array(BadgeSchema),
  karma: z.number(),
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
});

export type KarmaRequestParams = z.infer<typeof KarmaRequestParamsSchema>;
export type KarmaResponse = z.infer<typeof KarmaResponseSchema>;
export type Badge = z.infer<typeof BadgeSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
