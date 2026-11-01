import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

logger = logging.getLogger(__name__)

SMTP_EMAIL = os.environ.get("SMTP_EMAIL")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD")
SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))


def send_welcome_email(to_email: str, restaurant_name: str, password: str, slug: str):
    """Send welcome email with login credentials to new restaurant client."""
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        logger.warning("SMTP not configured — skipping welcome email to %s", to_email)
        return False

    menu_url = f"https://smartnouri.cloud/menu/{slug}"
    client_url = "https://smartnouri.cloud/client"

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }}
        .container {{ max-width: 560px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }}
        .header {{ background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 32px 40px; text-align: center; }}
        .header h1 {{ margin: 0; }}
        .header .smart {{ color: #ffffff; font-size: 28px; font-weight: 700; }}
        .header .nouri {{ color: #f97316; font-size: 28px; font-weight: 800; }}
        .body {{ padding: 36px 40px; color: #333; }}
        .body h2 {{ font-size: 22px; color: #1a1a2e; margin: 0 0 16px; }}
        .body p {{ font-size: 15px; line-height: 1.6; color: #555; }}
        .credentials {{ background: #f8f9fb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px 24px; margin: 24px 0; }}
        .credentials .label {{ font-size: 12px; text-transform: uppercase; color: #888; letter-spacing: 1px; margin-bottom: 4px; }}
        .credentials .value {{ font-size: 17px; font-weight: 700; color: #1a1a2e; margin-bottom: 14px; word-break: break-all; }}
        .credentials .value:last-child {{ margin-bottom: 0; }}
        .btn {{ display: inline-block; background: linear-gradient(135deg, #f97316, #fb923c); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; margin: 8px 4px; }}
        .btn-outline {{ display: inline-block; border: 2px solid #e5e7eb; color: #555; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 14px; margin: 8px 4px; }}
        .footer {{ padding: 24px 40px; text-align: center; background: #fafafa; border-top: 1px solid #f0f0f0; }}
        .footer p {{ font-size: 12px; color: #aaa; margin: 0; }}
        .cta-section {{ text-align: center; margin: 28px 0 8px; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1><span class="smart">SMART </span><span class="nouri">NOURI</span></h1>
        </div>
        <div class="body">
          <h2>Bienvenue, {restaurant_name} ! 🎉</h2>
          <p>Votre menu digital a été créé avec succès par notre intelligence artificielle. Voici vos identifiants pour accéder à votre espace client et modifier votre menu à tout moment :</p>

          <div class="credentials">
            <div class="label">📧 Email</div>
            <div class="value">{to_email}</div>
            <div class="label">🔑 Mot de passe</div>
            <div class="value">{password}</div>
          </div>

          <p>Conservez bien ce mot de passe. Vous pouvez vous connecter sur votre espace client pour modifier vos plats, prix et catégories à tout moment.</p>

          <div class="cta-section">
            <a href="{client_url}" class="btn">Se connecter</a>
            <a href="{menu_url}" class="btn-outline">Voir mon menu</a>
          </div>
        </div>
        <div class="footer">
          <p>Smart Nouri — Menus digitaux & solutions QR • smartnouri.cloud</p>
        </div>
      </div>
    </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"🎉 Votre menu digital est prêt — {restaurant_name}"
    msg["From"] = f"Smart Nouri <{SMTP_EMAIL}>"
    msg["To"] = to_email

    # Plain text fallback
    text_body = f"""Bienvenue {restaurant_name} !

Votre menu digital est prêt.

Email: {to_email}
Mot de passe: {password}

Connectez-vous : {client_url}
Voir votre menu : {menu_url}

— Smart Nouri
"""
    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(msg)
        logger.info("Welcome email sent to %s for restaurant %s", to_email, restaurant_name)
        return True
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to_email, str(e))
        return False

def send_password_reset_email(to_email: str, restaurant_name: str, new_password: str):
    """Send a new randomly generated password to the client."""
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        logger.warning("SMTP not configured — skipping reset email to %s", to_email)
        return False

    client_url = "https://smartnouri.cloud/client"

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }}
        .container {{ max-width: 560px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }}
        .header {{ background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 32px 40px; text-align: center; }}
        .header h1 {{ margin: 0; }}
        .header .smart {{ color: #ffffff; font-size: 28px; font-weight: 700; }}
        .header .nouri {{ color: #f97316; font-size: 28px; font-weight: 800; }}
        .body {{ padding: 36px 40px; color: #333; }}
        .body h2 {{ font-size: 22px; color: #1a1a2e; margin: 0 0 16px; }}
        .body p {{ font-size: 15px; line-height: 1.6; color: #555; }}
        .credentials {{ background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 20px 24px; margin: 24px 0; }}
        .credentials .label {{ font-size: 12px; text-transform: uppercase; color: #b45309; letter-spacing: 1px; margin-bottom: 4px; }}
        .credentials .value {{ font-size: 17px; font-weight: 700; color: #78350f; margin-bottom: 14px; word-break: break-all; }}
        .credentials .value:last-child {{ margin-bottom: 0; }}
        .btn {{ display: inline-block; background: linear-gradient(135deg, #f97316, #fb923c); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; margin: 8px 4px; }}
        .footer {{ padding: 24px 40px; text-align: center; background: #fafafa; border-top: 1px solid #f0f0f0; }}
        .footer p {{ font-size: 12px; color: #aaa; margin: 0; }}
        .cta-section {{ text-align: center; margin: 28px 0 8px; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1><span class="smart">SMART </span><span class="nouri">NOURI</span></h1>
        </div>
        <div class="body">
          <h2>Bonjour, {restaurant_name}</h2>
          <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre Espace Client Smart Nouri.</p>
          <p>Voici votre nouveau mot de passe temporaire :</p>

          <div class="credentials">
            <div class="label">📧 Email</div>
            <div class="value">{to_email}</div>
            <div class="label">🔑 Nouveau mot de passe</div>
            <div class="value">{new_password}</div>
          </div>

          <p>Vous pouvez vous connecter dès maintenant et modifier ce mot de passe si besoin.</p>

          <div class="cta-section">
            <a href="{client_url}" class="btn">Me connecter</a>
          </div>
        </div>
        <div class="footer">
          <p>Smart Nouri — Menus digitaux & solutions QR • smartnouri.cloud</p>
        </div>
      </div>
    </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "🔐 Nouveau mot de passe — Smart Nouri"
    msg["From"] = f"Smart Nouri <{SMTP_EMAIL}>"
    msg["To"] = to_email

    text_body = f"""Bonjour {restaurant_name},

Voici votre nouveau mot de passe pour votre Espace Client Smart Nouri :

Email: {to_email}
Mot de passe: {new_password}

Connectez-vous : {client_url}

— Smart Nouri
"""
    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(msg)
        logger.info("Password reset email sent to %s for restaurant %s", to_email, restaurant_name)
        return True
    except Exception as e:
        logger.error("Failed to send reset email to %s: %s", to_email, str(e))
        return False
