# bitte-beefy-agent

Bitte Beefy Agent is a tool for streamlining earning the highest APYs across 23 chains with safety and efficiency in mind within the Beefy ecosystem.

## Overview

Built using Next.js 14 + Shadcn/ui + Hono (using FastNear, NearSocial) + Zod + Swagger UI.

## Backlog

- [ ] Add more detailed signals to the agent
- [ ] Add support for building transactions directly from the agent

## Project Walkthrough

The template supports creating, managing, and deploying the Bitte Beefy Agent functionalities.

### API Base URL

<https://bitte-beefy-agent.vercel.app>

### Endpoints

- Highest yielding vaults from Beefy Finance `GET` `/api/beefy-top-vaults`

### Usage

Make LLM requests to the endpoints above. Refer to the full API documentation for detailed parameter and response information.

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
  - Confirm chainId is 1 (only Ethereum supported)
  - Check server logs for validation errors

- Tunneling issues:
  - If localtunnel fails, try `pnpm dev:agent-serveo`
  - If both fail, check firewall/VPN settings

- generate-evm-tx errors:
  - Verify safe has sufficient balance
  - Ensure safe has approved vault contract
  - Check gas settings
  - Review server logs for detailed error messages

- Development server:
  - Port 3000 already in use? Kill process or change port
  - Check .env.local has NEAR_ENV="mainnet"

- Unexpected response from the agent:
  - Check response from https://localhost:3000/.well-known/ai-plugin.json
  - Check response from your plugin API endpoints
  - Check the tunneling service url

- Error deploying the agent:
  - Check validity of https://bitte-beefy-agent.vercel.app/.well-known/ai-plugin.json openapi schema
