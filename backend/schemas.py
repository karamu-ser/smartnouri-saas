from pydantic import ConfigDict, BaseModel, EmailStr, Field, field_validator, model_validator
from typing import List, Optional, Literal
from datetime import datetime
import re


MOROCCAN_PHONE_PATTERN = re.compile(r"^\+212[5-7]\d{8}$")


def normalize_moroccan_phone(value: str) -> str:
    """Return a canonical +212 number or raise a validation error."""
    compact = re.sub(r"[\s.()-]", "", value.strip())
    if compact.startswith("00212"):
        compact = "+212" + compact[5:]
    elif compact.startswith("0"):
        compact = "+212" + compact[1:]
    if not MOROCCAN_PHONE_PATTERN.fullmatch(compact):
        raise ValueError("Le numéro doit être marocain au format +212 suivi de 9 chiffres (5, 6 ou 7).")
    return compact

# --- MenuItem Schemas ---
class MenuItemBase(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = 0.0
    currency: Optional[str] = "MAD"
    is_available: Optional[bool] = True
    image_url: Optional[str] = None

class MenuItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    price: float = Field(..., ge=0, le=99999)
    currency: str = Field("MAD", max_length=5)
    is_available: bool = True
    image_url: Optional[str] = Field(None, max_length=500000)

class ImageUploadRequest(BaseModel):
    image_base64: str = Field(..., max_length=700000)  # ~525KB image max

class MenuItemResponse(MenuItemBase):
    id: Optional[int] = None
    category_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

# --- Category Schemas ---
class CategoryBase(BaseModel):
    name: Optional[str] = None
    sort_order: Optional[int] = 0

class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    sort_order: int = Field(0, ge=0, le=1000)
    items: List[MenuItemCreate] = []

class CategoryResponse(CategoryBase):
    id: Optional[int] = None
    menu_id: Optional[int] = None
    items: List[MenuItemResponse] = []

    model_config = ConfigDict(from_attributes=True)

# --- Menu Schemas ---
class MenuBase(BaseModel):
    is_active: bool = True

class MenuCreate(MenuBase):
    categories: List[CategoryCreate] = []

class MenuResponse(MenuBase):
    id: Optional[int] = None
    restaurant_id: Optional[int] = None
    categories: List[CategoryResponse] = []

    model_config = ConfigDict(from_attributes=True)

# --- Restaurant Schemas ---
class RestaurantBase(BaseModel):
    name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    description: Optional[str] = None

class RestaurantCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    contact_email: Optional[EmailStr] = None
    contact_phone: str = Field(..., min_length=6, max_length=20)
    captcha_token: str = Field(..., min_length=1, max_length=2048, exclude=True)
    description: Optional[str] = Field(None, max_length=1000)
    theme: Optional[str] = "cafe"

    @field_validator("contact_email", mode="before")
    @classmethod
    def empty_email_is_optional(cls, value):
        return None if isinstance(value, str) and not value.strip() else value

    @field_validator("contact_phone")
    @classmethod
    def validate_moroccan_phone(cls, value):
        return normalize_moroccan_phone(value)

class RestaurantResponse(RestaurantBase):
    id: Optional[int] = None
    slug: Optional[str] = None
    original_menu_image: Optional[str] = None
    status: Optional[str] = "pending"
    theme: Optional[str] = "cafe"
    created_at: Optional[datetime] = None
    client_email: Optional[str] = None
    menus: List[MenuResponse] = []

    model_config = ConfigDict(from_attributes=True)

class RestaurantCreateResponse(RestaurantResponse):
    """Credentials are returned only once at creation, never on public reads."""
    client_identifier: Optional[str] = None
    client_password: Optional[str] = None
    client_recovery_code: Optional[str] = None

class PublishRequest(BaseModel):
    theme: Literal["cafe", "restaurant", "snack"]

# --- Client Auth Schemas ---
class ClientLogin(BaseModel):
    identifier: Optional[str] = Field(None, min_length=1, max_length=320)
    email: Optional[EmailStr] = None  # Backward compatibility for existing clients.
    password: str = Field(..., min_length=1, max_length=72)

    @model_validator(mode="after")
    def require_identifier(self):
        if not (self.identifier and self.identifier.strip()) and not self.email:
            raise ValueError("Un identifiant ou un email est nécessaire")
        return self

    @field_validator("password")
    @classmethod
    def limit_password_bytes(cls, value):
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Le mot de passe ne doit pas dépasser 72 octets")
        return value

class ClientForgotPassword(BaseModel):
    identifier: str = Field(..., min_length=1, max_length=320)
    recovery_code: str = Field(..., min_length=1, max_length=128)
    new_password: str = Field(..., min_length=12, max_length=72)

    @field_validator("new_password")
    @classmethod
    def limit_password_bytes(cls, value):
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Le mot de passe ne doit pas dépasser 72 octets")
        return value

class ClientLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    restaurant_id: int
    restaurant_name: str
    slug: str
