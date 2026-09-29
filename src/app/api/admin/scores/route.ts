import { isAdminRequest, unauthorizedAdminResponse } from "@/lib/admin-auth";
import { listAdminRuns, listTenants } from "@/lib/db";

export const runtime = "nodejs";

function csvCell(value: string | number | null) {
  const text = value === null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return unauthorizedAdminResponse();
  const url = new URL(request.url);
  const parsedGameId = Number(url.searchParams.get("gameId"));
  const gameId = Number.isInteger(parsedGameId) && parsedGameId > 0 ? parsedGameId : undefined;
  const tenantId = url.searchParams.get("tenant")?.trim() || undefined;
  const format = url.searchParams.get("format");
  const runs = listAdminRuns(gameId, tenantId, format === "csv" ? undefined : 500);

  if (format === "csv") {
    const columns = ["run_id", "game_id", "game_slug", "game_title", "tenant_id", "participant_id", "participant_name", "score", "status", "started_at", "finished_at"] as const;
    const lines = [columns.join(","), ...runs.map((run) => columns.map((column) => csvCell(run[column])).join(","))];
    return new Response(`\uFEFF${lines.join("\r\n")}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="com-arcade-scores.csv"',
        "Cache-Control": "private, no-store",
      },
    });
  }

  return Response.json(
    { runs, tenants: listTenants().map((item) => item.tenant_id) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
