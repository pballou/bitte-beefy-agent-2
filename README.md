# bitte-beefy-agent

Bitte Beefy Agent is a tool for streamlining earning the highest APYs across 23 chains with safety and efficiency in mind within the Beefy ecosystem.

## Overview

Bitte Karma Agent is a tool for assessing account karma based on activity history within the NEAR ecosystem.

Built using Next.js 14 + Shadcn/ui + Hono (using FastNear, NearSocial) + Zod + Swagger UI.

## Backlog

- [x] Refactor using Zod + Hono to have the OpenAPI schema auto-generated
- Add more badges and APIs for the karma assessment. Some ideas:
  - [x] Badges for nearblocks.io
  - [ ] Badges for Mintbase NFT market value
  - [ ] Badges for proof of personhood
- [ ] Use NearSocial contract to store community awarded badges
- [ ] Define a process for community voting on karma points for each badge

## Project Walkthrough

Bitte Karma Agent facilitates the development of AI-powered tools for evaluating account karma. The template supports creating, managing, and deploying karma assessment functionalities, starting with badges.

### API Base URL

<https://bitte-karma-agent.vercel.app>

### Endpoints

- Account Karma `GET` `/api/karma/{account}`

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
make-agent register https://bitte-karma-agent.vercel.app
```

### Agent redeployment

```bash
make-agent deploy -u https://bitte-karma-agent.vercel.app
```

## Troubleshooting

- Errors starting the Next.js development server:
  - Use ai to troubleshoot the error message
- Errors starting the agent development server:
  - Try again in 24 hours
- Unexpected response from the agent:
  - Check response from https://localhost:3000/.well-known/ai-plugin.json
  - Check response from your plugin API endpoints
  - Check the tunneling service url
- Error deploying the agent:
  - Check validity of https://bitte-karma-agent.vercel.app/.well-known/ai-plugin.json openapi schema
