from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, status, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
import re
import os
import unicodedata
import uuid
import base64
import logging
from logging.handlers import TimedRotatingFileHandler
import time
import shutil
import secrets
import string
import requests
from pathlib import Path
from sqlalchemy.exc import IntegrityError
from datetime import timedelta

from dotenv import load_dotenv
load_dotenv()

import models
import schemas
from database import engine, get_db, SessionLocal
from migrate_db import migrate_database
from ai_service import extract_menu_from_images
import security

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# --- Setup Security Logger ---
LOGS_DIR = os.environ.get("SECURITY_LOG_DIR", os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs"))
os.makedirs(LOGS_DIR, exist_ok=True)

security_logger = logging.getLogger("security")
security_logger.setLevel(logging.INFO)
# Éviter de dupliquer les logs si le logger est appelé plusieurs fois
if not security_logger.handlers:
    file_handler = TimedRotatingFileHandler(
        os.path.join(LOGS_DIR, "security.log"),
        when="midnight",
        interval=1,
        backupCount=30,
        encoding="utf-8"
    )
    formatter = logging.Formatter('%(asctime)s | %(levelname)s | %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
    file_handler.setFormatter(formatter)
    security_logger.addHandler(file_handler)

logger = logging.getLogger(__name__)

# Add nullable columns before querying existing databases, then create new tables.
migrate_database(engine)
models.Base.metadata.create_all(bind=engine)


def backfill_phone_registry():
    """Reserve every valid historical number without changing or deleting accounts."""
    db = SessionLocal()
    try:
        reserved = {row.phone for row in db.query(models.PhoneRegistration).all()}
        for restaurant in db.query(models.Restaurant).all():
            try:
                phone = schemas.normalize_moroccan_phone(restaurant.contact_phone or "")
            except ValueError:
                continue
            restaurant.contact_phone = phone
            if phone not in reserved:
                db.add(models.PhoneRegistration(phone=phone))
                reserved.add(phone)
        db.commit()
    finally:
        db.close()


backfill_phone_registry()

# Use the same password-hash work for absent accounts to avoid exposing existence.
INVALID_CREDENTIAL_HASH = security.get_password_hash(secrets.token_urlsafe(24))

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Smart Nouri SaaS API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    client_ip = request.headers.get("X-Forwarded-For")
    if client_ip:
        client_ip = client_ip.split(",")[0].strip()
    else:
        client_ip = request.client.host if request.client else "Unknown"
        
    try:
        response = await call_next(request)
        process_time = int((time.time() - start_time) * 1000)
        status_code = response.status_code
        user_agent = request.headers.get("User-Agent", "Unknown")
        path = request.url.path
        is_menu_view = request.method == "GET" and (
            path.startswith("/api/v1/restaurants/slug/") or 
            path.startswith("/api/v1/menus/") or 
            (path.startswith("/api/v1/restaurants/") and path != "/api/v1/restaurants") or
            path == "/"
        )
        
        if not is_menu_view:
            security_logger.info(f"IP: {client_ip} | {request.method} {request.url.path} | {status_code} | {process_time}ms | {user_agent}")
        return response
    except Exception as e:
        process_time = int((time.time() - start_time) * 1000)
        user_agent = request.headers.get("User-Agent", "Unknown")
        security_logger.error(f"IP: {client_ip} | {request.method} {request.url.path} | 500 ERROR: {str(e)} | {process_time}ms | {user_agent}")
        raise

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; script-src 'self' https://challenges.cloudflare.com; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "connect-src 'self' https://challenges.cloudflare.com; "
        "frame-src https://challenges.cloudflare.com; object-src 'none'; frame-ancestors 'none';"
    )
    return response

# Security Configuration — Hash chargé depuis .env
ADMIN_PASSWORD_HASH = os.environ.get("ADMIN_PASSWORD_HASH")
if not ADMIN_PASSWORD_HASH:
    raise RuntimeError("❌ ADMIN_PASSWORD_HASH non configuré ! Ajoutez-le dans backend/.env")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

def get_current_admin(token: str = Depends(oauth2_scheme)):
    try:
        # In a real app, you would decode and verify the token. 
        # Here we just check if it's a valid JWT string structure.
        # But for full security, let's actually decode it.
        import jwt
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        username: str = payload.get("sub")
        if username != "admin":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return True

# CORS — configurable via .env, pas de localhost en production
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "https://smartnouri.cloud").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

@app.post("/api/v1/auth/login")
@limiter.limit("5/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    # Valider le username ET le password
    if form_data.username != "admin":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiants incorrects",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not security.verify_password(form_data.password, ADMIN_PASSWORD_HASH):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiants incorrects",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = security.create_access_token(data={"sub": "admin"})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/v1/client/forgot-password")
@limiter.limit("5/minute")
def client_forgot_password(
    request: Request,
    forgot_data: schemas.ClientForgotPassword, 
    db: Session = Depends(get_db)
):
    restaurant = find_client_by_identifier(db, forgot_data.identifier)
    recovery_hash = (
        restaurant.client_recovery_code_hash
        if restaurant and restaurant.client_recovery_code_hash else INVALID_CREDENTIAL_HASH
    )
    # Recovery codes are ASCII token_urlsafe values; longer values cannot be valid.
    recovery_code = forgot_data.recovery_code.strip()
    valid_code = security.verify_password(
        recovery_code if len(recovery_code.encode("utf-8")) <= 72 else "invalid-recovery-code",
        recovery_hash,
    )
    if not valid_code or not restaurant or not restaurant.client_recovery_code_hash:
        raise HTTPException(
            status_code=400,
            detail="Identifiant ou code de récupération incorrect. Sans code, contactez le support.",
        )
    restaurant.client_password_hash = security.get_password_hash(forgot_data.new_password)
    # This offline recovery key stays valid so the saved access sheet remains usable.
    db.commit()
    return {"message": "Mot de passe modifié. Connectez-vous avec votre nouveau mot de passe."}

@app.get("/")
def read_root():
    return {"message": "Welcome to Smart Nouri API"}

def generate_unique_slug(db: Session, base_name: str) -> str:
    slug = unicodedata.normalize('NFKD', base_name).encode('ascii', 'ignore').decode('ascii')
    slug = re.sub(r'[^\w\s-]', '', slug.lower())
    slug = re.sub(r'[-\s]+', '-', slug).strip('-_')
    if not slug:
        slug = "menu"
    
    original_slug = slug
    counter = 1
    while db.query(models.Restaurant).filter(models.Restaurant.slug == slug).first():
        slug = f"{original_slug}-{counter}"
        counter += 1
    return slug


TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


def verify_captcha(token: str, remote_ip: str | None = None) -> None:
    secret = os.environ.get("TURNSTILE_SECRET_KEY")
    if not secret:
        raise HTTPException(status_code=503, detail="Le contrôle anti-robot n'est pas configuré.")
    try:
        verification = requests.post(
            TURNSTILE_VERIFY_URL,
            data={"secret": secret, "response": token, "remoteip": remote_ip or ""},
            timeout=8,
        )
        verification.raise_for_status()
        result = verification.json()
    except (requests.RequestException, ValueError) as exc:
        logger.error("Turnstile verification unavailable: %s", exc)
        raise HTTPException(status_code=503, detail="Le contrôle anti-robot est indisponible. Réessayez.") from exc
    if not result.get("success"):
        raise HTTPException(status_code=400, detail="Le contrôle anti-robot a expiré ou a échoué. Réessayez.")

@app.post("/api/v1/restaurants", response_model=schemas.RestaurantCreateResponse)
@limiter.limit("5/hour")
def create_restaurant(request: Request, restaurant: schemas.RestaurantCreate, response: Response, db: Session = Depends(get_db)):
    client_ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
    if not client_ip and request.client:
        client_ip = request.client.host
    verify_captcha(restaurant.captcha_token, client_ip)

    if db.query(models.PhoneRegistration).filter(
        models.PhoneRegistration.phone == restaurant.contact_phone
    ).first():
        raise HTTPException(status_code=409, detail="Ce numéro de téléphone a déjà été utilisé.")

    # Generate credentials locally: no email provider is needed to create an account.
    alphabet = string.ascii_letters + string.digits
    client_password = ''.join(secrets.choice(alphabet) for _ in range(16))
    client_password_hash = security.get_password_hash(client_password)
    client_recovery_code = secrets.token_urlsafe(32)
    
    db_restaurant = models.Restaurant(**restaurant.model_dump(exclude={"captcha_token"}))
    db_restaurant.slug = generate_unique_slug(db, restaurant.name)
    db_restaurant.status = "published"
    db_restaurant.client_email = restaurant.contact_email
    db_restaurant.client_password_hash = client_password_hash
    db_restaurant.client_recovery_code_hash = security.get_password_hash(client_recovery_code)
    db.add(models.PhoneRegistration(phone=restaurant.contact_phone))
    db.add(db_restaurant)
    
    try:
        db.commit()
        db.refresh(db_restaurant)
    except IntegrityError:
        db.rollback()
        if db.query(models.PhoneRegistration).filter(
            models.PhoneRegistration.phone == restaurant.contact_phone
        ).first():
            raise HTTPException(status_code=409, detail="Ce numéro de téléphone a déjà été utilisé.")
        raise HTTPException(status_code=409, detail="Un compte avec cet email existe déjà. Veuillez utiliser une autre adresse email.")
    
    response.headers["Cache-Control"] = "no-store"
    credentials = schemas.RestaurantCreateResponse.model_validate(db_restaurant)
    credentials.client_identifier = db_restaurant.slug
    credentials.client_password = client_password
    credentials.client_recovery_code = client_recovery_code
    return credentials

@app.get("/api/v1/restaurants", response_model=List[schemas.RestaurantResponse])
def get_restaurants(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), admin: bool = Depends(get_current_admin)):
    restaurants = db.query(models.Restaurant).offset(skip).limit(limit).all()
    return restaurants

MAX_UPLOAD_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}

@app.post("/api/v1/restaurants/{restaurant_id}/menu/upload", response_model=schemas.MenuResponse)
@limiter.limit("3/minute")
async def upload_menu_image(
    restaurant_id: int,
    request: Request,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    # 1. Verify restaurant exists
    restaurant = db.query(models.Restaurant).filter(models.Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
        
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 fichiers autorisés")

    images_data = []
    base64_strings = []

    for file in files:
        # 2. Validate Content-Type
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=400, detail=f"Type non autorisé: {file.content_type}. Acceptés: JPEG, PNG, WebP")

        # 3. Read image with size limit
        image_bytes = await file.read()
        if len(image_bytes) > MAX_UPLOAD_SIZE:
            raise HTTPException(status_code=400, detail="Un des fichiers est trop volumineux. Maximum: 5 MB par fichier")

        # 4. Validate magic bytes (pas juste le Content-Type du client)
        if image_bytes[:3] == b'\xff\xd8\xff':
            detected = 'jpeg'
        elif image_bytes[:8] == b'\x89PNG\r\n\x1a\n':
            detected = 'png'
        elif image_bytes[:4] == b'RIFF' and image_bytes[8:12] == b'WEBP':
            detected = 'webp'
        else:
            detected = None
        
        if not detected:
            raise HTTPException(status_code=400, detail="Un des fichiers n'est pas une image valide")
        
        mime_type = file.content_type or "image/jpeg"
        images_data.append({
            "mime_type": mime_type,
            "data": image_bytes
        })
        
        b64_string = base64.b64encode(image_bytes).decode('utf-8')
        base64_strings.append(f"data:{mime_type};base64,{b64_string}")

    import json
    # 5. Save original images as JSON string array to DB for admin verification
    restaurant.original_menu_image = json.dumps(base64_strings)
    db.commit()
    
    # 6. Process with AI (Gemini)
    try:
        extracted_data = extract_menu_from_images(images_data)
    except Exception as e:
        logger.error(f"AI extraction error for restaurant {restaurant_id}: {e}")
        raise HTTPException(
            status_code=502,
            detail="La lecture du menu a échoué. Réessayez avec des photos nettes.",
        ) from e

    try:
        if not isinstance(extracted_data, dict):
            raise ValueError("Invalid extracted menu")
        categories_data = [
            schemas.CategoryCreate.model_validate(category).model_dump()
            for category in extracted_data.get("categories", [])
        ]
        if not any(category["items"] for category in categories_data):
            raise ValueError("Empty extracted menu")
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=502,
            detail="Aucun plat n'a été détecté. Réessayez avec des photos nettes du menu.",
        )

    # 7. Replace the existing menu atomically, making retries safe after a lost response.
    if "restaurant_description" in extracted_data:
        restaurant.description = extracted_data["restaurant_description"]

    db_menu = db.query(models.Menu).filter(
        models.Menu.restaurant_id == restaurant.id
    ).order_by(models.Menu.id).first()
    if db_menu is None:
        db_menu = models.Menu(restaurant_id=restaurant.id, is_active=True)
        db.add(db_menu)
        db.flush()
    else:
        old_categories = db.query(models.Category).filter(models.Category.menu_id == db_menu.id).all()
        for category in old_categories:
            db.query(models.MenuItem).filter(models.MenuItem.category_id == category.id).delete()
            db.delete(category)
        db.flush()
        db_menu.is_active = True

    # Add Categories and Items
    for cat_data in categories_data:
        db_cat = models.Category(
            menu_id=db_menu.id,
            name=cat_data.get("name", "Unknown Category"),
            sort_order=cat_data.get("sort_order", 0)
        )
        db.add(db_cat)
        db.flush()

        items_data = cat_data.get("items", [])
        for item_data in items_data:
            db_item = models.MenuItem(
                category_id=db_cat.id,
                name=item_data.get("name", "Unknown Item"),
                description=item_data.get("description"),
                price=item_data.get("price", 0.0),
                currency=item_data.get("currency", "MAD"),
                is_available=item_data.get("is_available", True)
            )
            db.add(db_item)
    
    db.commit()
    
    # 5. Fetch full tree to return
    db.refresh(db_menu)
    return db_menu

@app.get("/api/v1/menus/{menu_id}", response_model=schemas.MenuResponse)
def get_menu(menu_id: int, db: Session = Depends(get_db)):
    menu = db.query(models.Menu).filter(models.Menu.id == menu_id).first()
    if not menu:
        raise HTTPException(status_code=404, detail="Menu not found")
    return menu

@app.get("/api/v1/restaurants/{restaurant_id}", response_model=schemas.RestaurantResponse)
def get_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    restaurant = db.query(models.Restaurant).filter(models.Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant

@app.get("/api/v1/restaurants/slug/{slug}", response_model=schemas.RestaurantResponse)
def get_restaurant_by_slug(slug: str, db: Session = Depends(get_db)):
    restaurant = db.query(models.Restaurant).filter(models.Restaurant.slug == slug).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant

@app.put("/api/v1/restaurants/{restaurant_id}", response_model=schemas.RestaurantResponse)
def update_restaurant(restaurant_id: int, rest_update: schemas.RestaurantBase, db: Session = Depends(get_db), admin: bool = Depends(get_current_admin)):
    restaurant = db.query(models.Restaurant).filter(models.Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    updates = rest_update.model_dump(exclude_unset=True)
    requested_phone = updates.get("contact_phone")
    if requested_phone is not None:
        try:
            requested_phone = schemas.normalize_moroccan_phone(requested_phone)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        updates["contact_phone"] = requested_phone
        if requested_phone != restaurant.contact_phone:
            if db.query(models.PhoneRegistration).filter(
                models.PhoneRegistration.phone == requested_phone
            ).first():
                raise HTTPException(status_code=409, detail="Ce numéro de téléphone a déjà été utilisé.")
            db.add(models.PhoneRegistration(phone=requested_phone))

    for key, value in updates.items():
        setattr(restaurant, key, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Ce numéro de téléphone a déjà été utilisé.")
    db.refresh(restaurant)
    return restaurant

@app.put("/api/v1/menu_items/{item_id}", response_model=schemas.MenuItemResponse)
def update_menu_item(item_id: int, item_update: schemas.MenuItemBase, db: Session = Depends(get_db), admin: bool = Depends(get_current_admin)):
    db_item = db.query(models.MenuItem).filter(models.MenuItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    for key, value in item_update.model_dump().items():
        setattr(db_item, key, value)
    
    db.commit()
    db.refresh(db_item)
    return db_item

@app.delete("/api/v1/menu_items/{item_id}")
def delete_menu_item(item_id: int, db: Session = Depends(get_db), admin: bool = Depends(get_current_admin)):
    db_item = db.query(models.MenuItem).filter(models.MenuItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db.delete(db_item)
    db.commit()
    return {"success": True}

@app.delete("/api/v1/restaurants/{restaurant_id}")
def delete_restaurant(restaurant_id: int, db: Session = Depends(get_db), admin: bool = Depends(get_current_admin)):
    restaurant = db.query(models.Restaurant).filter(models.Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    menus = db.query(models.Menu).filter(models.Menu.restaurant_id == restaurant_id).all()
    for menu in menus:
        # Simple cascade cleanup for SQLite
        categories = db.query(models.Category).filter(models.Category.menu_id == menu.id).all()
        for cat in categories:
            items = db.query(models.MenuItem).filter(models.MenuItem.category_id == cat.id).all()
            for item in items:
                db.delete(item)
            db.delete(cat)
        db.delete(menu)
        
    db.delete(restaurant)
    db.commit()
    return {"success": True}

@app.post("/api/v1/restaurants/{restaurant_id}/publish")
def publish_restaurant(restaurant_id: int, request: schemas.PublishRequest, db: Session = Depends(get_db), admin: bool = Depends(get_current_admin)):
    restaurant = db.query(models.Restaurant).filter(models.Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    restaurant.status = "active"
    restaurant.theme = request.theme
    
    db.commit()
    db.refresh(restaurant)
    return {"success": True, "url": f"https://smartnouri.cloud/menu/{restaurant.slug}", "theme": restaurant.theme}

@app.post("/api/v1/menus/{menu_id}/categories", response_model=schemas.CategoryResponse)
def create_category(menu_id: int, category: schemas.CategoryCreate, db: Session = Depends(get_db), admin: bool = Depends(get_current_admin)):
    menu = db.query(models.Menu).filter(models.Menu.id == menu_id).first()
    if not menu:
        raise HTTPException(status_code=404, detail="Menu not found")
    
    db_cat = models.Category(
        menu_id=menu_id,
        name=category.name,
        sort_order=category.sort_order
    )
    db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat

@app.put("/api/v1/categories/{category_id}", response_model=schemas.CategoryResponse)
def update_category(category_id: int, category_update: schemas.CategoryBase, db: Session = Depends(get_db), admin: bool = Depends(get_current_admin)):
    db_cat = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db_cat.name = category_update.name
    db_cat.sort_order = category_update.sort_order
    db.commit()
    db.refresh(db_cat)
    return db_cat

@app.delete("/api/v1/categories/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db), admin: bool = Depends(get_current_admin)):
    db_cat = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="Category not found")
    
    items = db.query(models.MenuItem).filter(models.MenuItem.category_id == category_id).all()
    for item in items:
        db.delete(item)
        
    db.delete(db_cat)
    db.commit()
    return {"success": True}

@app.post("/api/v1/categories/{category_id}/items", response_model=schemas.MenuItemResponse)
def create_menu_item(category_id: int, item: schemas.MenuItemCreate, db: Session = Depends(get_db), admin: bool = Depends(get_current_admin)):
    db_cat = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db_item = models.MenuItem(
        category_id=category_id,
        **item.model_dump()
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.post("/api/v1/menu_items/{item_id}/image", response_model=schemas.MenuItemResponse)
def upload_item_image(item_id: int, request: schemas.ImageUploadRequest, db: Session = Depends(get_db), admin: bool = Depends(get_current_admin)):
    db_item = db.query(models.MenuItem).filter(models.MenuItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db_item.image_url = request.image_base64
    db.commit()
    db.refresh(db_item)
    return db_item

# =============================================
# CLIENT AUTH & SELF-SERVICE ENDPOINTS
# =============================================

def get_current_client(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Decode JWT and return the restaurant owned by this client."""
    try:
        import jwt as pyjwt
        payload = pyjwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        subject: str = payload.get("sub")
        role: str = payload.get("role", "")
        if role != "client" or not subject:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    
    if payload.get("identity_type") == "restaurant_id":
        restaurant = db.query(models.Restaurant).filter(models.Restaurant.id == subject).first()
    else:
        # Existing email-based sessions remain valid until their normal expiration.
        restaurant = db.query(models.Restaurant).filter(models.Restaurant.client_email == subject).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant


def find_client_by_identifier(db: Session, identifier: str):
    identifier = identifier.strip()
    if "@" in identifier:
        return db.query(models.Restaurant).filter(models.Restaurant.client_email == identifier).first()
    return db.query(models.Restaurant).filter(models.Restaurant.slug == identifier).first()

@app.post("/api/v1/client/login", response_model=schemas.ClientLoginResponse)
@limiter.limit("10/minute")
def client_login(request: Request, login_data: schemas.ClientLogin, db: Session = Depends(get_db)):
    identifier = (login_data.identifier or "").strip() or str(login_data.email)
    restaurant = find_client_by_identifier(db, identifier)
    password_hash = (
        restaurant.client_password_hash
        if restaurant and restaurant.client_password_hash else INVALID_CREDENTIAL_HASH
    )
    valid_password = security.verify_password(login_data.password, password_hash)
    if not valid_password or not restaurant or not restaurant.client_password_hash:
        raise HTTPException(status_code=401, detail="Identifiant ou mot de passe incorrect")
    
    access_token = security.create_access_token(
        data={"sub": str(restaurant.id), "role": "client", "identity_type": "restaurant_id"}
    )
    return schemas.ClientLoginResponse(
        access_token=access_token,
        restaurant_id=restaurant.id,
        restaurant_name=restaurant.name,
        slug=restaurant.slug or ""
    )

@app.get("/api/v1/client/restaurant", response_model=schemas.RestaurantResponse)
def get_client_restaurant(restaurant: models.Restaurant = Depends(get_current_client)):
    return restaurant

@app.put("/api/v1/client/menu_items/{item_id}", response_model=schemas.MenuItemResponse)
def client_update_item(
    item_id: int,
    item: schemas.MenuItemBase,
    restaurant: models.Restaurant = Depends(get_current_client),
    db: Session = Depends(get_db)
):
    """Allow client to update their own menu items only."""
    db_item = db.query(models.MenuItem).filter(models.MenuItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Verify this item belongs to the client's restaurant
    category = db.query(models.Category).filter(models.Category.id == db_item.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    menu = db.query(models.Menu).filter(models.Menu.id == category.menu_id).first()
    if not menu or menu.restaurant_id != restaurant.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this item")
    
    update_data = item.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.post("/api/v1/client/categories/{category_id}/items", response_model=schemas.MenuItemResponse)
def client_add_item(
    category_id: int,
    item: schemas.MenuItemCreate,
    restaurant: models.Restaurant = Depends(get_current_client),
    db: Session = Depends(get_db)
):
    """Allow client to add items to their own categories."""
    db_cat = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="Category not found")
    menu = db.query(models.Menu).filter(models.Menu.id == db_cat.menu_id).first()
    if not menu or menu.restaurant_id != restaurant.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_item = models.MenuItem(category_id=category_id, **item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.delete("/api/v1/client/menu_items/{item_id}")
def client_delete_item(
    item_id: int,
    restaurant: models.Restaurant = Depends(get_current_client),
    db: Session = Depends(get_db)
):
    """Allow client to delete their own menu items."""
    db_item = db.query(models.MenuItem).filter(models.MenuItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    category = db.query(models.Category).filter(models.Category.id == db_item.category_id).first()
    if not category:
        raise HTTPException(status_code=404)
    menu = db.query(models.Menu).filter(models.Menu.id == category.menu_id).first()
    if not menu or menu.restaurant_id != restaurant.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(db_item)
    db.commit()
    return {"ok": True}
