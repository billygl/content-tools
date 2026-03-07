# LinkedIn Batch Scheduler & Text Formatter

This tool formats a given text by highlighting important keywords with Gemini, converting them to bold characters, and natively scheduling them to LinkedIn with optional images.

## Features

- **Keyword Highlighting**: Utilizes the Gemini API to identify and mark key words and phrases in the text.
- **Bold Conversion**: Converts the highlighted keywords into mathematical bold Unicode characters for emphasis.
- **LinkedIn Integration**: Schedules posts directly to your LinkedIn profile natively.
- **Batch Processing**: Write multiple posts at once separated by `-----` and let the script schedule them sequentially at intervals.
- **Local Images**: Automatically upload correlating images (e.g. `1.jpg`, `2.jpg`) along with your batch posts.
- **Dry Run & Review**: Output formatted posts to a file for manual review before sending them to LinkedIn.

## Setup Requirements

1. Python 3.9+ 
2. A Python Virtual Environment
3. API Keys set in a `.env` file (see `.env.example`).

### 1. Installation
```bash
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. Getting your API Keys
1. **Gemini**: Go to [Google AI Studio](https://aistudio.google.com/) to get a free API key. Save as `GEMINI_API_KEY`.
2. **LinkedIn**: 
   - Follow the instructions in `setup_guide.md` to create a LinkedIn app and get your `Client ID` and `Client Secret`.
   - Add them to your `.env` as `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET`.
   - Run the token generator script to automatically fetch and save your Access Token:
     ```bash
     python get_linkedin_token.py
     ```

## Usage

### Single-File Formatter (Legacy Mode)
If you just want to read `text.txt` and format it locally:
```bash
python formatter.py
```

### Batch Mode & LinkedIn Scheduling
Write your posts in a text file (e.g. `data/input.txt`), separated by exactly 5 dashes (`-----`).

**Options available in `main.py`:**
- `--action`: **(Required)** One of `gemini`, `format`, or `post`.
- `--input`: **(Required)** The text file to read from.
- `--output`: The file to save results to (required for `gemini` and `format`).
- `--images`: Folder containing `1.jpg`, `2.jpg`, etc. Defaults to `data/images`.
- `--start`: ISO time to schedule the first post (e.g., `2026-03-05T10:00:00`). Defaults to now.
- `--interval_hours`: Hours between each post. Defaults to `24`.

#### The 3-Step Explicit Workflow

To prevent AI formatting errors, it's recommended to do this in three distinct steps. You can automate this process interactively by running:

```powershell
.\run_pipeline.ps1
```
This script will run Gemini, pause to ask if the asterisks look correct (allowing you to retry if it messed up), then run the bold formatter, and finally ask if you want to publish it to LinkedIn.

**Or manually via Terminal:**

**Step 1. Get Gemini Output (with asterisks)**
Generate the AI highlights and hashtags, saving to a temporary file so you can verify the asterisks are placed correctly.
```bash
python main.py --action gemini --input data/input.txt --output data/gemini_output.txt
```
*(Review `data/gemini_output.txt` to ensure Gemini added the `*asterisks*` properly)*

**Step 2. Convert Asterisks to Bold**
Once verified, convert the asterisks into mathematical bold unicode.
```bash
python main.py --action format --input data/gemini_output.txt --output data/final_output.txt
```
*(Review `data/final_output.txt` to ensure the bold text looks correct)*

**Step 3. Schedule or Post to LinkedIn**
Take the final polished text and publish it. The script will automatically look for matching images in your `data/images` folder (e.g., `1.jpg` for the first post).
```bash
python main.py --action post --input data/final_output.txt --start "2026-03-03T07:30:00" --interval_hours 24
```

#### Direct Immediate Workflow
If you want to skip Gemini entirely (e.g. you have your own pre-formatted text), just start at Step 3!
