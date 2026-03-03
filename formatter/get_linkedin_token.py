import urllib.parse
import webbrowser
from http.server import HTTPServer, BaseHTTPRequestHandler
import requests
import sys
import os
from dotenv import load_dotenv

load_dotenv()

# We'll listen on a local port for the OAuth callback
PORT = 8080
REDIRECT_URI = f"http://localhost:{PORT}/callback"

# Global variables to store the received code and errors
auth_code = None
error_msg = None

class OAuthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        global auth_code, error_msg
        
        parsed_path = urllib.parse.urlparse(self.path)
        
        if parsed_path.path == "/callback":
            query = urllib.parse.parse_qs(parsed_path.query)
            
            if 'code' in query:
                auth_code = query['code'][0]
                self.send_response(200)
                self.send_header('Content-type', 'text/html')
                self.end_headers()
                self.wfile.write(b"<html><body><h1>Authentication successful!</h1><p>You can close this window and return to the terminal.</p></body></html>")
            elif 'error' in query:
                error_msg = query['error'][0]
                self.send_response(400)
                self.send_header('Content-type', 'text/html')
                self.end_headers()
                self.wfile.write(f"<html><body><h1>Authentication Failed</h1><p>Error: {error_msg}</p></body></html>".encode())
            else:
                self.send_response(400)
                self.send_header('Content-type', 'text/html')
                self.end_headers()
                self.wfile.write(b"<html><body><h1>Invalid callback URL</h1></body></html>")
        else:
            self.send_response(404)
            self.end_headers()

def main():
    print("=== LinkedIn Access Token Generator ===")
    print("1. Please ensure your LinkedIn app has the exact Redirect URL configured:")
    print(f"   {REDIRECT_URI}")
    print("2. Make sure you have requested the 'Share on LinkedIn' and 'Sign In with LinkedIn using OpenID Connect' products.\n")
    
    client_id = os.getenv("LINKEDIN_CLIENT_ID")
    client_secret = os.getenv("LINKEDIN_CLIENT_SECRET")
    
    if not client_id:
        client_id = input("Enter your Client ID: ").strip()
    else:
        print(f"Using Client ID from .env: {client_id[:5]}...")
        
    if not client_secret:
        client_secret = input("Enter your Client Secret: ").strip()
    else:
        print("Using Client Secret from .env: ********")
    
    if not client_id or not client_secret:
        print("Client ID and Secret are required. Exiting.")
        return

    # 1. Authorize URL
    auth_url = "https://www.linkedin.com/oauth/v2/authorization"
    # We require these scopes for openid and posting
    scopes = "w_member_social openid profile email"
    
    params = {
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": REDIRECT_URI,
        "scope": scopes,
        "state": "super_random_state_12345"
    }
    
    auth_req_url = f"{auth_url}?{urllib.parse.urlencode(params)}"
    
    print("\nStarting local server to catch the callback...")
    try:
        server = HTTPServer(('localhost', PORT), OAuthHandler)
    except Exception as e:
        print(f"Failed to start server on port {PORT}. Is something else using it? Error: {e}")
        return
        
    print("Opening browser for you to log in to LinkedIn...")
    webbrowser.open(auth_req_url)
    
    print("Waiting for you to authorize...")
    # Handle exactly one request
    server.handle_request()
    server.server_close()
    
    if error_msg:
        print(f"\nAuthentication failed! LinkedIn returned error: {error_msg}")
        return
        
    if not auth_code:
        print("\nAuthentication failed! Did not receive an authorization code.")
        return
        
    print("\nAuthorization code received! Exchanging for Access Token...")
    
    # 2. Exchange Code for Token
    token_url = "https://www.linkedin.com/oauth/v2/accessToken"
    # Content-Type: application/x-www-form-urlencoded
    payload = {
        "grant_type": "authorization_code",
        "code": auth_code,
        "redirect_uri": REDIRECT_URI,
        "client_id": client_id,
        "client_secret": client_secret
    }
    
    try:
        response = requests.post(token_url, data=payload)
        response.raise_for_status()
        token_data = response.json()
        
        access_token = token_data.get('access_token')
        expires_in = token_data.get('expires_in')
        
        print("\n=======================================================")
        print("SUCCESS! Here is your Access Token:")
        print("=======================================================")
        print(access_token)
        print("=======================================================")
        print(f"Copy the token above and paste it into your .env file as LINKEDIN_ACCESS_TOKEN={access_token[:10]}...")
        if expires_in:
            print(f"This token expires in {expires_in} seconds (approx {expires_in/86400:.1f} days).")
            
    except Exception as e:
        print("\nFailed to exchange code for token!")
        if hasattr(e, 'response') and e.response is not None:
            print(f"LinkedIn API Response: {e.response.text}")
        else:
            print(f"Error: {e}")

if __name__ == "__main__":
    main()
