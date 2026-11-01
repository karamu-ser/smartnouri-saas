#!/bin/bash
# Script de Protection Anti-DDoS (Nginx + Fail2Ban) pour Smart Nouri SaaS
set -e

echo "🛡️ Début de l'installation des protections Anti-DDoS..."

NGINX_CONF="/etc/nginx/nginx.conf"
SITE_CONF="/etc/nginx/sites-available/smartnouri"

# 1. Configuration des Zones de Limite dans Nginx (nginx.conf)
echo "⚙️ Configuration des zones de limitation Nginx..."
if ! grep -q "limit_req_zone" "$NGINX_CONF"; then
    sudo sed -i '/http {/a \
    \
    # --- SMART NOURI ANTI-DDOS LIMITS ---\
    limit_req_zone $binary_remote_addr zone=mylimit:10m rate=20r/s;\
    limit_conn_zone $binary_remote_addr zone=addr:10m;\
    # -------------------------------------' "$NGINX_CONF"
    echo "✅ Zones Nginx ajoutées."
else
    echo "ℹ️ Zones Nginx déjà configurées."
fi

# 2. Application des limites sur l'API (sites-available/smartnouri)
echo "⚙️ Application des limites sur l'API..."
if ! grep -q "limit_req zone=mylimit" "$SITE_CONF"; then
    sudo sed -i '/location \/api\/ {/a \
        # --- DDOS PROTECTION ---\
        limit_req zone=mylimit burst=5 nodelay;\
        limit_conn addr 10;\
        # -----------------------' "$SITE_CONF"
    echo "✅ Limites appliquées sur /api/."
else
    echo "ℹ️ Limites déjà appliquées sur /api/."
fi

# 3. Installation et configuration de Fail2Ban
echo "📦 Installation de Fail2Ban..."
sudo apt-get update
sudo apt-get install -y fail2ban

echo "⚙️ Configuration de Fail2Ban pour Nginx..."
sudo cat <<EOF | sudo tee /etc/fail2ban/jail.local > /dev/null
[DEFAULT]
bantime  = 3600
findtime  = 600
maxretry = 5

[nginx-http-auth]
enabled = true

[nginx-botsearch]
enabled = true

[nginx-limit-req]
enabled = true
port    = http,https
logpath = /var/log/nginx/error.log
findtime = 60
maxretry = 2
bantime = 7200
EOF

echo "🚀 Redémarrage des services..."
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban

echo "🎉 Installation Anti-DDoS terminée avec succès !"
echo "Pour voir le statut de Fail2Ban : sudo fail2ban-client status"
echo "Pour voir les IPs bloquées par Nginx : sudo fail2ban-client status nginx-limit-req"
