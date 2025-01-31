// API Endpoints
export const API_ENDPOINTS = {
  HEALTH: '/api/health',
  TOP_VAULTS: '/api/top-beefy-vaults',
  SWAGGER: '/api/swagger',
  AI_PLUGIN: '/.well-known/ai-plugin.json'
} as const;

// Operation IDs
export const OPERATION_IDS = {
  HEALTH_CHECK: 'health-check',
  TOP_BEEFY_VAULTS: 'top-beefy-vaults'
} as const; 