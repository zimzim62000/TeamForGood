# Palette Rush — module COM Arcade

Édition **palette-rush-2026-w41** — diffusion du lundi 5 octobre 2026 à 08:00 au lundi 12 octobre 2026 à 08:00 (heure de Paris). Thème : **Octobre Rose & Movember**.

Conforme au contrat `GAMEKIT.md` v1 fourni par l'IT.

## Objectif, règles et contrôles

Un cariste pousse son transpalette dans un entrepôt vu de dessus. Il faut se faufiler entre les colonnes de palettes qui défilent et récolter un maximum de fruits et légumes, pendant les 30 secondes de la partie.

- **Contrôles** : Espace ou flèche haut (clavier), clic ou tap (souris/tactile) — fait "sauter" le transpalette. Jouable intégralement au clavier, sans son.
- La difficulté (largeur des couloirs, vitesse de défilement) augmente progressivement et régulièrement du début à la fin des 30 secondes.
- Une collision avec une colonne de palettes, le plafond ou le sol met fin à la partie immédiatement (le module appelle alors `kit.run.finish("collision")`).
- Si le joueur tient les 30 secondes sans collision, la partie se termine naturellement à l'expiration du chrono officiel de l'hôte ; le module ne rappelle pas `kit.run.finish()` dans ce cas, conformément au contrat.
- À la fin de chaque partie (collision ou temps écoulé), un encart affiche au hasard un chiffre clé, un fait ("le saviez-vous ?") ou une idée reçue démontée, sur Octobre Rose et Movember mélangés (dépistage du cancer du sein, de la prostate, du testicule, santé mentale masculine). Un tirage "sac mélangé" garantit qu'aucune capsule ne repasse avant que les 40 disponibles soient toutes sorties.
- Les deux numéros d'aide sont affichés en permanence sur l'écran de fin : **0 805 123 124** (Cancer info service) et **3114** (numéro national de prévention du suicide, 24h/24).

## Durée et conditions de fin

- Durée officielle : **30 secondes**, configurée dans `manifest.durationSeconds` et devant correspondre à la configuration COM Arcade.
- Fin anticipée : collision (`kit.run.finish("collision")`).
- Fin naturelle : expiration du chrono officiel de l'hôte (aucun appel `finish()` du module).
- Le jeu supporte un replay complet sur la même instance (`start()` réinitialise totalement l'état), une pause/reprise sans perte d'état, et une destruction propre (`destroy()` stoppe tous les timers et vide `root`).

## Formule de score

- **+10 points** par colonne de palettes franchie.
- **+30 points** par fruit ou légume récolté (récolte non garantie à chaque colonne : environ 4 colonnes sur 5 portent un fruit).
- Toutes les additions passent exclusivement par `kit.score.add()`, avec des valeurs entières strictement positives (10 ou 30).

**Score maximum théorique : environ 960 points.** Les colonnes apparaissent à cadence fixe (une toutes les 1,15 s), soit 27 apparitions possibles en 30 secondes ; compte tenu du temps de trajet à l'écran, au plus 24 d'entre elles peuvent être réellement franchies avant la fin du chrono. En supposant une partie parfaite avec un fruit récolté à chaque passage : 24 × (10 + 30) = 960 points. Ce plafond est théorique (nécessite une exécution parfaite et une chance maximale sur l'apparition des fruits) ; les parties testées atteignent typiquement 400 à 650 points pour un bon niveau de jeu.

## Accessibilité et responsive

- Toutes les actions sont jouables au clavier (Espace / flèche haut), en plus du clic/tap.
- Le focus clavier est placé automatiquement dans le jeu au démarrage (`wrap.focus()`) et reste visible (anneau bleu ajouté/retiré via les événements `focus`/`blur`, enregistrés par `kit.events.on`).
- Le score et les événements importants (score, collision, fin de partie) sont annoncés textuellement via `kit.ui.setStatus()`, en plus de leur affichage visuel — aucune information n'est portée uniquement par la couleur ou le son.
- `prefers-reduced-motion` est respecté : les particules, l'effet de secousse à la collision et le flou de mouvement des fruits sont désactivés si le système le demande (écouté dynamiquement via `kit.events.on(mediaQueryList, "change", …)`).
- Le canvas est redimensionné en fonction de `root` (résolution logique 960×540, 16:9) et se met à jour sur `resize` (écouté via `kit.events.on(window, "resize", …)`). Fonctionne de 320 px de large jusqu'au plein écran.
- Aucun élément interactif imbriqué : un seul conteneur focusable contient le canvas, donc aucun piège de focus possible.
- Contraste : palette Primever (bleu #0058A2/#2873B1/#69ACDF) sur fond sombre, texte clair (#F4F1E8) — contrastes élevés partout.

## Assets

**Aucun asset externe.** Tout est généré par code :

- Personnage, entrepôt, palettes, fruits et légumes : dessinés en Canvas 2D (formes vectorielles + emoji Unicode natifs du système, aucune police ni image chargée).
- Logo Primever : reproduit à l'identique à partir du tracé vectoriel officiel (`logo PRIMEVER_blanc.svg`), intégré en dur dans `game.js` sous forme de `Path2D` et rempli en blanc — aucun fichier image, aucun appel réseau.
- Sons (flap, score, récolte, collision) : synthétisés en direct via l'API Web Audio native (oscillateurs), aucun fichier audio. Le jeu reste entièrement jouable et compréhensible sans son.
- Aucune police externe : tout le texte du canvas utilise la pile système (`system-ui, -apple-system, Arial, sans-serif`).

Le dossier `assets/` est donc vide (aucun fichier à livrer).

## Navigateurs testés

- Chrome (dernière version stable) — testé.
- Le module n'utilise que des API web standard (Canvas 2D, `Path2D`, Web Audio, `matchMedia`, ES modules) supportées par les versions récentes de Chrome et Edge.

## Limites connues

- Le contenu de sensibilisation (chiffres, faits, idées reçues) est fixé dans le code à la date de livraison ; toute mise à jour ultérieure des chiffres nécessite une nouvelle édition du module (nouvel `id`, conformément à la règle "un identifiant n'est jamais réutilisé").
- Le thème visuel (accessoire du personnage : ruban rose) est fixé sur "Octobre Rose" pour cette édition ; une future édition dédiée à Movember (courant novembre) nécessitera un nouveau module avec un `id` distinct et la variable `CAMPAIGN` basculée sur `"movember"` en tête de fichier.
- Aucune persistance ni identité n'est gérée par le module (conformément au contrat) : le meilleur score par participant et le classement sont entièrement à la charge de COM Arcade.
- Le texte des capsules de sensibilisation n'est pas lu automatiquement par un lecteur d'écran au-delà du résumé fourni via `kit.ui.setStatus()` au moment de la collision/fin de partie (qui annonce le score final, pas le contenu de la capsule elle-même).

## Accroche (120 caractères max)

> Slalomez 30 s entre les palettes, récoltez fruits & légumes : sensibilisation Octobre Rose & Movember.

(102 caractères)
