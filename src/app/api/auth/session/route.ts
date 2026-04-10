import { NextResponse, type NextRequest } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getAuthFromRequest(request);
  return NextResponse.json({ session });
}