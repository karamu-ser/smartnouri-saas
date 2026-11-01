#!/bin/bash
set -e

# 1. Mise à jour du code
cd ~/smartnouri-saas
git pull

# 2. Build du Frontend
case "$VITE_TURNSTILE_SITE_KEY" in
  ""|VOTRE_*|your-*|YOUR_*)
    echo 'VITE_TURNSTILE_SITE_KEY absente ou encore définie avec une valeur d’exemple.' >&2
    echo 'Copiez la vraie Site Key depuis Cloudflare Turnstile, puis relancez le déploiement.' >&2
    exit 1
    ;;
esac

# Les Site Keys Turnstile sont plus courtes que les Secret Keys. Cette garde
# évite aussi de republier une ancienne Secret Key après sa rotation.
if [ "${#VITE_TURNSTILE_SITE_KEY}" -gt 30 ]; then
  echo 'Déploiement refusé : VITE_TURNSTILE_SITE_KEY ressemble à une Secret Key.' >&2
  echo 'Copiez le champ « Site key » (le champ supérieur) depuis Cloudflare Turnstile.' >&2
  exit 1
fi

# La Site Key est publique, tandis que la Secret Key ne doit jamais entrer
# dans le bundle Vite. Bloquer le déploiement si les deux valeurs sont égales.
if [ -f backend/.env ]; then
  BACKEND_TURNSTILE_SECRET="$(sed -n 's/^TURNSTILE_SECRET_KEY=//p' backend/.env | tail -n 1 | tr -d '\r')"
  BACKEND_TURNSTILE_SECRET="${BACKEND_TURNSTILE_SECRET#\"}"
  BACKEND_TURNSTILE_SECRET="${BACKEND_TURNSTILE_SECRET%\"}"
  BACKEND_TURNSTILE_SECRET="${BACKEND_TURNSTILE_SECRET#\'}"
  BACKEND_TURNSTILE_SECRET="${BACKEND_TURNSTILE_SECRET%\'}"
  if [ -n "$BACKEND_TURNSTILE_SECRET" ] && [ "$VITE_TURNSTILE_SITE_KEY" = "$BACKEND_TURNSTILE_SECRET" ]; then
    echo 'Déploiement refusé : VITE_TURNSTILE_SITE_KEY contient la Secret Key du backend.' >&2
    echo 'Utilisez la Site Key publique du widget Cloudflare dans .env.deploy.' >&2
    exit 1
  fi
fi
printf 'VITE_API_URL=https://smartnouri.cloud/api/v1\nVITE_TURNSTILE_SITE_KEY=%s\n' "$VITE_TURNSTILE_SITE_KEY" > .env.production
if [ -n "$VITE_WHATSAPP_PHONE" ]; then
  printf 'VITE_WHATSAPP_PHONE=%s\n' "$VITE_WHATSAPP_PHONE" >> .env.production
fi
npm install
npx vite build

# Publier les fichiers avec des permissions lisibles par Nginx. Un ancien
# fichier créé avec un umask strict peut sinon conserver le mode 600 lors d'un
# simple `cp`, ce qui provoque un 403 sur le bundle JavaScript et un écran noir.
WEB_ROOT="${WEB_ROOT:-/var/www/smartnouri}"
sudo install -d -m 755 "$WEB_ROOT"
sudo cp -r dist/. "$WEB_ROOT/"
sudo find "$WEB_ROOT" -type d -exec chmod 755 {} +
sudo find "$WEB_ROOT" -type f -exec chmod 644 {} +

# 3. Mise à jour du Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
python migrate_db.py  # <-- TRÈS IMPORTANT : met à jour la base de données

# 4. Redémarrage des services
sudo systemctl restart smartnouri-api
sudo systemctl reload nginx

echo "✅ Deploy OK → https://smartnouri.cloud"
