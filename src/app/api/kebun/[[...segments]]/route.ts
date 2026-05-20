import { NextRequest, NextResponse } from "next/server";

const isProduction = process.env.NODE_ENV === "production";

function getKebunBaseUrl() {
  const configured =
    process.env.KEBUN_API_BASE_URL ?? process.env.NEXT_PUBLIC_KEBUN_API_BASE_URL;
  if (configured && configured.trim().length > 0) return configured;
  if (!isProduction) return "http://localhost:8081";
  return null;
}

function buildUpstreamUrl(request: NextRequest, segments?: string[]) {
  const kebunBaseUrl = getKebunBaseUrl();
  if (!kebunBaseUrl) return null;
  const path = segments && segments.length > 0 ? `/${segments.join("/")}` : "";
  const upstream = new URL(`/kebun${path}`, kebunBaseUrl);
  upstream.search = request.nextUrl.search;
  return upstream;
}

async function forward(request: NextRequest, segments?: string[]) {
  const upstreamUrl = buildUpstreamUrl(request, segments);
  if (!upstreamUrl) {
    return NextResponse.json(
      {
        message:
          "Missing kebun API base URL. Set KEBUN_API_BASE_URL (recommended) or NEXT_PUBLIC_KEBUN_API_BASE_URL.",
      },
      { status: 500 },
    );
  }
  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.text();

  try {
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers: {
        "content-type": request.headers.get("content-type") ?? "application/json",
        authorization: request.headers.get("authorization") ?? "",
      },
      body,
      cache: "no-store",
    });

    const contentType = upstream.headers.get("content-type") ?? "application/json";
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: { "content-type": contentType },
    });
  } catch {
    return NextResponse.json(
      {
        message: "Cannot reach Kebun service. Check your configured KEBUN_API_BASE_URL.",
      },
      { status: 502 },
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ segments?: string[] }> },
) {
  const params = await context.params;
  return forward(request, params.segments);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ segments?: string[] }> },
) {
  const params = await context.params;
  return forward(request, params.segments);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ segments?: string[] }> },
) {
  const params = await context.params;
  return forward(request, params.segments);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ segments?: string[] }> },
) {
  const params = await context.params;
  return forward(request, params.segments);
}
