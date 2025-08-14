import { describe, it, expect, beforeEach } from "vitest";
import { D1Service } from "./d1";
import type { Item } from "./db-schema";

// Mock D1Database for testing
class MockD1Database implements D1Database {
  private items: Item[] = [];
  private nextId = 1;

  prepare(query: string) {
    return new MockD1PreparedStatement(query, this.items, this.nextId, (id) => { this.nextId = id; });
  }

  async exec(query: string): Promise<D1ExecResult> {
    // For schema initialization - just return success
    return { count: 0, duration: 0 };
  }

  async dump(): Promise<ArrayBuffer> {
    throw new Error("Not implemented");
  }

  async batch(): Promise<D1Result[]> {
    throw new Error("Not implemented");
  }
}

class MockD1PreparedStatement implements D1PreparedStatement {
  private bindings: any[] = [];

  constructor(
    private query: string,
    private items: Item[],
    private nextId: number,
    private setNextId: (id: number) => void
  ) {}

  bind(...values: any[]): D1PreparedStatement {
    this.bindings = values;
    return this;
  }

  async first<T = unknown>(colName?: string): Promise<T | null> {
    const result = await this.all<T>();
    return result.results[0] || null;
  }

  async run(): Promise<D1Result> {
    if (this.query.includes("DELETE")) {
      const id = this.bindings[0];
      const index = this.items.findIndex(item => item.id === id);
      if (index >= 0) {
        this.items.splice(index, 1);
        return { success: true, changes: 1, duration: 0, meta: {} };
      }
      return { success: true, changes: 0, duration: 0, meta: {} };
    }

    return { success: true, changes: 1, duration: 0, meta: {} };
  }

  async all<T = unknown>(): Promise<D1Result<T[]>> {
    if (this.query.includes("INSERT")) {
      const [name, description] = this.bindings;
      const newItem: Item = {
        id: this.nextId,
        name,
        description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.items.push(newItem);
      this.setNextId(this.nextId + 1);
      return { 
        success: true, 
        results: [newItem as T], 
        duration: 0, 
        meta: { changes: 1 } 
      };
    }

    if (this.query.includes("UPDATE")) {
      const id = this.bindings[this.bindings.length - 1]; // ID is last parameter
      const item = this.items.find(item => item.id === id);
      if (!item) {
        return { success: true, results: [], duration: 0, meta: { changes: 0 } };
      }

      // Update based on bindings
      let bindingIndex = 0;
      if (this.query.includes("name = ?")) {
        item.name = this.bindings[bindingIndex++];
      }
      if (this.query.includes("description = ?")) {
        item.description = this.bindings[bindingIndex++];
      }
      item.updated_at = new Date().toISOString();

      return { 
        success: true, 
        results: [item as T], 
        duration: 0, 
        meta: { changes: 1 } 
      };
    }

    if (this.query.includes("SELECT") && this.query.includes("WHERE id = ?")) {
      const id = this.bindings[0];
      const item = this.items.find(item => item.id === id);
      return { 
        success: true, 
        results: item ? [item as T] : [], 
        duration: 0, 
        meta: {} 
      };
    }

    if (this.query.includes("SELECT COUNT(*)")) {
      return { 
        success: true, 
        results: [{ total: this.items.length } as T], 
        duration: 0, 
        meta: {} 
      };
    }

    if (this.query.includes("SELECT * FROM items")) {
      let filteredItems = [...this.items];
      
      // Handle WHERE id > ? (cursor)
      if (this.query.includes("WHERE id > ?")) {
        const cursor = this.bindings[0];
        filteredItems = filteredItems.filter(item => item.id > cursor);
      }

      // Handle LIMIT and OFFSET
      const limitMatch = this.query.match(/LIMIT (\d+)/);
      const offsetMatch = this.query.match(/OFFSET (\d+)/);
      
      if (limitMatch) {
        const limit = parseInt(limitMatch[1]);
        const offset = offsetMatch ? parseInt(offsetMatch[1]) : 0;
        filteredItems = filteredItems.slice(offset, offset + limit);
      }

      return { 
        success: true, 
        results: filteredItems as T[], 
        duration: 0, 
        meta: {} 
      };
    }

    return { success: true, results: [], duration: 0, meta: {} };
  }

  raw(): Promise<unknown[]> {
    throw new Error("Not implemented");
  }
}

describe("D1Service", () => {
  let d1Service: D1Service;
  let mockDB: MockD1Database;

  beforeEach(() => {
    mockDB = new MockD1Database();
    d1Service = new D1Service(mockDB);
  });

  describe("initializeSchema", () => {
    it("should initialize schema successfully", async () => {
      const result = await d1Service.initializeSchema();
      expect(result.success).toBe(true);
    });
  });

  describe("createItem", () => {
    it("should create item successfully", async () => {
      const input = { name: "Test Item", description: "Test description" };
      const result = await d1Service.createItem(input);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe(input.name);
        expect(result.data.description).toBe(input.description);
        expect(result.data.id).toBe(1);
      }
    });

    it("should validate required name field", async () => {
      const input = { name: "", description: "Test description" };
      const result = await d1Service.createItem(input);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("INVALID_INPUT");
      }
    });

    it("should handle optional description", async () => {
      const input = { name: "Test Item" };
      const result = await d1Service.createItem(input);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe(input.name);
        expect(result.data.description).toBe(null);
      }
    });
  });

  describe("getItem", () => {
    it("should return item by ID", async () => {
      // Create an item first
      await d1Service.createItem({ name: "Test Item", description: "Test description" });
      
      const result = await d1Service.getItem(1);
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(1);
      expect(result.data?.name).toBe("Test Item");
    });

    it("should return null for non-existent item", async () => {
      const result = await d1Service.getItem(999);
      expect(result.success).toBe(true);
      expect(result.data).toBe(null);
    });

    it("should validate ID parameter", async () => {
      const result = await d1Service.getItem(-1);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe("INVALID_INPUT");
    });
  });

  describe("listItems", () => {
    beforeEach(async () => {
      // Create test items
      await d1Service.createItem({ name: "Item 1", description: "Description 1" });
      await d1Service.createItem({ name: "Item 2", description: "Description 2" });
      await d1Service.createItem({ name: "Item 3", description: "Description 3" });
    });

    it("should list all items", async () => {
      const result = await d1Service.listItems();
      
      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(3);
      expect(result.data.hasMore).toBe(false);
      expect(result.data.total).toBe(3);
    });

    it("should respect limit parameter", async () => {
      const result = await d1Service.listItems({ limit: 2 });
      
      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(2);
      expect(result.data.hasMore).toBe(true);
    });

    it("should validate limit parameter", async () => {
      const result = await d1Service.listItems({ limit: 200 });
      expect(result.success).toBe(false);
      expect(result.error.code).toBe("INVALID_INPUT");
    });

    it("should validate offset parameter", async () => {
      const result = await d1Service.listItems({ offset: -1 });
      expect(result.success).toBe(false);
      expect(result.error.code).toBe("INVALID_INPUT");
    });
  });

  describe("updateItem", () => {
    it("should update item successfully", async () => {
      // Create an item first
      await d1Service.createItem({ name: "Original", description: "Original description" });
      
      const result = await d1Service.updateItem(1, { name: "Updated", description: "Updated description" });
      
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe("Updated");
      expect(result.data?.description).toBe("Updated description");
    });

    it("should return null for non-existent item", async () => {
      const result = await d1Service.updateItem(999, { name: "Updated" });
      expect(result.success).toBe(true);
      expect(result.data).toBe(null);
    });

    it("should validate ID parameter", async () => {
      const result = await d1Service.updateItem(-1, { name: "Updated" });
      expect(result.success).toBe(false);
      expect(result.error.code).toBe("INVALID_INPUT");
    });

    it("should validate update input", async () => {
      const result = await d1Service.updateItem(1, {});
      expect(result.success).toBe(false);
      expect(result.error.code).toBe("INVALID_INPUT");
    });
  });

  describe("deleteItem", () => {
    it("should delete item successfully", async () => {
      // Create an item first
      await d1Service.createItem({ name: "To Delete", description: "Will be deleted" });
      
      const result = await d1Service.deleteItem(1);
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      
      // Verify item is gone
      const getResult = await d1Service.getItem(1);
      expect(getResult.data).toBe(null);
    });

    it("should return false for non-existent item", async () => {
      const result = await d1Service.deleteItem(999);
      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });

    it("should validate ID parameter", async () => {
      const result = await d1Service.deleteItem(-1);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe("INVALID_INPUT");
    });
  });
});