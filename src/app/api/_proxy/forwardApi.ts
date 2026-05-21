import { NextRequest, NextResponse } from "next/server";

type ProxyRouteContext = {
  params: Promise<{ segments?: string[] }>;
};

type BaseUrlResolver = () => string | null;

type ProxyHandler = (request: NextRequest, context: ProxyRouteContext) => Promise<NextResponse>;

type ForwardApiConfig = {
  resolveBaseUrl: BaseUrlResolver;
  buildPath?: (segments?: string[]) => string;
  missingBaseUrlMessage: string;
  unreachableMessage: string;
};

type ForwardApiHandlers = Readonly<{
  GET: ProxyHandler;
  POST: ProxyHandler;
  PUT: ProxyHandler;
  DELETE: ProxyHandler;
}>;

function defaultBuildPath(segments?: string[]) {
  return segments && segments.length > 0 ? `/${segments.join("/")}` : "";
}

function buildUpstreamUrl(
  request: NextRequest,
  segments: string[] | undefined,
  config: ForwardApiConfig,
) {
  const baseUrl = config.resolveBaseUrl();
  if (!baseUrl) return null;

  const path = config.buildPath ? config.buildPath(segments) : defaultBuildPath(segments);
  const upstream = new URL(path, baseUrl);
  upstream.search = request.nextUrl.search;
  return upstream;
}

async function forwardRequest(
  request: NextRequest,
  context: ProxyRouteContext,
  config: ForwardApiConfig,
) {
  const params = await context.params;
  const upstreamUrl = buildUpstreamUrl(request, params.segments, config);

  if (!upstreamUrl) {
    return NextResponse.json({ message: config.missingBaseUrlMessage }, { status: 500 });
  }

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.text();

  const headers = {
    "content-type": request.headers.get("content-type") ?? "application/json",
    authorization: request.headers.get("authorization") ?? "",
  };

  try {
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });

    const contentType = upstream.headers.get("content-type") ?? "application/json";
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: { "content-type": contentType },
    });
  } catch {
    return NextResponse.json({ message: config.unreachableMessage }, { status: 502 });
  }
}

export function createForwardApiHandlers(config: ForwardApiConfig): ForwardApiHandlers {
  return {
    GET: (request, context) => forwardRequest(request, context, config),
    POST: (request, context) => forwardRequest(request, context, config),
    PUT: (request, context) => forwardRequest(request, context, config),
    DELETE: (request, context) => forwardRequest(request, context, config),
  };
}
