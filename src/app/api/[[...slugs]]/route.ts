import { handle } from "hono/vercel";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { DEPLOYMENT_URL } from "vercel-url";
import { getTopBeefyVaults } from "@/lib";
import { BeefyResponseSchema, ErrorResponseSchema, HealthCheckSchema, TransactionRequestSchema, SignRequestSchema, BalancesResponseSchema } from "@/lib/schemas";
import { getVaultBalance } from '@/lib/transactions';
import { isValidAddress, getProviderForChain, SUPPORTED_CHAINS } from '@/lib/utils';
import { API_ENDPOINTS, OPERATION_IDS } from '@/lib/constants';
import { GenerateUrlRequestSchema, GenerateUrlResponseSchema } from "@/lib/schemas";
import { formatUnits } from "ethers";

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
        "Returns top 200 vaults sorted by TVL, including detailed vault information",
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
      tools: [
        { 
          type: "function",
          function: {
            name: "generate-evm-tx",
            description: "Generate a URL for depositing into a Beefy vault",
            parameters: {
              type: "object",
              properties: {
                vault: {
                  type: "string",
                  description: "The vault address to deposit into"
                },
                amount: {
                  type: "string",
                  description: "The amount to deposit in ETH"
                },
                chainId: {
                  type: "number",
                  description: "The chain ID where the vault is deployed"
                },
                tokenAddress: {
                  type: "string",
                  description: "The address of the token to deposit"
                }
              },
              required: ["vault", "amount", "chainId", "tokenAddress"]
            }
          }
        }
      ],
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

const transactionRoute = createRoute({
  method: 'post',
  path: '/api/generate-evm-tx',
  operationId: 'generate-evm-tx',
  description: 'Generate a URL for depositing into a Beefy vault. Returns a clickable link that opens our deposit interface with pre-filled transaction details. Example: "Create a deposit link for 0.1 ETH into the cbETH-WETH vault"',
  request: {
    body: {
      content: {
        'application/json': {
          schema: GenerateUrlRequestSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Transaction URL generated successfully',
      content: {
        'application/json': {
          schema: GenerateUrlResponseSchema
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
    }
  }
});

app.openapi(transactionRoute, async (c) => {
  try {
    const { vault, amount, vaultId, chainId, tokenAddress } = await c.req.json();
    
    // Validate inputs
    if (!vault || !amount || !chainId || !tokenAddress) {
      throw new Error('Missing required parameters');
    }

    // Validate chain ID
    if (!(chainId in SUPPORTED_CHAINS)) {
      throw new Error(`Unsupported chain ID. Supported chains are: ${Object.entries(SUPPORTED_CHAINS)
        .map(([id, name]) => `${id} (${name})`)
        .join(', ')}`);
    }

    // Validate addresses
    if (!isValidAddress(vault) || !isValidAddress(tokenAddress)) {
      throw new Error('Invalid address format');
    }

    const url = `${DEPLOYMENT_URL}/deposit?vault=${vault}&amount=${amount}&chainId=${chainId}&tokenAddress=${tokenAddress}`;
    
    return c.json({
      url,
      message: `Click to deposit ${formatUnits(BigInt(amount), 18)} ETH into vault ${vault}`
    }, 200);
  } catch (error) {
    console.error('URL generation failed:', error);
    return c.json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    }, 400);
  }
});

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