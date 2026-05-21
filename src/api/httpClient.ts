export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

interface RequestOptions extends RequestInit {
  token?: string | null;
}

const tryParseJson = (value: string): unknown | null => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(url, { ...options, headers });
  const contentType = response.headers.get("content-type");
  const contentLength = response.headers.get("content-length");
  const hasBody = response.status !== 204 && contentLength !== "0";
  const rawBody = hasBody ? await response.text() : "";
  const isJson = contentType?.includes("application/json") ?? false;
  const payload = (() => {
    if (!rawBody.trim()) return null;
    if (isJson) return tryParseJson(rawBody);
    if (!response.ok) {
      const parsed = tryParseJson(rawBody);
      if (parsed !== null) return parsed;
    }
    return rawBody;
  })();

  if (!response.ok) {
    const message =
      (typeof payload === "object" &&
        payload !== null &&
        "message" in payload &&
        typeof (payload as Record<string, unknown>).message === "string" &&
        (payload as Record<string, unknown>).message) ||
      (typeof payload === "object" &&
        payload !== null &&
        "error" in payload &&
        typeof (payload as Record<string, unknown>).error === "string" &&
        (payload as Record<string, unknown>).error) ||
      (typeof payload === "string" && payload.trim()) ||
      response.statusText;
    throw new ApiError(response.status, String(message), payload);
  }

  return payload as T;
}
