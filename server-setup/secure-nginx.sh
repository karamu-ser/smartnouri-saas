#!/bin/bash
# Script pour sécuriser Nginx (Headers HTTP Stricts) pour Smart Nouri SaaS
set -e

NGINX_CONF_PATH="/etc/nginx/sites-available/smartnouri"

# Vérifier si le fichier existe
if [ ! -f "$NGINX_CONF_PATH" ]; then
    echo "⚠️  Fichier de configuration Nginx introuvable : $NGINX_CONF_PATH"
    echo "Si votre fichier porte un autre nom (ex: default), veuillez modifier ce script."
    exit 1
fi

echo "🔒 Sécurisation du fichier Nginx : $NGINX_CONF_PATH"

# Supprimer l'ancien bloc si le script a déjà été exécuté. Cela rend le script
# idempotent et évite des CSP multiples qui se bloquent entre elles.
sudo sed -i \
    -e '/# --- SMART NOURI SECURITY HEADERS ---/,/# ------------------------------------/d' \
    -e '/add_header Content-Security-Policy/d' \
    "$NGINX_CONF_PATH"

# Ajouter les en-têtes uniquement au serveur HTTPS. Turnstile a besoin de son
# script, de ses requêtes réseau et de son iframe, tous servis par ce domaine.
sudo sed -i '/listen 443 ssl http2;/a \
    # --- SMART NOURI SECURITY HEADERS ---\
    add_header X-Frame-Options "DENY" always;\
    add_header X-Content-Type-Options "nosniff" always;\
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;\
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;\
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;\
    add_header Content-Security-Policy "default-src '"'self'"'; script-src '"'self'"' https://challenges.cloudflare.com; style-src '"'self'"' '"'unsafe-inline'"' https://fonts.googleapis.com; font-src '"'self'"' https://fonts.gstatic.com; img-src '"'self'"' data: blob: https://images.unsplash.com https://res.cloudinary.com; connect-src '"'self'"' https://smartnouri.cloud https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; object-src '"'none'"'; base-uri '"'self'"'; form-action '"'self'"'; frame-ancestors '"'none'"';" always;\
    # ------------------------------------' "$NGINX_CONF_PATH"

echo "✅ Headers de sécurité ajoutés avec succès !"
echo "🔄 Test de la configuration Nginx..."
sudo nginx -t

echo "🚀 Redémarrage de Nginx..."
sudo systemctl reload nginx
echo "🎉 Terminé ! Vous pouvez relancer le scan Mozilla Observatory, vous devriez obtenir la note A ou A+ !"
