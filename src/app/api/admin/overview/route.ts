import { isAdminRequest, unauthorizedAdminResponse } from "@/lib/admin-auth";
import { adminOverview } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return unauthorizedAdminResponse();
  return Response.json(adminOverview(), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
