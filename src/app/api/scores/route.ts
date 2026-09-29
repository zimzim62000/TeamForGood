import { addScore, getActiveGame } from "@/lib/db";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { score?: unknown; name?: unknown } | null;
  const score = typeof body?.score === "number" ? Math.floor(body.score) : NaN;
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 40) : "";
  if (!Number.isInteger(score) || score < 0 || score > 999999 || !name) return Response.json({ error: "Score ou nom invalide." }, { status: 400 });
  const participantId = request.headers.get("x-intranet-user-id") ?? name.toLowerCase();
  const participantName = request.headers.get("x-intranet-user-name") ?? name;
  const game = getActiveGame(); addScore(game.id, participantId.slice(0, 100), participantName.slice(0, 40), score);
  return Response.json({ ok: true });
}
