import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE_NAME = "coachinghub_session";

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return atob(padded);
}

function getTokenRole(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return { isLoggedIn: false, role: null as string | null };

  const parts = token.split(".");
  if (parts.length !== 3) return { isLoggedIn: true, role: null as string | null };

  try {
    const payload = JSON.parse(decodeBase64Url(parts[1])) as { role?: string };
    return { isLoggedIn: true, role: payload.role ?? null };
  } catch {
    return { isLoggedIn: true, role: null as string | null };
  }
}

export async function proxy(request: NextRequest) {
  const { isLoggedIn, role } = getTokenRole(request);
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isDashboard = pathname.startsWith("/dashboard") ||
    pathname.startsWith("/students") ||
    pathname.startsWith("/batches") ||
    pathname.startsWith("/attendance") ||
    pathname.startsWith("/fees") ||
    pathname.startsWith("/exams") ||
    pathname.startsWith("/teachers") ||
    pathname.startsWith("/settings");
  const isAdmin = pathname.startsWith("/admin");
  const isStudentPortal = pathname.startsWith("/student-portal");

  if (!isLoggedIn && (isDashboard || isAdmin || isStudentPortal)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isLoggedIn && isAuthPage) {
    if (role === "STUDENT") return NextResponse.redirect(new URL("/student-portal", request.url));
    if (role === "SUPER_ADMIN") return NextResponse.redirect(new URL("/admin", request.url));
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isAdmin && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (role === "STUDENT" && isDashboard) {
    return NextResponse.redirect(new URL("/student-portal", request.url));
  }

  if (pathname === "/") {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", request.url));
    if (role === "STUDENT") return NextResponse.redirect(new URL("/student-portal", request.url));
    if (role === "SUPER_ADMIN") return NextResponse.redirect(new URL("/admin", request.url));
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};