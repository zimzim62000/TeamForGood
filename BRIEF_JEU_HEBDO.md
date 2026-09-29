# Brief de commande — prochain jeu COM Arcade

> À envoyer tel quel au service Communication, au studio ou au prestataire.

Nous préparons le prochain jeu de **COM Arcade**, le mini-jeu hebdomadaire de notre intranet. Vous ne développez pas une application complète : vous fournissez une mécanique de jeu qui sera intégrée à notre **COM Arcade GameKit**. Notre plateforme gère l'utilisateur, le chrono officiel, la persistance des scores et le classement.

## Informations éditoriales à compléter

| Élément | Valeur |
| --- | --- |
| Nom du jeu | [nom court et mémorisable] |
| Thème / campagne COM | [thème] |
| Diffusion | [date de début] → [date de fin] |
| Objectif joueur | [une phrase] |
| Règle de score | [une phrase] |
| Accroche | [maximum 120 caractères] |

## Votre mission créative

Concevez un rétro-jeu immédiat à comprendre et plaisant à rejouer, pour des collaborateurs internes. La durée d'une partie doit être de **20 à 120 secondes**. Le jeu doit être accessible sans connaissance métier, jouable au clavier et sans son, avec des instructions très courtes et une règle de score transparente.

Nous recherchons une boucle de jeu claire, une direction artistique rétro lisible, une difficulté progressive mais équitable et un résultat valorisant. Évitez les mécanismes frustrants, le pay-to-win et les contenus violents, clivants, politiques ou anxiogènes.

## Livrable technique obligatoire

Livrez un fichier ZIP de moins de 5 Mo contenant uniquement :

```text
game/
  game.js
  assets/
  README.md
```

Le fichier `game.js` est un module JavaScript ES natif sans framework, dépendance, CDN, serveur, `package.json`, `index.html` ni iframe. Il doit suivre strictement le contrat [GAMEKIT.md](./GAMEKIT.md) joint à ce brief : objet exporté `game`, méthode `mount(root, kit)` et méthodes `start`, `pause`, `destroy`.

Le score est transmis exclusivement via `kit.score.add()` ou `kit.score.set()`, puis la fin de jeu via `kit.run.finish()`. Ne créez pas de formulaire, de compte, de stockage navigateur, d'appel réseau ni de système de classement : ils sont fournis par COM Arcade.

## Livrables complémentaires

- une capture ou maquette de l'écran de jeu ;
- le texte final des règles et contrôles ;
- la formule exacte du score ;
- une liste complète des assets, auteurs et licences ;
- le README technique complété selon le GameKit.

## Définition de « prêt à intégrer »

Le jeu est accepté après démonstration d'une partie complète, d'une fin de partie, d'un redémarrage et d'une destruction propre, sans erreur console ni requête réseau. Tout livrable qui ne respecte pas le GameKit ou introduit une dépendance externe sera retourné pour correction.
