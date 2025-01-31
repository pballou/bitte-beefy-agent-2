import { z } from "zod";

const LPBreakdownSchema = z.object({
  price: z.number(),
  tokens: z.array(z.string()),
  balances: z.array(z.string()),
  totalSupply: z.string()
});

// Schema for individual vault data
export const BeefyVaultSchema = z.object({
  name: z.string(),
  description: z.string(),
  apy: z.number(),
  tvl: z.number(),
  platform: z.string(),
  chain: z.string(),
  assets: z.array(z.string()),
  vaultAddress: z.string(),
  risks: z.array(z.string()).optional(),
  addLiquidityUrl: z.string(),
  lastHarvest: z.number().optional(),
  lpBreakdown: LPBreakdownSchema.optional(),
  safetyScore: z.number().optional(),
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

// Health Check Response
export const HealthCheckSchema = z.object({
  status: z.string(),
  timestamp: z.string()
});

// URL Generation Request Schema
export const GenerateUrlRequestSchema = z.object({
  vault: z.string().describe('The vault address to deposit into'),
  amount: z.string().describe('The amount to deposit in ETH'),
  chainId: z.number().describe('The chain ID where the vault is deployed'),
  vaultId: z.string().optional().describe('The Beefy vault identifier for linking to app.beefy.com'),
  tokenAddress: z.string().describe('The address of the token to deposit (WETH for ETH deposits)')
});

// URL Generation Response Schema
export const GenerateUrlResponseSchema = z.object({
  url: z.string().describe('URL to the deposit interface with pre-filled parameters'),
  message: z.string().describe('Human readable description of the deposit')
});

export type BeefyResponse = z.infer<typeof BeefyResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;