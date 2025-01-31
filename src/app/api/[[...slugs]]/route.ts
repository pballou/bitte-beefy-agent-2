import { handle } from "hono/vercel";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { DEPLOYMENT_URL } from "vercel-url";
import { getTopBeefyVaults } from "@/lib";
import { BeefyResponseSchema, ErrorResponseSchema, HealthCheckSchema, GenerateUrlRequestSchema, GenerateUrlResponseSchema } from "@/lib/schemas";
import { isValidAddress, SUPPORTED_CHAINS } from '@/lib/utils';
import { API_ENDPOINTS, OPERATION_IDS } from '@/lib/constants';
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
            description: "Creates a clickable deposit URL. IMPORTANT: This tool returns a URL, not a transaction. Example: Calling generate-evm-tx with vault=0x123... amount=1000000 chainId=8453 returns {url: 'https://...', message: 'Click to deposit 0.001 ETH...'}", 
            parameters: {
              type: "object",
              properties: {
                vault: {
                  type: "string",
                  description: "Vault address (e.g., 0xA6854c1F54198D351D6d4263806F5A876099839b for cbETH-WETH LP)"
                },
                amount: {
                  type: "string",
                  description: "Amount in wei (e.g., 1000000000000000 for 0.001 ETH)"
                },
                chainId: {
                  type: "number",
                  description: "Chain ID (e.g., 8453 for Base network)"
                },
                tokenAddress: {
                  type: "string",
                  description: "Token address (e.g., 0x4200000000000000000000000000000000000006 for WETH on Base)"
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
  description: 'Generate a URL for depositing into a Beefy vault. Returns a clickable link that opens our deposit interface with pre-filled transaction details.',
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

export const GET = handle(app);
export const POST = handle(app);