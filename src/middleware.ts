import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;
  const role = session?.user?.role;

  const isAuthPage = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");
  const isDashboard = nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/students") ||
    nextUrl.pathname.startsWith("/batches") ||
    nextUrl.pathname.startsWith("/attendance") ||
    nextUrl.pathname.startsWith("/fees") ||
    nextUrl.pathname.startsWith("/exams") ||
    nextUrl.pathname.startsWith("/teachers") ||
    nextUrl.pathname.startsWith("/settings");
  const isAdmin = nextUrl.pathname.startsWith("/admin");
  const isStudentPortal = nextUrl.pathname.startsWith("/student-portal");

  // Redirect unauthenticated users to login
  if (!isLoggedIn && (isDashboard || isAdmin || isStudentPortal)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Redirect authenticated users away from auth pages
  if (isLoggedIn && isAuthPage) {
    if (role === "STUDENT") return NextResponse.redirect(new URL("/student-portal", req.url));
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Super admin only
  if (isAdmin && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Students can only access student portal
  if (role === "STUDENT" && isDashboard) {
    return NextResponse.redirect(new URL("/student-portal", req.url));
  }

  // Root redirect
  if (nextUrl.pathname === "/") {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", req.url));
    if (role === "STUDENT") return NextResponse.redirect(new URL("/student-portal", req.url));
    if (role === "SUPER_ADMIN") return NextResponse.redirect(new URL("/admin", req.url));
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
