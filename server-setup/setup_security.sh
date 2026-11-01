#!/bin/bash
# Hardening script for Smart Nouri SaaS Oracle Cloud Server
# Run this script with sudo on the server.

set -e

echo "🔒 Starting Server Security Hardening..."

# 1. Update system
echo "📦 Updating system packages..."
apt-get update && apt-get upgrade -y

# 2. Configure SSH Hardening
echo "🔑 Hardening SSH..."
sed -i 's/^#*PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#*PermitRootLogin yes/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
systemctl restart sshd

# 3. Configure UFW (Firewall)
echo "🛡️ Configuring UFW Firewall..."
apt-get install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
# Enable UFW non-interactively
ufw --force enable

# 4. Install and configure Fail2ban
echo "🚫 Installing and configuring Fail2ban..."
apt-get install -y fail2ban
cat <<EOT > /etc/fail2ban/jail.local
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
EOT
systemctl enable fail2ban
systemctl restart fail2ban

# 5. Database Backup Cron
echo "💾 Setting up SQLite backup cronjob..."
# This assumes the project is in /home/ubuntu/smart_nouri
BACKUP_DIR="/home/ubuntu/backups"
mkdir -p $BACKUP_DIR
chown ubuntu:ubuntu $BACKUP_DIR

cat <<EOT > /etc/cron.daily/smartnouri-backup
#!/bin/bash
# Backup backend DB
cp /home/ubuntu/smart_nouri/backend/smartnouri.db $BACKUP_DIR/smartnouri_\$(date +\%Y\%m\%d).db
# Backup contacts DB
cp /home/ubuntu/smart_nouri/server/database.sqlite $BACKUP_DIR/contacts_\$(date +\%Y\%m\%d).sqlite
# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -name '*.db' -exec rm {} \;
find $BACKUP_DIR -type f -mtime +7 -name '*.sqlite' -exec rm {} \;
EOT
chmod +x /etc/cron.daily/smartnouri-backup

echo "✅ Hardening complete!"
echo "Next steps:"
echo "1. Copy smartnouri.nginx.conf to /etc/nginx/sites-available/smartnouri"
echo "2. Create symlink: ln -s /etc/nginx/sites-available/smartnouri /etc/nginx/sites-enabled/"
echo "3. Test nginx: nginx -t"
echo "4. Reload nginx: systemctl reload nginx"
