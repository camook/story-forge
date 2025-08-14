export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

export async function apiFetch<T>(input: RequestInfo, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("accept")) headers.set("accept", "application/json");
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");

  const res = await fetch(input, { ...init, headers });

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    let payload: unknown = undefined;
    try {
      payload = isJson ? await res.json() : await res.text();
    } catch {
      // swallow
    }
    const err: ApiError = {
      status: res.status,
      message: typeof payload === "object" && payload !== null && "error" in (payload as any)
        ? String((payload as any).error)
        : res.statusText || "Request failed",
      details: payload,
    };
    throw err;
  }

  if (!isJson) {
    throw { status: 500, message: "Invalid content-type; expected JSON" } satisfies ApiError;
  }

  return (await res.json()) as T;
}
