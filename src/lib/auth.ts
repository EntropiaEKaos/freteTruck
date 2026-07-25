import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users, type User } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";

function getSecret(): string {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === "production") {
    console.warn("AUTH_SECRET nao definido em producao! Gere com: openssl rand -hex 32");
  }
  return "frete-truck-dev-secret-2024";
}
const SECRET = getSecret();
const COOKIE_NAME = "ft_session";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

function sign(value: string): string {
  return createHmac("sha256", SECRET).update(value).digest("hex");
}

export function createSessionToken(userId: number): string {
  const payload = `${userId}.${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

export function parseSessionToken(token: string | undefined): number | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const payload = `${parts[0]}.${parts[1]}`;
  if (sign(payload) !== parts[2]) return null;
  const id = parseInt(parts[0], 10);
  return Number.isNaN(id) ? null : id;
}

// Detecta se estamos em HTTPS (produção/Vercel) ou HTTP (dev local)
function isHttps(): boolean {
  // No Vercel/produção sempre HTTPS. O header x-forwarded-proto é setado pelo proxy.
  // Em dev local ou ambientes sem HTTPS, retornamos false para o cookie funcionar.
  if (process.env.NODE_ENV === "production") return true;
  if (process.env.VERCEL) return true;
  return false;
}

export async function setSessionCookie(userId: number) {
  const store = await cookies();
  const secure = isHttps();
  store.set(COOKIE_NAME, createSessionToken(userId), {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  const secure = isHttps();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const store = await cookies();
    const userId = parseSessionToken(store.get(COOKIE_NAME)?.value);
    if (!userId) return null;
    const rows = await db.select().from(users).where(and(eq(users.id, userId), isNull(users.deletedAt))).limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}
