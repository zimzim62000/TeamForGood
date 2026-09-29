export const game = {
  manifest: {
    id: "neon-dodger",
    title: "Neon Dodger — Démonstration",
    version: "1.0.0",
    durationSeconds: 30,
    controls: "Flèches ou ZQSD",
    scoring: "+100 par pixel collecté",
  },

  mount(root, kit) {
    let player = { x: 1, y: 4 };
    let target = { x: 6, y: 4 };
    let paused = true;

    root.innerHTML = `
      <style>
        .pp-game { position:relative; width:100%; height:100%; min-height:260px; overflow:hidden; color:#fff; background:linear-gradient(135deg,#20134b,#101b3c); outline:0; }
        .pp-grid { position:absolute; inset:0; opacity:.18; background-image:linear-gradient(#9ee7ff 1px,transparent 1px),linear-gradient(90deg,#9ee7ff 1px,transparent 1px); background-size:11.111% 11.111%; }
        .pp-player,.pp-target { position:absolute; width:8%; aspect-ratio:1; transform:translate(-50%,-50%); transition:left 80ms linear,top 80ms linear; }
        .pp-player { background:#ff6b35; border:3px solid #fff; box-shadow:4px 4px 0 #ffd166; }
        .pp-target { display:grid; place-items:center; color:#ffd166; font-size:clamp(28px,6vw,56px); filter:drop-shadow(0 0 8px #ffd166); animation:pp-pulse .7s infinite alternate; }
        .pp-copy { position:absolute; left:5%; right:5%; bottom:5%; margin:0; text-align:center; font:700 clamp(12px,2vw,16px) Arial,sans-serif; }
        @keyframes pp-pulse { to { transform:translate(-50%,-50%) scale(1.2); } }
        @media (prefers-reduced-motion:reduce) { .pp-player,.pp-target { transition:none; animation:none; } }
      </style>
      <div class="pp-game" tabindex="0" role="application" aria-label="Pixel Panic, utilisez les flèches ou ZQSD pour collecter l'étoile">
        <div class="pp-grid"></div>
        <div class="pp-player" aria-hidden="true"></div>
        <div class="pp-target" aria-hidden="true">✦</div>
        <p class="pp-copy">FLÈCHES / ZQSD · COLLECTEZ LE PIXEL JAUNE</p>
      </div>`;

    const shell = root.querySelector(".pp-game");
    const playerNode = root.querySelector(".pp-player");
    const targetNode = root.querySelector(".pp-target");

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
    }

    function onKeydown(event) {
      if (paused || !kit.run.isRunning()) return;
      const key = event.key.toLowerCase();
      const moves = { arrowleft: [-1, 0], q: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0], arrowup: [0, -1], z: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1] };
      const move = moves[key];
      if (!move) return;
      event.preventDefault();
      player.x = Math.max(0, Math.min(8, player.x + move[0]));
      player.y = Math.max(0, Math.min(8, player.y + move[1]));
      if (player.x === target.x && player.y === target.y) {
        kit.score.add(100);
        kit.ui.setStatus(`Pixel collecté ! ${kit.score.current()} points.`);
        moveTarget();
      }
      render();
    }

    kit.events.on(shell, "keydown", onKeydown);
    render();

    return {
      start() {
        player = { x: 1, y: 4 };
        target = { x: 6, y: 4 };
        paused = false;
        render();
        kit.run.start();
        kit.ui.setStatus("Partie lancée. Collectez le pixel jaune.");
        shell.focus();
      },
      pause() { paused = true; },
      resume() { paused = false; shell.focus(); },
      destroy() { paused = true; root.replaceChildren(); },
    };
  },
};
