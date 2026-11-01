import os
import sys
import traceback

print("=== STARTING DATABASE DIAGNOSTIC ===")

try:
    from database import SessionLocal
    import models
    import schemas
except Exception as e:
    print("FAILED TO IMPORT MODULES:", e)
    sys.exit(1)

db_path = "smartnouri.db"
if os.path.exists(db_path):
    print(f"DB File Permissions: {oct(os.stat(db_path).st_mode)}")
    print(f"DB File Owner UID: {os.stat(db_path).st_uid}")
    print(f"Can read? {os.access(db_path, os.R_OK)}")
    print(f"Can write? {os.access(db_path, os.W_OK)}")
else:
    print("DB File does not exist at ./smartnouri.db!")

db = SessionLocal()
try:
    print("Querying restaurants...")
    restaurants = db.query(models.Restaurant).all()
    print(f"Found {len(restaurants)} restaurants.")

    for r in restaurants:
        print(f"--- Checking Restaurant ID {r.id} ({r.name}) ---")
        try:
            resp = schemas.RestaurantResponse.model_validate(r)
            print("  [OK] Pydantic validation passed.")
        except Exception as e:
            print(f"  [ERROR] Pydantic validation failed for ID {r.id}:")
            traceback.print_exc()

except Exception as e:
    print("[ERROR] SQLAlchemy Database Query Failed:")
    traceback.print_exc()
finally:
    db.close()

print("=== END OF DIAGNOSTIC ===")
