import fs from "node:fs";
import path from "node:path";
import { isAdminRequest, unauthorizedAdminResponse } from "@/lib/admin-auth";
import { createScheduledGame, getActiveGame, listGames, type NewGame } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return unauthorizedAdminResponse();
  return Response.json(
    { activeGame: getActiveGame(), games: listGames() },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return unauthorizedAdminResponse();
  const body = await request.json().catch(() => null) as Partial<NewGame> | null;
  if (!body) return Response.json({ error: "Corps JSON invalide." }, { status: 400 });

  const startsAtMs = typeof body.startsAt === "string" ? Date.parse(body.startsAt) : Number.NaN;
  const endsAtMs = typeof body.endsAt === "string" ? Date.parse(body.endsAt) : Number.NaN;
  const game: NewGame = {
    slug: typeof body.slug === "string" ? body.slug.trim() : "",
    title: typeof body.title === "string" ? body.title.trim() : "",
    startsAt: Number.isFinite(startsAtMs) ? new Date(startsAtMs).toISOString() : "",
    endsAt: Number.isFinite(endsAtMs) ? new Date(endsAtMs).toISOString() : "",
    moduleUrl: typeof body.moduleUrl === "string" ? body.moduleUrl.trim() : "",
    durationSeconds: Number(body.durationSeconds),
    maxScore: Number(body.maxScore),
  };

  if (!/^[a-z0-9][a-z0-9-]*$/.test(game.slug) || !game.title || !game.startsAt || !game.endsAt) {
    return Response.json({ error: "Identifiant, titre ou dates invalides." }, { status: 400 });
  }
  if (endsAtMs <= startsAtMs) return Response.json({ error: "La fin doit suivre le début." }, { status: 400 });
  if (!Number.isInteger(game.durationSeconds) || game.durationSeconds < 20 || game.durationSeconds > 120) {
    return Response.json({ error: "La durée doit être comprise entre 20 et 120 secondes." }, { status: 400 });
  }
  if (!Number.isInteger(game.maxScore) || game.maxScore < 1) {
    return Response.json({ error: "Le score maximum doit être un entier positif." }, { status: 400 });
  }
  if (!/^\/games\/[a-z0-9/_-]+\.js$/i.test(game.moduleUrl)) {
    return Response.json({ error: "Le module doit être un chemin local /games/.../game.js." }, { status: 400 });
  }
  if (game.moduleUrl !== `/games/${game.slug}/game.js`) {
    return Response.json({ error: "Le dossier du module doit porter exactement l’identifiant du jeu." }, { status: 400 });
  }

  const publicDirectory = path.resolve(process.cwd(), "public");
  const modulePath = path.resolve(publicDirectory, `.${game.moduleUrl}`);
  if (!modulePath.startsWith(`${publicDirectory}${path.sep}`) || !fs.existsSync(modulePath)) {
    return Response.json({ error: "Le module n’a pas été livré par la CI." }, { status: 400 });
  }

  const result = createScheduledGame(game);
  if (!result.ok) {
    const error = result.reason === "duplicate"
      ? "Cet identifiant a déjà été utilisé."
      : "Cette période chevauche un jeu existant.";
    return Response.json({ error }, { status: 409 });
  }
  return Response.json({ ok: true, id: result.id }, { status: 201 });
}
