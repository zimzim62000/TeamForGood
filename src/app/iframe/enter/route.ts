import { AuthError, createSessionToken, verifyEntryToken } from "@/lib/auth";
import { upsertUser } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("t");
  if (!token) return new Response("Jeton d’entrée manquant.", { status: 400 });

  try {
    const identity = verifyEntryToken(token);
    upsertUser(identity.tenantId, identity.userId, identity.firstName, identity.lastInitial);
    const session = createSessionToken(identity);
    const publicBaseUrl = process.env.PUBLIC_BASE_URL
      ?? (process.env.NODE_ENV !== "production" ? url.origin : null);
    if (!publicBaseUrl) return new Response("PUBLIC_BASE_URL est absent.", { status: 500 });
    const destination = new URL("/", publicBaseUrl);
    destination.searchParams.set("s", session);
    return new Response(null, {
      status: 303,
      headers: { Location: destination.toString(), "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof AuthError) return new Response(error.message, { status: 401 });
    throw error;
  }
}
