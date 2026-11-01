# Smart Nouri — menus et accès sans email

La création d’un menu affiche directement l’identifiant (le slug du menu), le mot de passe et un code de récupération. L’email est facultatif et aucun envoi SMTP/Gmail n’est nécessaire. Le client peut télécharger ses accès privés, ouvrir son espace et y retrouver son QR code. Le lien public et le QR ne contiennent aucun accès privé.

Le code de récupération permet de choisir un nouveau mot de passe depuis « Mot de passe oublié ». Il reste valide après utilisation : conserver le fichier d’accès en lieu sûr et y mettre à jour le mot de passe après un changement. Les comptes existants peuvent continuer à utiliser leur email ou le slug de leur menu et leur mot de passe. S’ils ont perdu ce dernier et n’ont pas de code de récupération, l’interface les dirige vers l’assistance pour une vérification manuelle.

Les QR sont affichés en SVG, sans logo superposé, avec une marge blanche de quatre modules. Les téléchargements comprennent un PNG d’au moins 1600 px et un SVG pour l’impression.

## Configuration et mise en ligne

- Déployer ensemble le frontend et le backend : les formulaires utilisent les nouveaux champs d’accès et de récupération.
- `VITE_API_URL` : URL de l’API, généralement `https://smartnouri.cloud/api/v1` en production.
- `VITE_PUBLIC_SITE_URL` (facultatif) : URL publique du site utilisée dans les QR, par exemple `https://smartnouri.cloud`. Sans valeur, le domaine affiché dans le navigateur est utilisé.
- `VITE_WHATSAPP_PHONE` (facultatif) : numéro d’assistance WhatsApp pour les boutons de contact (format international sans +, ex. `212600000000`).
- `VITE_TURNSTILE_SITE_KEY` : clé publique du widget Cloudflare Turnstile autorisé pour `smartnouri.cloud`.
- `TURNSTILE_SECRET_KEY` : clé secrète Turnstile, uniquement dans `backend/.env`. Le serveur refuse toute création si elle manque ou si le jeton est invalide.
- Le backend conserve les paramètres `SECRET_KEY` et `ADMIN_PASSWORD_HASH`. La configuration IA reste nécessaire pour analyser les photos ; elle est indépendante de Gmail.
- La colonne nullable `client_recovery_code_hash` est ajoutée automatiquement au démarrage, sans modifier les comptes existants. Le script de déploiement peut aussi exécuter `cd backend && python migrate_db.py` avant le redémarrage. Exécuter depuis le même répertoire que l’API, ou fournir son `DATABASE_URL`, pour viser la bonne base.
- Vérifications : `npm run build`, `npm run lint` et `python -m unittest discover -s backend -p 'test_email_free_access.py'` (dépendances backend et `httpx` nécessaires ; tests sur une base temporaire, sans envoi d’email).

En cas d’échec de l’analyse, les accès restent visibles et la relance utilise le même établissement. Les photos acceptées sont JPEG, PNG et WebP, au maximum 10 fichiers de 5 Mo chacun.

Les téléphones sont enregistrés au format marocain `+212` suivi de 9 chiffres (préfixe 5, 6 ou 7). Un registre permanent empêche qu’un numéro déjà utilisé soit réinscrit, même après suppression du restaurant. Les anciens numéros marocains valides sont ajoutés au registre au démarrage.

## Développement local

Le site utilise le backend Python FastAPI dans `backend/`. `server/index.js` est l’ancien service de contacts, indépendant du parcours des menus.

```sh
npm ci
npm run dev
```

Dans un autre terminal, après activation de votre environnement Python et configuration de `backend/.env` :

```sh
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Pour le développement local, ajouter `http://localhost:5173` à `ALLOWED_ORIGINS` dans `backend/.env`. Ne pas enregistrer les fichiers `.env`, bases de données ou fichiers d’accès clients dans Git.

## Régression navigateur

`scripts/test-client-flow.mjs` vérifie la création sans email, la relance sans doublon, les accès privés, les exports PNG/SVG, la connexion et la récupération sur mobile. L’API est simulée : aucun compte réel ni appel IA n’est créé.

Après `npm run build`, lancer `npm run preview -- --host 127.0.0.1 --port 4173`, puis Chrome avec un profil de test séparé :

```sh
google-chrome --headless --remote-debugging-port=9222 --user-data-dir=/tmp/smartnouri-browser-test about:blank
node scripts/test-client-flow.mjs
```

Node 22 ou plus récent est nécessaire pour ce script. `SITE_URL`, `BROWSER_DEBUG_URL` et `SCREENSHOT_PATH` peuvent personnaliser les adresses locales et la capture facultative.
