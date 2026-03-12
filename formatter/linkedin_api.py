import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

# We will read this from .env
# Make sure to set LINKEDIN_ACCESS_TOKEN
ACCESS_TOKEN = os.getenv("LINKEDIN_ACCESS_TOKEN")
# Also need the ID of the person or organization
# E.g., LINKEDIN_AUTHOR_ID=urn:li:person:YOUR_ID or urn:li:organization:ORG_ID
AUTHOR_URN = os.getenv("LINKEDIN_AUTHOR_URN")

def _get_headers():
    if not ACCESS_TOKEN:
        raise ValueError("LINKEDIN_ACCESS_TOKEN is not set in .env")
    return {
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
        "Linkedin-Version": "202602"
    }

def get_my_profile():
    """Fetches your user ID to build the URN if not provided in .env."""
    url = "https://api.linkedin.com/v2/userinfo"
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    # The 'sub' claim in the OIDC userinfo response contains the member's ID
    data = response.json()
    return f"urn:li:person:{data.get('sub')}"

def _get_author_urn():
    if AUTHOR_URN:
        return AUTHOR_URN
    return get_my_profile()

def upload_local_image(image_path: str) -> str:
    """Uploads a local image file to LinkedIn and returns the asset URN."""
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found at {image_path}")
        
    print(f"Registering image upload for {image_path}...")
    upload_url, asset_urn = initialize_media_upload("urn:li:digitalmediaRecipe:feedshare-image")
    
    # Step 2: Upload the binary data
    print(f"Uploading binary data to LinkedIn...")
    with open(image_path, "rb") as f:
        media_data = f.read()
        
    upload_headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}
    upload_response = requests.put(upload_url, headers=upload_headers, data=media_data)
    upload_response.raise_for_status()
    
    print(f"Successfully uploaded image. Asset URN: {asset_urn}")
    return asset_urn

def upload_local_document(doc_path: str, title: str = "Document") -> str:
    """Uploads a local PDF/Document to LinkedIn and returns the asset URN."""
    if not os.path.exists(doc_path):
        raise FileNotFoundError(f"Document not found at {doc_path}")
        
    print(f"Registering document upload for {doc_path}...")
    upload_url, asset_urn = initialize_media_upload("urn:li:digitalmediaRecipe:feedshare-document")
    
    # Step 2: Upload binary data
    print(f"Uploading document binary to LinkedIn...")
    with open(doc_path, "rb") as f:
        doc_data = f.read()
        
    upload_headers = {
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "Content-Type": "application/pdf"
    }
    upload_response = requests.put(upload_url, headers=upload_headers, data=doc_data)
    upload_response.raise_for_status()
    
    print(f"Successfully uploaded document. Asset URN: {asset_urn}")
    return asset_urn

def initialize_media_upload(recipe_urn: str):
    """
    Generic media registration (image or document) using versioned API.
    """
    author_urn = _get_author_urn()
    
    if "image" in recipe_urn:
        url = "https://api.linkedin.com/rest/images?action=initializeUpload"
    else:
        url = "https://api.linkedin.com/rest/documents?action=initializeUpload"
        
    payload = {
        "initializeUploadRequest": {
            "owner": author_urn
        }
    }
    
    response = requests.post(url, headers=_get_headers(), json=payload)
    if response.status_code != 200:
        print(f"Failed to initialize upload. Status: {response.status_code}")
        print(response.json())
        response.raise_for_status()
        
    data = response.json()
    
    upload_url = data["value"]["uploadUrl"]
    asset_urn = data["value"]["image"] if "image" in recipe_urn else data["value"]["document"]
    
    return upload_url, asset_urn

def schedule_post(text: str, image_urn: str = None, document_urn: str = None, scheduled_time_ms: int = None):
    """
    Schedules or posts to LinkedIn using the modern /rest/posts API.
    """
    author_urn = _get_author_urn()
    url = "https://api.linkedin.com/rest/posts"
    
    import re
    
    # Normalize line endings and strip null bytes to prevent LinkedIn backend truncation.
    # Windows \r\n or unexpected LLM characters often cause the post to be cut off mid-sentence.
    safe_text = text.replace('\r\n', '\n').replace('\r', '\n').replace('\x00', '')
    
    # CRITICAL FIX: LinkedIn's backend parser (which checks for URLs and mentions) 
    # crashes if a parenthesis or bracket immediately precedes or encloses astral/4-byte 
    # Unicode characters (like Mathematical Bold). We escape them with backslashes so the 
    # API treats them as raw text rather than a malformed markdown/mention node.
    safe_text = re.sub(r'([()\[\]{}<>])', r'\\\1', safe_text)
    
    payload = {
        "author": author_urn,
        "commentary": safe_text,
        "visibility": "PUBLIC",
        "distribution": {
            "feedDistribution": "MAIN_FEED",
            "targetEntities": [],
            "thirdPartyDistributionChannels": []
        },
        "lifecycleState": "PUBLISHED"
    }
    
    if document_urn:
        payload["content"] = {
            "media": {
                "id": document_urn,
                "title": "Document"
            }
        }
    elif image_urn:
        payload["content"] = {
            "media": {
                "id": image_urn,
                "title": "Image"
            }
        }
        
    if scheduled_time_ms:
        print("Warning: Native LinkedIn API scheduling is restricted to approved partners.")
        print("Sending immediately. Local sleep handles the schedule.")
    
    print(f"Publishing post to LinkedIn via /rest/posts...")
    # To bypass LinkedIn WAF treating mixed 4-byte and 2-byte UTF-8 scripts as corrupted/spam,
    # we force `json.dumps` to escape all unicode to `\uXXXX` standard ASCII. 
    # LinkedIn's JSON parser seamlessly decodes these back into your exact accented words and emojis.
    json_payload = json.dumps(payload, ensure_ascii=True).encode('ascii')
    headers = _get_headers()
    headers["Content-Type"] = "application/json"
    
    response = requests.post(url, headers=headers, data=json_payload)
    
    if response.status_code not in (201, 200, 202):
        print(f"Failed to create post. Status: {response.status_code}")
        try:
            print(response.json())
        except:
            print(response.text)
        response.raise_for_status()
        
    post_urn = response.headers.get("x-restli-id")
    if post_urn:
        post_url = f"https://www.linkedin.com/feed/update/{post_urn}"
        return post_url
    
    return "Posted Successfully (URL not available)"
