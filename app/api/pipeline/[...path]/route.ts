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
  if (req.method !== "GET") {
    headers["Content-Type"] = "application/json";
  }
  if (PIPELINE_KEY) {
    headers["Authorization"] = `Bearer ${PIPELINE_KEY}`;
  }

  try {
    const body = req.method !== "GET" ? await req.text() : undefined;
    const res = await fetch(url.toString(), {
      method: req.method,
      headers,
      ...(body ? { body } : {}),
    });

    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
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
