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

export type BeefyResponse = z.infer<typeof BeefyResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// Transaction Request Schema
export const TransactionRequestSchema = z.object({
  chainId: z.number(),
  safeAddress: z.string(),
  vaultAddress: z.string(),
  amount: z.string(), // In token units
  action: z.enum(['deposit', 'withdraw'])
});

// Transaction Response Schema
export const SignRequestSchema = z.object({
  method: z.literal('eth_sendTransaction'),
  chainId: z.number(),
  params: z.array(z.object({
    to: z.string(),
    data: z.string(),
    value: z.string()
  }))
});

// Health Check Response
export const HealthCheckSchema = z.object({
  status: z.string(),
  timestamp: z.string()
});

// Balance Response
export const BalanceSchema = z.object({
  vaultAddress: z.string(),
  balance: z.string(),
  symbol: z.string(),
  decimals: z.number()
});

export const BalancesResponseSchema = z.object({
  balances: z.array(BalanceSchema)
});