import { NextRequest, NextResponse } from "next/server";

const kebunBaseUrl =
  process.env.KEBUN_API_BASE_URL ??
  process.env.NEXT_PUBLIC_KEBUN_API_BASE_URL ??
  "http://localhost:8081";

function buildUpstreamUrl(request: NextRequest, segments?: string[]) {
  const path = segments && segments.length > 0 ? `/${segments.join("/")}` : "";
  const upstream = new URL(`/kebun${path}`, kebunBaseUrl);
  upstream.search = request.nextUrl.search;
  return upstream;
}

async function forward(request: NextRequest, segments?: string[]) {
  const upstreamUrl = buildUpstreamUrl(request, segments);
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
        message:
          "Cannot reach Kebun service. Check if backend is running on http://localhost:8081.",
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
