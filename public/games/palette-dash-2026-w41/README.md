# Palette Dash — module COM Arcade

Édition diffusée le 6 octobre 2026 de 08:00 à 20:00 (heure de Paris), sous l'identifiant immuable `palette-dash-2026-w41`. La durée officielle est configurée à 45 secondes dans le module et dans COM Arcade.

Conforme au contrat `GAMEKIT.md` v1.

## Objectif, règles et contrôles

Un jeu de course sans fin façon "dinosaure hors-ligne", aux couleurs Primever : un cariste court automatiquement dans un couloir d'entrepôt, le joueur doit sauter par-dessus les palettes au sol et se baisser sous les charges suspendues.

- **Contrôles** : Espace ou flèche haut (ou bouton SAUT) pour sauter ; flèche bas, maintenue (ou bouton BAS, maintenu) pour se baisser. Jouable intégralement au clavier, sans son.
- Deux types d'obstacles : des palettes au sol (à sauter) et des charges suspendues (à éviter en se baissant). Certains obstacles portent un fruit ou légume bonus à proximité.
- La vitesse de course augmente progressivement et régulièrement du début à la fin de la partie (de 320 à 560 px/s), ainsi que la fréquence des obstacles — avec un plancher de sécurité qui garantit toujours un délai suffisant après un saut pour réagir à l'obstacle suivant, pour une difficulté croissante mais équitable.
- Une collision avec un obstacle met fin à la partie immédiatement (le module appelle alors `kit.run.finish("collision")`).
- Si le joueur tient jusqu'à l'expiration du chrono officiel de l'hôte, la partie se termine naturellement (l'arrivée) ; le module ne rappelle pas `kit.run.finish()` dans ce cas, conformément au contrat.
- Une bannière "OCTOBRE ROSE & MOVEMBER" reste visible en permanence dans le bandeau supérieur pendant toute la partie. À la fin de chaque partie (collision ou arrivée), un encart affiche au hasard un chiffre clé, un fait ("le saviez-vous ?") ou une idée reçue démontée, sur Octobre Rose et Movember mélangés (dépistage du cancer du sein, de la prostate, du testicule, santé mentale masculine), avec les deux numéros d'aide (Cancer info service, 3114). Même banque de 40 capsules et même tirage "sac mélangé" (sans répétition avant d'avoir fait le tour) que les autres jeux Palette.

## Durée et conditions de fin

- Durée officielle : **45 secondes** (`manifest.durationSeconds`), identique à la configuration COM Arcade.
- Fin anticipée : collision avec un obstacle (`kit.run.finish("collision")`).
- Fin naturelle : expiration du chrono officiel de l'hôte (aucun appel `finish()` du module) — atteindre la fin du chrono, c'est "gagner" la course.
- Replay complet supporté sur la même instance (`start()` réinitialise entièrement la position, les obstacles et le score affiché côté module), pause/reprise sans perte d'état, destruction propre (`destroy()` stoppe le timer et vide `root`).

## Formule de score

- **+10 points par seconde** de course survécue (calculé en continu, crédité en entiers au fil de la partie).
- **+15 points** par fruit ou légume attrapé en l'air.
- Toutes les additions passent exclusivement par `kit.score.add()`, avec des valeurs entières strictement positives.

**Score maximum théorique : environ 675 points** (pour une durée de 45 s). Survivre l'intégralité des 45 secondes rapporte 450 points (45 × 10) de façon certaine et déterministe. À cela s'ajoutent les fruits bonus : avec un intervalle moyen d'environ 1,2 s entre deux obstacles et 40% de chances qu'un obstacle porte un fruit, environ 37 obstacles apparaissent sur la durée, soit environ 15 fruits si tous sont attrapés (15 × 15 = 225 points). Total théorique : 450 + 225 ≈ 675 points. Ce plafond suppose de survivre sans la moindre collision tout en attrapant chaque fruit ; les parties testées avec une bonne maîtrise se situent couramment entre 200 et 450 points.

## Accessibilité et responsive

- Toutes les actions sont jouables au clavier (Espace/flèche haut pour sauter, flèche bas pour se baisser), en plus des deux boutons tactiles affichés à l'écran.
- Le focus clavier est placé automatiquement dans le jeu au démarrage et reste visible (anneau bleu ajouté/retiré via les événements `focus`/`blur`, enregistrés par `kit.events.on`).
- Le score et les événements importants (collision, fin de partie) sont annoncés textuellement via `kit.ui.setStatus()`, en plus de leur affichage visuel.
- Les deux types d'obstacles se distinguent par leur **position** (au sol / suspendu) et leur **forme**, pas seulement par la couleur.
- `prefers-reduced-motion` est respecté : les particules de saut/collecte et l'effet de flash à la collision sont désactivés si le système le demande (écouté dynamiquement via `kit.events.on(mediaQueryList, "change", …)`).
- Le canvas se redimensionne avec `root` (résolution logique 960×540, 16:9) et se redessine immédiatement après tout changement de taille (écouté via `kit.events.on(window, "resize", …)`), pour éviter tout écran vide après un redimensionnement. Fonctionne de 320 px de large jusqu'au plein écran.
- Aucun élément interactif imbriqué : un seul conteneur focusable contient le canvas, donc aucun piège de focus possible.
- Contraste : palette Primever (bleu #0058A2/#2873B1/#69ACDF) sur fond sombre, texte clair (#F4F1E8).

## Assets

**Aucun asset externe.** Tout est généré par code :

- Personnage, obstacles et décor : dessinés en Canvas 2D (formes vectorielles, aucune image).
- Fruits et légumes affichés via emoji Unicode natifs du système, aucune image chargée.
- Logo Primever : reproduit à l'identique à partir du tracé vectoriel officiel (`logo PRIMEVER_blanc.svg`), intégré en dur dans `game.js` sous forme de `Path2D` et rempli en blanc — aucun fichier image, aucun appel réseau.
- Sons (saut, collecte, collision, tic de chaque seconde) : synthétisés en direct via l'API Web Audio native (oscillateurs), aucun fichier audio. Le jeu reste entièrement jouable et compréhensible sans son.
- Aucune police externe : tout le texte du canvas utilise la pile système (`system-ui, -apple-system, Arial, sans-serif`).

Le dossier `assets/` est donc vide (aucun fichier à livrer).

## Navigateurs testés

- Chrome (dernière version stable) — testé.
- Le module n'utilise que des API web standard (Canvas 2D, `Path2D`, Web Audio, `matchMedia`, ES modules) supportées par les versions récentes de Chrome et Edge.

## Limites connues

- Un plancher de sécurité (`SPAWN_MIN_SAFE`, 0,95 s) garantit un délai minimal entre deux obstacles, toujours supérieur à la durée d'un saut (~0,745 s) : ce réglage a été corrigé pendant les tests internes après avoir constaté qu'un intervalle plus court pouvait créer des enchaînements injouables en fin de partie.
- Pas de double-saut ni de hauteur de saut variable (impulsion fixe), pour rester simple à comprendre en moins de dix secondes.
- Le contenu de sensibilisation (chiffres, faits, idées reçues) est fixé dans le code à la date de livraison ; toute mise à jour ultérieure nécessite une nouvelle édition du module (nouvel `id`, conformément à la règle "un identifiant n'est jamais réutilisé").
- Le texte des capsules de sensibilisation n'est pas lu automatiquement par un lecteur d'écran au-delà du résumé fourni via `kit.ui.setStatus()` au moment de la collision/fin de partie (qui annonce le score final, pas le contenu de la capsule elle-même).
- L'identifiant et la durée ont été confirmés pour cette édition avant mise en production.

## Accroche (120 caractères max)

> Sautez, baissez-vous, 45 secondes chrono : filez dans l'entrepôt sans toucher un obstacle.

(90 caractères)
