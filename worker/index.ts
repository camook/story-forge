import { Hono } from "hono";
import { cors } from "hono/cors";

export type Env = {
  Bindings: {
    KV: KVNamespace;
    DB: D1Database;
  };
};

export const app = new Hono<Env>();

// Minimal CORS for API routes
app.use("/api/*", cors({
  origin: "*",
  allowMethods: ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"],
}));

// Request logging
app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  const method = c.req.method;
  const url = new URL(c.req.url);
  const status = c.res.status;
  console.log(`${method} ${url.pathname} -> ${status} ${ms}ms`);
});

// Centralized error handling
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "internal_error" }, 500);
});

app.get("/healthz", (c) => {
  c.header("Cache-Control", "no-store");
  return c.json({ status: "ok" }, 200);
});

app.get("/api/hello", (c) =>
  c.json({ message: "Hello from Hono on Workers" }, 200)
);

app.get("/api/time", (c) => {
  c.header("Cache-Control", "no-store");
  return c.json({ time: new Date().toISOString() }, 200);
});

export default {
  fetch: (request: Request, env: Env["Bindings"], ctx: ExecutionContext) =>
    app.fetch(request, env, ctx),
};
