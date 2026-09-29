# Brief de commande — jeu hebdomadaire COM Arcade

> Document prêt à transmettre au service Communication, à un studio ou à un prestataire. Les champs entre crochets doivent être complétés avant envoi.

## 1. Contexte

COM Arcade est le mini-jeu hebdomadaire intégré à l’intranet Primetime. Vous ne développez pas un site ni une application autonome : vous livrez uniquement une mécanique de jeu compatible avec notre contrat `GAMEKIT.md`.

COM Arcade prend déjà en charge l’identité, le tenant, la session, le chrono officiel, l’enregistrement des parties, le meilleur score par participant et le classement. Le jeu ne doit recréer aucune de ces fonctions.

## 2. Fiche éditoriale

| Élément | Valeur à compléter |
| --- | --- |
| Nom court du jeu | [nom] |
| Identifiant unique | [slug jamais utilisé auparavant] |
| Thème / campagne | [thème] |
| Diffusion | [date et heure de début] → [date et heure de fin] |
| Durée d’une partie | [20 à 120 secondes] |
| Objectif | [une phrase] |
| Contrôles | [touches et éventuels contrôles tactiles] |
| Formule exacte du score | [formule, bonus et pénalités] |
| Score maximum théorique | [entier] |
| Accroche | [120 caractères maximum] |

Chaque nouvelle semaine reçoit un identifiant de jeu inédit. Un jeu ou un identifiant déjà diffusé ne doit jamais être réutilisé : les éditions passées et leurs scores restent historisés.

## 3. Intention créative

Concevez un rétro-jeu :

- compris en moins de dix secondes, sans connaissance métier ;
- agréable à rejouer pendant une partie de 20 à 120 secondes ;
- jouable intégralement au clavier et sans son ;
- utilisable dans un cadre 16:9 responsive à partir de 320 px de large ;
- doté d’une difficulté progressive, lisible et équitable ;
- valorisant, non violent, non anxiogène, non politique et non clivant.

Les contrôles, l’objectif et la règle de score doivent rester visibles ou accessibles pendant la partie. Le hasard peut varier une partie, mais ne doit pas rendre le classement arbitraire.

## 4. Livrable obligatoire

Livrez un ZIP dont le contenu décompressé pèse moins de 5 Mo et contient un seul dossier :

```text
game/
  game.js
  assets/
  README.md
```

Contraintes :

- `game.js` est un module JavaScript ES natif exportant `game` ;
- aucun framework, package npm, CDN, serveur, `index.html`, iframe ou code compilé opaque ;
- aucun appel réseau (`fetch`, WebSocket, beacon), analytics, publicité ou tracking ;
- aucun cookie, `localStorage`, `sessionStorage` ou autre stockage navigateur ;
- aucun formulaire, compte, nom, e-mail ou identifiant utilisateur demandé par le jeu ;
- aucun accès ou changement de `document.body`, du titre, de l’URL ou des styles de l’hôte ;
- tous les assets sont locaux, optimisés, crédités et sous licence compatible ;
- compatibilité avec les versions récentes de Chrome et Edge.

Le contrat technique complet joint à la commande est `GAMEKIT.md`. En cas de différence, ce contrat prévaut.

## 5. Cycle de vie et score

Le jeu doit fournir `mount`, puis un contrôleur avec `start`, `pause`, `resume` et `destroy`.

- `start()` remet toujours la mécanique dans son état initial et appelle `kit.run.start()`.
- `pause()` stoppe immédiatement les animations et interactions du jeu.
- `resume()` reprend sans remettre la partie à zéro.
- `destroy()` retire tous les éléments créés par le jeu.
- Le chrono officiel appartient à COM Arcade et termine automatiquement la partie à la durée annoncée.
- Une fin naturelle anticipée peut appeler `kit.run.finish(reason)`.
- Le score passe exclusivement par `kit.score.add()` ou `kit.score.set()`.
- Aucun score ne peut être ajouté après la fin d’une partie.

Le jeu doit supporter au minimum une partie complète, un replay sur la même instance, une mise en pause/reprise et une destruction.

## 6. Accessibilité et responsive

- toutes les actions sont disponibles au clavier ;
- le focus clavier est visible et placé dans le jeu au démarrage ;
- aucune information n’est communiquée uniquement par la couleur ou le son ;
- les consignes et retours importants sont textuels via `kit.ui.setStatus()` ;
- les animations respectent `prefers-reduced-motion` ;
- les textes et éléments interactifs conservent un contraste lisible ;
- aucune touche ne piège définitivement le focus ;
- le jeu reste utilisable de 320 px de large jusqu’au plein écran.

## 7. README et livrables complémentaires

Le README du jeu doit indiquer :

- objectif, règles et contrôles ;
- durée et conditions de fin ;
- formule détaillée du score et maximum théorique ;
- liste exhaustive des assets, auteurs, sources et licences ;
- navigateurs testés ;
- limites connues.

Joignez également une capture ou une maquette de l’écran de jeu et le texte éditorial final destiné aux joueurs.

## 8. Recette d’acceptation

La livraison est acceptée si :

1. le ZIP respecte exactement la structure et la limite de poids ;
2. le module s’importe sans erreur et son manifeste correspond au jeu commandé ;
3. deux parties consécutives donnent un état propre et indépendant ;
4. le chrono, la pause, la reprise, la fin naturelle et la fin anticipée fonctionnent ;
5. le score correspond à la formule annoncée et reste dans les limites convenues ;
6. `destroy()` ne laisse aucun DOM, timer, listener ou audio actif ;
7. aucune requête réseau ni stockage navigateur n’est produit ;
8. le clavier, le responsive et la réduction des animations sont vérifiés ;
9. la console reste sans erreur pendant toute la recette ;
10. les assets et leurs licences sont complets.

Une livraison qui échoue à l’un de ces critères est retournée pour correction.
