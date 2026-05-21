import { ApiError, request } from "./httpClient";

const createResponse = ({
  ok,
  status,
  statusText,
  contentType,
  contentLength,
  body,
}: {
  ok: boolean;
  status: number;
  statusText: string;
  contentType?: string;
  contentLength?: string;
  body: string;
}) =>
  ({
    ok,
    status,
    statusText,
    headers: {
      get: (key: string) => {
        if (key.toLowerCase() === "content-type") return contentType ?? null;
        if (key.toLowerCase() === "content-length") return contentLength ?? null;
        return null;
      },
    },
    text: async () => body,
  }) as Response;

describe("request", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete (globalThis as { fetch?: typeof fetch }).fetch;
  });

  it("does not throw when DELETE returns 204 with empty body", async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      createResponse({ ok: true, status: 204, statusText: "No Content", contentLength: "0", body: "" }),
    );
    globalThis.fetch = fetchMock as typeof fetch;

    await expect(request<void>("/api/kebun/KBN001", { method: "DELETE" })).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws ApiError with fallback message when body is empty and not ok", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      createResponse({ ok: false, status: 403, statusText: "Forbidden", contentLength: "0", body: "" }),
    );

    await expect(request("/api/kebun/KBN001", { method: "DELETE" })).rejects.toEqual(
      expect.objectContaining<ApiError>({
        status: 403,
        message: "Forbidden",
      }),
    );
  });
});
