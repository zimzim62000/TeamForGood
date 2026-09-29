import { createHash, timingSafeEqual } from "node:crypto";

export function isAdminRequest(request: Request) {
  const expected = process.env.ADMIN_API_TOKEN;
  const authorization = request.headers.get("authorization") ?? "";
  const received = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!expected || expected.length < 32 || !received) return false;
  const expectedHash = createHash("sha256").update(expected).digest();
  const receivedHash = createHash("sha256").update(received).digest();
  return timingSafeEqual(expectedHash, receivedHash);
}

export function unauthorizedAdminResponse() {
  return Response.json({ error: "Accès administrateur refusé." }, {
    status: 401,
    headers: { "Cache-Control": "no-store", "WWW-Authenticate": "Bearer" },
  });
}
