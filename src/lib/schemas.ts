import { z } from "zod";

// Schema for individual vault data
export const BeefyVaultSchema = z.object({
  name: z.string(),
  description: z.string(),
  apy: z.number(),
  tvl: z.number(),
  platform: z.string(),
  chain: z.string(),
  assets: z.array(z.string()),
  risks: z.array(z.string()).optional(),
  addLiquidityUrl: z.string(),
});

// Type for vault data
export type BeefyVault = z.infer<typeof BeefyVaultSchema>;

// Response format for the API
export const BeefyResponseSchema = z.object({
  vaults: z.array(BeefyVaultSchema),
  timestamp: z.string()
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
});

export type BeefyResponse = z.infer<typeof BeefyResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
