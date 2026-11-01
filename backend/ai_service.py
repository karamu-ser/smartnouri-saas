import os
import json
import google.generativeai as genai
from typing import List, Dict, Any

# Configure the API key. In production, this should come from environment variables.
# We will look for GEMINI_API_KEY.
api_key = os.environ.get("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

# We use gemini-2.5-flash for complex document extraction.
MODEL_NAME = 'gemini-2.5-flash'

def extract_menu_from_images(images_data: List[Dict[str, bytes]]) -> Dict[str, Any]:
    """
    Takes multiple images of a restaurant menu and uses Gemini to extract
    the categories, items, and prices into a single structured JSON format.
    """
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY non configurée : lecture du menu indisponible")

    try:
        model = genai.GenerativeModel(MODEL_NAME)
        
        prompt = """
        You are an expert data extractor for a restaurant digital menu system.
        Look at the provided image(s) of a restaurant menu. 
        Extract all the categories, dish names, descriptions, and prices from ALL the provided pages.
        Combine everything into a SINGLE cohesive menu structure.
        
        Format the output STRICTLY as a JSON object matching this schema:
        {
            "restaurant_description": "string (Generate a short, catchy, elegant 1-sentence subtitle describing the vibe of the restaurant based on its menu, e.g. 'Un havre de paix aux tons chauds', 'Cuisine traditionnelle authentique', etc.)",
            "categories": [
                {
                    "name": "string (Category name like 'Pizzas', 'Drinks')",
                    "sort_order": integer (0, 1, 2...),
                    "items": [
                        {
                            "name": "string (Dish name)",
                            "description": "string (Ingredients or description, or null if none)",
                            "price": float (Parse the price as a clean number, e.g. 12.50),
                            "currency": "string (Always use 'DH')",
                            "is_available": true
                        }
                    ]
                }
            ]
        }
        
        CRITICAL RULES:
        1. Output ONLY valid JSON.
        2. Do not include markdown formatting (like ```json).
        3. Do not include any other text before or after the JSON.
        """

        # Construct the parts array for the Gemini model
        request_parts = [prompt]
        for img_dict in images_data:
            request_parts.append({
                "mime_type": img_dict.get("mime_type", "image/jpeg"),
                "data": img_dict.get("data")
            })

        response = model.generate_content(request_parts)
        
        # Clean the response text (sometimes the model still includes markdown blocks despite instructions)
        text_response = response.text.strip()
        if text_response.startswith("```json"):
            text_response = text_response[7:]
        if text_response.endswith("```"):
            text_response = text_response[:-3]
            
        text_response = text_response.strip()
        
        # Parse and return the JSON
        return json.loads(text_response)

    except Exception as e:
        print(f"Error during AI extraction: {str(e)}")
        raise e
