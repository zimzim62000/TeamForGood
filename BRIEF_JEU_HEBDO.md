# Brief à transmettre au service Communication

Copiez-collez le texte ci-dessous et complétez les champs entre crochets.

---

Nous préparons le prochain mini-jeu de **COM Arcade**, service satellite autonome de notre intranet. Le jeu précédent doit être remplacé sans modifier l’application, le stockage des scores ni le classement.

Merci de nous fournir un jeu web rétro **prêt à intégrer**, conforme à ce cahier des charges :

## Concept éditorial

- Nom du jeu : **[nom]**
- Thème / campagne COM associée : **[thème]**
- Période de diffusion : **[date de début] → [date de fin]**
- Accroche affichée à l’écran (max. 120 caractères) : **[accroche]**
- Public : collaborateurs internes ; ton inclusif, léger et non infantilisant.

## Livrable attendu

Fournissez un dossier autonome avec :

1. `index.html`, `game.js`, `styles.css` et les éventuels assets dans `assets/` ; aucun build, CDN ou dépendance externe.
2. Un jeu jouable au clavier, à la souris ou au tactile, dans un conteneur responsive de 16:9 environ.
3. Une fonction JavaScript globale exactement nommée `startGame()`.
4. À la fin d’une partie, l’appel suivant, une seule fois :

```js
window.parent.postMessage({ type: "com-arcade:game-over", score: 1234 }, "*");
```

`score` doit être un entier positif. Le jeu ne doit pas envoyer de nom, d’e-mail, de cookie, ni aucune donnée utilisateur : l’intranet gère l’identité et l’enregistrement du score.

5. Une durée de partie comprise entre 20 secondes et 2 minutes. Le score doit refléter clairement la performance, avec une règle simple à expliquer en une phrase.
6. Un écran de démarrage, les instructions, un écran de fin, et un bouton « Rejouer ».
7. Une courte notice `README.md` indiquant : règles, contrôles, formule du score, crédits/licences des visuels et sons.

## Contraintes essentielles

- Compatible Chrome et Edge récents, sans connexion Internet après le chargement.
- JavaScript sans framework ; pas de React, iframe tierce, publicité, tracking ou collecte de données.
- Pas de contenu discriminant, violent, anxiogène, politique ou nécessitant une connaissance métier spécifique.
- Visuels et sons créés ou licenciés pour cet usage interne ; fournir les crédits.
- Accessibilité minimale : contrôles alternatifs, instructions textuelles, contraste lisible, le jeu reste jouable sans son.
- Poids cible total : moins de 5 Mo, assets optimisés.
- Le jeu doit pouvoir être arrêté/nettoyé proprement : pas de timer, listener ou audio persistant après une fin de partie.

## Critères de validation

Avant livraison, vérifiez : le jeu démarre sans erreur console, une partie peut être jouée jusqu’au bout, l’événement `com-arcade:game-over` est envoyé avec un score entier, et « Rejouer » démarre une nouvelle partie sans recharger la page.

---

À fournir également avec la réponse : une maquette ou capture de l’écran de jeu, le nom du jeu, l’accroche, la règle de score et les crédits des assets.
