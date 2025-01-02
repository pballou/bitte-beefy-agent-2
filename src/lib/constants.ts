// API Endpoints
export const API_ENDPOINTS = {
  BALANCES: '/api/balances',
  TRANSACTION: '/api/transaction',
  HEALTH: '/api/health',
  TOP_VAULTS: '/api/top-beefy-vaults',
  SWAGGER: '/api/swagger',
  AI_PLUGIN: '/.well-known/ai-plugin.json'
} as const;

// Operation IDs
export const OPERATION_IDS = {
  GET_VAULT_BALANCE: 'get-vault-balance',
  CREATE_TRANSACTION: 'create-transaction',
  HEALTH_CHECK: 'health-check',
  TOP_BEEFY_VAULTS: 'top-beefy-vaults'
} as const; 