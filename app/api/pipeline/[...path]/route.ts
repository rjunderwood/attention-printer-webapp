import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const PIPELINE_URL = process.env.PIPELINE_API_URL || "http://localhost:5000";
const PIPELINE_KEY = process.env.PIPELINE_API_KEY || "";

async function proxyRequest(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path } = await params;
  const apiPath = `/api/${path.join("/")}`;
  const url = new URL(apiPath, PIPELINE_URL);

  // Forward query params
  req.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const headers: Record<string, string> = {};
  const contentType = req.headers.get("content-type") || "";
  const isMultipart = contentType.includes("multipart/form-data");

  if (req.method !== "GET" && !isMultipart) {
    headers["Content-Type"] = "application/json";
  }
  if (isMultipart) {
    headers["Content-Type"] = contentType;
  }
  if (PIPELINE_KEY) {
    headers["Authorization"] = `Bearer ${PIPELINE_KEY}`;
  }

  try {
    let body: ArrayBuffer | string | undefined;
    if (req.method !== "GET") {
      if (isMultipart) {
        body = await req.arrayBuffer();
      } else {
        body = await req.text();
      }
    }
    const res = await fetch(url.toString(), {
      method: req.method,
      headers,
      ...(body ? { body } : {}),
    });

    const resContentType = res.headers.get("content-type") || "";
    if (resContentType.includes("application/json") || !resContentType) {
      const data = await res.text();
      return new NextResponse(data, {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    const data = await res.arrayBuffer();
    return new NextResponse(data, {
      status: res.status,
      headers: { "Content-Type": resContentType },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to pipeline API" },
      { status: 502 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const DELETE = proxyRequest;
