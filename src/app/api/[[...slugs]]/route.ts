import { handle } from "hono/vercel";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { DEPLOYMENT_URL } from "vercel-url";
import { getTopBeefyVaults } from "@/lib";
import { BeefyResponseSchema, ErrorResponseSchema } from "@/lib/schemas";

const app = new OpenAPIHono();

// Define route for fetching top yielding Beefy vaults
const getBeefyRoute = createRoute({
  operationId: "get-beefy-top-vaults",
  description:
    "Get highest yielding vaults from Beefy Finance with detailed information about TVL, platform, chain, and associated risks.",
  method: "get",
  path: "/api/beefy-top-vaults",
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
  },
  tags: ["Vaults"],
});

// Handle requests for Beefy vault data
app.openapi(getBeefyRoute, async (c) => {
  try {
    const vaults = await getTopBeefyVaults();
    return c.json(vaults, 200);
  } catch (error) {
    return c.json({ error: "Failed to fetch Beefy data" }, 400);
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
        "An assistant that helps find the best yield opportunities on Beefy Finance with safety in mind.",
      instructions:
        "Find the highest yielding vaults on Beefy with detailed information about risks and opportunities.",
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

export const GET = handle(app);
export const POST = handle(app);
