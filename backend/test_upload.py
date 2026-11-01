import requests
import sys
import json

def test_upload(restaurant_id, image_path):
    url = f"http://localhost:8000/api/v1/restaurants/{restaurant_id}/menu/upload"
    
    try:
        with open(image_path, 'rb') as f:
            files = {'file': (image_path, f, 'image/jpeg')}
            print(f"Uploading {image_path} to {url}...")
            response = requests.post(url, files=files)
            
            if response.status_code == 200:
                print("✅ Upload successful!")
                print("Structured Menu Data returned from API:")
                print(json.dumps(response.json(), indent=2))
            else:
                print(f"❌ Upload failed with status code {response.status_code}")
                print(response.text)
    except FileNotFoundError:
        print(f"Error: Could not find image at {image_path}")
    except Exception as e:
        print(f"Error during upload: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python test_upload.py <restaurant_id> <path_to_image>")
        sys.exit(1)
        
    restaurant_id = sys.argv[1]
    image_path = sys.argv[2]
    
    test_upload(restaurant_id, image_path)
