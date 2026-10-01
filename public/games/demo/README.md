# Neon Dodger — jeu de démonstration

## Fiche de jeu

- **Identifiant** : `neon-dodger` (entrée de secours permanente, jamais recréée)
- **Objectif** : déplacer le carré orange et collecter les pixels jaunes.
- **Contrôles** : flèches, ZQSD ou WASD. Le jeu est entièrement jouable au clavier.
- **Durée** : 30 secondes, mesurées et terminées par COM Arcade.
- **Fin anticipée** : aucune ; la partie se termine à l'expiration du chrono officiel.
- **Score** : `100 × nombre de pixels collectés`.
- **Score maximum configuré** : 10 000 points (plafond de la plateforme).

La cible se déplace automatiquement, avec un intervalle qui diminue progressivement pour augmenter la difficulté sans rendre le résultat arbitraire. Une nouvelle partie réinitialise toute la grille. La pause, la reprise et la destruction sont gérées par le cycle de vie GameKit.

## Accessibilité et compatibilité

Les consignes et les retours de score passent aussi par `kit.ui.setStatus()`. Le focus est placé dans la zone de jeu au démarrage, son indicateur reste visible et `prefers-reduced-motion` désactive les animations décoratives. L'affichage reste responsive à partir de 320 px.

## Assets, sources et licences

Aucun asset externe : le décor, le carré et le pixel sont générés en HTML/CSS. Le code est original et livré sous la licence du projet COM Arcade. Aucun appel réseau, stockage navigateur, cookie, framework ou dépendance n'est utilisé.

## Navigateurs testés et limites

Compatible avec les versions récentes de Chrome et Edge. Le hasard de la position de la cible varie légèrement les parties ; le déplacement progressif reste borné et le score est plafonné par COM Arcade. Le jeu est un fallback technique, destiné à maintenir une expérience jouable entre deux rotations hebdomadaires.

## Texte joueur

> Collectez les pixels jaunes en 30 secondes. La cible bouge de plus en plus vite : flèches ou ZQSD/WASD pour vous déplacer.
