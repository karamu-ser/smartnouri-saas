import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import security
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)
token = security.create_access_token({'sub': 'admin'})
response = client.get("/api/v1/restaurants", headers={"Authorization": f"Bearer {token}"})
print("STATUS:", response.status_code)
if response.status_code != 200:
    print("ERROR:", response.json())
else:
    print("SUCCESS! Restaurants count:", len(response.json()))
