import { NextResponse } from "next/server";
import { buildClearedAuthCookie } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(buildClearedAuthCookie());
  return response;
}