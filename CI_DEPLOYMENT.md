# Publication des jeux par la CI

Aucune commande n'est nécessaire sur la machine de production. Le catalogue Git est la source de configuration et le volume SQLite reste la source d'historique.

## Ajouter une édition

1. Créer `public/games/<slug>/` avec `game.js`, `assets/` et `README.md`.
2. Ajouter l'édition dans `src/config/games.json`.
3. Ajuster `endsAt` du jeu précédent pour qu'il soit égal au `startsAt` du nouveau.
4. Lancer `npm run check` dans la CI.
5. Construire puis déployer l'image Docker en conservant le même volume `/data`.

Exemple de catalogue :

```json
[
  {
    "slug": "jeu-2026-w41",
    "title": "Jeu semaine 41",
    "startsAt": "2026-10-05T08:00:00+02:00",
    "endsAt": "2026-10-12T08:00:00+02:00",
    "moduleUrl": "/games/jeu-2026-w41/game.js",
    "durationSeconds": 45,
    "maxScore": 50000
  }
]
```

Les dates sont converties en UTC lors de leur enregistrement. Il est donc conseillé d'écrire explicitement le décalage français (`+02:00` en heure d'été, `+01:00` en heure d'hiver).

Le déploiement :

- crée les nouveaux jeux dans SQLite ;
- met à jour les dates et libellés des entrées déjà déclarées ;
- refuse les identifiants dupliqués, modules remplacés, dates invalides et périodes qui se chevauchent ;
- active automatiquement l'édition correspondant à la date courante ;
- ne supprime jamais les anciennes éditions, parties ou scores.

## Lire les résultats sans accès serveur

Jeu actif :

```text
GET https://retrogaming.tousamba.cloud/api/games
```

Historique des éditions et identifiants numériques :

```text
GET https://retrogaming.tousamba.cloud/api/games?history=1
```

Classement du jeu actif :

```text
GET https://retrogaming.tousamba.cloud/api/leaderboard
```

Classement d'une édition passée :

```text
GET https://retrogaming.tousamba.cloud/api/leaderboard?gameId=12
```

La requête doit être faite depuis une session Primetime valide afin que le classement soit limité à son tenant. Le résultat JSON contient les dix meilleurs participants, avec le meilleur score de chacun et la date de réalisation.

## Administration Communication

L'interface `/admin` permet, avec `ADMIN_API_TOKEN` :

- de consulter jusqu'aux 500 parties les plus récentes avec filtres jeu et tenant ;
- d'exporter toutes les parties filtrées au format CSV ;
- de programmer les dates de début et de fin d'une édition ;
- de créer l'entrée d'un jeu dont le module a déjà été livré par la CI.

Le jeton administrateur doit être long et aléatoire, conservé dans les secrets de déploiement et transmis à l'équipe autorisée par un canal sûr. Il n'est enregistré ni en cookie ni dans le stockage du navigateur.
