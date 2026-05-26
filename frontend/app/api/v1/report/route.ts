import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.arrayBuffer();
    const contentType = request.headers.get("content-type") || "";
    const cookie = request.headers.get("cookie");

    const backendResponse = await fetch(`${BACKEND_URL}/api/v1/report`, {
      method: "POST",
      headers: {
        "content-type": contentType,
        ...(cookie ? { cookie } : {}),
      },
      body,
    });

    const responseBody = await backendResponse.text();

    return new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: {
        "content-type":
          backendResponse.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    console.error("[/api/v1/report proxy] Error:", error);
    return NextResponse.json(
      { detail: "Proxy error: failed to reach backend." },
      { status: 502 }
    );
  }
}
