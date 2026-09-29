# COM Arcade GameKit — contrat d'intégration

## Pourquoi ce kit existe

Le jeu est remplaçable chaque semaine ; le service COM Arcade, l'identité intranet, les scores et les classements ne le sont pas. Un fournisseur de jeu ne livre donc jamais une application autonome, une base de données ou une authentification. Il livre une mécanique de jeu branchée sur notre GameKit.

## Ce que COM Arcade fournit

- l'écran, le responsive et le design système ;
- l'identité de la personne connectée ;
- le chrono officiel de la partie ;
- la session de jeu, l'enregistrement du score, le classement et l'historique ;
- le cycle de vie : démarrer, mettre en pause, terminer, rejouer, détruire ;
- un conteneur DOM vide `root` et les assets validés.

## Ce que le fournisseur fournit

Un dossier `game/` contenant exactement :

```text
game/
  game.js        # module ES, sans framework ni dépendance
  assets/        # images, sprites, sons, polices sous licence
  README.md      # règle, contrôles, score, crédits
```

Il ne fournit ni `index.html`, ni serveur, ni `package.json`, ni CDN, ni iframe.

## Module attendu

`game.js` exporte un objet `game` qui respecte ce contrat :

```js
export const game = {
  manifest: { id: "pixel-panic", title: "Pixel Panic", version: "1.0.0", durationSeconds: 45, controls: "Flèches ou ZQSD", scoring: "10 points par pixel collecté" },
  mount(root, kit) {
    // Construire tout le jeu exclusivement dans root.
    return { start() {}, pause() {}, destroy() {} };
  }
};
```

L'hôte appelle `mount`, puis `start`. Il peut appeler `pause` lors d'une perte de visibilité et appellera toujours `destroy` en fin de partie ou au changement de jeu.

## API GameKit disponible dans `mount(root, kit)`

```ts
kit.run.start(): void
kit.run.finish(reason?: string): void
kit.run.isRunning(): boolean
kit.score.add(points: number): void      // entier positif, maximum 10 000 par appel
kit.score.set(value: number): void       // entier >= 0 ; seulement si la règle le justifie
kit.score.current(): number
kit.ui.setStatus(text: string): void     // message accessible, max. 160 caractères
kit.timers.timeout(callback, ms): number // timers nettoyés automatiquement
kit.timers.interval(callback, ms): number
kit.timers.clear(id): void
kit.events.on(target, event, handler): void // listener nettoyé automatiquement
kit.assets.url(relativePath: string): string
```

Le GameKit refuse un score hors bornes, un score après `finish`, et les appels après `destroy`. `finish` déclenche le stockage du score côté serveur : le jeu ne fait jamais de `fetch` pour envoyer un score.

## Règles non négociables

- JavaScript ES natif, compatible Chrome et Edge récents ; pas de React, Phaser, Unity, CDN, npm ou dépendance téléchargée.
- Aucun `fetch`, WebSocket, localStorage, cookie, analytics, tracking, publicité, iframe, popup ou authentification.
- Aucun nom, e-mail ou identifiant utilisateur ne doit être demandé, affiché ou transmis.
- Le jeu est jouable clavier et sans son ; les consignes et retours de jeu doivent être textuels.
- Le jeu doit fonctionner dans un espace 16:9 responsive, à partir de 320 px de large.
- Tous les assets sont livrés, optimisés ; poids total inférieur à 5 Mo ; licences et crédits fournis.
- Le jeu ne modifie jamais `document.body`, le titre de page ou les styles de l'hôte ; tous les éléments sont dans `root`.

## Validation de livraison

La livraison est acceptée seulement si :

1. `game.js` s'importe sans erreur et expose le contrat ci-dessus ;
2. une partie se lance, se termine naturellement et peut être rejouée ;
3. `destroy()` laisse le DOM, les timers, les listeners et l'audio propres ;
4. les appels `kit.score.*` produisent le score attendu selon la règle annoncée ;
5. aucun appel réseau ne se produit pendant une partie ;
6. le README liste règles, contrôles, formule de score, durée, assets et licences.

## Exemple minimal

```js
export const game = {
  manifest: { id: "catch-star", title: "Catch Star", version: "1.0.0", durationSeconds: 30, controls: "Clic ou Entrée", scoring: "+10 par étoile" },
  mount(root, kit) {
    const button = document.createElement("button");
    button.textContent = "✦";
    root.append(button);
    kit.events.on(button, "click", () => { if (kit.run.isRunning()) kit.score.add(10); });
    return { start() { kit.run.start(); }, pause() {}, destroy() { root.replaceChildren(); } };
  }
};
```
