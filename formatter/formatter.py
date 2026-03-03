import re
import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

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

def format_post(text_to_process: str) -> str:
    """Highlights text intelligently using Gemini and applies bold unicode to asterisks."""
    if not text_to_process.strip():
        return ""
        
    try:
        processed_text = highlight(text_to_process)
        
        # Replace *text* with bold version
        processed_text = re.sub(r'\*([^*]+)\*', lambda m: to_bold(m.group(1)), processed_text)
        
        # Trim whitespace for clean output
        processed_text = processed_text.strip()
        
        return processed_text
    except Exception as e:
        print(f"Error during formatting: {str(e)}")
        # If API fails, return the original text as a fallback
        return text_to_process.strip()

def process_batch_file(file_path: str) -> list[str]:
    """Reads a file and splits it into individual posts based on the '-----' separator."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        SEPARATOR = '-----'
        # Split by separator
        parts = content.split(SEPARATOR)
        
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
