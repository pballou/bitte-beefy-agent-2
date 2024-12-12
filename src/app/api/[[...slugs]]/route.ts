import { handle } from "hono/vercel";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { getUserKarma } from "@/lib/user-karma";
import { DEPLOYMENT_URL } from "vercel-url";
import {
  KarmaRequestParamsSchema,
  KarmaResponseSchema,
  ErrorResponseSchema,
} from "@/lib/schemas";

const app = new OpenAPIHono();

const getKarmaRoute = createRoute({
  operationId: "get-account-karma",
  description:
    "Get account karma and badges based on actions performed by the account.",

  method: "get",
  path: "/api/karma/{account}",
  request: {
    params: KarmaRequestParamsSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: KarmaResponseSchema,
        },
      },
      description: "Successful response with karma and badges",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Bad request",
    },
  },
});

app.openapi(getKarmaRoute, async (c) => {
  const { account } = c.req.param();
  const karma = await getUserKarma(account);
  if (!karma) {
    return c.json({ error: `User ${account} not found` }, 400);
  }
  return c.json(karma, 200);
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
    title: "Bitte Karma API",
    description:
      "API for retrieving account karma and badges based on actions performed by the account on NEAR blockchain.",
    version: "1.0.0",
  },
  servers: [{ url: config.url || DEPLOYMENT_URL }],
  "x-mb": {
    "account-id": key.accountId || "",
    assistant: {
      name: "Karma Agent",
      description:
        "An assistant that provides account karma and badges based on actions performed by the account and its current state.",
      instructions: "Get information about an account's karma and badges.",
      image: (config?.url || DEPLOYMENT_URL) + "/karma-agent-logo.png",
    },
  },
});

app.get("/api/swagger", (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Bitte Karma API Documentation</title>
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
