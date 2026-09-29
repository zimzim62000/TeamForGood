import { createRun, finishRun, getActiveGame } from "@/lib/db";
import { AuthError, resolveParticipant } from "@/lib/auth";

export const runtime = "nodejs";

type RunBody = { action?: unknown; name?: unknown; runId?: unknown; score?: unknown };

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as RunBody | null;
  if (!body) return Response.json({ error: "Corps JSON invalide." }, { status: 400 });

  if (body.action === "start") {
    try {
      const participant = resolveParticipant(request, body.name);
      const game = getActiveGame();
      if (!game) return Response.json({ error: "Aucun jeu actif." }, { status: 404 });
      return Response.json({ run: createRun(game, participant), participant: { name: participant.name } });
    } catch (error) {
      if (error instanceof AuthError) {
        return Response.json({ error: error.message }, { status: 401 });
      }
      throw error;
    }
  }

  if (body.action === "finish") {
    const runId = typeof body.runId === "string" ? body.runId : "";
    const score = typeof body.score === "number" ? body.score : Number.NaN;
    if (!runId) return Response.json({ error: "Session manquante." }, { status: 400 });
    try {
      const participant = resolveParticipant(request, body.name);
      const result = finishRun(runId, score, participant);
      if (!result.ok) {
        const status = result.reason === "not_found" ? 404
          : result.reason === "invalid_score" ? 400
          : result.reason === "forbidden" ? 403 : 409;
        return Response.json({ error: result.reason }, { status });
      }
      return Response.json({ ok: true });
    } catch (error) {
      if (error instanceof AuthError) return Response.json({ error: error.message }, { status: 401 });
      throw error;
    }
  }

  return Response.json({ error: "Action inconnue." }, { status: 400 });
}
