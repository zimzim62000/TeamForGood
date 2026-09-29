import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
const dataDir = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, "arcade.db"));
db.pragma("journal_mode = WAL");
db.exec(`CREATE TABLE IF NOT EXISTS games (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, week_of TEXT NOT NULL, is_active INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP); CREATE TABLE IF NOT EXISTS scores (id INTEGER PRIMARY KEY AUTOINCREMENT, game_id INTEGER NOT NULL REFERENCES games(id), participant_id TEXT NOT NULL, participant_name TEXT NOT NULL, score INTEGER NOT NULL CHECK(score >= 0), played_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP); CREATE INDEX IF NOT EXISTS scores_by_game ON scores(game_id, score DESC, played_at ASC);`);
db.prepare("INSERT OR IGNORE INTO games (slug, title, week_of, is_active) VALUES (?, ?, ?, 1)").run("neon-dodger", "Neon Dodger", new Date().toISOString().slice(0, 10));
export type Game = { id: number; slug: string; title: string; week_of: string; is_active: number };
export type Score = { participant_name: string; score: number; played_at: string };
export function getActiveGame() { return db.prepare("SELECT id, slug, title, week_of, is_active FROM games WHERE is_active = 1 LIMIT 1").get() as Game; }
export function leaderboard(gameId: number) { return db.prepare("SELECT participant_name, MAX(score) AS score, MIN(played_at) AS played_at FROM scores WHERE game_id = ? GROUP BY participant_id, participant_name ORDER BY score DESC, played_at ASC LIMIT 10").all(gameId) as Score[]; }
export function addScore(gameId: number, participantId: string, participantName: string, score: number) { db.prepare("INSERT INTO scores (game_id, participant_id, participant_name, score) VALUES (?, ?, ?, ?)").run(gameId, participantId, participantName, score); }
