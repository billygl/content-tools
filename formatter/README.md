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
Write your posts in a text file (e.g. `batch_example.txt`), separated by exactly 5 dashes (`-----`).

**Options available in `main.py`:**
- `--input`: The text file containing your posts.
- `--images`: (Optional) Folder containing `1.jpg`, `2.jpg` etc., matching the post order.
- `--start`: ISO time to schedule the first post (e.g., `2026-03-05T10:00:00`). Defaults to now.
- `--interval_hours`: Hours between each post. Defaults to `24`.
- `--output`: If provided, the script saves the formatted text to this file *instead* of scheduling to LinkedIn.
- `--skip-formatting`: If provided, skips Gemini and schedules the exact text as-is.

#### Workflow 1: Format, Review, then Schedule

**Step 1. Format text to a review file:**
```bash
python main.py --input data/input.txt --output data/input_output.txt
```
*(Open `reviewed_posts.txt` and manually edit/verify the outputs).*

**Step 2. Schedule the reviewed file to LinkedIn (skipping AI format):**
```bash
python main.py --input data/input_output.txt --images images --start "2026-03-03T07:30:00" --interval_hours 24 --skip-formatting
```
```bash
python main.py --input data/input_output.txt --start "2026-03-03T07:30:00" --interval_hours 24 --skip-formatting
```

#### Workflow 2: Direct Schedule
If you trust the AI output and want to schedule immediately:
```bash
python main.py --input batch_example.txt --images images --start "2026-03-05T12:00:00" --interval_hours 24
```
