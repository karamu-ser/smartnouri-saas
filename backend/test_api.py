import os
import sys
import logging
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import security
from sqlalchemy.orm import Session
from database import SessionLocal
import models
import schemas
from fastapi.encoders import jsonable_encoder

db = SessionLocal()
try:
    restaurants = db.query(models.Restaurant).all()
    print("Found restaurants in DB:", len(restaurants))
    for r in restaurants:
        print(f"Serializing Restaurant {r.id} ({r.name})")
        # Try Pydantic serialization
        try:
            resp = schemas.RestaurantResponse.model_validate(r)
            print(f"  Pydantic Validated! menus: {len(resp.menus)}")
        except Exception as e:
            print(f"  Pydantic ERROR: {e}")
            import traceback
            traceback.print_exc()
except Exception as e:
    print(f"DB Error: {e}")
finally:
    db.close()
