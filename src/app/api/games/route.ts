import { getActiveGame } from "@/lib/db";
export const runtime = "nodejs";
export async function GET() { return Response.json({ game: getActiveGame() }); }
