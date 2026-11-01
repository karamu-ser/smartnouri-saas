"""Idempotent nullable-column migrations, also run before API startup.

Run from backend/ with ``python migrate_db.py``. DATABASE_URL selects the same
database as the API; without it, both use smartnouri.db in the current directory.
"""
from sqlalchemy import inspect, text
from database import engine

COLUMNS_TO_ADD = {
    "restaurants": {
        "slug": "VARCHAR",
        "original_menu_image": "VARCHAR",
        "client_email": "VARCHAR",
        "client_password_hash": "VARCHAR",
        "client_recovery_code_hash": "VARCHAR",
    },
    "menu_items": {
        "image_url": "VARCHAR"
    }
}

def migrate_database(bind=engine):
    """Migrate only existing tables; create_all handles brand-new databases."""
    from models import PhoneRegistration
    PhoneRegistration.__table__.create(bind=bind, checkfirst=True)
    with bind.begin() as connection:
        inspector = inspect(connection)
        tables = set(inspector.get_table_names())
        for table, columns in COLUMNS_TO_ADD.items():
            if table not in tables:
                continue
            existing = {column["name"] for column in inspector.get_columns(table)}
            for column_name, column_type in columns.items():
                if column_name not in existing:
                    # Identifiers and types come only from the static mapping above.
                    connection.execute(text(
                        f'ALTER TABLE "{table}" ADD COLUMN "{column_name}" {column_type}'
                    ))


if __name__ == "__main__":
    migrate_database()
    print("Migration terminée. Les comptes existants sont conservés.")
