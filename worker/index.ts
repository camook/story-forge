import { Hono } from "hono";
import { KVService } from "./lib/kv";
import { D1Service } from "./lib/d1";
import type { CreateItemInput, UpdateItemInput } from "./lib/db-schema";
import { authMiddleware, securityHeaders, corsPolicy, type AuthVariables } from "./lib/middleware";
import { validateField, validateObject, ValidationError, kvKeyValidation, itemNameValidation, itemDescriptionValidation, itemNameValidationOptional, itemDescriptionValidationOptional, paginationValidation, sanitizeString } from "./lib/validation";

export type Env = {
  Bindings: {
    KV: KVNamespace;
    DB: D1Database;
  };
};

export const app = new Hono<Env & { Variables: AuthVariables }>();

// Security headers for all responses
app.use("*", securityHeaders());

// Environment-aware CORS policy  
const isDev = typeof (globalThis as any).process !== "undefined" || 
             typeof (globalThis as any).navigator === "undefined";
app.use("/api/*", corsPolicy(isDev));

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
  
  if (err instanceof ValidationError) {
    return c.json({ 
      error: "validation_error", 
      message: err.message,
      field: err.field 
    }, 400);
  }
  
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

// Demo authenticated endpoint
app.get("/api/auth/profile", authMiddleware(), (c) => {
  const auth = c.get("auth");
  return c.json({ 
    message: "Profile accessed successfully",
    user: auth.user
  }, 200);
});

// KV API routes (protected)
app.use("/api/kv/*", authMiddleware());

app.get("/api/kv/:key", async (c) => {
  const key = c.req.param("key");
  const type = c.req.query("type") as "text" | "json" | undefined;
  
  // Validate key format
  validateField(key, "key", kvKeyValidation);
  
  const kvService = new KVService(c.env.KV);
  const result = await kvService.get(key, type ? { type } : undefined);
  
  if (!result.success) {
    return c.json({ error: result.error.message }, result.error.code === "INVALID_VALUE" ? 400 : 500);
  }
  
  if (result.data === null) {
    return c.json({ error: "Key not found" }, 404);
  }
  
  return c.json({ key, value: result.data }, 200);
});

app.put("/api/kv/:key", async (c) => {
  const key = c.req.param("key");
  
  // Validate key format
  validateField(key, "key", kvKeyValidation);
  
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  
  // Validate request body
  validateObject(body, {
    value: { required: true },
    ttl: { type: "number", min: 1, max: 86400 * 365 } // Max 1 year
  });
  
  const kvService = new KVService(c.env.KV);
  const options: { expirationTtl?: number } = {};
  
  if (body.ttl && typeof body.ttl === "number" && body.ttl > 0) {
    options.expirationTtl = body.ttl;
  }
  
  let result;
  if (typeof body.value === "object") {
    result = await kvService.putJSON(key, body.value, options);
  } else {
    result = await kvService.put(key, String(body.value), options);
  }
  
  if (!result.success) {
    return c.json({ error: result.error.message }, result.error.code === "INVALID_VALUE" ? 400 : 500);
  }
  
  return c.json({ key, success: true }, 201);
});

app.delete("/api/kv/:key", async (c) => {
  const key = c.req.param("key");
  
  // Validate key format
  validateField(key, "key", kvKeyValidation);
  
  const kvService = new KVService(c.env.KV);
  const result = await kvService.delete(key);
  
  if (!result.success) {
    return c.json({ error: result.error.message }, result.error.code === "INVALID_VALUE" ? 400 : 500);
  }
  
  return c.json({ key, deleted: true }, 200);
});

app.get("/api/kv", async (c) => {
  const prefix = c.req.query("prefix");
  const limitStr = c.req.query("limit");
  const cursor = c.req.query("cursor");
  
  // Validate query parameters
  const queryParams: any = {};
  if (limitStr) {
    const limit = parseInt(limitStr);
    validateField(limit, "limit", paginationValidation.limit);
    queryParams.limit = limit;
  }
  if (cursor) {
    validateField(cursor, "cursor", { type: "string", maxLength: 1024 });
    queryParams.cursor = cursor;
  }
  if (prefix) {
    validateField(prefix, "prefix", { type: "string", maxLength: 256 });
    queryParams.prefix = prefix;
  }
  
  const kvService = new KVService(c.env.KV);
  const result = await kvService.list({
    prefix: queryParams.prefix,
    limit: queryParams.limit,
    cursor: queryParams.cursor
  });
  
  if (!result.success) {
    return c.json({ error: result.error.message }, 500);
  }
  
  return c.json(result.data, 200);
});

// D1 API routes (protected)
app.use("/api/d1/*", authMiddleware());

app.get("/api/d1/init", async (c) => {
  const d1Service = new D1Service(c.env.DB);
  const result = await d1Service.initializeSchema();
  
  if (!result.success) {
    return c.json({ error: result.error.message }, 500);
  }
  
  return c.json({ message: "Schema initialized successfully" }, 200);
});

app.get("/api/d1/items", async (c) => {
  const limitStr = c.req.query("limit");
  const offsetStr = c.req.query("offset");
  const cursorStr = c.req.query("cursor");
  
  // Validate pagination parameters
  const queryParams: any = {};
  if (limitStr) {
    const limit = parseInt(limitStr);
    validateField(limit, "limit", paginationValidation.limit);
    queryParams.limit = limit;
  }
  if (offsetStr) {
    const offset = parseInt(offsetStr);
    validateField(offset, "offset", paginationValidation.offset);
    queryParams.offset = offset;
  }
  if (cursorStr) {
    const cursor = parseInt(cursorStr);
    validateField(cursor, "cursor", paginationValidation.cursor);
    queryParams.cursor = cursor;
  }
  
  const d1Service = new D1Service(c.env.DB);
  const result = await d1Service.listItems({
    limit: queryParams.limit,
    offset: queryParams.offset,
    cursor: queryParams.cursor
  });
  
  if (!result.success) {
    return c.json({ error: result.error.message }, result.error.code === "INVALID_INPUT" ? 400 : 500);
  }
  
  return c.json(result.data, 200);
});

app.post("/api/d1/items", async (c) => {
  let body: CreateItemInput;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  
  // Validate and sanitize input
  if (body.name !== undefined) {
    validateField(body.name, "name", itemNameValidation);
  }
  if (body.description !== undefined) {
    validateField(body.description, "description", itemDescriptionValidation);
  }
  
  // Sanitize string inputs
  if (body.name) {
    body.name = sanitizeString(body.name);
  }
  if (body.description) {
    body.description = sanitizeString(body.description);
  }
  
  const d1Service = new D1Service(c.env.DB);
  const result = await d1Service.createItem(body);
  
  if (!result.success) {
    const status = result.error.code === "INVALID_INPUT" ? 400 : 
                   result.error.code === "CONSTRAINT_ERROR" ? 409 : 500;
    return c.json({ error: result.error.message }, status);
  }
  
  return c.json(result.data, 201);
});

app.get("/api/d1/items/:id", async (c) => {
  const idStr = c.req.param("id");
  const id = parseInt(idStr);
  
  // Validate ID parameter
  validateField(id, "id", { 
    required: true, 
    type: "number", 
    min: 1,
    custom: (value) => Number.isInteger(value) || "ID must be an integer"
  });
  
  const d1Service = new D1Service(c.env.DB);
  const result = await d1Service.getItem(id);
  
  if (!result.success) {
    return c.json({ error: result.error.message }, result.error.code === "INVALID_INPUT" ? 400 : 500);
  }
  
  if (result.data === null) {
    return c.json({ error: "Item not found" }, 404);
  }
  
  return c.json(result.data, 200);
});

app.put("/api/d1/items/:id", async (c) => {
  const idStr = c.req.param("id");
  const id = parseInt(idStr);
  
  // Validate ID parameter
  validateField(id, "id", { 
    required: true, 
    type: "number", 
    min: 1,
    custom: (value) => Number.isInteger(value) || "ID must be an integer"
  });
  
  let body: UpdateItemInput;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  
  // Validate and sanitize input
  if (body.name !== undefined) {
    validateField(body.name, "name", itemNameValidation);
  }
  if (body.description !== undefined) {
    validateField(body.description, "description", itemDescriptionValidation);
  }
  
  // Sanitize string inputs
  if (body.name) {
    body.name = sanitizeString(body.name);
  }
  if (body.description) {
    body.description = sanitizeString(body.description);
  }
  
  const d1Service = new D1Service(c.env.DB);
  const result = await d1Service.updateItem(id, body);
  
  if (!result.success) {
    const status = result.error.code === "INVALID_INPUT" ? 400 : 
                   result.error.code === "CONSTRAINT_ERROR" ? 409 : 500;
    return c.json({ error: result.error.message }, status);
  }
  
  if (result.data === null) {
    return c.json({ error: "Item not found" }, 404);
  }
  
  return c.json(result.data, 200);
});

app.delete("/api/d1/items/:id", async (c) => {
  const idStr = c.req.param("id");
  const id = parseInt(idStr);
  
  // Validate ID parameter
  validateField(id, "id", { 
    required: true, 
    type: "number", 
    min: 1,
    custom: (value) => Number.isInteger(value) || "ID must be an integer"
  });
  
  const d1Service = new D1Service(c.env.DB);
  const result = await d1Service.deleteItem(id);
  
  if (!result.success) {
    return c.json({ error: result.error.message }, result.error.code === "INVALID_INPUT" ? 400 : 500);
  }
  
  if (!result.data) {
    return c.json({ error: "Item not found" }, 404);
  }
  
  return c.json({ id, deleted: true }, 200);
});

export default {
  fetch: (request: Request, env: Env["Bindings"], ctx: ExecutionContext) =>
    app.fetch(request, env, ctx),
};
