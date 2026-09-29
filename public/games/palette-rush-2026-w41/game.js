// Palette Rush — module COM Arcade (contrat GAMEKIT v1)
// Aucune dépendance externe : DOM + Canvas 2D + Web Audio API natifs uniquement.
"use strict";

const W = 960, H = 540; // résolution logique 16:9
const DURATION = 30; // secondes — doit correspondre à la config COM Arcade

const COL_W = 90;
const PLAYER_X = 210;
const GRAVITY = 1150;
const FLAP_V = -300;
const MAX_FALL = 480;
const TOP_BOUND = 34, BOT_BOUND = H - 16;
const PLAYER_RY = 17, PLAYER_RX = 19;
const SPAWN_INTERVAL = 1.15; // cadence fixe : la variance vient de la position du couloir, pas du timing
const GAP_H_START = 210, GAP_H_END = 142;
const SPEED_START = 250, SPEED_END = 410;
const SCORE_PER_COLUMN = 10;
const SCORE_PER_FRUIT = 30;

const FRUITS = ["\u{1F34E}", "\u{1F34C}", "\u{1F347}", "\u{1F349}", "\u{1F955}", "\u{1F345}", "\u{1F346}", "\u{1F966}", "\u{1F34D}", "\u{1F352}", "\u{1F34B}", "\u{1F33D}"];

// Thème actif pour cette édition : diffusion 5→12 oct. 2026 = Octobre Rose.
const CAMPAIGN = "rose"; // "rose" | "movember"
const THEME = {
  rose: { label: "Octobre Rose & Movember", accessory: "ribbon", accent: "#69acdf" },
  movember: { label: "Octobre Rose & Movember", accessory: "moustache", accent: "#69acdf" }
}[CAMPAIGN];

// Contenu de sensibilisation mélangé (femmes + hommes), tiré sans répétition avant
// d'avoir fait le tour complet (sac mélangé, en mémoire pour la durée du module).
const CAPSULES = [
  { type: "stat", text: "1 femme sur 8 sera touchée par un cancer du sein au cours de sa vie." },
  { type: "stat", text: "61 214 nouveaux cas de cancer du sein sont diagnostiqués chaque année en France : le cancer le plus fréquent chez la femme." },
  { type: "stat", text: "Détecté tôt, le cancer du sein se guérit dans 9 cas sur 10." },
  { type: "stat", text: "Le cancer du sein reste la 1ère cause de décès par cancer chez la femme, avec près de 12 500 décès par an en France." },
  { type: "stat", text: "Seulement 47,5% des femmes concernées participent au dépistage organisé, pourtant gratuit et recommandé tous les 2 ans de 50 à 74 ans." },
  { type: "stat", text: "L'alcool est responsable d'environ 17% des cancers du sein, même en consommation modérée mais régulière." },
  { type: "stat", text: "Près de 5% des femmes touchées par un cancer du sein ont moins de 40 ans, soit environ 3 000 femmes par an en France." },
  { type: "fact", text: "La mammographie de dépistage est prise en charge à 100% par l'Assurance Maladie, tous les 2 ans, de 50 à 74 ans." },
  { type: "fact", text: "Près de 80% des cancers du sein surviennent après 50 ans, d'où l'âge du dépistage organisé, mais la vigilance reste de mise avant." },
  { type: "fact", text: "Le cancer du sein peut aussi toucher les hommes, même si c'est rare (moins de 1% des cas)." },
  { type: "fact", text: "Le tabac augmente aussi le risque de cancer du sein, y compris en cas de tabagisme passif." },
  { type: "fact", text: "Chez les femmes jeunes, les seins sont souvent plus denses, ce qui peut rendre la mammographie moins performante : un changement doit toujours être signalé à un médecin." },
  { type: "myth", claim: "Pas de symptôme, pas de danger.", reality: "Un cancer du sein peut se développer plusieurs années sans aucun signe visible, d'où l'intérêt du dépistage régulier." },
  { type: "myth", claim: "L'autopalpation suffit à se rassurer.", reality: "Elle aide à mieux se connaître, mais ne remplace jamais une mammographie." },
  { type: "myth", claim: "Sans antécédent familial, je ne risque rien.", reality: "Seuls 5 à 10% des cancers du sein sont liés à une prédisposition génétique héréditaire connue." },
  { type: "myth", claim: "La mammographie est dangereuse à cause des rayons.", reality: "Les doses utilisées sont très faibles ; les bénéfices d'une détection précoce dépassent largement ce risque théorique." },
  { type: "myth", claim: "Porter un soutien-gorge, avec armature, augmente le risque de cancer du sein.", reality: "Aucune étude sérieuse ne montre de lien." },
  { type: "myth", claim: "Les déodorants provoquent le cancer du sein.", reality: "Aucune étude menée chez l'humain n'a montré de lien : un mythe sans fondement scientifique." },
  { type: "stat", text: "Le cancer de la prostate est le cancer le plus fréquent chez l'homme en France : environ 59 900 nouveaux cas estimés en 2018 (dernière année disponible, INCa)." },
  { type: "stat", text: "En France, environ 8 100 hommes meurent chaque année d'un cancer de la prostate (estimations de mortalité 2018, INCa)." },
  { type: "stat", text: "Le cancer du testicule touche surtout les hommes jeunes de 15 à 35 ans, avec environ 3 000 nouveaux cas par an en France." },
  { type: "stat", text: "Le taux de survie à 5 ans du cancer du testicule dépasse 95% tous stades confondus." },
  { type: "stat", text: "Près de 3 décès par suicide sur 4 concernent des hommes en France : en 2023, ils représentaient 75,1% des décès par suicide." },
  { type: "stat", text: "Le taux de suicide chez les hommes est environ 3 fois supérieur à celui des femmes (20,8 pour 100 000 hommes contre 6,3 pour les femmes en 2022)." },
  { type: "stat", text: "En 2024, 4,8% des hommes adultes déclaraient avoir eu des pensées suicidaires au cours des 12 derniers mois." },
  { type: "stat", text: "Seuls 25% des hommes en France ont déjà consulté un psychologue ou un psychothérapeute." },
  { type: "stat", text: "L'OMS recommande aux adultes 150 à 300 minutes d'activité physique modérée par semaine, ou l'équivalent en intensité soutenue." },
  { type: "stat", text: "Movember est né en 2003 à Melbourne avec 30 participants : le mouvement rassemble aujourd'hui plus de 6 millions de personnes dans le monde." },
  { type: "fact", text: "L'auto-examen des testicules ne prend qu'une minute sous la douche, une fois par mois : on cherche une bosse, une zone dure, un changement de taille ou de poids." },
  { type: "fact", text: "Une grosseur ou une douleur inhabituelle au niveau d'un testicule mérite d'être vérifiée : connaître ce qui est habituel pour son corps aide à repérer un changement." },
  { type: "fact", text: "1 homme sur 8 déclare souffrir de troubles psychiques en France : en parler à un proche ou un professionnel est un premier pas qui compte." },
  { type: "fact", text: "Le 3114 est le numéro national de prévention du suicide : gratuit, confidentiel, disponible 24h/24, pour soi ou pour un proche inquiet." },
  { type: "fact", text: "56% des hommes estiment que la santé mentale masculine reste un sujet tabou en France." },
  { type: "fact", text: "Bouger protège aussi la santé mentale : l'activité physique régulière aide à réduire les symptômes d'anxiété et de dépression." },
  { type: "fact", text: "Un changement inhabituel n'est pas forcément grave, mais il mérite parfois une consultation : une boule, une douleur persistante ou des troubles urinaires qui durent sont de bonnes raisons d'en parler à un professionnel." },
  { type: "fact", text: "Depuis sa création, Movember a permis de récolter plus de 1,2 milliard d'euros pour plus de 1 250 projets de recherche sur la santé masculine." },
  { type: "myth", claim: "Il faut absolument se faire dépister la prostate par prise de sang (PSA) dès 50 ans.", reality: "Aucune autorité de santé française ne recommande ce dépistage systématique sans symptôme : la bonne démarche est d'en discuter avec son médecin." },
  { type: "myth", claim: "Le cancer du testicule touche surtout les hommes âgés.", reality: "C'est l'un des rares cancers qui touche en majorité les hommes jeunes, entre 15 et 35 ans." },
  { type: "myth", claim: "Parler de sa santé mentale, c'est un signe de faiblesse.", reality: "Demander de l'aide est un acte de courage, pas un aveu d'échec." },
  { type: "myth", claim: "Les hommes se suicident moins que les femmes.", reality: "C'est l'inverse : ils représentent environ 3 suicides sur 4 en France." }
];
const CAPSULE_LABELS = { stat: "Chiffre clé", fact: "Le saviez-vous ?", myth: "Idée reçue" };

// Logo Primever (tracé vectoriel officiel, version blanche) — dessiné via Path2D, sans asset externe.
const LOGO_D = [
  "M20.7,84.4h24.3c20,0,40.1,2.1,40.1,25.1s-18.5,34.2-40.5,34.2h-12.4l-6.8,31.8H1.1l19.6-91.1ZM35.8,126.4h6.5c9.7,0,18.4-3.4,18.4-14.2s-6-10.6-12.5-10.6h-7.2l-5.2,24.8Z",
  "M101.6,84.4h29.1c17.4.1,38.2.7,38.2,23.2s-12.5,21.7-26.5,23.4v.3c7.2.7,9.5,10.3,10.8,16.2l6.5,28.1h-24.3l-4.7-23.2c-2.3-11.9-3.1-12.8-14.1-12.8h-2.6l-7.3,36h-24.4l19.2-91.1ZM117.6,122.3h8.2c10.6,0,18.8-2.6,18.8-11.2s-3.9-9.3-11.2-9.4h-11.6l-4.2,20.6Z",
  "M189.4,84.4h24.5L195,175.5h-24.5l19.4-91.1Z",
  "M231.6,84.4h38.1l1.4,61.2h.3l28.6-61.2h38.9l-19.4,91.1h-23.7l16.6-74.6h-.3l-35.8,74.6h-22.9l-3.4-74.6h-.3l-16.2,74.6h-22.2l19.9-91.1Z",
  "M355.7,84.4h64.1l-3.6,17.2h-40l-4.2,18.8h38l-3.8,17.3h-37.9l-4.4,20.6h41.6l-3.5,17.2h-65.9l19.6-91.1Z",
  "M469.5,175.5h-30l-11.9-91.1h24.4l6.1,68.9h.3l35.2-68.9h26.3l-50.4,91.1Z",
  "M529.7,84.4h64l-3.5,17.2h-40.1l-4.1,18.8h38l-3.8,17.3h-37.9l-4.4,20.6h41.6l-3.5,17.2h-65.9l19.6-91.1Z",
  "M609,84.4h29.1c17.4.1,38.2.7,38.2,23.2s-12.5,21.7-26.5,23.4v.3c7.2.7,9.5,10.3,10.8,16.2l6.5,28.1h-24.3l-4.7-23.2c-2.4-11.9-3.1-12.8-14.1-12.8h-2.6l-7.3,36h-24.4l19.2-91.1ZM625.1,122.3h8.2c10.6,0,18.8-2.6,18.8-11.2s-3.9-9.3-11.2-9.4h-11.6l-4.2,20.6Z",
  "M698.4,78c0,0,0,.1,0,.2-1.8-3.9-2.8-8.3-2.8-12.9,0-10.7,5.4-20.1,13.6-25.7,6.1-3.3,13.2-5.2,20.6-5.2s20.4,3.7,28.3,10.5c1.3,1.1,2,2.7,2.1,4.4,0,1.6-.5,3.1-1.5,4.3h17.4v-17.4c-2.2,1.9-5.5,1.9-7.8,0-7.8-6.5-17.6-10.1-27.8-10.1s-21,3.9-28.9,11c3.2-12.3,13.7-21.7,26.6-23.1.7,0,1.5,0,2.3,0,11.1,0,22,3.4,31.1,9.6l6.2-6.2c1.7-1.7,4.3-2.3,6.6-1.3,2.3.9,3.7,3.1,3.7,5.6v38.1c0,3.3-2.7,6.1-6.1,6.1h-38.1c-2.4,0-4.7-1.5-5.6-3.7-.9-2.3-.4-4.9,1.3-6.6l5-5c-4.6-2.5-9.7-3.8-14.9-3.8-17.3,0-31.4,14.1-31.4,31.4",
  "M792.3,61.8c0,0,0-.1,0-.2,1.8,3.9,2.8,8.3,2.8,12.9,0,10.7-5.4,20.1-13.6,25.7-6.1,3.3-13.2,5.2-20.6,5.2s-20.4-3.7-28.3-10.5c-1.3-1.1-2-2.7-2.1-4.4,0-1.6.5-3.1,1.5-4.3h-17.4v17.4c2.2-1.9,5.5-1.9,7.8,0,7.8,6.5,17.6,10.1,27.8,10.1s21-3.9,28.9-11c-3.2,12.3-13.7,21.7-26.6,23.1-.7,0-1.5,0-2.3,0-11.1,0-22-3.4-31.1-9.6l-6.2,6.2c-1.7,1.7-4.3,2.3-6.6,1.3-2.3-.9-3.7-3.1-3.7-5.6v-38.1c0-3.3,2.7-6.1,6.1-6.1h38.1c2.4,0,4.7,1.5,5.6,3.7.9,2.3.4,4.9-1.3,6.6l-5,5c4.6,2.5,9.7,3.8,14.9,3.8,17.3,0,31.4-14.1,31.4-31.4"
].map((d) => new Path2D(d));

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * clamp(t, 0, 1); }

function makeShuffleBag(pool) {
  let bag = [];
  let lastIdx = -1;
  return function pick() {
    if (pool.length === 1) return pool[0];
    if (bag.length === 0) {
      bag = pool.map((_, i) => i);
      for (let i = bag.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      if (bag[0] === lastIdx) {
        const k = 1 + ((Math.random() * (bag.length - 1)) | 0);
        [bag[0], bag[k]] = [bag[k], bag[0]];
      }
    }
    const idx = bag.shift();
    lastIdx = idx;
    return pool[idx];
  };
}

export const game = {
  manifest: {
    id: "palette-rush-2026-w41",
    title: "Palette Rush",
    version: "1.0.0",
    durationSeconds: DURATION,
    controls: "Espace ou flèche haut (clavier), clic ou tap : faire avancer le transpalette.",
    scoring: "+10 par colonne de palettes franchie, +30 par fruit ou légume récolté."
  },

  mount(root, kit) {
    const wrap = document.createElement("div");
    wrap.tabIndex = 0;
    wrap.setAttribute("role", "application");
    wrap.setAttribute("aria-label", "Palette Rush — jeu d'entrepôt");
    wrap.style.cssText = "position:relative;width:100%;height:100%;outline:none;background:#12151a;overflow:hidden;touch-action:none;user-select:none;";
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "display:block;width:100%;height:100%;";
    wrap.appendChild(canvas);
    root.appendChild(wrap);
    const ctx = canvas.getContext("2d");

    kit.events.on(wrap, "focus", () => { wrap.style.outline = "3px solid " + THEME.accent; wrap.style.outlineOffset = "-3px"; });
    kit.events.on(wrap, "blur", () => { wrap.style.outline = "none"; });

    function fit() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = wrap.getBoundingClientRect();
      const w = Math.max(1, rect.width), h = Math.max(1, rect.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr * (w / W), 0, 0, dpr * (h / H), 0, 0);
    }
    fit();
    kit.events.on(window, "resize", fit);

    let reduceMotion = false;
    try {
      const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
      reduceMotion = mql.matches;
      kit.events.on(mql, "change", (e) => { reduceMotion = e.matches; });
    } catch { /* matchMedia indisponible : mouvement complet par défaut */ }

    const pickCapsule = makeShuffleBag(CAPSULES);

    // ---------- audio (Web Audio API native, aucun fichier) ----------
    let actx = null;
    function ac() { if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch {} } return actx; }
    function tone(freq, dur, type, gain, delay) {
      const a = ac(); if (!a) return;
      try {
        const t0 = a.currentTime + (delay || 0);
        const osc = a.createOscillator(); const g = a.createGain();
        osc.type = type || "square";
        osc.frequency.setValueAtTime(freq, t0);
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(gain || 0.12, t0 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
        osc.connect(g); g.connect(a.destination);
        osc.start(t0); osc.stop(t0 + dur + 0.02);
      } catch {}
    }
    const sfxFlap = () => tone(480, 0.07, "square", 0.06);
    const sfxScore = () => { tone(660, 0.08, "triangle", 0.09); tone(880, 0.09, "triangle", 0.08, 0.05); };
    const sfxFruit = () => { tone(920, 0.06, "sine", 0.1); tone(1300, 0.07, "sine", 0.08, 0.04); };
    const sfxCrash = () => { tone(120, 0.25, "sawtooth", 0.14); tone(70, 0.28, "square", 0.12, 0.03); };

    // ---------- state ----------
    let player, columns, particles, floats, elapsed, running, ended, worldX;
    let shakeTime = 0, shakeMag = 0, flashTime = 0, flashColor = "224,64,43";
    let endCapsule = null, endReason = "";
    let lastGapCenter, nextSpawnAt;

    function resetRound() {
      player = { x: PLAYER_X, y: H / 2, vy: 0, tilt: 0, legPhase: 0 };
      columns = [];
      particles = [];
      floats = [];
      elapsed = 0;
      worldX = 0;
      running = false;
      ended = false;
      shakeTime = 0; flashTime = 0;
      endCapsule = null; endReason = "";
      lastGapCenter = H / 2;
      nextSpawnAt = 0;
    }
    resetRound();

    function difficultyAt(t) {
      const p = t / DURATION;
      return { gapH: lerp(GAP_H_START, GAP_H_END, p), speed: lerp(SPEED_START, SPEED_END, p) };
    }

    function spawnColumn() {
      const d = difficultyAt(elapsed);
      const margin = TOP_BOUND + d.gapH / 2 + 14;
      const minC = margin, maxC = H - margin;
      const maxDelta = 130;
      let center = lastGapCenter + (Math.random() * 2 - 1) * maxDelta;
      center = clamp(center, minC, maxC);
      lastGapCenter = center;
      let fruit = null;
      if (Math.random() < 0.82) {
        fruit = { emoji: FRUITS[(Math.random() * FRUITS.length) | 0], relOffset: (Math.random() * 2 - 1) * d.gapH * 0.22, collected: false, bob: Math.random() * Math.PI * 2 };
      }
      columns.push({ x: W + 10, gapH: d.gapH, center, gapTop: center - d.gapH / 2, gapBottom: center + d.gapH / 2, passed: false, fruit });
    }

    function flap() {
      if (!running) return;
      player.vy = FLAP_V;
      sfxFlap();
      spawnPuff(player.x - 12, player.y + 14);
    }

    function spawnPuff(x, y) {
      if (reduceMotion) return;
      for (let i = 0; i < 3; i++) particles.push({ x, y, vx: (Math.random() - 0.5) * 36, vy: 18 + Math.random() * 26, life: 0.3, maxLife: 0.3, color: "rgba(240,240,235,0.55)", r: 3 + Math.random() * 3 });
    }
    function spawnBurst(x, y, color, n) {
      const count = reduceMotion ? 0 : n;
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2, sp = 50 + Math.random() * 80;
        particles.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 0.45, maxLife: 0.45, color, r: 3 + Math.random() * 3 });
      }
    }
    function spawnDebris(x, y) {
      const count = reduceMotion ? 0 : 10;
      for (let i = 0; i < count; i++) {
        const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, sp = 80 + Math.random() * 140;
        particles.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 0.55, maxLife: 0.55, color: Math.random() < 0.5 ? "#b97d3f" : "#8a5a29", r: 3 + Math.random() * 4, rect: true });
      }
    }
    function spawnFloat(x, y, text, color) { floats.push({ x, y, vy: -50, life: 0.8, maxLife: 0.8, text, color }); }

    function endRound(reason) {
      if (ended) return;
      ended = true; running = false;
      endReason = reason;
      endCapsule = pickCapsule();
      const scoreNow = kit.score.current();
      if (reason === "collision") {
        spawnDebris(player.x, player.y);
        sfxCrash();
        shakeTime = reduceMotion ? 0 : 0.3; shakeMag = 9;
        flashTime = 0.15; flashColor = "224,64,43";
        kit.ui.setStatus("Collision ! Score final : " + scoreNow + ".");
        kit.run.finish("collision");
      } else {
        kit.ui.setStatus("Temps écoulé ! Score final : " + scoreNow + ".");
      }
    }

    function update(dt) {
      elapsed += dt;
      worldX += (running ? difficultyAt(elapsed).speed : 0) * dt;

      updateParticles(dt); updateFloats(dt);
      if (shakeTime > 0) shakeTime -= dt;
      if (flashTime > 0) flashTime -= dt;

      if (!running) return;

      if (elapsed >= DURATION) { endRound("time"); return; }

      const d = difficultyAt(elapsed);

      player.vy += GRAVITY * dt;
      if (player.vy > MAX_FALL) player.vy = MAX_FALL;
      player.y += player.vy * dt;
      player.tilt = clamp(player.vy / 380, -0.55, 0.9);
      player.legPhase += dt * 10;

      if (player.y - PLAYER_RY < TOP_BOUND) { player.y = TOP_BOUND + PLAYER_RY; endRound("collision"); return; }
      if (player.y + PLAYER_RY > BOT_BOUND) { player.y = BOT_BOUND - PLAYER_RY; endRound("collision"); return; }

      if (elapsed >= nextSpawnAt) { spawnColumn(); nextSpawnAt = elapsed + SPAWN_INTERVAL; }

      for (let i = columns.length - 1; i >= 0; i--) {
        const c = columns[i];
        c.x -= d.speed * dt;

        if (!c.passed && c.x + COL_W < player.x) {
          c.passed = true;
          kit.score.add(SCORE_PER_COLUMN);
          sfxScore();
          spawnFloat(player.x + 18, player.y - 26, "+" + SCORE_PER_COLUMN, "#69acdf");
          kit.ui.setStatus("Score : " + kit.score.current());
        }

        const withinX = player.x + PLAYER_RX > c.x && player.x - PLAYER_RX < c.x + COL_W;
        if (withinX && (player.y - PLAYER_RY < c.gapTop || player.y + PLAYER_RY > c.gapBottom)) { endRound("collision"); return; }

        if (c.fruit && !c.fruit.collected) {
          const fx = c.x + COL_W / 2, fy = c.center + c.fruit.relOffset;
          const dx = player.x - fx, dy = player.y - fy;
          if (dx * dx + dy * dy < (22 + 20) * (22 + 20)) {
            c.fruit.collected = true;
            kit.score.add(SCORE_PER_FRUIT);
            sfxFruit();
            spawnBurst(fx, fy, "#8fd6a3", 9);
            spawnFloat(fx, fy - 10, "+" + SCORE_PER_FRUIT, "#57c17e");
            kit.ui.setStatus("Score : " + kit.score.current());
          }
        }

        if (c.x + COL_W < -20) columns.splice(i, 1);
      }
    }

    function updateParticles(dt) {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 240 * dt; p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
      }
    }
    function updateFloats(dt) {
      for (let i = floats.length - 1; i >= 0; i--) {
        const f = floats[i]; f.y += f.vy * dt; f.life -= dt;
        if (f.life <= 0) floats.splice(i, 1);
      }
    }

    // ---------- drawing ----------
    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
    function drawFloor() {
      ctx.fillStyle = "#9aa1ab"; ctx.fillRect(0, 0, W, H);
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "rgba(255,255,255,0.06)"); g.addColorStop(0.5, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,0.12)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const tile = 54, offset = worldX % tile;
      ctx.strokeStyle = "rgba(120,126,136,0.5)"; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = -offset; x < W + tile; x += tile) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
      ctx.stroke();
      const laneW = 8, dash = 22, gapd = 16;
      ctx.fillStyle = "rgba(105,172,223,0.7)";
      [50, H - 50].forEach((ly) => {
        const o = worldX % (dash + gapd);
        for (let x = -o; x < W; x += dash + gapd) ctx.fillRect(x, ly - laneW / 2, dash, laneW);
      });
    }
    function drawPalletBlock(x, y, w, h) {
      ctx.fillStyle = "#00000022"; ctx.fillRect(x + 2, y + 2, w, h);
      ctx.fillStyle = "#b97d3f"; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      const slats = 3;
      for (let i = 0; i < slats; i++) ctx.fillRect(x + 3, y + (h / slats) * i + 3, w - 6, 4);
      ctx.strokeStyle = "#5f3d1a"; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    }
    function drawWrappedBox(x, y, w, h, tone) {
      ctx.fillStyle = tone; roundRect(x, y, w, h, 3); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.22)"; ctx.fillRect(x + 3, y + 3, w - 6, 5);
    }
    const BOX_TONES = ["#d9903f", "#c97b3a", "#e0a15a"];
    function drawHazardStrip(x, y, w, h) {
      ctx.save(); roundRect(x, y, w, h, 2); ctx.clip();
      ctx.fillStyle = "#111"; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#f5b700";
      for (let sx = -h; sx < w + h; sx += 10) {
        ctx.beginPath();
        ctx.moveTo(x + sx, y + h); ctx.lineTo(x + sx + h, y); ctx.lineTo(x + sx + h + 5, y); ctx.lineTo(x + sx + 5, y + h);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    function drawColumn(c) {
      ctx.fillStyle = "#c9550f"; ctx.fillRect(c.x - 3, 0, 5, H); ctx.fillRect(c.x + COL_W - 2, 0, 5, H);
      const unit = 40;
      let yy = 0, idx = 0;
      while (yy < c.gapTop) {
        const hh = Math.min(unit, c.gapTop - yy);
        if (idx % 3 === 2 && hh > 26) drawWrappedBox(c.x + 5, yy + 3, COL_W - 14, hh - 6, BOX_TONES[idx % 3]);
        else drawPalletBlock(c.x + 3, yy + 2, COL_W - 10, hh - 4);
        yy += unit; idx++;
      }
      drawHazardStrip(c.x, c.gapTop - 8, COL_W, 8);
      drawHazardStrip(c.x, c.gapBottom, COL_W, 8);
      yy = c.gapBottom + 8; idx = 0;
      while (yy < H) {
        const hh2 = Math.min(unit, H - yy);
        if (idx % 3 === 1 && hh2 > 26) drawWrappedBox(c.x + 5, yy + 3, COL_W - 14, hh2 - 6, BOX_TONES[(idx + 1) % 3]);
        else drawPalletBlock(c.x + 3, yy + 2, COL_W - 10, hh2 - 4);
        yy += unit; idx++;
      }
    }
    function drawFruit(c) {
      const f = c.fruit; if (!f || f.collected) return;
      const fx = c.x + COL_W / 2, fy = c.center + f.relOffset;
      const bob = reduceMotion ? 0 : Math.sin(worldX * 0.02 + f.bob) * 5;
      ctx.save(); ctx.translate(fx, fy + bob);
      ctx.font = "26px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2;
      ctx.fillText(f.emoji, 0, 0);
      ctx.restore();
    }
    function drawAccessory() {
      if (THEME.accessory === "moustache") {
        ctx.fillStyle = "#3a2a1c";
        ctx.beginPath(); ctx.moveTo(-32, -13); ctx.quadraticCurveTo(-27, -10, -22, -12); ctx.quadraticCurveTo(-27, -8, -32, -10); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-22, -12); ctx.quadraticCurveTo(-17, -10, -13, -12); ctx.quadraticCurveTo(-17, -8, -22, -10); ctx.closePath(); ctx.fill();
      } else if (THEME.accessory === "ribbon") {
        ctx.save(); ctx.translate(-25, -1);
        ctx.fillStyle = "#e8368f";
        ctx.beginPath(); ctx.ellipse(-3, -2, 3, 4.3, -0.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(3, -2, 3, 4.3, 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-2, 6); ctx.lineTo(0, 4.4); ctx.lineTo(2, 6); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
    function drawPlayer(p) {
      ctx.save(); ctx.translate(p.x, p.y);
      ctx.save(); ctx.translate(2, 26); ctx.scale(1, 0.32);
      ctx.beginPath(); ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.ellipse(0, 0, 30, 30, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.rotate(p.tilt * 0.32);
      const legSwing = reduceMotion ? 0 : Math.sin(p.legPhase) * 5;
      ctx.strokeStyle = "#2b2f36"; ctx.lineWidth = 5; ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-26, 14); ctx.lineTo(-26 - legSwing, 26);
      ctx.moveTo(-19, 14); ctx.lineTo(-19 + legSwing, 26);
      ctx.stroke();
      ctx.fillStyle = "#0058a2"; roundRect(-33, -7, 17, 22, 5); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-31, -2); ctx.lineTo(-18, -2); ctx.moveTo(-31, 3); ctx.lineTo(-18, 3); ctx.stroke();
      drawAccessory();
      ctx.strokeStyle = "#e7c9a3"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-19, -3); ctx.lineTo(-5, -17); ctx.stroke();
      ctx.fillStyle = "#e7c9a3"; ctx.beginPath(); ctx.arc(-26, -15, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#3a3f47"; ctx.beginPath(); ctx.arc(-26, -19, 8, Math.PI, Math.PI * 2); ctx.fill();
      ctx.fillRect(-33, -20, 14, 4);
      ctx.strokeStyle = "#3a3f47"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-5, -17); ctx.lineTo(5, -2); ctx.stroke();
      ctx.fillStyle = "#3a3f47"; ctx.beginPath(); ctx.arc(-5, -17, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#3a3f47"; roundRect(4, -5, 17, 14, 3); ctx.fill();
      ctx.fillStyle = "#15171a";
      ctx.beginPath(); ctx.arc(9, 10, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(19, 10, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(38, 8, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(38, -2, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#69acdf"; ctx.fillRect(19, -3, 22, 4); ctx.fillRect(19, 3, 22, 4);
      ctx.fillStyle = "#8a5a29"; ctx.fillRect(26, -8, 17, 4);
      ctx.fillStyle = "#d9903f"; roundRect(26, -21, 17, 14, 3); ctx.fill();
      ctx.font = "11px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("\u{1F96C}", 31, -14); ctx.fillText("\u{1F34A}", 40, -12);
      ctx.restore();
    }
    function drawParticles() {
      particles.forEach((p) => {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife); ctx.fillStyle = p.color;
        if (p.rect) ctx.fillRect(p.x - p.r / 2, p.y - p.r / 2, p.r, p.r);
        else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }
      });
      ctx.globalAlpha = 1;
    }
    function drawFloats() {
      floats.forEach((f) => {
        ctx.globalAlpha = Math.max(0, f.life / f.maxLife);
        ctx.font = "700 18px system-ui, -apple-system, Arial, sans-serif";
        ctx.textAlign = "center"; ctx.fillStyle = f.color;
        ctx.fillText(f.text, f.x, f.y);
      });
      ctx.globalAlpha = 1;
    }
    function wrapText(text, maxWidth) {
      const words = text.split(" ");
      const lines = []; let line = "";
      for (const w of words) {
        const test = line ? line + " " + w : w;
        if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; }
        else line = test;
      }
      if (line) lines.push(line);
      return lines;
    }
    function drawLogo(x, y, scale, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y); ctx.scale(scale, scale);
      ctx.fillStyle = "#ffffff";
      LOGO_D.forEach((p) => ctx.fill(p));
      ctx.restore();
    }
    function drawHud() {
      ctx.fillStyle = "rgba(20,23,28,0.85)"; ctx.fillRect(0, 0, W, 38);
      ctx.fillStyle = "rgba(105,172,223,0.8)"; ctx.fillRect(0, 36, W, 2);
      ctx.textBaseline = "middle";
      ctx.font = "700 24px system-ui, -apple-system, Arial, sans-serif";
      ctx.textAlign = "left"; ctx.fillStyle = "#f4f1e8";
      ctx.fillText("Score " + kit.score.current(), 14, 19);
      ctx.textAlign = "right"; ctx.fillStyle = "#9aa3ad"; ctx.font = "600 15px system-ui, -apple-system, Arial, sans-serif";
      const remain = Math.max(0, Math.ceil(DURATION - elapsed));
      ctx.fillText(remain + " s", W - 14, 19);
      drawLogo(W - 108, 8, 0.028, 0.95);
    }
    function drawIntroCaption() {
      const remain = introCaptionUntil - elapsed;
      if (remain <= 0) return;
      const a = Math.min(1, remain / 0.5) * 0.92;
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(10,12,16," + a + ")";
      roundRect(W / 2 - 320, H / 2 - 34, 640, 68, 10); ctx.fill();
      ctx.fillStyle = "rgba(244,241,232," + a + ")";
      ctx.font = "600 16px system-ui, -apple-system, Arial, sans-serif";
      ctx.fillText("Espace ou clic pour avancer, évitez les colonnes de palettes, récoltez fruits et légumes.", W / 2, H / 2 - 6);
      ctx.fillStyle = "rgba(105,172,223," + a + ")";
      ctx.font = "700 15px system-ui, -apple-system, Arial, sans-serif";
      ctx.fillText("+10 par colonne franchie · +30 par récolte", W / 2, H / 2 + 18);
    }
    function drawEndOverlay() {
      ctx.fillStyle = "rgba(10,12,16,0.82)"; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.fillStyle = endReason === "collision" ? "#e0402b" : "#69acdf";
      ctx.font = "700 30px system-ui, -apple-system, Arial, sans-serif";
      ctx.fillText(endReason === "collision" ? "COLLISION" : "TEMPS ÉCOULÉ", W / 2, 64);
      ctx.fillStyle = "#f4f1e8"; ctx.font = "700 44px system-ui, -apple-system, Arial, sans-serif";
      ctx.fillText("Score : " + kit.score.current(), W / 2, 112);

      if (endCapsule) {
        const panelW = 620, panelX = W / 2 - panelW / 2, panelY = 148, panelH = 150;
        ctx.fillStyle = "rgba(105,172,223,0.12)";
        roundRect(panelX, panelY, panelW, panelH, 12); ctx.fill();
        ctx.strokeStyle = "rgba(105,172,223,0.35)"; ctx.lineWidth = 1.5;
        roundRect(panelX, panelY, panelW, panelH, 12); ctx.stroke();

        ctx.textAlign = "left";
        ctx.fillStyle = "#69acdf"; ctx.font = "700 13px system-ui, -apple-system, Arial, sans-serif";
        ctx.fillText((CAPSULE_LABELS[endCapsule.type] || "").toUpperCase() + " — OCTOBRE ROSE & MOVEMBER", panelX + 20, panelY + 24);

        ctx.font = "600 15px system-ui, -apple-system, Arial, sans-serif";
        let ty = panelY + 52;
        if (endCapsule.type === "myth") {
          ctx.fillStyle = "#e0a15a";
          wrapText("❌ " + endCapsule.claim, panelW - 40).forEach((line) => { ctx.fillText(line, panelX + 20, ty); ty += 20; });
          ty += 6;
          ctx.fillStyle = "#f4f1e8";
          wrapText("✅ " + endCapsule.reality, panelW - 40).forEach((line) => { ctx.fillText(line, panelX + 20, ty); ty += 20; });
        } else {
          ctx.fillStyle = "#f4f1e8";
          wrapText(endCapsule.text, panelW - 40).forEach((line) => { ctx.fillText(line, panelX + 20, ty); ty += 20; });
        }
      }

      ctx.textAlign = "center"; ctx.fillStyle = "#9aa3ad"; ctx.font = "600 13px system-ui, -apple-system, Arial, sans-serif";
      ctx.fillText("0 805 123 124 — Cancer info service    ·    3114 — Prévention du suicide (24h/24)", W / 2, H - 16);
    }
    function render() {
      ctx.save(); ctx.clearRect(0, 0, W, H);
      if (shakeTime > 0) ctx.translate((Math.random() - 0.5) * shakeMag, (Math.random() - 0.5) * shakeMag);
      drawFloor();
      columns.forEach(drawColumn);
      columns.forEach(drawFruit);
      drawParticles();
      drawPlayer(player);
      drawFloats();
      drawHud();
      if (flashTime > 0) { ctx.fillStyle = "rgba(" + flashColor + "," + (flashTime / 0.25 * 0.35) + ")"; ctx.fillRect(0, 0, W, H); }
      if (running) drawIntroCaption();
      if (ended) drawEndOverlay();
      ctx.restore();
    }

    // ---------- boucle (pilotée par kit.timers, pas de rAF natif) ----------
    let tickId = null, lastT = null;
    function tick() {
      const now = performance.now();
      const dt = lastT == null ? 0 : Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      update(dt);
      render();
    }
    function startTicking() {
      if (tickId != null) return;
      lastT = null;
      tickId = kit.timers.interval(tick, 16);
    }
    function stopTicking() {
      if (tickId != null) { kit.timers.clear(tickId); tickId = null; }
    }

    kit.events.on(wrap, "pointerdown", (e) => { e.preventDefault(); flap(); });
    kit.events.on(window, "keydown", (e) => {
      if (e.code !== "Space" && e.code !== "ArrowUp") return;
      e.preventDefault();
      flap();
    });

    let introCaptionUntil = 0;

    render();

    return {
      start() {
        resetRound();
        running = true;
        player.vy = FLAP_V * 0.6;
        introCaptionUntil = 2.5;
        kit.run.start();
        kit.ui.setStatus("Palette Rush : espace ou clic pour avancer, évitez les colonnes de palettes, récoltez fruits et légumes. " + DURATION + " secondes chrono.");
        startTicking();
        render();
        wrap.focus();
      },
      pause() {
        running = false;
        stopTicking();
      },
      resume() {
        if (ended) return;
        running = true;
        startTicking();
        render();
      },
      destroy() {
        stopTicking();
        if (actx && actx.state !== "closed") {
          actx.close().catch(() => {});
          actx = null;
        }
        root.replaceChildren();
      }
    };
  }
};
