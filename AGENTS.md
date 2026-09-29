# COM Arcade — règles produit

## Mission
COM Arcade est un service satellite autonome de l'intranet, porté par le service Communication. Il propose un rétro-jeu JavaScript renouvelé chaque semaine et un classement interne.

## Invariants à ne pas modifier
- Stack : Next.js (App Router), SQLite, Docker.
- Le service reste indépendant du code de l'intranet. Son intégration utilisateur se fait uniquement par un adaptateur/gateway HTTP.
- Toutes les parties sont historisées : jeu, participant, score et date de jeu.
- Le classement d'un jeu repose sur le meilleur score de chaque participant.
- La base SQLite est persistée hors du conteneur, dans le volume `/data`.

## Choix retenu : historiser chaque jeu
Ne jamais réutiliser un identifiant de jeu ni supprimer les scores d'une semaine précédente. Chaque rotation crée une entrée `games`, désactive l'ancienne (`is_active = 0`) et active la nouvelle. Cela permet les classements hebdomadaires, l'audit et des palmarès annuels fiables.

## Identité intranet
Le gateway devra envoyer `x-intranet-user-id` et `x-intranet-user-name`. En local, un prénom/pseudo saisi à l'écran sert de solution de développement. Ne pas faire confiance à un nom envoyé par le navigateur une fois le gateway en place.

## Développement
- `npm run dev` : développement local.
- `docker compose up --build` : exécution conteneurisée.
- Les routes API qui utilisent SQLite doivent rester en runtime Node (`runtime = "nodejs"`), jamais Edge.
- Avant toute modification, conserver la compatibilité avec les données SQLite déjà produites.
