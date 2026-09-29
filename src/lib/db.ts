import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import gameCatalog from "@/config/games.json";

const dataDir = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "arcade.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

function hasColumn(table: string, column: string) {
  return (db.pragma(`table_info(${table})`) as Array<{ name: string }>).some(
    (item) => item.name === column,
  );
}

const migrate = db.transaction(() => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      week_of TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL REFERENCES games(id),
      participant_id TEXT NOT NULL,
      participant_name TEXT NOT NULL,
      score INTEGER NOT NULL CHECK(score >= 0),
      played_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrations additives : elles préservent les bases déjà créées par le prototype.
  if (!hasColumn("games", "module_url")) {
    db.exec("ALTER TABLE games ADD COLUMN module_url TEXT NOT NULL DEFAULT '/games/demo/game.js'");
  }
  if (!hasColumn("games", "duration_seconds")) {
    db.exec("ALTER TABLE games ADD COLUMN duration_seconds INTEGER NOT NULL DEFAULT 30");
  }
  if (!hasColumn("games", "max_score")) {
    db.exec("ALTER TABLE games ADD COLUMN max_score INTEGER NOT NULL DEFAULT 100000");
  }
  if (!hasColumn("games", "starts_at")) {
    db.exec("ALTER TABLE games ADD COLUMN starts_at TEXT");
  }
  if (!hasColumn("games", "ends_at")) {
    db.exec("ALTER TABLE games ADD COLUMN ends_at TEXT");
  }
  if (!hasColumn("scores", "run_id")) {
    db.exec("ALTER TABLE scores ADD COLUMN run_id TEXT");
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      game_id INTEGER NOT NULL REFERENCES games(id),
      tenant_id TEXT NOT NULL DEFAULT 'local',
      participant_id TEXT NOT NULL,
      participant_name TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      deadline_at INTEGER NOT NULL,
      finished_at INTEGER,
      status TEXT NOT NULL DEFAULT 'running' CHECK(status IN ('running', 'finished', 'expired'))
    );
    CREATE INDEX IF NOT EXISTS scores_by_game ON scores(game_id, score DESC, played_at ASC);
    CREATE UNIQUE INDEX IF NOT EXISTS one_score_per_run ON scores(run_id) WHERE run_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS runs_by_game ON runs(game_id, started_at DESC);
  `);
  if (!hasColumn("runs", "tenant_id")) {
    db.exec("ALTER TABLE runs ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'local'");
  }
  if (!hasColumn("scores", "tenant_id")) {
    db.exec("ALTER TABLE scores ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'local'");
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      tenant_id TEXT NOT NULL,
      external_id TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_initial TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (tenant_id, external_id)
    );
  `);

  db.exec(`
    UPDATE games
    SET is_active = 0
    WHERE is_active = 1
      AND id <> (SELECT id FROM games WHERE is_active = 1 ORDER BY id DESC LIMIT 1);
    CREATE UNIQUE INDEX IF NOT EXISTS one_active_game ON games(is_active) WHERE is_active = 1;
  `);

});

type CatalogGame = {
  slug: string;
  title: string;
  startsAt: string;
  endsAt: string;
  moduleUrl: string;
  durationSeconds: number;
  maxScore: number;
};

function validateCatalog(catalog: CatalogGame[]) {
  const slugs = new Set<string>();
  const sorted = [...catalog].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  for (const item of sorted) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(item.slug) || slugs.has(item.slug)) throw new Error(`Identifiant de jeu invalide ou dupliqué : ${item.slug}`);
    if (!item.title.trim()) throw new Error(`Titre manquant pour ${item.slug}`);
    if (!/^\/games\/[a-z0-9/_-]+\.js$/i.test(item.moduleUrl)) throw new Error(`Module local invalide pour ${item.slug}`);
    if (!Number.isInteger(item.durationSeconds) || item.durationSeconds < 20 || item.durationSeconds > 120) throw new Error(`Durée invalide pour ${item.slug}`);
    if (!Number.isInteger(item.maxScore) || item.maxScore < 1) throw new Error(`Score maximum invalide pour ${item.slug}`);
    const start = Date.parse(item.startsAt);
    const end = Date.parse(item.endsAt);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) throw new Error(`Dates invalides pour ${item.slug}`);
    slugs.add(item.slug);
  }
  for (let index = 1; index < sorted.length; index += 1) {
    if (Date.parse(sorted[index].startsAt) < Date.parse(sorted[index - 1].endsAt)) {
      throw new Error(`Les diffusions ${sorted[index - 1].slug} et ${sorted[index].slug} se chevauchent.`);
    }
  }
}

const syncCatalog = db.transaction((catalog: CatalogGame[]) => {
  validateCatalog(catalog);
  const findExisting = db.prepare("SELECT module_url FROM games WHERE slug = ?");
  const upsert = db.prepare(`
    INSERT INTO games (
      slug, title, week_of, is_active, module_url, duration_seconds, max_score, starts_at, ends_at
    ) VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      title = excluded.title,
      week_of = excluded.week_of,
      module_url = excluded.module_url,
      duration_seconds = excluded.duration_seconds,
      max_score = excluded.max_score,
      starts_at = excluded.starts_at,
      ends_at = excluded.ends_at
  `);
  for (const item of catalog) {
    const existing = findExisting.get(item.slug) as { module_url: string } | undefined;
    if (existing && existing.module_url !== item.moduleUrl) {
      throw new Error(`L’identifiant ${item.slug} existe déjà avec un autre module et ne peut pas être réutilisé.`);
    }
    upsert.run(
      item.slug,
      item.title,
      item.startsAt.slice(0, 10),
      item.moduleUrl,
      item.durationSeconds,
      item.maxScore,
      new Date(item.startsAt).toISOString(),
      new Date(item.endsAt).toISOString(),
    );
  }
});

// Next.js charge les routes dans plusieurs workers pendant le build. La base
// persistante ne doit être migrée/synchronisée qu'au runtime du conteneur.
const isNextBuild = process.env.npm_lifecycle_event === "build";
if (!isNextBuild) {
  migrate();
  syncCatalog(gameCatalog as CatalogGame[]);
}

export type Game = {
  id: number;
  slug: string;
  title: string;
  week_of: string;
  is_active: number;
  module_url: string;
  duration_seconds: number;
  max_score: number;
  starts_at: string | null;
  ends_at: string | null;
};

export type Score = {
  participant_name: string;
  score: number;
  played_at: string;
};

export type Participant = { tenantId: string; id: string; name: string };

export function getActiveGame() {
  const now = new Date().toISOString();
  const overrideSlug = process.env.GAME_OVERRIDE_SLUG?.trim();
  const scheduled = overrideSlug
    ? db.prepare("SELECT id FROM games WHERE slug = ? LIMIT 1").get(overrideSlug) as { id: number } | undefined
    : db.prepare(`
        SELECT id FROM games
        WHERE starts_at <= ? AND ends_at > ?
        ORDER BY starts_at DESC, id DESC
        LIMIT 1
      `).get(now, now) as { id: number } | undefined;
  const current = db.prepare("SELECT id FROM games WHERE is_active = 1 LIMIT 1").get() as { id: number } | undefined;
  if (current?.id !== scheduled?.id) {
    const activate = db.transaction(() => {
      db.prepare("UPDATE games SET is_active = 0 WHERE is_active = 1").run();
      if (scheduled) db.prepare("UPDATE games SET is_active = 1 WHERE id = ?").run(scheduled.id);
    });
    activate();
  }
  return (db.prepare(`
    SELECT id, slug, title, week_of, is_active, module_url, duration_seconds, max_score, starts_at, ends_at
    FROM games WHERE is_active = 1 LIMIT 1
  `).get() as Game | undefined) ?? null;
}

export function listGames() {
  return db.prepare(`
    SELECT id, slug, title, week_of, is_active, module_url, duration_seconds, max_score, starts_at, ends_at
    FROM games ORDER BY week_of DESC, id DESC
  `).all() as Game[];
}

export type NewGame = {
  slug: string;
  title: string;
  startsAt: string;
  endsAt: string;
  moduleUrl: string;
  durationSeconds: number;
  maxScore: number;
};

export type CreateGameResult =
  | { ok: true; id: number }
  | { ok: false; reason: "duplicate" | "overlap" };

export const createScheduledGame = db.transaction((game: NewGame): CreateGameResult => {
  if (db.prepare("SELECT id FROM games WHERE slug = ?").get(game.slug)) {
    return { ok: false, reason: "duplicate" };
  }
  const overlap = db.prepare(`
    SELECT slug FROM games
    WHERE starts_at IS NOT NULL AND ends_at IS NOT NULL
      AND starts_at < ? AND ends_at > ?
    LIMIT 1
  `).get(game.endsAt, game.startsAt);
  if (overlap) return { ok: false, reason: "overlap" };
  const result = db.prepare(`
    INSERT INTO games (
      slug, title, week_of, is_active, module_url, duration_seconds, max_score, starts_at, ends_at
    ) VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?)
  `).run(
    game.slug,
    game.title,
    game.startsAt.slice(0, 10),
    game.moduleUrl,
    game.durationSeconds,
    game.maxScore,
    game.startsAt,
    game.endsAt,
  );
  return { ok: true, id: Number(result.lastInsertRowid) };
});

export type AdminRun = {
  run_id: string;
  game_id: number;
  game_slug: string;
  game_title: string;
  tenant_id: string;
  participant_id: string;
  participant_name: string;
  score: number | null;
  status: string;
  started_at: number;
  finished_at: number | null;
};

export function listAdminRuns(gameId?: number, tenantId?: string, limit?: number) {
  const filters: string[] = [];
  const parameters: Array<number | string> = [];
  if (gameId) { filters.push("runs.game_id = ?"); parameters.push(gameId); }
  if (tenantId) { filters.push("runs.tenant_id = ?"); parameters.push(tenantId); }
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const limitClause = limit ? "LIMIT ?" : "";
  if (limit) parameters.push(limit);
  return db.prepare(`
    SELECT runs.id AS run_id, runs.game_id, games.slug AS game_slug, games.title AS game_title,
      runs.tenant_id, runs.participant_id, runs.participant_name, scores.score,
      runs.status, runs.started_at, runs.finished_at
    FROM runs
    JOIN games ON games.id = runs.game_id
    LEFT JOIN scores ON scores.run_id = runs.id
    ${where}
    ORDER BY runs.started_at DESC
    ${limitClause}
  `).all(...parameters) as AdminRun[];
}

export function listTenants() {
  return db.prepare(`
    SELECT tenant_id FROM users
    UNION SELECT tenant_id FROM runs
    ORDER BY tenant_id
  `).all() as Array<{ tenant_id: string }>;
}

export function leaderboard(gameId: number, tenantId: string) {
  return db.prepare(`
    WITH ranked AS (
      SELECT participant_id, participant_name, score, played_at,
        ROW_NUMBER() OVER (
          PARTITION BY participant_id
          ORDER BY score DESC, played_at ASC, id ASC
        ) AS position
      FROM scores
      WHERE game_id = ? AND tenant_id = ?
    )
    SELECT participant_name, score, played_at
    FROM ranked
    WHERE position = 1
    ORDER BY score DESC, played_at ASC
    LIMIT 10
  `).all(gameId, tenantId) as Score[];
}

export function upsertUser(tenantId: string, externalId: string, firstName: string, lastInitial: string) {
  db.prepare(`
    INSERT INTO users (tenant_id, external_id, first_name, last_initial)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(tenant_id, external_id) DO UPDATE SET
      first_name = excluded.first_name,
      last_initial = excluded.last_initial,
      updated_at = CURRENT_TIMESTAMP
  `).run(tenantId, externalId, firstName, lastInitial);
}

export function createRun(game: Game, participant: Participant) {
  const id = randomUUID();
  const startedAt = Date.now();
  const deadlineAt = startedAt + game.duration_seconds * 1000;
  db.prepare(`
    INSERT INTO runs (id, game_id, tenant_id, participant_id, participant_name, started_at, deadline_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, game.id, participant.tenantId, participant.id, participant.name, startedAt, deadlineAt);
  return { id, startedAt, deadlineAt };
}

type RunRow = {
  id: string;
  game_id: number;
  tenant_id: string;
  participant_id: string;
  participant_name: string;
  deadline_at: number;
  status: "running" | "finished" | "expired";
  max_score: number;
};

export type FinishRunResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "already_finished" | "expired" | "invalid_score" | "forbidden" };

export const finishRun = db.transaction((runId: string, score: number, participant: Participant): FinishRunResult => {
  const run = db.prepare(`
    SELECT runs.id, runs.game_id, runs.tenant_id, runs.participant_id, runs.participant_name,
      runs.deadline_at, runs.status, games.max_score
    FROM runs JOIN games ON games.id = runs.game_id
    WHERE runs.id = ?
  `).get(runId) as RunRow | undefined;

  if (!run) return { ok: false, reason: "not_found" };
  if (run.tenant_id !== participant.tenantId || run.participant_id !== participant.id) {
    return { ok: false, reason: "forbidden" };
  }
  if (run.status !== "running") return { ok: false, reason: "already_finished" };
  if (!Number.isInteger(score) || score < 0 || score > run.max_score) {
    return { ok: false, reason: "invalid_score" };
  }

  const finishedAt = Date.now();
  if (finishedAt > run.deadline_at + 10_000) {
    db.prepare("UPDATE runs SET status = 'expired', finished_at = ? WHERE id = ?").run(finishedAt, runId);
    return { ok: false, reason: "expired" };
  }

  db.prepare("UPDATE runs SET status = 'finished', finished_at = ? WHERE id = ? AND status = 'running'")
    .run(finishedAt, runId);
  db.prepare(`
    INSERT INTO scores (game_id, tenant_id, participant_id, participant_name, score, run_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(run.game_id, run.tenant_id, run.participant_id, run.participant_name, score, run.id);
  return { ok: true };
});
