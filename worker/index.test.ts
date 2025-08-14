import { describe, it, expect } from "vitest";
import { app, type Env } from "./index";

const dummyEnv = {} as unknown as Env["Bindings"];

describe("Worker core routes", () => {
  it("GET /healthz returns status ok", async () => {
    const res = await app.fetch(new Request("http://localhost/healthz"), dummyEnv);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/application\/json/i);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe("ok");
  });

  it("GET /api/time returns ISO timestamp", async () => {
    const res = await app.fetch(new Request("http://localhost/api/time"), dummyEnv);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { time: string };
    // Basic ISO 8601 check
    expect(typeof data.time).toBe("string");
    expect(() => new Date(data.time)).not.toThrow();
  });
});

