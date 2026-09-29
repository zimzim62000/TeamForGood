import { getActiveGame, leaderboard } from "@/lib/db";
import { AuthError, resolveTenant } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const activeGame = getActiveGame();
  const requestedGameId = Number(new URL(request.url).searchParams.get("gameId"));
  const gameId = Number.isInteger(requestedGameId) && requestedGameId > 0
    ? requestedGameId
    : activeGame?.id;
  if (!gameId) return Response.json({ error: "Aucun jeu disponible." }, { status: 404 });
  try {
    return Response.json(
      { game: activeGame, gameId, scores: leaderboard(gameId, resolveTenant(request)) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof AuthError) return Response.json({ error: error.message }, { status: 401 });
    throw error;
  }
}
