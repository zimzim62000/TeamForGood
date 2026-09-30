# Intégration iframe Primetime ↔ COM Arcade

## Flux retenu

1. Le serveur Primetime produit un JWT HS256 valable au maximum cinq minutes.
2. L’iframe ouvre `/iframe/enter?t=<jwt>`.
3. COM Arcade lit le `cid` non vérifié uniquement pour choisir le secret du tenant.
4. COM Arcade vérifie la signature, les dates et le `cid` signé.
5. L’utilisateur est créé ou mis à jour avec la clé `(tenant, uid)`.
6. COM Arcade redirige vers `/?s=<session-interne>`.
7. Le navigateur utilise cette session interne pour les API. Aucun cookie ni stockage navigateur n’est nécessaire.

Les classements, utilisateurs, sessions de jeu et scores sont isolés par tenant.

## Jeton d’entrée Primetime

Algorithme obligatoire : JWT HS256. Claims obligatoires :

| Claim | Contenu |
| --- | --- |
| `cid` | identifiant du tenant |
| `uid` | identifiant utilisateur stable dans Primetime |
| `prenom` | prénom |
| `initNom` | première lettre du nom uniquement |
| `iat` | timestamp Unix d’émission |
| `exp` | expiration, au maximum `iat + 300` |

Le secret tenant contient exactement 32 octets, transmis sous la forme de 64 caractères hexadécimaux. Il reste exclusivement côté serveur.

## Configuration COM Arcade

```dotenv
SESSION_SECRET_HEX=<secret interne de 64 caractères hexa>
RETRO_TENANTS_JSON={"primetime":{"secretsHex":["<secret tenant actuel>"]}}
FRAME_ANCESTORS=https://domaine-reel-de-primetime.example
PUBLIC_BASE_URL=https://retrogaming.tousamba.cloud
ALLOW_DEV_IDENTITY=false
```

Pour une rotation sans interruption, ajouter temporairement l’ancien et le nouveau secret dans `secretsHex`, faire basculer Primetime, puis retirer l’ancien.

`FRAME_ANCESTORS` accepte plusieurs origines séparées par des espaces. `capacitor://localhost` et `https://localhost` sont déjà ajoutés pour une éventuelle webview Capacitor.

## Règles de sécurité

- ne jamais écrire les secrets dans le dépôt, un ticket, une URL ou du JavaScript client ;
- régénérer l’URL d’entrée à chaque affichage de l’iframe ;
- ne jamais utiliser le `cid` non signé autrement que pour sélectionner un secret candidat ;
- utiliser HTTPS exclusivement en production ;
- conserver `Referrer-Policy: no-referrer` ;
- définir précisément les origines Primetime autorisées dans `frame-ancestors` ;
- remplacer immédiatement le secret d’un tenant en cas de fuite.

## Hauteur de l’iframe et plein écran

COM Arcade envoie au parent un message `postMessage` `{ source: "com-arcade", type: "resize", height }` à chaque changement de hauteur. Primetime doit écouter ce message, vérifier l’origine, puis appliquer la hauteur reçue à l’iframe. Prévoir un minimum de 480 px pour conserver une zone de jeu confortable.

L’iframe doit aussi autoriser le plein écran, afin que le bouton **PLEIN ÉCRAN** puisse servir de solution de repli :

```html
<iframe id="com-arcade" allow="fullscreen" allowfullscreen></iframe>
<script>
  window.addEventListener("message", (event) => {
    if (event.origin !== "https://retrogaming.tousamba.cloud") return;
    const data = event.data;
    if (data?.source !== "com-arcade" || data?.type !== "resize" || !Number.isFinite(data.height)) return;
    document.getElementById("com-arcade").style.height = `${Math.max(480, Math.ceil(data.height))}px`;
  });
</script>
```

Le mode historique par en-têtes `x-intranet-user-id` et `x-intranet-user-name` reste disponible derrière un gateway de confiance. Le gateway doit supprimer toute valeur fournie par le navigateur avant d’injecter les siennes.
