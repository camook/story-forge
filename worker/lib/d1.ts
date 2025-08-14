import type { D1Database } from "@cloudflare/workers-types";
import { SCHEMA_SQL, type Item, type CreateItemInput, type UpdateItemInput, type ListItemsOptions } from "./db-schema";

export type D1Error = {
  code: "NOT_FOUND" | "INVALID_INPUT" | "DATABASE_ERROR" | "CONSTRAINT_ERROR";
  message: string;
};

export type D1Result<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: D1Error;
};

export class D1Service {
  constructor(private readonly db: D1Database) {}

  async initializeSchema(): Promise<D1Result<void>> {
    try {
      await this.db.exec(SCHEMA_SQL);
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "DATABASE_ERROR",
          message: error instanceof Error ? error.message : "Failed to initialize schema"
        }
      };
    }
  }

  async createItem(input: CreateItemInput): Promise<D1Result<Item>> {
    try {
      if (!input.name || typeof input.name !== "string" || input.name.trim().length === 0) {
        return {
          success: false,
          error: { code: "INVALID_INPUT", message: "Name is required and must be a non-empty string" }
        };
      }

      const result = await this.db.prepare(
        "INSERT INTO items (name, description) VALUES (?, ?) RETURNING *"
      ).bind(input.name.trim(), input.description || null).first<Item>();

      if (!result) {
        return {
          success: false,
          error: { code: "DATABASE_ERROR", message: "Failed to create item" }
        };
      }

      return { success: true, data: result };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown database error";
      const code = message.includes("UNIQUE") || message.includes("constraint") 
        ? "CONSTRAINT_ERROR" as const 
        : "DATABASE_ERROR" as const;
        
      return {
        success: false,
        error: { code, message }
      };
    }
  }

  async getItem(id: number): Promise<D1Result<Item | null>> {
    try {
      if (!Number.isInteger(id) || id <= 0) {
        return {
          success: false,
          error: { code: "INVALID_INPUT", message: "ID must be a positive integer" }
        };
      }

      const result = await this.db.prepare("SELECT * FROM items WHERE id = ?").bind(id).first<Item>();
      return { success: true, data: result || null };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "DATABASE_ERROR",
          message: error instanceof Error ? error.message : "Unknown database error"
        }
      };
    }
  }

  async listItems(options: ListItemsOptions = {}): Promise<D1Result<{ items: Item[]; hasMore: boolean; total?: number }>> {
    try {
      const { limit = 20, offset = 0, cursor } = options;

      if (limit < 1 || limit > 100) {
        return {
          success: false,
          error: { code: "INVALID_INPUT", message: "Limit must be between 1 and 100" }
        };
      }

      if (offset < 0) {
        return {
          success: false,
          error: { code: "INVALID_INPUT", message: "Offset must be non-negative" }
        };
      }

      let query = "SELECT * FROM items";
      let countQuery = "SELECT COUNT(*) as total FROM items";
      const params: (string | number)[] = [];

      if (cursor) {
        query += " WHERE id > ?";
        countQuery += " WHERE id > ?";
        params.push(cursor);
      }

      query += " ORDER BY id ASC LIMIT ? OFFSET ?";
      params.push(limit + 1, offset); // Request one extra to check if there are more

      const [itemsResult, countResult] = await Promise.all([
        this.db.prepare(query).bind(...params).all<Item>(),
        this.db.prepare(countQuery).bind(...(cursor ? [cursor] : [])).first<{ total: number }>()
      ]);

      if (!itemsResult.success) {
        return {
          success: false,
          error: { code: "DATABASE_ERROR", message: "Failed to fetch items" }
        };
      }

      const items = itemsResult.results;
      const hasMore = items.length > limit;
      if (hasMore) {
        items.pop(); // Remove the extra item
      }

      return {
        success: true,
        data: {
          items,
          hasMore,
          total: countResult?.total
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "DATABASE_ERROR",
          message: error instanceof Error ? error.message : "Unknown database error"
        }
      };
    }
  }

  async updateItem(id: number, input: UpdateItemInput): Promise<D1Result<Item | null>> {
    try {
      if (!Number.isInteger(id) || id <= 0) {
        return {
          success: false,
          error: { code: "INVALID_INPUT", message: "ID must be a positive integer" }
        };
      }

      if (!input.name && !input.description && input.description !== null) {
        return {
          success: false,
          error: { code: "INVALID_INPUT", message: "At least one field must be provided for update" }
        };
      }

      const updates: string[] = [];
      const params: (string | number | null)[] = [];

      if (input.name !== undefined) {
        if (!input.name || typeof input.name !== "string" || input.name.trim().length === 0) {
          return {
            success: false,
            error: { code: "INVALID_INPUT", message: "Name must be a non-empty string" }
          };
        }
        updates.push("name = ?");
        params.push(input.name.trim());
      }

      if (input.description !== undefined) {
        updates.push("description = ?");
        params.push(input.description || null);
      }

      if (updates.length === 0) {
        // If no updates, just return the current item
        return await this.getItem(id);
      }

      params.push(id);
      const query = `UPDATE items SET ${updates.join(", ")} WHERE id = ? RETURNING *`;
      
      const result = await this.db.prepare(query).bind(...params).first<Item>();
      
      if (!result) {
        return { success: true, data: null }; // Item not found
      }

      return { success: true, data: result };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown database error";
      const code = message.includes("UNIQUE") || message.includes("constraint") 
        ? "CONSTRAINT_ERROR" as const 
        : "DATABASE_ERROR" as const;
        
      return {
        success: false,
        error: { code, message }
      };
    }
  }

  async deleteItem(id: number): Promise<D1Result<boolean>> {
    try {
      if (!Number.isInteger(id) || id <= 0) {
        return {
          success: false,
          error: { code: "INVALID_INPUT", message: "ID must be a positive integer" }
        };
      }

      const result = await this.db.prepare("DELETE FROM items WHERE id = ?").bind(id).run();
      
      return { 
        success: true, 
        data: result.changes > 0 
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "DATABASE_ERROR",
          message: error instanceof Error ? error.message : "Unknown database error"
        }
      };
    }
  }
}