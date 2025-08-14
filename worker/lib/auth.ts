export interface User {
  id: string;
  email: string | undefined;
  roles: string[] | undefined;
}

export interface AuthContext {
  user: User;
  token: string;
}

export interface JWTPayload {
  sub: string;
  email?: string;
  roles?: string[];
  exp: number;
  iat: number;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: "MISSING_TOKEN" | "INVALID_TOKEN" | "EXPIRED_TOKEN" | "MALFORMED_TOKEN"
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export function parseJWT(token: string): JWTPayload {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new AuthError("Invalid token format", "MALFORMED_TOKEN");
    }

    const payloadStr = parts[1];
    if (!payloadStr) {
      throw new AuthError("Invalid token format", "MALFORMED_TOKEN");
    }

    const payload = JSON.parse(atob(payloadStr));
    
    if (!payload.sub) {
      throw new AuthError("Token missing subject", "INVALID_TOKEN");
    }

    if (!payload.exp || payload.exp < Date.now() / 1000) {
      throw new AuthError("Token expired", "EXPIRED_TOKEN");
    }

    return payload as JWTPayload;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError("Invalid token format", "MALFORMED_TOKEN");
  }
}

export function extractUser(payload: JWTPayload): User {
  return {
    id: payload.sub,
    email: payload.email,
    roles: payload.roles || []
  };
}