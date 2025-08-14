import { describe, it, expect, beforeEach } from "vitest";
import { app, type Env } from "./index";

// Create mock bindings for testing
class MockKVNamespace {
  private store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }

  async put(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async list(): Promise<{ keys: { name: string }[]; cursor?: string; list_complete: boolean }> {
    const keys = Array.from(this.store.keys()).map(name => ({ name }));
    return { keys, list_complete: true };
  }

  getWithMetadata(): Promise<{ value: string | null; metadata: unknown }> {
    throw new Error("Not implemented");
  }
}

class MockD1Database {
  private items: any[] = [];
  private nextId = 1;

  prepare(query: string) {
    const self = this;
    return {
      bind(...values: any[]) {
        return {
          async first() {
            if (query.includes("INSERT")) {
              const [name, description] = values;
              const newItem = {
                id: self.nextId++,
                name,
                description,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              self.items.push(newItem);
              return newItem;
            }
            
            if (query.includes("SELECT") && query.includes("WHERE id = ?")) {
              const [id] = values;
              return self.items.find(item => item.id === id) || null;
            }
            
            if (query.includes("SELECT COUNT(*)")) {
              return { total: self.items.length };
            }
            
            return null;
          },
          async all() {
            if (query.includes("SELECT * FROM items")) {
              return { 
                success: true, 
                results: self.items.slice(0, 100), 
                meta: {} 
              };
            }
            return { success: true, results: [], meta: {} };
          },
          async run() {
            if (query.includes("DELETE")) {
              const [id] = values;
              const index = self.items.findIndex(item => item.id === id);
              const changes = index >= 0 ? 1 : 0;
              if (index >= 0) self.items.splice(index, 1);
              return { changes, success: true, meta: {}, duration: 0 };
            }
            return { changes: 1, success: true, meta: {}, duration: 0 };
          }
        };
      }
    };
  }

  async exec(): Promise<D1ExecResult> {
    return { count: 0, duration: 0 };
  }

  async dump(): Promise<ArrayBuffer> {
    throw new Error("Not implemented");
  }

  async batch(): Promise<D1Result[]> {
    throw new Error("Not implemented");
  }
}

describe("KV API endpoints", () => {
  let mockEnv: Env["Bindings"];

  beforeEach(() => {
    mockEnv = {
      KV: new MockKVNamespace() as any,
      DB: new MockD1Database() as any
    };
  });

  describe("GET /api/kv/:key", () => {
    it("should return 404 for non-existent key", async () => {
      const res = await app.fetch(new Request("http://localhost/api/kv/nonexistent"), mockEnv);
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe("Key not found");
    });

    it("should return stored value", async () => {
      await mockEnv.KV.put("test-key", "test-value");
      const res = await app.fetch(new Request("http://localhost/api/kv/test-key"), mockEnv);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.key).toBe("test-key");
      expect(body.value).toBe("test-value");
    });
  });

  describe("PUT /api/kv/:key", () => {
    it("should store text value", async () => {
      const res = await app.fetch(new Request("http://localhost/api/kv/test-key", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: "test-value" })
      }), mockEnv);
      
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.key).toBe("test-key");
    });

    it("should store JSON value", async () => {
      const jsonValue = { message: "hello", count: 42 };
      const res = await app.fetch(new Request("http://localhost/api/kv/json-key", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: jsonValue })
      }), mockEnv);
      
      expect(res.status).toBe(201);
    });

    it("should validate request body", async () => {
      const res = await app.fetch(new Request("http://localhost/api/kv/test-key", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      }), mockEnv);
      
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Body must contain 'value' field");
    });
  });

  describe("DELETE /api/kv/:key", () => {
    it("should delete key", async () => {
      await mockEnv.KV.put("test-key", "test-value");
      const res = await app.fetch(new Request("http://localhost/api/kv/test-key", {
        method: "DELETE"
      }), mockEnv);
      
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(body.key).toBe("test-key");
    });
  });

  describe("GET /api/kv", () => {
    it("should list keys", async () => {
      await mockEnv.KV.put("key1", "value1");
      await mockEnv.KV.put("key2", "value2");
      
      const res = await app.fetch(new Request("http://localhost/api/kv"), mockEnv);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.keys).toHaveLength(2);
    });
  });
});

describe("D1 API endpoints", () => {
  let mockEnv: Env["Bindings"];

  beforeEach(() => {
    mockEnv = {
      KV: new MockKVNamespace() as any,
      DB: new MockD1Database() as any
    };
  });

  describe("GET /api/d1/init", () => {
    it("should initialize schema", async () => {
      const res = await app.fetch(new Request("http://localhost/api/d1/init"), mockEnv);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.message).toBe("Schema initialized successfully");
    });
  });

  describe("POST /api/d1/items", () => {
    it("should create item", async () => {
      const res = await app.fetch(new Request("http://localhost/api/d1/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test Item", description: "Test description" })
      }), mockEnv);
      
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.id).toBe(1);
      expect(body.name).toBe("Test Item");
      expect(body.description).toBe("Test description");
    });

    it("should validate required fields", async () => {
      const res = await app.fetch(new Request("http://localhost/api/d1/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: "Test description" })
      }), mockEnv);
      
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("Name is required");
    });
  });

  describe("GET /api/d1/items/:id", () => {
    it("should return item by ID", async () => {
      // Create an item first
      await app.fetch(new Request("http://localhost/api/d1/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test Item" })
      }), mockEnv);
      
      const res = await app.fetch(new Request("http://localhost/api/d1/items/1"), mockEnv);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.id).toBe(1);
      expect(body.name).toBe("Test Item");
    });

    it("should return 404 for non-existent item", async () => {
      const res = await app.fetch(new Request("http://localhost/api/d1/items/999"), mockEnv);
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe("Item not found");
    });

    it("should validate ID parameter", async () => {
      const res = await app.fetch(new Request("http://localhost/api/d1/items/invalid"), mockEnv);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("ID must be a positive integer");
    });
  });

  describe("GET /api/d1/items", () => {
    it("should list items", async () => {
      // Create some items first
      await app.fetch(new Request("http://localhost/api/d1/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Item 1" })
      }), mockEnv);
      
      await app.fetch(new Request("http://localhost/api/d1/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Item 2" })
      }), mockEnv);
      
      const res = await app.fetch(new Request("http://localhost/api/d1/items"), mockEnv);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toHaveLength(2);
      expect(body.hasMore).toBe(false);
    });
  });

  describe("DELETE /api/d1/items/:id", () => {
    it("should delete item", async () => {
      // Create an item first
      await app.fetch(new Request("http://localhost/api/d1/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "To Delete" })
      }), mockEnv);
      
      const res = await app.fetch(new Request("http://localhost/api/d1/items/1", {
        method: "DELETE"
      }), mockEnv);
      
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(body.id).toBe(1);
    });

    it("should return 404 for non-existent item", async () => {
      const res = await app.fetch(new Request("http://localhost/api/d1/items/999", {
        method: "DELETE"
      }), mockEnv);
      
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe("Item not found");
    });
  });
});