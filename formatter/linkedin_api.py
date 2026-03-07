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
        "X-Restli-Protocol-Version": "2.0.0"
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
    """Generic media registration (image or document)."""
    author_urn = _get_author_urn()
    url = "https://api.linkedin.com/v2/assets?action=registerUpload"
    payload = {
        "registerUploadRequest": {
            "recipes": [recipe_urn],
            "owner": author_urn,
            "serviceRelationships": [
                {
                    "relationshipType": "OWNER",
                    "identifier": "urn:li:userGeneratedContent"
                }
            ]
        }
    }
    
    response = requests.post(url, headers=_get_headers(), json=payload)
    response.raise_for_status()
    data = response.json()
    
    upload_mechanism = data["value"]["uploadMechanism"]["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]
    upload_url = upload_mechanism["uploadUrl"]
    asset_urn = data["value"]["asset"]
    
    return upload_url, asset_urn

def schedule_post(text: str, image_urn: str = None, document_urn: str = None, scheduled_time_ms: int = None):
    """
    Schedules or posts to LinkedIn.
    Supports Image or Document (PDF).
    """
    author_urn = _get_author_urn()
    url = "https://api.linkedin.com/v2/ugcPosts"
    
    media_content = []
    share_media_category = "NONE"
    
    if document_urn:
        share_media_category = "DOCUMENT"
        media_content.append({
            "media": document_urn,
            "status": "READY"
        })
    elif image_urn:
        share_media_category = "IMAGE"
        media_content.append({
            "media": image_urn,
            "status": "READY"
        })
    
    share_content = {
        "shareCommentary": {
            "text": text
        },
        "shareMediaCategory": share_media_category
    }
    if media_content:
        share_content["media"] = media_content
        
    payload = {
        "author": author_urn,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": share_content
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
    }
    
    if scheduled_time_ms:
        print("Warning: Native LinkedIn API scheduling (scheduledTime) is restricted to approved Marketing Developer Partners.")
        print("We are sending the post immediately instead. Local sleep handles the schedule.")
    
    # Ensure header has Linkedin-Version for Posts API
    headers = _get_headers()
    headers["Linkedin-Version"] = "202304" # Use an appropriate dated version for Posts API
    
    print(f"Publishing/Scheduling post to LinkedIn...")
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code not in (201, 200, 202):
        print(f"Failed to create post. Status: {response.status_code}")
        print(response.json())
        response.raise_for_status()
        
    post_urn = response.headers.get("x-restli-id")
    if post_urn:
        # e.g., urn:li:share:123456789
        post_id = post_urn.split(":")[-1]
        post_url = f"https://www.linkedin.com/feed/update/{post_urn}"
        return post_url
    
    return "Posted Successfully (URL not available)"
