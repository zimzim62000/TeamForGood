"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

type ScoreRow = { participant_name: string; score: number; played_at: string };
type GameInfo = { id: number; slug: string; title: string; module_url: string; duration_seconds: number; max_score: number };
type GameController = { start(): void; pause(): void; resume(): void; destroy(): void };
type GameKit = {
  run: { start(): void; finish(reason?: string): void; isRunning(): boolean };
  score: { add(points: number): void; set(value: number): void; current(): number };
  ui: { setStatus(text: string): void };
  timers: { timeout(callback: () => void, ms: number): number; interval(callback: () => void, ms: number): number; clear(id: number): void };
  events: { on(target: EventTarget, event: string, handler: EventListener): void };
  assets: { url(relativePath: string): string };
};
type GameModule = { game: { manifest: { id: string; title: string; version: string; durationSeconds: number }; mount(root: HTMLElement, kit: GameKit): GameController } };

const importExternalModule = (url: string) => import(/* webpackIgnore: true */ url) as Promise<GameModule>;

export function Arcade() {
  const [name, setName] = useState("");
  const [game, setGame] = useState<GameInfo | null>(null);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [message, setMessage] = useState("Chargement du jeu…");
  const [playerName, setPlayerName] = useState("");
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const mainRef = useRef<HTMLElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<GameController | null>(null);
  const gameRef = useRef<GameInfo | null>(null);
  const scoreRef = useRef(0);
  const runningRef = useRef(false);
  const runIdRef = useRef<string | null>(null);
  const deadlineRef = useRef(0);
  const finishingRef = useRef(false);
  const cleanupRef = useRef<() => void>(() => undefined);
  const finishRef = useRef<(reason?: string) => void>(() => undefined);
  const sessionRef = useRef<string | null>(null);

  const authHeaders = useCallback((): HeadersInit => {
    const session = sessionRef.current;
    return session ? { Authorization: `Bearer ${session}` } : {};
  }, []);

  const loadLeaderboard = useCallback(async (gameId?: number) => {
    const suffix = gameId ? `?gameId=${gameId}` : "";
    const response = await fetch(`/api/leaderboard${suffix}`, { cache: "no-store", headers: authHeaders() });
    if (!response.ok) throw new Error("Classement indisponible.");
    const data = await response.json() as { scores: ScoreRow[] };
    setScores(data.scores);
  }, [authHeaders]);

  const finish = useCallback(async (reason = "finished") => {
    if (!runningRef.current || finishingRef.current) return;
    finishingRef.current = true;
    runningRef.current = false;
    setRunning(false);
    controllerRef.current?.pause();
    const runId = runIdRef.current;
    if (!runId) return;

    try {
      const response = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ action: "finish", runId, score: scoreRef.current, reason, name }),
      });
      if (!response.ok) throw new Error("Le score a été refusé.");
      setMessage(`Partie terminée — ${scoreRef.current} points enregistrés.`);
      await loadLeaderboard(gameRef.current?.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible d’enregistrer le score.");
    } finally {
      runIdRef.current = null;
      finishingRef.current = false;
    }
  }, [authHeaders, loadLeaderboard, name]);

  finishRef.current = finish;

  useEffect(() => {
    sessionRef.current = new URLSearchParams(window.location.search).get("s");
    setHasSession(Boolean(sessionRef.current));
    let cancelled = false;

    async function initialize() {
      try {
        const response = await fetch("/api/games", { cache: "no-store" });
        if (!response.ok) throw new Error("Aucun jeu actif.");
        const { game: activeGame } = await response.json() as { game: GameInfo };
        const gameModule = await importExternalModule(activeGame.module_url);
        if (!gameModule.game?.manifest || typeof gameModule.game.mount !== "function") throw new Error("Le module de jeu ne respecte pas le GameKit.");
        if (gameModule.game.manifest.id !== activeGame.slug) throw new Error("L’identifiant du module ne correspond pas au jeu actif.");
        if (gameModule.game.manifest.durationSeconds !== activeGame.duration_seconds) throw new Error("La durée du module ne correspond pas à la configuration.");
        if (cancelled || !rootRef.current) return;

        const timers = new Set<number>();
        const listeners: Array<{ target: EventTarget; event: string; handler: EventListener }> = [];
        const moduleBase = new URL(activeGame.module_url, window.location.origin);
        moduleBase.pathname = moduleBase.pathname.replace(/[^/]+$/, "");
        const kit: GameKit = {
          run: {
            start() { if (!runIdRef.current) throw new Error("Aucune session active."); runningRef.current = true; setRunning(true); },
            finish(reason) { void finishRef.current(reason); },
            isRunning() { return runningRef.current; },
          },
          score: {
            add(points) {
              if (!runningRef.current || !Number.isInteger(points) || points <= 0 || points > 10_000) return;
              const next = Math.min(activeGame.max_score, scoreRef.current + points);
              scoreRef.current = next; setScore(next);
            },
            set(value) {
              if (!runningRef.current || !Number.isInteger(value) || value < 0 || value > activeGame.max_score) return;
              scoreRef.current = value; setScore(value);
            },
            current() { return scoreRef.current; },
          },
          ui: { setStatus(text) { setMessage(text.slice(0, 160)); } },
          timers: {
            timeout(callback, ms) { const id = window.setTimeout(() => { timers.delete(id); callback(); }, ms); timers.add(id); return id; },
            interval(callback, ms) { const id = window.setInterval(callback, ms); timers.add(id); return id; },
            clear(id) { window.clearTimeout(id); window.clearInterval(id); timers.delete(id); },
          },
          events: { on(target, event, handler) { target.addEventListener(event, handler); listeners.push({ target, event, handler }); } },
          assets: {
            url(relativePath) {
              if (!relativePath || relativePath.includes("..") || /^[a-z]+:/i.test(relativePath) || relativePath.startsWith("/")) {
                throw new Error("Chemin d’asset refusé.");
              }
              return new URL(`assets/${relativePath.replace(/^assets\//, "")}`, moduleBase).toString();
            },
          },
        };

        const controller = gameModule.game.mount(rootRef.current, kit);
        if (!controller || ["start", "pause", "resume", "destroy"].some((method) => typeof controller[method as keyof GameController] !== "function")) {
          throw new Error("Le contrôleur du jeu est incomplet.");
        }
        controllerRef.current = controller;
        cleanupRef.current = () => {
          controllerRef.current?.destroy();
          timers.forEach((id) => { window.clearTimeout(id); window.clearInterval(id); });
          listeners.forEach(({ target, event, handler }) => target.removeEventListener(event, handler));
          rootRef.current?.replaceChildren();
        };
        gameRef.current = activeGame;
        setGame(activeGame); setSeconds(activeGame.duration_seconds); setReady(true); setMessage("Prêt — lancez une partie.");
        await loadLeaderboard(activeGame.id);
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "Chargement impossible.");
      }
    }

    void initialize();
    return () => { cancelled = true; cleanupRef.current(); };
  }, [loadLeaderboard]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setSeconds(remaining);
      if (remaining === 0) void finishRef.current("time");
    }, 200);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    const onVisibility = () => {
      if (!runningRef.current) return;
      if (document.hidden) controllerRef.current?.pause(); else controllerRef.current?.resume();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    if (window.parent === window) return;
    const notifyParent = () => {
      window.parent.postMessage({ source: "com-arcade", type: "resize", height: Math.ceil(document.documentElement.scrollHeight) }, "*");
    };
    const observer = new ResizeObserver(notifyParent);
    observer.observe(document.documentElement);
    window.addEventListener("resize", notifyParent);
    notifyParent();
    return () => { observer.disconnect(); window.removeEventListener("resize", notifyParent); };
  }, []);

  async function toggleFullscreen() {
    if (focusMode) {
      setFocusMode(false);
      return;
    }
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await (mainRef.current ?? document.documentElement).requestFullscreen();
    } catch {
      setFocusMode(true);
      setMessage("Mode jeu activé.");
    }
  }

  async function start(event?: FormEvent) {
    event?.preventDefault();
    if (!ready || runningRef.current) return;
    if (!sessionRef.current && !name.trim()) { setMessage("Entrez votre prénom ou pseudo avant de jouer en local."); return; }
    setMessage("Création de la partie…");
    try {
      const response = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ action: "start", name }),
      });
      const data = await response.json() as { error?: string; run?: { id: string; deadlineAt: number }; participant?: { name: string } };
      if (!response.ok || !data.run) throw new Error(data.error ?? "Impossible de démarrer.");
      runIdRef.current = data.run.id; deadlineRef.current = data.run.deadlineAt; scoreRef.current = 0;
      setScore(0); setSeconds(gameRef.current?.duration_seconds ?? 0); setPlayerName(data.participant?.name ?? name);
      controllerRef.current?.start();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible de démarrer.");
    }
  }

  return (
    <main ref={mainRef} className={`arcade-bg arcade-page min-h-screen px-4 py-7 sm:px-10 sm:py-10 ${focusMode ? "arcade-focus" : ""} ${showLeaderboard ? "arcade-show-leaderboard" : ""}`}><div className="mx-auto max-w-6xl">
      <header className="arcade-header mb-7 flex flex-col justify-between gap-3 border-b-4 border-[#14213d] pb-5 sm:flex-row sm:items-end"><div><p className="arcade-kicker mb-1 text-sm font-bold tracking-[.22em] text-[#ff6b35]">SERVICE COM · INTRANET</p><h1 className="arcade-title text-4xl font-black tracking-tight sm:text-6xl">COM ARCADE</h1></div><div className="flex items-center gap-3"><p className="arcade-header-copy max-w-sm text-sm font-bold">Un jeu rétro chaque semaine. Une partie courte. Votre meilleur score au classement.</p><button type="button" onClick={() => { setShowLeaderboard((value) => !value); setFocusMode(false); }} className="shrink-0 border-2 border-[#14213d] bg-white px-3 py-2 text-sm font-black" aria-pressed={showLeaderboard}>{showLeaderboard ? "JEU" : "CLASSEMENT"}</button><button type="button" onClick={() => void toggleFullscreen()} className="shrink-0 border-2 border-[#14213d] bg-white px-3 py-2 text-sm font-black" aria-label={isFullscreen || focusMode ? "Réduire la zone de jeu" : "Agrandir la zone de jeu"}>{isFullscreen || focusMode ? "RÉDUIRE" : "AGRANDIR LE JEU"}</button></div></header>
      <section className="arcade-layout grid gap-7 lg:grid-cols-[1.35fr_.65fr]">
        <div className="border-4 border-[#14213d] bg-[#14213d] p-3 shadow-[8px_8px_0_#ff6b35]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-white"><strong>{game?.title ?? "JEU EN CHARGEMENT"}</strong><span className="font-mono">{score} PTS · {seconds.toString().padStart(2, "0")} S</span></div>
          <div className="relative">
          <div ref={rootRef} className="arcade-game-stage aspect-video min-h-[260px] overflow-hidden bg-[#20134b]" aria-label="Zone du jeu" />
          {!running && <form onSubmit={start} className="absolute inset-x-3 bottom-3 flex flex-col gap-3 sm:flex-row">
            {!hasSession && <input aria-label="Prénom ou pseudo local" maxLength={40} value={name} onChange={(event) => setName(event.target.value)} className="min-w-0 flex-1 border-2 border-white bg-white px-3 py-2 text-[#14213d]" placeholder="Prénom / pseudo (mode local)" />}
            <button disabled={!ready || running} className="flex-1 bg-[#ffd166] px-4 py-3 font-black text-[#14213d] disabled:opacity-40">{running ? "PARTIE EN COURS…" : "JOUER"}</button>
          </form>}
          </div>
        </div>
        <aside className="arcade-leaderboard border-4 border-[#14213d] bg-white p-5 shadow-[8px_8px_0_#14213d]">
          <h2 className="mb-1 text-2xl font-black">CLASSEMENT</h2>{playerName && <p className="mb-4 text-sm font-bold text-[#ff6b35]">Session : {playerName}</p>}
          <ol className="space-y-2">{scores.length ? scores.map((item, index) => <li key={`${item.participant_name}-${index}`} className="flex justify-between border-b-2 border-[#f1e5c7] pb-2 font-bold"><span><b className="mr-3 text-[#ff6b35]">{index + 1}</b>{item.participant_name}</span><span>{item.score}</span></li>) : <li className="text-sm">Aucun score pour ce tenant. À vous de jouer.</li>}</ol>
          <p role="status" aria-live="polite" className="mt-6 border-t-2 border-[#14213d] pt-4 text-sm font-bold text-[#ff6b35]">{message}</p>
        </aside>
      </section>
    </div></main>
  );
}
