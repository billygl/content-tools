import re
import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

# Shared Paths
DATA_DIR = "data"
UPLOADS_DIR = os.path.join(DATA_DIR, "uploads")
QUEUE_DIR = os.path.join(DATA_DIR, "queue.json")
QUEUE_MEDIA_DIR = os.path.join(DATA_DIR, "queue_media")
INPUT_FILE = os.path.join(DATA_DIR, "input.txt")
GEMINI_OUTPUT_FILE = os.path.join(DATA_DIR, "gemini_output.txt")
FINAL_OUTPUT_FILE = os.path.join(DATA_DIR, "final_output.txt")

system_prompt = "Highlight keywords. Highlight the most important words by making them enclosed in asterisks (*). Choose only 4 or 5 most relevant words to highlight but highlight all their ocurrences. At then end, add 3 o 4 relevant hashtags related to the text. Use spanish. Add some emojis to decorate some ideas."

def to_bold(text):
    """Converts text to mathematical bold unicode characters."""
    result = ""
    for char in text:
        if 'A' <= char <= 'Z':
            result += chr(ord(char) - ord('A') + 0x1D400)
        elif 'a' <= char <= 'z':
            result += chr(ord(char) - ord('a') + 0x1D41A)
        elif '0' <= char <= '9':
            result += chr(ord(char) - ord('0') + 0x1D7CE)
        else:
            result += char
    return result

def highlight(text):
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=f"{system_prompt}\n\n{text}"
    )
    return response.text

def gemini_highlight(text_to_process: str) -> str:
    """Highlights text intelligently using Gemini with asterisks."""
    if not text_to_process.strip():
        return ""
        
    try:
        processed_text = highlight(text_to_process)
        return processed_text.strip()
    except Exception as e:
        print(f"Error during Gemini generation: {str(e)}")
        # If API fails, return the original text as a fallback
        return text_to_process.strip()

def apply_bold(text_to_process: str) -> str:
    """Applies bold unicode to asterisks."""
    if not text_to_process.strip():
        return ""
    # Replace *text* with bold version
    processed_text = re.sub(r'\*([^*]+)\*', lambda m: to_bold(m.group(1)), text_to_process)
    return processed_text.strip()

def process_batch_file(file_path: str) -> list[str]:
    """Reads a file and splits it into individual posts based on the '-----' separator."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        SEPARATOR = '-----'
        # Split by separator exclusively on its own line
        parts = re.split(rf'(?m)^{SEPARATOR}\s*$', content)
        
        # Clean up and filter empty posts
        posts = [p.strip() for p in parts if p.strip()]
        return posts
        
    except FileNotFoundError:
        print(f"Error: File {file_path} not found.")
        return []

def save_formatted_posts(posts: list[str], output_file: str):
    """Utility to save the AI-formatted posts back to a review file."""
    SEPARATOR_N = '\n\n-----\n\n'
    result = SEPARATOR_N.join(posts)
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(result)
    print(f"Formatted outputs saved to {output_file}")

def get_post_media(directory: str, post_number: int) -> tuple[str | None, str | None]:
    """
    Looks for media (PDF or Image) for a specific post number.
    Prioritizes PDF over images.
    Returns (media_path, media_type)
    """
    if not directory or not os.path.exists(directory):
        return None, None
        
    # 1. Check for PDF first (Precedence)
    pdf_path = os.path.join(directory, f"{post_number}.pdf")
    if os.path.exists(pdf_path):
        return pdf_path, "document"
        
    # 2. Check for Images
    for ext in ['.jpg', '.jpeg', '.png']:
        path = os.path.join(directory, f"{post_number}{ext}")
        if os.path.exists(path):
            return path, "image"
            
    return None, None

def process_and_save_batch(input_file: str, output_file: str, action: str) -> list[str]:
    """
    Processes a batch file with either 'gemini' or 'format' action and saves result.
    Returns the list of processed posts.
    """
    posts = process_batch_file(input_file)
    if not posts:
        return []
        
    results = []
    for p in posts:
        if action == "gemini":
            results.append(gemini_highlight(p))
        elif action == "format":
            results.append(apply_bold(p))
        else:
            results.append(p)
            
    save_formatted_posts(results, output_file)
    return results
