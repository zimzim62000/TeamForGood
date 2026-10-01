export const game = {
  manifest: {
    id: "neon-dodger",
    title: "Neon Dodger — Démonstration",
    version: "1.1.0",
    durationSeconds: 30,
    controls: "Flèches ou ZQSD / WASD",
    scoring: "+100 par pixel jaune collecté",
  },

  mount(root, kit) {
    root.innerHTML = `
      <style>
        .nd-game { position:relative; width:100%; height:100%; min-height:260px; overflow:hidden; color:#fff; background:linear-gradient(135deg,#20134b,#101b3c); outline:0; }
        .nd-game:focus-visible { box-shadow:inset 0 0 0 4px #ffd166; }
        .nd-grid { position:absolute; inset:0; opacity:.18; background-image:linear-gradient(#9ee7ff 1px,transparent 1px),linear-gradient(90deg,#9ee7ff 1px,transparent 1px); background-size:11.111% 11.111%; }
        .nd-player,.nd-target { position:absolute; width:8%; aspect-ratio:1; transform:translate(-50%,-50%); }
        .nd-player { background:#ff6b35; border:3px solid #fff; box-shadow:4px 4px 0 #ffd166; transition:left 80ms linear,top 80ms linear; }
        .nd-target { display:grid; place-items:center; color:#ffd166; font-size:clamp(28px,6vw,56px); filter:drop-shadow(0 0 8px #ffd166); animation:nd-pulse .7s infinite alternate; }
        .nd-copy { position:absolute; left:5%; right:5%; bottom:5%; margin:0; text-align:center; font:700 clamp(12px,2vw,16px) Arial,sans-serif; }
        @keyframes nd-pulse { to { transform:translate(-50%,-50%) scale(1.2); } }
        @media (prefers-reduced-motion:reduce) { .nd-player,.nd-target { transition:none; animation:none; } }
      </style>
      <div class="nd-game" tabindex="0" role="application" aria-label="Neon Dodger. Déplacez le carré orange pour collecter les pixels jaunes.">
        <div class="nd-grid" aria-hidden="true"></div>
        <div class="nd-player" aria-hidden="true"></div>
        <div class="nd-target" aria-hidden="true">✦</div>
        <p class="nd-copy">FLÈCHES / ZQSD / WASD · COLLECTEZ LES PIXELS JAUNES</p>
      </div>`;

    const shell = root.querySelector(".nd-game");
    const playerNode = root.querySelector(".nd-player");
    const targetNode = root.querySelector(".nd-target");
    let player = { x: 1, y: 4 };
    let target = { x: 6, y: 4 };
    let paused = true;
    let startedAt = 0;
    let moveTimer = null;
    let nextMoveAt = 0;

    function render() {
      playerNode.style.left = `${(player.x + 0.5) * 11.111}%`;
      playerNode.style.top = `${(player.y + 0.5) * 11.111}%`;
      targetNode.style.left = `${(target.x + 0.5) * 11.111}%`;
      targetNode.style.top = `${(target.y + 0.5) * 11.111}%`;
    }

    function moveTarget() {
      do {
        target = { x: Math.floor(Math.random() * 9), y: Math.floor(Math.random() * 9) };
      } while (target.x === player.x && target.y === player.y);
      render();
    }

    function scheduleTargetMove() {
      const elapsed = Math.max(0, (Date.now() - startedAt) / 1000);
      nextMoveAt = Date.now() + Math.max(650, 1450 - elapsed * 24);
    }

    function tick() {
      if (!paused && kit.run.isRunning() && Date.now() >= nextMoveAt) {
        moveTarget();
        scheduleTargetMove();
      }
    }

    function onKeydown(event) {
      if (paused || !kit.run.isRunning()) return;
      const moves = {
        arrowleft: [-1, 0], q: [-1, 0], a: [-1, 0],
        arrowright: [1, 0], d: [1, 0],
        arrowup: [0, -1], z: [0, -1], w: [0, -1],
        arrowdown: [0, 1], s: [0, 1],
      };
      const move = moves[event.key.toLowerCase()];
      if (!move) return;
      event.preventDefault();
      player.x = Math.max(0, Math.min(8, player.x + move[0]));
      player.y = Math.max(0, Math.min(8, player.y + move[1]));
      if (player.x === target.x && player.y === target.y) {
        kit.score.add(100);
        kit.ui.setStatus(`Pixel collecté ! ${kit.score.current()} points.`);
        moveTarget();
        scheduleTargetMove();
      }
      render();
    }

    kit.events.on(shell, "keydown", onKeydown);
    render();

    function startTimer() {
      if (moveTimer == null) moveTimer = kit.timers.interval(tick, 100);
    }
    function stopTimer() {
      if (moveTimer != null) { kit.timers.clear(moveTimer); moveTimer = null; }
    }

    return {
      start() {
        player = { x: 1, y: 4 };
        target = { x: 6, y: 4 };
        startedAt = Date.now();
        paused = false;
        scheduleTargetMove();
        render();
        kit.run.start();
        kit.ui.setStatus("Partie lancée. Collectez les pixels jaunes : 100 points chacun.");
        startTimer();
        shell.focus();
      },
      pause() { paused = true; stopTimer(); },
      resume() { if (!kit.run.isRunning()) return; paused = false; scheduleTargetMove(); startTimer(); shell.focus(); },
      destroy() { paused = true; stopTimer(); root.replaceChildren(); },
    };
  },
};
