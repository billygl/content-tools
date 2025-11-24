import re
import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

input_file = 'text.txt'

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
    system_prompt = "Highlight keywords. Highlight the most important words by making them enclosed in asterisks (*). Choose only 3 or 4  most relevant words to highlight. At then end, add 3 o 4 relevant hashtags related to the text. Use spanish. Add a pair of emojis to decorate some ideas."
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=f"{system_prompt}\n\n{text}"
    )
    return response.text

def process_text(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Split by separator and take the first part
        SEPARATOR = '-----'
        SEPARATOR_N = '\n' + SEPARATOR + '\n'
        parts = content.split(SEPARATOR)
        text_to_process = parts[0]
        # Highlight
        processed_text = highlight(text_to_process)
        
        # Replace *text* with bold version
        # The regex looks for * followed by non-* characters followed by *
        processed_text = re.sub(r'\*([^*]+)\*', lambda m: to_bold(m.group(1)), processed_text)
        
        # Trim whitespace for clean output
        processed_text = processed_text.strip()
        
        return text_to_process + SEPARATOR_N + processed_text
        
    except FileNotFoundError:
        return f"Error: File {file_path} not found."
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":

    result = process_text(input_file)
    
    with open(input_file, 'w', encoding='utf-8') as f:
        f.write(result)
    print(f"Output saved to {input_file}")
