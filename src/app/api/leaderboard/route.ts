import { getActiveGame, leaderboard } from "@/lib/db";
export const runtime = "nodejs";
export async function GET() { const game = getActiveGame(); return Response.json({ game, scores: leaderboard(game.id) }); }
