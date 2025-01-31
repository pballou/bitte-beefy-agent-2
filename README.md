# bitte-beefy-agent

Bitte Beefy Agent is a tool for streamlining earning the highest APYs across 23 chains with safety and efficiency in mind within the Beefy ecosystem.

## Overview

Built using Next.js 14 + Shadcn/ui + Hono + Zod + Swagger UI.

## API Base URL

<https://bitte-beefy-agent.vercel.app>

## Endpoints

1. **Get Top Vaults** 
   - `GET /api/beefy-top-vaults`
   - Returns highest yielding vaults with safety scores and details
   - Example: "Show me the top 5 yield opportunities on Base"

2. **Generate Deposit URL**
   - `POST /api/generate-deposit-url`
   - Creates a clickable deposit link with pre-filled transaction details
   - Required params: vault address, amount, chainId, tokenAddress
   - Optional: vaultId (for Beefy app linking)
   - Example: "I want to deposit 0.1 ETH into the cbETH-WETH vault"

## Usage Flow

1. AI fetches top vaults and analyzes them for the user
2. User selects a vault to deposit into
3. AI generates a deposit URL with all necessary parameters
4. User clicks the link to open our deposit interface
5. Interface handles wallet connection, network switching, and deposit execution

## Example AI Interaction

"Show me the safest yield opportunities on Base with at least 10% APY"
1. AI fetches vaults from `/api/beefy-top-vaults`
2. AI analyzes metrics (TVL, safety score, APY) to find best matches
3. AI presents filtered options to user
4. User: "I want to deposit 0.1 ETH into the cbETH-WETH vault"
5. AI uses `/api/generate-deposit-url` to create deposit link
6. User clicks link to execute deposit through our interface

## Getting Started

[Docs to integrate](https://docs.mintbase.xyz/ai/assistant-plugins)

### Installation

Set `NEAR_ENV="mainnet"` in your `.env.local` file.

```bash
# install dependencies
pnpm i

# start the development server
pnpm dev:next

# start the agent development server
pnpm dev:agent
```

## Deployment

Check out [Next.js deployment documentation](https://nextjs.org/docs/deployment) for details on (re-)deploying on Vercel.

### Agent registration

NOTE: Only run this once, when creating a new agent.

```bash
make-agent register -u https://bitte-beefy-agent.vercel.app
```

### Agent redeployment

```bash
make-agent deploy -u https://bitte-beefy-agent.vercel.app
```

## Troubleshooting

- Transaction errors (400):
  - Check vault/safe addresses are valid Ethereum addresses
  - Verify amount is in wei (18 decimals)
  - Confirm chainId is supported (1: Ethereum, 8453: Base, 42161: Arbitrum)
  - Check server logs for validation errors

- Development server:
  - Port 3000 already in use? Kill process or change port
  - Check .env.local has NEAR_ENV="mainnet"

- Unexpected response from the agent:
  - Check response from https://localhost:3000/.well-known/ai-plugin.json
  - Check response from your plugin API endpoints
  - Check the tunneling service url

- Error deploying the agent:
  - Check validity of https://bitte-beefy-agent.vercel.app/.well-known/ai-plugin.json openapi schema

### Environment Variables

Required in your `.env.local` and Vercel deployment:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your_project_id_here"
```

Get your WalletConnect project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/)