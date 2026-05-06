/**
 * app/api/analyze/route.ts
 *
 * Thin Next.js API proxy for POST /api/v1/analyze.
 * This route exists specifically to forward multipart/form-data (including
 * binary screenshot files) to the FastAPI backend without the binary-data
 * corruption that occurs when Next.js rewrites proxy multipart payloads.
 */

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  try {
    // Read the raw body as an ArrayBuffer and forward it verbatim,
    // preserving the original Content-Type header (including multipart boundary).
    const body = await request.arrayBuffer();
    const contentType = request.headers.get("content-type") || "";

    const backendResponse = await fetch(`${BACKEND_URL}/api/v1/analyze`, {
      method: "POST",
      headers: {
        "content-type": contentType,
      },
      body: body,
    });

    const data = await backendResponse.json();

    return NextResponse.json(data, { status: backendResponse.status });
  } catch (err: any) {
    console.error("[/api/analyze proxy] Error:", err);
    return NextResponse.json(
      { detail: "Proxy error: failed to reach backend." },
      { status: 502 }
    );
  }
}
