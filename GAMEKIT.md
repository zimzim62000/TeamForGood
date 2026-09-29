# COM Arcade GameKit — contrat d’intégration v1

## Responsabilités

COM Arcade fournit le conteneur responsive, l’identité et le tenant, la session de partie, le chrono officiel, le score, sa persistance et le classement. Le module hebdomadaire fournit uniquement la mécanique visuelle et interactive.

Le jeu reçoit un élément DOM vide `root`. Tout ce qu’il crée doit rester dans cet élément.

## Module attendu

```js
export const game = {
  manifest: {
    id: "pixel-panic-2026-w40",
    title: "Pixel Panic",
    version: "1.0.0",
    durationSeconds: 45,
    controls: "Flèches ou ZQSD",
    scoring: "+100 par pixel collecté"
  },
  mount(root, kit) {
    return {
      start() {},
      pause() {},
      resume() {},
      destroy() {}
    };
  }
};
```

Le champ `id` est immuable et inédit. `durationSeconds` est un entier compris entre 20 et 120 et doit correspondre à la durée configurée dans COM Arcade.

## Cycle de vie

1. L’hôte importe le module une seule fois et appelle `mount(root, kit)`.
2. Après création de la session serveur, l’hôte appelle `start()` ; le jeu réinitialise son état puis appelle `kit.run.start()`.
3. En cas de perte de visibilité, l’hôte appelle `pause()`. Le chrono officiel continue afin d’éviter les avantages liés au changement d’onglet.
4. Au retour, l’hôte appelle `resume()` si la partie n’est pas terminée.
5. L’hôte termine automatiquement la partie lorsque la durée officielle expire. Le jeu peut terminer plus tôt avec `kit.run.finish(reason)`.
6. Pour rejouer, l’hôte rappelle `start()` sur la même instance.
7. Au changement de jeu ou démontage de la page, l’hôte appelle `destroy()` puis nettoie aussi les ressources enregistrées via le kit.

Après `pause()`, aucune interaction ne doit modifier le jeu ou le score. Après `destroy()`, aucun appel au kit n’est autorisé.

## API disponible

```ts
kit.run.start(): void
kit.run.finish(reason?: string): void
kit.run.isRunning(): boolean

kit.score.add(points: number): void
kit.score.set(value: number): void
kit.score.current(): number

kit.ui.setStatus(text: string): void

kit.timers.timeout(callback: () => void, ms: number): number
kit.timers.interval(callback: () => void, ms: number): number
kit.timers.clear(id: number): void

kit.events.on(target: EventTarget, event: string, handler: EventListener): void
kit.assets.url(relativePath: string): string
```

Règles d’utilisation :

- `score.add` accepte un entier strictement positif, limité à 10 000 par appel ;
- `score.set` accepte un entier positif ou nul uniquement si la formule du jeu le justifie ;
- le total est plafonné au maximum défini lors de l’intégration ;
- les appels de score hors partie ou après la fin sont ignorés ;
- `setStatus` accepte au maximum 160 caractères et sert aux retours accessibles ;
- les timers et listeners doivent obligatoirement être créés via le kit ;
- `assets.url` ne doit viser qu’un fichier livré dans `assets/`.

Le score envoyé par le module reste contrôlé par la plateforme : une session serveur possède un jeu, un tenant, un participant, une heure de départ, une échéance et une seule soumission finale.

## Interdictions

- React, Phaser, Unity, npm, dépendance externe, CDN ou iframe ;
- `fetch`, XMLHttpRequest, WebSocket, EventSource, beacon ;
- cookies, stockage local ou cache applicatif ;
- authentification ou collecte d’identité ;
- modification du document hôte hors de `root` ;
- listeners ou timers natifs non enregistrés via le kit ;
- contenu violent, anxiogène, politique, clivant ou publicitaire.

## Exemple minimal

```js
export const game = {
  manifest: {
    id: "catch-star-2026-w40",
    title: "Catch Star",
    version: "1.0.0",
    durationSeconds: 30,
    controls: "Entrée",
    scoring: "+10 par étoile"
  },
  mount(root, kit) {
    const button = document.createElement("button");
    button.textContent = "✦";
    root.append(button);
    kit.events.on(button, "click", () => {
      if (kit.run.isRunning()) kit.score.add(10);
    });
    return {
      start() { kit.run.start(); button.focus(); },
      pause() { button.disabled = true; },
      resume() { button.disabled = false; button.focus(); },
      destroy() { root.replaceChildren(); }
    };
  }
};
```
