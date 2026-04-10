import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import type { Role } from "@/generated/prisma";

export const AUTH_COOKIE_NAME = "coachinghub_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationId: string | null;
}

interface AuthSession {
  user: AuthUser;
}

interface TokenPayload {
  name: string;
  email: string;
  role: Role;
  organizationId: string | null;
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is missing");
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(user: AuthUser) {
  return new SignJWT({
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getJwtSecret());
}

async function verifySessionToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify<TokenPayload>(token, getJwtSecret());
    if (!payload.sub || !payload.email || !payload.role || !payload.name) {
      return null;
    }

    return {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      organizationId: payload.organizationId ?? null,
    };
  } catch {
    return null;
  }
}

export function buildAuthCookie(token: string) {
  return {
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export function buildClearedAuthCookie() {
  return {
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}

export async function auth(): Promise<AuthSession | null> {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const user = await verifySessionToken(token);
  if (!user) return null;

  return { user };
}

export async function getAuthFromRequest(request: NextRequest): Promise<AuthSession | null> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const user = await verifySessionToken(token);
  if (!user) return null;

  return { user };
}
