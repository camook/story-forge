import { describe, it, expect, beforeEach } from "vitest";
import { KVService } from "./kv";

// Mock KVNamespace for testing
class MockKVNamespace implements KVNamespace {
  private store = new Map<string, { value: string; metadata?: unknown; expiration?: number }>();

  async get(key: string, type?: "text" | "json" | "arrayBuffer" | "stream"): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    // Check expiration
    if (entry.expiration && Date.now() > entry.expiration) {
      this.store.delete(key);
      return null;
    }
    
    return entry.value;
  }

  async put(key: string, value: string | ArrayBuffer | ReadableStream, options?: { expirationTtl?: number; expiration?: number; metadata?: unknown }): Promise<void> {
    const entry: { value: string; metadata?: unknown; expiration?: number } = {
      value: typeof value === "string" ? value : "buffer-or-stream"
    };
    
    if (options?.metadata) {
      entry.metadata = options.metadata;
    }
    
    if (options?.expirationTtl) {
      entry.expiration = Date.now() + (options.expirationTtl * 1000);
    } else if (options?.expiration) {
      entry.expiration = options.expiration * 1000;
    }
    
    this.store.set(key, entry);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ keys: { name: string; metadata?: unknown }[]; cursor?: string; list_complete: boolean }> {
    const { prefix = "", limit = 1000 } = options || {};
    const keys = Array.from(this.store.keys())
      .filter(key => key.startsWith(prefix))
      .slice(0, limit)
      .map(name => ({ name, metadata: this.store.get(name)?.metadata }));
    
    return {
      keys,
      list_complete: true
    };
  }

  getWithMetadata(): Promise<{ value: string | null; metadata: unknown }> {
    throw new Error("Not implemented");
  }
}

describe("KVService", () => {
  let kvService: KVService;
  let mockKV: MockKVNamespace;

  beforeEach(() => {
    mockKV = new MockKVNamespace();
    kvService = new KVService(mockKV);
  });

  describe("get", () => {
    it("should return null for non-existent key", async () => {
      const result = await kvService.get("nonexistent");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(null);
      }
    });

    it("should return text value", async () => {
      await mockKV.put("test-key", "test-value");
      const result = await kvService.get("test-key");
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("test-value");
      }
    });

    it("should parse JSON value", async () => {
      const jsonValue = { message: "hello", count: 42 };
      await mockKV.put("json-key", JSON.stringify(jsonValue));
      const result = await kvService.get<typeof jsonValue>("json-key", { type: "json" });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(jsonValue);
      }
    });

    it("should handle invalid JSON", async () => {
      await mockKV.put("invalid-json", "not-json");
      const result = await kvService.get("invalid-json", { type: "json" });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("INVALID_VALUE");
      }
    });

    it("should validate key parameter", async () => {
      const result = await kvService.get("");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("INVALID_VALUE");
      }
    });
  });

  describe("put", () => {
    it("should store text value", async () => {
      const result = await kvService.put("test-key", "test-value");
      expect(result.success).toBe(true);
      
      const retrieved = await kvService.get("test-key");
      if (retrieved.success) {
        expect(retrieved.data).toBe("test-value");
      }
    });

    it("should validate key parameter", async () => {
      const result = await kvService.put("", "value");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("INVALID_VALUE");
      }
    });
  });

  describe("putJSON", () => {
    it("should store JSON value", async () => {
      const jsonValue = { message: "hello", count: 42 };
      const result = await kvService.putJSON("json-key", jsonValue);
      expect(result.success).toBe(true);
      
      const retrieved = await kvService.get<typeof jsonValue>("json-key", { type: "json" });
      if (retrieved.success) {
        expect(retrieved.data).toEqual(jsonValue);
      }
    });

    it("should handle non-serializable values", async () => {
      const circular: any = {};
      circular.self = circular;
      
      const result = await kvService.putJSON("circular", circular);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("INVALID_VALUE");
      }
    });
  });

  describe("delete", () => {
    it("should delete existing key", async () => {
      await mockKV.put("test-key", "test-value");
      const result = await kvService.delete("test-key");
      expect(result.success).toBe(true);
      
      const retrieved = await kvService.get("test-key");
      if (retrieved.success) {
        expect(retrieved.data).toBe(null);
      }
    });

    it("should validate key parameter", async () => {
      const result = await kvService.delete("");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("INVALID_VALUE");
      }
    });
  });

  describe("list", () => {
    it("should list all keys", async () => {
      await mockKV.put("key1", "value1");
      await mockKV.put("key2", "value2");
      
      const result = await kvService.list();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.keys).toHaveLength(2);
        expect(result.data.keys.map((k: { name: string }) => k.name)).toContain("key1");
        expect(result.data.keys.map((k: { name: string }) => k.name)).toContain("key2");
      }
    });

    it("should filter by prefix", async () => {
      await mockKV.put("test:key1", "value1");
      await mockKV.put("test:key2", "value2");
      await mockKV.put("other:key", "value3");
      
      const result = await kvService.list({ prefix: "test:" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.keys).toHaveLength(2);
        expect(result.data.keys.every((k: { name: string }) => k.name.startsWith("test:"))).toBe(true);
      }
    });
  });
});