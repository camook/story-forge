import { Hono } from "hono";

type Env = {
  Bindings: {
    KV: KVNamespace;
    DB: D1Database;
  };
};

const app = new Hono<Env>();

app.get("/healthz", (c) => c.json({ ok: true }, 200));

app.get("/api/hello", (c) =>
  c.json({ message: "Hello from Hono on Workers" }, 200)
);

export default {
  fetch: (request: Request, env: Env["Bindings"], ctx: ExecutionContext) =>
    app.fetch(request, env, ctx),
};

