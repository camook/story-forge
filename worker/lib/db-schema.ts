export const SCHEMA_SQL = `
-- Items table for demonstration
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_items_updated_at 
  AFTER UPDATE ON items
BEGIN
  UPDATE items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
`;

export type Item = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateItemInput = {
  name: string;
  description?: string;
};

export type UpdateItemInput = {
  name?: string;
  description?: string;
};

export type ListItemsOptions = {
  limit?: number;
  offset?: number;
  cursor?: number;
};