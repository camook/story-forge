import type { KVNamespace } from "@cloudflare/workers-types";

export type KVError = {
  code: "KEY_NOT_FOUND" | "INVALID_VALUE" | "KV_ERROR";
  message: string;
};

export type KVResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: KVError;
};

export type KVGetOptions = {
  type?: "text" | "json" | "arrayBuffer" | "stream";
};

export type KVPutOptions = {
  expirationTtl?: number;
  expiration?: number;
  metadata?: Record<string, unknown>;
};

export class KVService {
  constructor(private readonly kv: KVNamespace) {}

  async get<T = string>(key: string, options: KVGetOptions = {}): Promise<KVResult<T | null>> {
    try {
      if (!key || typeof key !== "string") {
        return {
          success: false,
          error: { code: "INVALID_VALUE", message: "Key must be a non-empty string" }
        };
      }

      const { type = "text" } = options;
      const value = await this.kv.get(key, type as "text");
      
      if (value === null) {
        return { success: true, data: null };
      }

      let parsedValue: T;
      if (type === "json") {
        try {
          parsedValue = JSON.parse(value) as T;
        } catch {
          return {
            success: false,
            error: { code: "INVALID_VALUE", message: "Stored value is not valid JSON" }
          };
        }
      } else {
        parsedValue = value as T;
      }

      return { success: true, data: parsedValue };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "KV_ERROR",
          message: error instanceof Error ? error.message : "Unknown KV error"
        }
      };
    }
  }

  async put(key: string, value: string | ArrayBuffer | ReadableStream, options: KVPutOptions = {}): Promise<KVResult<void>> {
    try {
      if (!key || typeof key !== "string") {
        return {
          success: false,
          error: { code: "INVALID_VALUE", message: "Key must be a non-empty string" }
        };
      }

      await this.kv.put(key, value, options);
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "KV_ERROR",
          message: error instanceof Error ? error.message : "Unknown KV error"
        }
      };
    }
  }

  async putJSON<T>(key: string, value: T, options: Omit<KVPutOptions, 'metadata'> & { metadata?: Record<string, unknown> } = {}): Promise<KVResult<void>> {
    try {
      const jsonValue = JSON.stringify(value);
      return await this.put(key, jsonValue, options);
    } catch (error) {
      return {
        success: false,
        error: {
          code: "INVALID_VALUE",
          message: "Value cannot be serialized to JSON"
        }
      };
    }
  }

  async delete(key: string): Promise<KVResult<void>> {
    try {
      if (!key || typeof key !== "string") {
        return {
          success: false,
          error: { code: "INVALID_VALUE", message: "Key must be a non-empty string" }
        };
      }

      await this.kv.delete(key);
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "KV_ERROR",
          message: error instanceof Error ? error.message : "Unknown KV error"
        }
      };
    }
  }

  async list(options: { prefix?: string; limit?: number; cursor?: string } = {}): Promise<KVResult<{ keys: { name: string; metadata?: unknown }[]; cursor?: string; complete: boolean }>> {
    try {
      const { prefix, limit = 100, cursor } = options;
      const listOptions: { prefix?: string; limit?: number; cursor?: string } = {};
      
      if (prefix !== undefined) listOptions.prefix = prefix;
      if (limit !== undefined) listOptions.limit = limit;
      if (cursor !== undefined) listOptions.cursor = cursor;
      
      const result = await this.kv.list(listOptions);
      
      return {
        success: true,
        data: {
          keys: result.keys,
          cursor: "cursor" in result ? result.cursor : undefined,
          complete: result.list_complete
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "KV_ERROR",
          message: error instanceof Error ? error.message : "Unknown KV error"
        }
      };
    }
  }
}