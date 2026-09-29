# COM Arcade

Service Next.js autonome proposant un jeu JavaScript hebdomadaire et un classement interne persistant dans SQLite.

La publication et la rotation ne nécessitent aucun accès à la machine : elles sont pilotées par le catalogue Git `src/config/games.json`. Voir `CI_DEPLOYMENT.md`.

## Développement local

```bash
npm install
npm run dev
```

En développement, le formulaire de prénom/pseudo fournit une identité locale. Le jeu de démonstration se trouve dans `public/games/demo/` et respecte le contrat `GAMEKIT.md`.

Pour tester localement une édition en dehors de ses dates de diffusion, définir temporairement `GAME_OVERRIDE_SLUG` avec son identifiant. Cette variable ne doit jamais être configurée en production.

Vérification complète :

```bash
npm run check
docker compose up --build
```

La base locale se trouve dans `data/arcade.db`. Dans Docker, elle est persistée dans le volume monté sur `/data`.

## Production et iframe Primetime

Copier `.env.example` vers un fichier d’environnement non versionné et renseigner les secrets. Voir `INTEGRATION_PRIMETIME.md` pour le JWT d’entrée, les tenants, la session interne, la CSP et la rotation des secrets.

Le mode `ALLOW_DEV_IDENTITY=true` fourni dans `docker-compose.yml` sert à la démonstration locale et doit être désactivé en production.

## Publier un nouveau jeu avec la CI

1. Valider le ZIP avec `BRIEF_JEU_HEBDO.md` et `GAMEKIT.md`.
2. Copier son contenu dans `public/games/<identifiant>/`.
3. Ajouter une entrée datée dans `src/config/games.json` avec un identifiant jamais utilisé.
4. Vérifier que les périodes de diffusion ne se chevauchent pas.
5. Commiter ces fichiers : la CI construit et déploie l'image, sans commande à lancer sur le serveur.

```json
{
  "slug": "jeu-2026-w41",
  "title": "Jeu semaine 41",
  "startsAt": "2026-10-05T08:00:00+02:00",
  "endsAt": "2026-10-12T08:00:00+02:00",
  "moduleUrl": "/games/jeu-2026-w41/game.js",
  "durationSeconds": 45,
  "maxScore": 50000
}
```

L'application synchronise le catalogue avec SQLite et active automatiquement le jeu correspondant à la date courante. Une rotation ne supprime jamais les jeux, parties ou scores précédents. Pour couper le jeu de démonstration au lancement du premier vrai jeu, régler son `endsAt` exactement à la même date que le `startsAt` du nouveau jeu.

## API

- `GET /api/games` : jeu actif ; ajouter `?history=1` pour l’historique.
- `GET /api/leaderboard?gameId=<id>` : meilleur score par participant, isolé par tenant.
- `POST /api/runs` : création et finalisation contrôlée d’une session de jeu.
- `GET /iframe/enter?t=<jwt>` : vérification du jeton Primetime et ouverture de la session interne.
- `GET /admin` : interface protégée de programmation, consultation des parties et export CSV.
- `GET /api/admin/scores?format=csv` : export complet protégé par `ADMIN_API_TOKEN`.
