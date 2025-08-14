import { describe, it, expect } from "vitest";
import { parseJWT, extractUser, AuthError } from "./auth";

describe("Auth utilities", () => {
  describe("parseJWT", () => {
    it("should throw error for invalid token format", () => {
      expect(() => parseJWT("invalid")).toThrow(AuthError);
      expect(() => parseJWT("invalid.token")).toThrow(AuthError);
    });

    it("should throw error for missing subject", () => {
      const invalidPayload = btoa(JSON.stringify({ exp: Date.now() / 1000 + 3600 }));
      const token = `header.${invalidPayload}.signature`;
      expect(() => parseJWT(token)).toThrow(AuthError);
    });

    it("should throw error for expired token", () => {
      const expiredPayload = btoa(JSON.stringify({ 
        sub: "user123", 
        exp: Date.now() / 1000 - 3600 // 1 hour ago
      }));
      const token = `header.${expiredPayload}.signature`;
      expect(() => parseJWT(token)).toThrow(AuthError);
    });

    it("should parse valid token", () => {
      const payload = {
        sub: "user123",
        email: "test@example.com",
        roles: ["user"],
        exp: Date.now() / 1000 + 3600, // 1 hour from now
        iat: Date.now() / 1000
      };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;
      
      const result = parseJWT(token);
      expect(result.sub).toBe("user123");
      expect(result.email).toBe("test@example.com");
      expect(result.roles).toEqual(["user"]);
    });
  });

  describe("extractUser", () => {
    it("should extract user from JWT payload", () => {
      const payload = {
        sub: "user123",
        email: "test@example.com",
        roles: ["user", "admin"],
        exp: Date.now() / 1000 + 3600,
        iat: Date.now() / 1000
      };

      const user = extractUser(payload);
      expect(user.id).toBe("user123");
      expect(user.email).toBe("test@example.com");
      expect(user.roles).toEqual(["user", "admin"]);
    });

    it("should handle missing optional fields", () => {
      const payload = {
        sub: "user123",
        exp: Date.now() / 1000 + 3600,
        iat: Date.now() / 1000
      };

      const user = extractUser(payload);
      expect(user.id).toBe("user123");
      expect(user.email).toBeUndefined();
      expect(user.roles).toEqual([]);
    });
  });
});