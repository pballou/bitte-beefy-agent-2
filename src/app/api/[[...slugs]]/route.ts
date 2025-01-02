import { handle } from "hono/vercel";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { DEPLOYMENT_URL } from "vercel-url";
import { getTopBeefyVaults } from "@/lib";
import { BeefyResponseSchema, ErrorResponseSchema, HealthCheckSchema, TransactionRequestSchema, SignRequestSchema, BalancesResponseSchema } from "@/lib/schemas";
import { encodeDepositTransaction, encodeWithdrawTransaction, getVaultBalance } from '@/lib/transactions';
import { isValidAddress, getProviderForChain, SUPPORTED_CHAINS } from '@/lib/utils';
import { API_ENDPOINTS, OPERATION_IDS } from '@/lib/constants';

const app = new OpenAPIHono();

// Define route for fetching top yielding Beefy vaults
const getBeefyRoute = createRoute({
  operationId: OPERATION_IDS.TOP_BEEFY_VAULTS,
  description:
    "Get highest yielding vaults from Beefy Finance with detailed information about TVL, platform, chain, risks, and safety scores (0-100). Example: 'Show me the top 5 yield opportunities, taking into account safety scores and platform stability'",
  method: "get",
  path: API_ENDPOINTS.TOP_VAULTS,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: BeefyResponseSchema,
        },
      },
      description:
        "Returns top 20 vaults sorted by APY, including detailed vault information",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Bad request or failed to fetch data from Beefy API",
    },
    500: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Server error",
    }
  },
  tags: ["Vaults"],
});

// Handle requests for Beefy vault data
app.openapi(getBeefyRoute, async (c) => {
  try {
    const vaults = await getTopBeefyVaults();
    return c.json(vaults, 200);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 400);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

const key = JSON.parse(process.env.BITTE_KEY || "{}");
const config = JSON.parse(process.env.BITTE_CONFIG || "{}") as {
  url?: string;
};

if (!key?.accountId) {
  console.warn("Missing account info.");
}
if (!config || !config.url) {
  console.warn("Missing config or url in config.");
}

app.doc("/.well-known/ai-plugin.json", {
  openapi: "3.0.0",
  info: {
    title: "Bitte Beefy API",
    description: "API for finding opportunities from Beefy Finance.",
    version: "1.0.0",
  },
  servers: [{ url: config.url || DEPLOYMENT_URL }],
  "x-mb": {
    "account-id": key.accountId || "",
    assistant: {
      name: "Beefy Yield Agent",
      description:
        "An assistant that helps find the best yield opportunities on Beefy Finance with safety in mind and can execute vault transactions.",
      instructions:
        "Get top-beefy-vaults, then analyze metrics to suggest the best opportunities matching user requirements. Can execute vault transactions (deposit/withdraw) using generate-evm-tx tool. Supports multiple EVM networks.",
      tools: [{ type: "generate-evm-tx" }],
      image: (config?.url || DEPLOYMENT_URL) + "/beefy-agent-logo.png",
    },
  },
});

app.get("/api/swagger", (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Bitte Beefy API Documentation</title>
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
        <style>
          body {
            background: #1a1a1a;
            color: #ffffff;
          }
          .swagger-ui {
            filter: invert(88%) hue-rotate(180deg);
          }
          .swagger-ui .topbar { 
            display: none;
          }
        </style>
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
        <script>
          window.onload = () => {
            window.ui = SwaggerUIBundle({
              url: '/.well-known/ai-plugin.json',
              dom_id: '#swagger-ui',
              theme: 'dark'
            });
          };
        </script>
      </body>
    </html>
  `);
});

// Health check endpoint
app.openapi(
  {
    method: 'get',
    path: API_ENDPOINTS.HEALTH,
    operationId: OPERATION_IDS.HEALTH_CHECK,
    description: 'Check if the service is running',
    responses: {
      200: {
        description: 'Service status',
        content: {
          'application/json': {
            schema: HealthCheckSchema,
          },
        },
      },
    },
  },
  (c) => {
    return c.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  }
);

// Transaction endpoint
app.openapi(
  {
    method: 'post' as const,
    path: API_ENDPOINTS.TRANSACTION,
    operationId: OPERATION_IDS.CREATE_TRANSACTION,
    description: 'Create a deposit or withdrawal transaction for a Beefy vault',
    request: {
      body: {
        content: {
          'application/json': {
            schema: TransactionRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Transaction data',
        content: {
          'application/json': {
            schema: SignRequestSchema
          }
        }
      },
      400: {
        description: 'Invalid parameters',
        content: {
          'application/json': {
            schema: ErrorResponseSchema
          }
        }
      },
      500: {
        description: 'Server error',
        content: {
          'application/json': {
            schema: ErrorResponseSchema
          }
        }
      }
    }
  } as const,
  async (c) => {
    try {
      const body = await c.req.json();
      const input = TransactionRequestSchema.parse(body);
      console.log('Processing transaction request:', { chainId: input.chainId, action: input.action });

      if (!isValidAddress(input.vaultAddress)) {
        console.warn('Invalid vault address provided:', input.vaultAddress);
        throw new Error('Invalid vault address');
      }
      if (!isValidAddress(input.safeAddress)) {
        console.warn('Invalid safe address provided:', input.safeAddress);
        throw new Error('Invalid safe address');
      }
      if (!SUPPORTED_CHAINS[input.chainId as keyof typeof SUPPORTED_CHAINS]) {
        console.warn('Unsupported chain ID:', input.chainId);
        throw new Error(`Chain ID ${input.chainId} not supported`);
      }

      const data = input.action === 'deposit' 
        ? await encodeDepositTransaction(input.vaultAddress, input.amount)
        : await encodeWithdrawTransaction(input.vaultAddress, input.amount);

      console.log('Transaction created successfully:', { 
        action: input.action, 
        vaultAddress: input.vaultAddress,
        chainId: input.chainId 
      });

      return c.json({
        method: 'eth_sendTransaction' as const,
        chainId: input.chainId,
        params: [{
          to: input.vaultAddress,
          data,
          value: '0x0'
        }]
      }, 200);
    } catch (error) {
      console.error('Transaction creation failed:', error);
      if (error instanceof Error) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

// Balance check endpoint
app.openapi(
  {
    method: 'get' as const,
    path: API_ENDPOINTS.BALANCES,
    operationId: OPERATION_IDS.GET_VAULT_BALANCE,
    description: 'Get user balance for a specific vault',
    parameters: [
      {
        in: 'query',
        name: 'vaultAddress',
        required: true,
        schema: { type: 'string' }
      },
      {
        in: 'query',
        name: 'userAddress',
        required: true,
        schema: { type: 'string' }
      },
      {
        in: 'query',
        name: 'chainId',
        required: true,
        schema: { type: 'number' }
      }
    ],
    responses: {
      200: {
        description: 'Vault balance',
        content: {
          'application/json': {
            schema: BalancesResponseSchema
          }
        }
      },
      400: {
        description: 'Invalid input parameters',
        content: {
          'application/json': {
            schema: ErrorResponseSchema
          }
        }
      },
      500: {
        description: 'Server error',
        content: {
          'application/json': {
            schema: ErrorResponseSchema
          }
        }
      }
    }
  } as const,
  async (c) => {
    try {
      const query = c.req.query();
      const vaultAddress = query.vaultAddress;
      const userAddress = query.userAddress;
      const chainId = parseInt(query.chainId as string);
      
      console.log('Processing balance request:', { vaultAddress, userAddress, chainId });

      if (!vaultAddress || !userAddress || isNaN(chainId)) {
        console.warn('Missing required parameters:', { vaultAddress, userAddress, chainId });
        throw new Error('Missing or invalid required parameters');
      }

      if (!isValidAddress(vaultAddress) || !isValidAddress(userAddress)) {
        console.warn('Invalid address format:', { vaultAddress, userAddress });
        throw new Error('Invalid address format');
      }

      const provider = getProviderForChain(chainId);
      const { balance, decimals } = await getVaultBalance(
        vaultAddress,
        userAddress,
        provider
      );

      console.log('Balance retrieved successfully:', { 
        vaultAddress, 
        balance: balance.toString(),
        userAddress 
      });

      return c.json({
        balances: [{
          vaultAddress,
          balance: balance.toString(),
          decimals,
          symbol: 'mooToken'
        }]
      }, 200);
    } catch (error) {
      console.error('Balance check failed:', error);
      if (error instanceof Error) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

export const GET = handle(app);
export const POST = handle(app);