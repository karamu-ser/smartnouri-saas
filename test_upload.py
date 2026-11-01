import requests

# 1. create restaurant
res = requests.post("http://127.0.0.1:8081/api/v1/restaurants", json={
    "name": "Test Upload",
    "contact_phone": "1234567",
    "contact_email": None
})
r_id = res.json()["id"]

# 2. upload dummy image
dummy_jpg = b'\xff\xd8\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xed\x00\x00\xff\xd9'

with open("dummy.jpg", "wb") as f:
    f.write(dummy_jpg)

with open("dummy.jpg", "rb") as f:
    files = [("files", ("dummy.jpg", f, "image/jpeg"))]
    res2 = requests.post(f"http://127.0.0.1:8081/api/v1/restaurants/{r_id}/menu/upload", files=files)
    print("Upload Status:", res2.status_code)
    print("Response:", res2.text)
