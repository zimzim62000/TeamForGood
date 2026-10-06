// Palette Dash — module COM Arcade (contrat GAMEKIT v1)
// Aucune dépendance externe : DOM + Canvas 2D natifs uniquement.
"use strict";

const W = 960, H = 540; // résolution logique 16:9
const DURATION = 45; // secondes — doit correspondre à la config COM Arcade

const GROUND_Y = 440;
const CHAR_X = 150;
const CHAR_W = 34, CHAR_H_STAND = 52, CHAR_H_DUCK = 28;
const GRAVITY = 2200, JUMP_V = -820; // durée de saut ~0,745 s
const SPEED_START = 320, SPEED_END = 560;
const SPAWN_START = 1.4, SPAWN_END = 1.05;
const SPAWN_MIN_SAFE = 0.95; // plancher absolu : toujours > durée de saut + marge, pour rester équitable
const SCORE_PER_SEC = 10;
const FRUIT_BONUS = 15;

const FRUITS = ["\u{1F34E}", "\u{1F34C}", "\u{1F347}", "\u{1F349}", "\u{1F955}", "\u{1F345}", "\u{1F346}", "\u{1F966}", "\u{1F34D}", "\u{1F352}", "\u{1F34B}", "\u{1F33D}"];

// Contenu de sensibilisation Octobre Rose & Movember, affiché en fin de partie.
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

export const game = {
  manifest: {
    id: "palette-dash-2026-w41",
    title: "Palette Dash",
    version: "1.0.0",
    durationSeconds: DURATION,
    controls: "Espace ou flèche haut (ou bouton SAUT) : sauter. Flèche bas (ou bouton DUCK, maintenir) : se baisser.",
    scoring: "+10 points par seconde de course survécue, +15 par fruit ou légume attrapé."
  },

  mount(root, kit) {
    const wrap = document.createElement("div");
    wrap.tabIndex = 0;
    wrap.setAttribute("role", "application");
    wrap.setAttribute("aria-label", "Palette Dash");
    wrap.style.cssText = "position:relative;width:100%;height:100%;outline:none;background:#12151a;overflow:hidden;touch-action:none;user-select:none;";
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "display:block;width:100%;height:100%;";
    wrap.appendChild(canvas);
    root.appendChild(wrap);
    const ctx = canvas.getContext("2d");

    kit.events.on(wrap, "focus", () => { wrap.style.outline = "3px solid #69acdf"; wrap.style.outlineOffset = "-3px"; });
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
    kit.events.on(window, "resize", () => { fit(); render(); });

    let reduceMotion = false;
    try {
      const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
      reduceMotion = mql.matches;
      kit.events.on(mql, "change", (e) => { reduceMotion = e.matches; });
    } catch {}

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
    const sfxJump = () => tone(420, 0.08, "square", 0.07);
    const sfxFruit = () => { tone(920, 0.06, "sine", 0.1); tone(1300, 0.07, "sine", 0.08, 0.04); };
    const sfxCrash = () => { tone(120, 0.28, "sawtooth", 0.14); tone(70, 0.3, "square", 0.12, 0.04); };
    const sfxTick = () => tone(660, 0.03, "triangle", 0.03);

    // ---------- state ----------
    let charY, charVy, ducking, grounded, obstacles, particles, floats, elapsed, running, ended, endReason;
    let worldX, nextSpawnAt, scoreAccum, scoreGiven, flashTime, shakeTime, shakeMag, endCapsule;

    function resetRound() {
      charY = GROUND_Y; charVy = 0; ducking = false; grounded = true;
      obstacles = [];
      particles = [];
      floats = [];
      elapsed = 0; running = false; ended = false; endReason = ""; endCapsule = null;
      worldX = 0; nextSpawnAt = 1.0;
      scoreAccum = 0; scoreGiven = 0;
      flashTime = 0; shakeTime = 0; shakeMag = 0;
    }
    resetRound();

    function difficultyAt(t) {
      const p = t / DURATION;
      return { speed: lerp(SPEED_START, SPEED_END, p), spawnInterval: lerp(SPAWN_START, SPAWN_END, p) };
    }

    function spawnObstacle() {
      const kinds = ["ground", "ground", "low"]; // plus de chances d'obstacle au sol
      const kind = kinds[(Math.random() * kinds.length) | 0];
      const withFruit = Math.random() < 0.4;
      if (kind === "ground") {
        const wide = Math.random() < 0.3 + elapsed / DURATION * 0.3;
        obstacles.push({
          kind: "ground", x: W + 20, w: wide ? 60 : 32, h: 40 + Math.random() * 16,
          fruit: withFruit ? { emoji: FRUITS[(Math.random() * FRUITS.length) | 0], collected: false, dy: -90 - Math.random() * 20 } : null
        });
      } else {
        obstacles.push({
          kind: "low", x: W + 20, w: 44, h: 18, flyY: GROUND_Y - CHAR_H_STAND,
          fruit: withFruit ? { emoji: FRUITS[(Math.random() * FRUITS.length) | 0], collected: false, dy: -70 } : null
        });
      }
    }

    function spawnBurst(x, y, color, n) {
      const count = reduceMotion ? 0 : n;
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 110;
        particles.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 0.45, maxLife: 0.45, color, r: 3 + Math.random() * 3 });
      }
    }
    function spawnFloat(x, y, text, color) { floats.push({ x, y, vy: -45, life: 0.8, maxLife: 0.8, text, color }); }

    function awardScore() {
      const target = Math.floor(scoreAccum);
      if (target > scoreGiven) { kit.score.add(target - scoreGiven); scoreGiven = target; }
    }

    function endRound(reason) {
      if (ended) return;
      ended = true; running = false; endReason = reason;
      endCapsule = pickCapsule();
      const scoreNow = kit.score.current();
      if (reason === "collision") {
        sfxCrash();
        shakeTime = reduceMotion ? 0 : 0.3; shakeMag = 8;
        kit.ui.setStatus("Collision ! Score final : " + scoreNow + ".");
        kit.run.finish("collision");
      } else {
        kit.ui.setStatus("Arrivée ! Score final : " + scoreNow + ".");
      }
    }

    function jump() {
      if (!running || !grounded || ducking) return;
      charVy = JUMP_V; grounded = false;
      sfxJump();
      spawnBurst(CHAR_X, GROUND_Y, "rgba(240,240,235,0.5)", 4);
    }

    function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
      return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    }

    function update(dt) {
      elapsed += dt;
      updateParticles(dt); updateFloats(dt);
      if (flashTime > 0) flashTime -= dt;
      if (shakeTime > 0) shakeTime -= dt;

      if (!running) return;
      if (elapsed >= DURATION) { endRound("time"); return; }

      const d = difficultyAt(elapsed);
      worldX += d.speed * dt;

      scoreAccum += SCORE_PER_SEC * dt;
      const prevTickSec = Math.floor((elapsed - dt));
      if (Math.floor(elapsed) > prevTickSec) sfxTick();
      awardScore();

      charVy += GRAVITY * dt;
      charY += charVy * dt;
      if (charY >= GROUND_Y) { charY = GROUND_Y; charVy = 0; grounded = true; }

      if (elapsed >= nextSpawnAt) {
        spawnObstacle();
        nextSpawnAt = elapsed + Math.max(SPAWN_MIN_SAFE, d.spawnInterval * (0.85 + Math.random() * 0.3));
      }

      const charH = ducking && grounded ? CHAR_H_DUCK : CHAR_H_STAND;
      const charTop = charY - charH;
      const charBox = { x: CHAR_X - CHAR_W / 2, y: charTop, w: CHAR_W, h: charH };

      for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.x -= d.speed * dt;

        let ob;
        if (o.kind === "ground") ob = { x: o.x, y: GROUND_Y - o.h, w: o.w, h: o.h };
        else ob = { x: o.x, y: o.flyY, w: o.w, h: o.h };

        if (rectsOverlap(charBox.x, charBox.y, charBox.w, charBox.h, ob.x, ob.y, ob.w, ob.h)) {
          endRound("collision"); return;
        }

        if (o.fruit && !o.fruit.collected) {
          const fx = o.x + o.w / 2, fy = (o.kind === "ground" ? GROUND_Y - o.h : o.flyY + o.h / 2) + o.fruit.dy;
          const dx = CHAR_X - fx, dy = (charTop + charH / 2) - fy;
          if (dx * dx + dy * dy < 30 * 30) {
            o.fruit.collected = true;
            kit.score.add(FRUIT_BONUS);
            sfxFruit();
            spawnBurst(fx, fy, "#8fd6a3", 8);
            spawnFloat(fx, fy - 10, "+" + FRUIT_BONUS, "#57c17e");
            kit.ui.setStatus("Score : " + kit.score.current());
          }
        }

        if (o.x + o.w < -30) obstacles.splice(i, 1);
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

    // ---------- input ----------
    kit.events.on(window, "keydown", (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); jump(); }
      else if (e.code === "ArrowDown") { e.preventDefault(); ducking = true; }
    });
    kit.events.on(window, "keyup", (e) => {
      if (e.code === "ArrowDown") ducking = false;
    });

    const BTN_Y = H - 56, BTN_H = 46;
    const jumpBtn = { x: 20, w: 150 }, duckBtn = { x: 190, w: 150 };
    kit.events.on(wrap, "pointerdown", (e) => {
      e.preventDefault();
      const rect = wrap.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width * W;
      const py = (e.clientY - rect.top) / rect.height * H;
      if (py >= BTN_Y && py <= BTN_Y + BTN_H) {
        if (px >= jumpBtn.x && px <= jumpBtn.x + jumpBtn.w) jump();
        else if (px >= duckBtn.x && px <= duckBtn.x + duckBtn.w) ducking = true;
      }
    });
    kit.events.on(wrap, "pointerup", () => { ducking = false; });
    kit.events.on(wrap, "pointercancel", () => { ducking = false; });

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
    function drawLogo(x, y, scale, alpha) {
      ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(scale, scale);
      ctx.fillStyle = "#ffffff"; LOGO_D.forEach((p) => ctx.fill(p));
      ctx.restore();
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

    function drawBackground() {
      ctx.fillStyle = "#9aa1ab"; ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
      ctx.fillStyle = "#1a1e26"; ctx.fillRect(0, 0, W, GROUND_Y);
      const tile = 48, off = worldX % tile;
      ctx.strokeStyle = "rgba(0,0,0,0.12)"; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = -off; x < W + tile; x += tile) { ctx.moveTo(x, GROUND_Y); ctx.lineTo(x, H); }
      ctx.stroke();
      ctx.fillStyle = "rgba(105,172,223,0.7)";
      const dash = 24, gapd = 18, lo = worldX % (dash + gapd);
      for (let x = -lo; x < W; x += dash + gapd) ctx.fillRect(x, GROUND_Y - 4, dash, 4);
    }
    function drawPalletBlock(x, y, w, h) {
      ctx.fillStyle = "#00000022"; ctx.fillRect(x + 2, y + 2, w, h);
      ctx.fillStyle = "#b97d3f"; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      const slats = Math.max(2, Math.floor(h / 14));
      for (let i = 0; i < slats; i++) ctx.fillRect(x + 3, y + (h / slats) * i + 3, w - 6, 4);
      ctx.strokeStyle = "#5f3d1a"; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    }
    function drawObstacles() {
      obstacles.forEach((o) => {
        if (o.kind === "ground") drawPalletBlock(o.x, GROUND_Y - o.h, o.w, o.h);
        else {
          ctx.save(); ctx.translate(o.x + o.w / 2, o.flyY + o.h / 2);
          ctx.fillStyle = "rgba(0,0,0,0.25)"; roundRect(-o.w / 2 + 2, -o.h / 2 + 2, o.w, o.h, 4); ctx.fill();
          ctx.fillStyle = "#2873b1"; roundRect(-o.w / 2, -o.h / 2, o.w, o.h, 4); ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.fillRect(-o.w / 2 + 3, -o.h / 2 + 3, o.w - 6, 4);
          ctx.restore();
        }
        if (o.fruit && !o.fruit.collected) {
          const fx = o.x + o.w / 2, fy = (o.kind === "ground" ? GROUND_Y - o.h : o.flyY + o.h / 2) + o.fruit.dy;
          ctx.font = "26px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2;
          ctx.fillText(o.fruit.emoji, fx, fy);
          ctx.shadowBlur = 0;
        }
      });
    }
    function drawChar() {
      const h = ducking && grounded ? CHAR_H_DUCK : CHAR_H_STAND;
      const top = charY - CHAR_H_STAND + (CHAR_H_STAND - h);
      ctx.save(); ctx.translate(CHAR_X, 0);
      ctx.save(); ctx.translate(0, GROUND_Y + 8); ctx.scale(1, 0.3);
      ctx.beginPath(); ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.ellipse(0, 0, 18, 18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      const midY = top + h / 2;
      ctx.fillStyle = "#0058a2"; roundRect(-12, top + h * 0.28, 24, h * 0.5, 6); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-10, midY - 2); ctx.lineTo(10, midY - 2); ctx.stroke();

      ctx.fillStyle = "#e7c9a3"; ctx.beginPath(); ctx.arc(8, top + h * 0.16, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#3a3f47"; ctx.beginPath(); ctx.arc(8, top + h * 0.1, 9, Math.PI, Math.PI * 2); ctx.fill();

      if (!ducking || !grounded) {
        const phase = (worldX * 0.05) % (Math.PI * 2);
        ctx.strokeStyle = "#2b2f36"; ctx.lineWidth = 5; ctx.lineCap = "round";
        const swing = grounded ? Math.sin(phase) * 10 : 0;
        ctx.beginPath();
        ctx.moveTo(-4, top + h - 4); ctx.lineTo(-4 - swing, top + h + 14);
        ctx.moveTo(4, top + h - 4); ctx.lineTo(4 + swing, top + h + 14);
        ctx.stroke();
      } else {
        ctx.strokeStyle = "#2b2f36"; ctx.lineWidth = 5; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(-10, top + h - 2); ctx.lineTo(-14, top + h + 6); ctx.moveTo(10, top + h - 2); ctx.lineTo(14, top + h + 6); ctx.stroke();
      }
      ctx.restore();
    }
    function drawParticles() {
      particles.forEach((p) => {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife); ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
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
    function drawHud() {
      ctx.fillStyle = "rgba(20,23,28,0.85)"; ctx.fillRect(0, 0, W, 38);
      ctx.fillStyle = "rgba(105,172,223,0.8)"; ctx.fillRect(0, 36, W, 2);
      ctx.textBaseline = "middle";
      ctx.font = "700 24px system-ui, -apple-system, Arial, sans-serif";
      ctx.textAlign = "left"; ctx.fillStyle = "#f4f1e8";
      ctx.fillText("Score " + kit.score.current(), 14, 19);
      ctx.textAlign = "center"; ctx.fillStyle = "#69acdf"; ctx.font = "700 12px system-ui, -apple-system, Arial, sans-serif";
      ctx.fillText("OCTOBRE ROSE & MOVEMBER", W / 2, 19);
      ctx.textAlign = "right"; ctx.fillStyle = "#9aa3ad"; ctx.font = "600 15px system-ui, -apple-system, Arial, sans-serif";
      const remain = Math.max(0, Math.ceil(DURATION - elapsed));
      ctx.fillText(remain + " s", W - 14, 19);
      drawLogo(W - 108, 8, 0.028, 0.95);
    }
    function drawButtons() {
      [["SAUT", jumpBtn], ["BAS", duckBtn]].forEach(([label, b]) => {
        ctx.fillStyle = "rgba(105,172,223,0.16)";
        roundRect(b.x, BTN_Y, b.w, BTN_H, 8); ctx.fill();
        ctx.strokeStyle = "rgba(105,172,223,0.5)"; ctx.lineWidth = 1.5;
        roundRect(b.x, BTN_Y, b.w, BTN_H, 8); ctx.stroke();
        ctx.fillStyle = "#f4f1e8"; ctx.textAlign = "center"; ctx.font = "700 16px system-ui, -apple-system, Arial, sans-serif";
        ctx.fillText(label, b.x + b.w / 2, BTN_Y + BTN_H / 2 + 6);
      });
    }
    function drawEndOverlay() {
      ctx.fillStyle = "rgba(10,12,16,0.85)"; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.fillStyle = endReason === "collision" ? "#e0402b" : "#69acdf";
      ctx.font = "700 26px system-ui, -apple-system, Arial, sans-serif";
      ctx.fillText(endReason === "collision" ? "COLLISION" : "ARRIVÉE !", W / 2, 76);
      ctx.fillStyle = "#f4f1e8"; ctx.font = "700 36px system-ui, -apple-system, Arial, sans-serif";
      ctx.fillText("Score : " + kit.score.current(), W / 2, 116);

      if (endCapsule) {
        const panelW = 640, panelX = W / 2 - panelW / 2, panelY = 140, panelH = 118;
        ctx.fillStyle = "rgba(105,172,223,0.12)";
        roundRect(panelX, panelY, panelW, panelH, 12); ctx.fill();
        ctx.strokeStyle = "rgba(105,172,223,0.35)"; ctx.lineWidth = 1.5;
        roundRect(panelX, panelY, panelW, panelH, 12); ctx.stroke();

        ctx.textAlign = "left";
        ctx.fillStyle = "#69acdf"; ctx.font = "700 12px system-ui, -apple-system, Arial, sans-serif";
        ctx.fillText((CAPSULE_LABELS[endCapsule.type] || "").toUpperCase() + " — OCTOBRE ROSE & MOVEMBER", panelX + 18, panelY + 20);

        ctx.font = "600 14px system-ui, -apple-system, Arial, sans-serif";
        let ty = panelY + 44;
        if (endCapsule.type === "myth") {
          ctx.fillStyle = "#e0a15a";
          wrapText("❌ " + endCapsule.claim, panelW - 36).forEach((line) => { ctx.fillText(line, panelX + 18, ty); ty += 18; });
          ty += 5;
          ctx.fillStyle = "#f4f1e8";
          wrapText("✅ " + endCapsule.reality, panelW - 36).forEach((line) => { ctx.fillText(line, panelX + 18, ty); ty += 18; });
        } else {
          ctx.fillStyle = "#f4f1e8";
          wrapText(endCapsule.text, panelW - 36).forEach((line) => { ctx.fillText(line, panelX + 18, ty); ty += 18; });
        }
      }

      ctx.textAlign = "center"; ctx.fillStyle = "#9aa3ad"; ctx.font = "600 12px system-ui, -apple-system, Arial, sans-serif";
      ctx.fillText("0 805 123 124 — Cancer info service    ·    3114 — Prévention du suicide (24h/24)", W / 2, H - 14);
      drawLogo(W / 2 - 60, H - 44, 0.052, 0.9);
    }
    function render() {
      ctx.save(); ctx.clearRect(0, 0, W, H);
      if (shakeTime > 0) ctx.translate((Math.random() - 0.5) * shakeMag, (Math.random() - 0.5) * shakeMag);
      drawBackground();
      drawObstacles();
      drawParticles();
      drawChar();
      drawFloats();
      drawHud();
      drawButtons();
      if (flashTime > 0) { ctx.fillStyle = "rgba(224,64,43," + (flashTime / 0.3 * 0.3) + ")"; ctx.fillRect(0, 0, W, H); }
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
    function startTicking() { if (tickId == null) { lastT = null; tickId = kit.timers.interval(tick, 16); } }
    function stopTicking() { if (tickId != null) { kit.timers.clear(tickId); tickId = null; } }

    render();

    return {
      start() {
        resetRound();
        running = true;
        kit.run.start();
        kit.ui.setStatus("Palette Dash : espace ou flèche haut pour sauter, flèche bas pour se baisser. " + DURATION + " secondes chrono.");
        startTicking();
        render();
        wrap.focus();
      },
      pause() { running = false; stopTicking(); },
      resume() { if (ended) return; running = true; startTicking(); render(); },
      destroy() { stopTicking(); root.replaceChildren(); }
    };
  }
};
