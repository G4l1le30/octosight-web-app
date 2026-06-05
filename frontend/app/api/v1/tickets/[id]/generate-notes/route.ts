import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const cookie = request.headers.get("cookie");

    const backendResponse = await fetch(
      `${BACKEND_URL}/api/v1/tickets/${id}/generate-notes`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(cookie ? { cookie } : {}),
        },
      }
    );

    const responseBody = await backendResponse.text();
    return new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: {
        "content-type":
          backendResponse.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    console.error("[/api/v1/tickets/[id]/generate-notes proxy] Error:", error);
    return NextResponse.json(
      { detail: "Proxy error: failed to reach backend." },
      { status: 502 }
    );
  }
}
