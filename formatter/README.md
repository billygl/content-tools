# Text Formatter

This script formats a given text file by highlighting important keywords and converting them to bold characters.

## Features

- **Keyword Highlighting**: Utilizes the Gemini API to identify and mark key words and phrases in the text.
- **Bold Conversion**: Converts the highlighted keywords into mathematical bold Unicode characters for emphasis.
- **Hashtags and Emojis**: Appends relevant hashtags and emojis to the content.

## How it Works

1.  The script reads the content from `text.txt`.
2.  It sends the text to the Gemini API (`gemini-2.5-flash-lite`) to get a highlighted version with important words enclosed in asterisks (`*word*`), along with some hashtags and emojis.
3.  It then processes this highlighted version, replacing the asterisks and their content with a bolded Unicode version of the text.
4.  The script overwrites the original `text.txt` with both the highlighted and the final bolded versions, separated by `-----`.

## Requirements

- Python 3
- A virtual environment
- A Gemini API key set as `GEMINI_API_KEY` in a `.env` file.

You can install the required packages using the `requirements.txt` file:
```bash
pip install -r requirements.txt
```

## Usage

1.  Create and activate a Python virtual environment.
2.  Install the dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Create a `.env` file in the same directory and add your Gemini API key:
    ```
    GEMINI_API_KEY=your_api_key_here
    ```
  - Use Google AI Studio for getting a key
4.  Create a `text.txt` file and add the text you want to format.
5.  Run the script:
    ```bash
    python formatter.py
    ```
6.  The `text.txt` file will be updated with the formatted content.
