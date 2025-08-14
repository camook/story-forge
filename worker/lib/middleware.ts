import { Context, Next } from "hono";
import { AuthContext, AuthError, parseJWT, extractUser } from "./auth";

export interface AuthVariables {
  auth: AuthContext;
}

export function authMiddleware() {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header("Authorization");
    
    if (!authHeader) {
      return c.json({ 
        error: "missing_authorization", 
        message: "Authorization header is required" 
      }, 401);
    }

    if (!authHeader.startsWith("Bearer ")) {
      return c.json({ 
        error: "invalid_authorization_format", 
        message: "Authorization header must use Bearer token format" 
      }, 401);
    }

    const token = authHeader.substring(7);
    
    try {
      const payload = parseJWT(token);
      const user = extractUser(payload);
      
      c.set("auth", { user, token });
      await next();
    } catch (error) {
      if (error instanceof AuthError) {
        const errorMap = {
          MISSING_TOKEN: "missing_token",
          INVALID_TOKEN: "invalid_token", 
          EXPIRED_TOKEN: "expired_token",
          MALFORMED_TOKEN: "malformed_token"
        };
        
        return c.json({
          error: errorMap[error.code],
          message: error.message
        }, 401);
      }
      
      console.error("Auth middleware error:", error);
      return c.json({ 
        error: "auth_error", 
        message: "Authentication failed" 
      }, 401);
    }
  };
}

export function securityHeaders() {
  return async (c: Context, next: Next) => {
    await next();
    
    // Content Security Policy for SPA
    c.header("Content-Security-Policy", 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self'; " +
      "font-src 'self'; " +
      "object-src 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'"
    );
    
    // Prevent MIME type sniffing
    c.header("X-Content-Type-Options", "nosniff");
    
    // Referrer policy
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");
    
    // Frame options
    c.header("X-Frame-Options", "DENY");
    
    // XSS protection
    c.header("X-XSS-Protection", "1; mode=block");
  };
}

export function corsPolicy(isDev: boolean = false) {
  const allowedOrigins = isDev 
    ? ["http://localhost:5173", "http://localhost:8787", "http://127.0.0.1:5173", "http://127.0.0.1:8787"]
    : ["https://story-forge.your-domain.com"]; // Replace with actual production domain

  return async (c: Context, next: Next) => {
    const origin = c.req.header("Origin");
    
    if (origin && allowedOrigins.includes(origin)) {
      c.header("Access-Control-Allow-Origin", origin);
    } else if (isDev) {
      // Allow all origins in development
      c.header("Access-Control-Allow-Origin", "*");
    }
    
    c.header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS, POST, PUT, PATCH, DELETE");
    c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    c.header("Access-Control-Allow-Credentials", "true");
    c.header("Access-Control-Max-Age", "86400");
    
    if (c.req.method === "OPTIONS") {
      return new Response("", { status: 204 });
    }
    
    await next();
  };
}