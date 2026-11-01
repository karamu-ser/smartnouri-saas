from sqlalchemy import Boolean, Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    contact_email = Column(String)
    contact_phone = Column(String)
    client_email = Column(String, unique=True, index=True, nullable=True)
    client_password_hash = Column(String, nullable=True)
    client_recovery_code_hash = Column(String, nullable=True)
    status = Column(String, default="pending")
    theme = Column(String, default="cafe")
    description = Column(String, nullable=True)
    slug = Column(String, unique=True, index=True, nullable=True)
    original_menu_image = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    menus = relationship("Menu", back_populates="restaurant")


class PhoneRegistration(Base):
    """Permanent ledger: deleting a restaurant never makes its phone reusable."""
    __tablename__ = "phone_registrations"

    id = Column(Integer, primary_key=True)
    phone = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class Menu(Base):
    __tablename__ = "menus"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
    is_active = Column(Boolean, default=True)

    restaurant = relationship("Restaurant", back_populates="menus")
    categories = relationship("Category", back_populates="menu")

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    menu_id = Column(Integer, ForeignKey("menus.id"))
    name = Column(String)
    sort_order = Column(Integer, default=0)

    menu = relationship("Menu", back_populates="categories")
    items = relationship("MenuItem", back_populates="category")

class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    name = Column(String)
    description = Column(String)
    price = Column(Float)
    currency = Column(String, default="MAD")
    is_available = Column(Boolean, default=True)
    image_url = Column(String, nullable=True)

    category = relationship("Category", back_populates="items")
