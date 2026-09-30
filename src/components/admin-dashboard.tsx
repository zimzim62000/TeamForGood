"use client";

import { FormEvent, useState } from "react";

type Game = {
  id: number;
  slug: string;
  title: string;
  starts_at: string | null;
  ends_at: string | null;
  is_active: number;
};
type Run = {
  run_id: string;
  game_title: string;
  tenant_id: string;
  participant_name: string;
  score: number | null;
  status: string;
  started_at: number;
};
type ParticipantCount = { tenant_id: string; participant_count: number };
type GameLeaderboardEntry = {
  game_id: number;
  game_slug: string;
  game_title: string;
  tenant_id: string;
  rank: number;
  participant_name: string;
  score: number;
};
type GlobalLeaderboardEntry = {
  tenant_id: string;
  rank: number;
  participant_name: string;
  normalized_score: number;
  raw_score: number;
  games_played: number;
};
type Overview = {
  participantCounts: ParticipantCount[];
  gameLeaderboards: GameLeaderboardEntry[];
  globalLeaderboards: GlobalLeaderboardEntry[];
};

const formatNumber = (value: number) => new Intl.NumberFormat("fr-FR").format(value);

export function AdminDashboard() {
  const [token, setToken] = useState("");
  const [games, setGames] = useState<Game[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [tenants, setTenants] = useState<string[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [gameId, setGameId] = useState("");
  const [tenant, setTenant] = useState("");
  const [message, setMessage] = useState("Saisissez le jeton administrateur.");
  const [connected, setConnected] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  async function loadGames() {
    const response = await fetch("/api/admin/games", { headers, cache: "no-store" });
    if (!response.ok) throw new Error("Jeton refusé ou liste indisponible.");
    const data = await response.json() as { games: Game[] };
    setGames(data.games);
  }

  async function loadOverview() {
    const response = await fetch("/api/admin/overview", { headers, cache: "no-store" });
    if (!response.ok) throw new Error("Tableau de bord indisponible.");
    setOverview(await response.json() as Overview);
  }

  async function loadRuns(selectedGame = gameId, selectedTenant = tenant) {
    const query = new URLSearchParams();
    if (selectedGame) query.set("gameId", selectedGame);
    if (selectedTenant) query.set("tenant", selectedTenant);
    const response = await fetch(`/api/admin/scores?${query}`, { headers, cache: "no-store" });
    if (!response.ok) throw new Error("Résultats indisponibles.");
    const data = await response.json() as { runs: Run[]; tenants: string[] };
    setRuns(data.runs); setTenants(data.tenants);
  }

  async function refresh() {
    try {
      await Promise.all([loadRuns(), loadOverview()]);
      setMessage("Données actualisées.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Actualisation impossible.");
    }
  }

  async function connect(event: FormEvent) {
    event.preventDefault();
    try {
      await Promise.all([loadGames(), loadRuns(), loadOverview()]);
      setConnected(true); setMessage("Administration connectée.");
    } catch (error) {
      setConnected(false); setMessage(error instanceof Error ? error.message : "Connexion impossible.");
    }
  }

  async function createGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const startsAtDate = new Date(String(form.get("startsAt")));
    const endsAtDate = new Date(String(form.get("endsAt")));
    if (!Number.isFinite(startsAtDate.getTime()) || !Number.isFinite(endsAtDate.getTime())) {
      setMessage("Dates invalides."); return;
    }
    const body = {
      slug: form.get("slug"), title: form.get("title"), moduleUrl: form.get("moduleUrl"),
      startsAt: startsAtDate.toISOString(), endsAt: endsAtDate.toISOString(),
      durationSeconds: Number(form.get("durationSeconds")), maxScore: Number(form.get("maxScore")),
    };
    const response = await fetch("/api/admin/games", {
      method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const data = await response.json() as { error?: string };
    if (!response.ok) { setMessage(data.error ?? "Création impossible."); return; }
    formElement.reset(); setMessage("Jeu programmé."); await Promise.all([loadGames(), loadOverview()]);
  }

  async function exportCsv() {
    const query = new URLSearchParams({ format: "csv" });
    if (gameId) query.set("gameId", gameId);
    if (tenant) query.set("tenant", tenant);
    const response = await fetch(`/api/admin/scores?${query}`, { headers });
    if (!response.ok) { setMessage("Export refusé."); return; }
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url; link.download = "com-arcade-scores.csv"; link.click(); URL.revokeObjectURL(url);
  }

  const knownTenants = Array.from(new Set([
    ...tenants,
    ...(overview?.participantCounts.map((item) => item.tenant_id) ?? []),
    ...(overview?.gameLeaderboards.map((item) => item.tenant_id) ?? []),
  ])).sort();
  const participantTotal = overview?.participantCounts.reduce((total, item) => total + item.participant_count, 0) ?? 0;
  const participantByTenant = new Map(overview?.participantCounts.map((item) => [item.tenant_id, item.participant_count]) ?? []);

  return <main className="min-h-screen bg-[#fff8e7] px-4 py-8 text-[#14213d]"><div className="mx-auto max-w-7xl">
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b-4 border-[#14213d] pb-5"><div><p className="font-bold tracking-[.2em] text-[#ff6b35]">COM ARCADE</p><h1 className="text-4xl font-black">ADMINISTRATION</h1></div>{connected && <button type="button" onClick={() => void refresh()} className="bg-[#14213d] px-4 py-3 font-black text-white">ACTUALISER</button>}</header>
    {!connected ? <form onSubmit={connect} className="max-w-xl border-4 border-[#14213d] bg-white p-5 shadow-[8px_8px_0_#ff6b35]"><label className="mb-2 block font-bold" htmlFor="token">JETON ADMINISTRATEUR</label><input id="token" type="password" required value={token} onChange={(event) => setToken(event.target.value)} className="w-full border-2 border-[#14213d] px-3 py-2" /><button className="mt-3 bg-[#14213d] px-5 py-3 font-black text-white">SE CONNECTER</button></form> : <>
      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border-4 border-[#14213d] bg-[#ffd166] p-5 shadow-[6px_6px_0_#14213d]"><p className="text-sm font-black">PARTICIPANTS</p><p className="text-4xl font-black">{formatNumber(participantTotal)}</p><p className="text-xs font-bold">Tous les tenants</p></div>
        {knownTenants.map((tenantId) => <div key={tenantId} className="border-4 border-[#14213d] bg-white p-5 shadow-[6px_6px_0_#ff6b35]"><p className="truncate text-sm font-black">TENANT · {tenantId}</p><p className="text-4xl font-black">{formatNumber(participantByTenant.get(tenantId) ?? 0)}</p><p className="text-xs font-bold">participants</p></div>)}
      </section>

      <section className="mb-8"><div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><p className="font-bold tracking-[.16em] text-[#ff6b35]">PALMARÈS</p><h2 className="text-3xl font-black">TOP 10 GLOBAL</h2></div><p className="max-w-xl text-sm font-bold">Somme de la meilleure partie de chaque jeu, normalisée selon le score maximum de ce jeu.</p></div><div className="grid gap-5 lg:grid-cols-2">
        {knownTenants.map((tenantId) => { const entries = overview?.globalLeaderboards.filter((item) => item.tenant_id === tenantId) ?? []; return <section key={tenantId} className="border-4 border-[#14213d] bg-white p-5 shadow-[7px_7px_0_#14213d]"><h3 className="mb-4 text-xl font-black">{tenantId}</h3>{entries.length ? <ol className="space-y-2">{entries.map((entry) => <li key={`${entry.rank}-${entry.participant_name}`} className="flex items-center justify-between gap-3 border-b-2 border-[#f1e5c7] pb-2"><span><b className="mr-3 text-[#ff6b35]">{entry.rank}</b>{entry.participant_name}</span><span className="text-right font-black">{formatNumber(entry.normalized_score)}<small className="ml-1 block font-normal">{entry.games_played} jeu(x)</small></span></li>)}</ol> : <p className="text-sm">Aucun score enregistré.</p>}</section>; })}
      </div></section>

      <section className="mb-8"><p className="font-bold tracking-[.16em] text-[#ff6b35]">PAR JEU</p><h2 className="mb-4 text-3xl font-black">TOP 10 DE CHAQUE JEU</h2><div className="grid gap-5 lg:grid-cols-2">
        {games.flatMap((item) => knownTenants.map((tenantId) => { const entries = overview?.gameLeaderboards.filter((entry) => entry.game_id === item.id && entry.tenant_id === tenantId) ?? []; return <section key={`${item.id}-${tenantId}`} className="border-4 border-[#14213d] bg-white p-5 shadow-[7px_7px_0_#ff6b35]"><p className="text-xs font-bold text-[#ff6b35]">{tenantId}</p><h3 className="mb-4 text-xl font-black">{item.is_active ? "● " : ""}{item.title}</h3>{entries.length ? <ol className="space-y-2">{entries.map((entry) => <li key={`${entry.rank}-${entry.participant_name}`} className="flex justify-between gap-3 border-b-2 border-[#f1e5c7] pb-2"><span><b className="mr-3 text-[#ff6b35]">{entry.rank}</b>{entry.participant_name}</span><b>{formatNumber(entry.score)} pts</b></li>)}</ol> : <p className="text-sm">Aucun score enregistré.</p>}</section>; }))}
      </div></section>

      <section className="mb-8 grid gap-7 lg:grid-cols-2">
        <section className="border-4 border-[#14213d] bg-white p-5 shadow-[8px_8px_0_#ff6b35]"><h2 className="mb-4 text-2xl font-black">PROGRAMMER UN JEU</h2><p className="mb-4 text-sm">Le dossier du jeu doit d’abord avoir été livré par la CI.</p><form onSubmit={createGame} className="grid gap-3 sm:grid-cols-2"><input name="slug" required pattern="[a-z0-9][a-z0-9-]*" placeholder="jeu-2026-w41" className="border-2 border-[#14213d] px-3 py-2" /><input name="title" required placeholder="Titre du jeu" className="border-2 border-[#14213d] px-3 py-2" /><input name="moduleUrl" required placeholder="/games/jeu/game.js" className="border-2 border-[#14213d] px-3 py-2 sm:col-span-2" /><label className="text-sm font-bold">DÉBUT<input name="startsAt" type="datetime-local" required className="mt-1 w-full border-2 border-[#14213d] px-3 py-2 font-normal" /></label><label className="text-sm font-bold">FIN<input name="endsAt" type="datetime-local" required className="mt-1 w-full border-2 border-[#14213d] px-3 py-2 font-normal" /></label><input name="durationSeconds" type="number" min="20" max="120" defaultValue="45" required aria-label="Durée en secondes" className="border-2 border-[#14213d] px-3 py-2" /><input name="maxScore" type="number" min="1" defaultValue="50000" required aria-label="Score maximum" className="border-2 border-[#14213d] px-3 py-2" /><button className="bg-[#ff6b35] px-5 py-3 font-black text-white sm:col-span-2">PROGRAMMER</button></form></section>
        <section className="border-4 border-[#14213d] bg-white p-5 shadow-[8px_8px_0_#14213d]"><h2 className="mb-4 text-2xl font-black">HISTORIQUE DES PARTIES</h2><div className="mb-4 grid gap-2 sm:grid-cols-2"><select value={gameId} onChange={(event) => setGameId(event.target.value)} className="border-2 border-[#14213d] px-3 py-2"><option value="">Tous les jeux</option>{games.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select><select value={tenant} onChange={(event) => setTenant(event.target.value)} className="border-2 border-[#14213d] px-3 py-2"><option value="">Tous les tenants</option>{knownTenants.map((item) => <option key={item} value={item}>{item}</option>)}</select></div><div className="mb-4 flex flex-wrap gap-2"><button type="button" onClick={() => void refresh()} className="bg-[#14213d] px-4 py-2 font-bold text-white">ACTUALISER</button><button type="button" onClick={() => void exportCsv()} className="bg-[#ffd166] px-4 py-2 font-bold">EXPORT CSV</button></div><div className="max-h-[520px] overflow-auto"><table className="w-full text-left text-sm"><thead><tr><th>Joueur</th><th>Jeu</th><th>Score</th><th>État</th></tr></thead><tbody>{runs.map((run) => <tr key={run.run_id} className="border-t"><td className="py-2">{run.participant_name}<br /><small>{run.tenant_id}</small></td><td>{run.game_title}</td><td>{run.score ?? "—"}</td><td>{run.status}</td></tr>)}</tbody></table></div></section>
      </section>
    </>}
    <p role="status" className="mt-6 font-bold text-[#ff6b35]">{message}</p>
  </div></main>;
}
