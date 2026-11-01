from database import get_db
import models
import schemas
from pydantic import ValidationError

db = next(get_db())
restaurants = db.query(models.Restaurant).all()
print(f"Found {len(restaurants)} restaurants")
for r in restaurants:
    try:
        resp = schemas.RestaurantResponse.model_validate(r)
        print(f"Validated restaurant {r.id}")
    except ValidationError as e:
        print(f"Validation error for restaurant {r.id}: {e}")
