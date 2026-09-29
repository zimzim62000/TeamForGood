import { getActiveGame, listGames } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const includeHistory = new URL(request.url).searchParams.get("history") === "1";
  const game = getActiveGame();
  if (!game) return Response.json({ error: "Aucun jeu actif." }, { status: 404 });
  return Response.json({ game, ...(includeHistory ? { games: listGames() } : {}) });
}
