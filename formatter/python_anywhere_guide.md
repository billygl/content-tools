# PythonAnywhere Deployment Guide for LinkedIn Scheduler

This guide details the steps to deploy the LinkedIn Batch Scheduler to your **YOUR_USERNAME** PythonAnywhere account.

## 1. Upload Your Files
1. Log in to [PythonAnywhere](https://www.pythonanywhere.com/).
2. Go to the **Files** tab.
3. Create a new directory named `formatter` at `/home/YOUR_USERNAME/formatter`.
4. Upload the following from your local `formatter/` folder:
   - `app.py`
   - `formatter.py`
   - `linkedin_api.py`
   - `.env` (ensure it has `WEB_USERNAME`, `WEB_PASSWORD`, `FLASK_SECRET_KEY`, and a new `WORKER_TOKEN`)
   - `static/` (folder and its contents)
   - `templates/` (folder and its contents)
   - `data/` (folder, specifically `data/images` if you have them)

## 2. Set Up the Virtual Environment
1. Go to the **Consoles** tab and open a **Bash** console.
2. Run the following commands:
   ```bash
   mkvirtualenv --python=python3.10 linkedin-env
   pip install flask flask-login requests python-dotenv google-generativeai
   ```

## 3. Create the Web App
1. Go to the **Web** tab.
2. Click **"Add a new web app"**.
3. Click **Next**, then choose **"Manual Configuration"** (do NOT choose Flask here).
4. Select **Python 3.10**.
5. Click **Next** to finish the wizard.

## 4. Configure Web App Paths
In the **Web** tab, update these sections:
- **Source code**: `/home/YOUR_USERNAME/formatter`
- **Working directory**: `/home/YOUR_USERNAME/formatter`
- **Virtualenv**: `/home/YOUR_USERNAME/.virtualenvs/linkedin-env`

## 5. Update WSGI Configuration
1. In the **Web** tab, under the **Code** section, click the link for the **WSGI configuration file**.
2. Delete the existing content and paste this exactly:

```python
import sys
import os
from dotenv import load_dotenv

# Path to your project
project_home = '/home/YOUR_USERNAME/formatter'
if project_home not in sys.path:
    sys.path.append(project_home)

# Load environment variables from .env
load_dotenv(os.path.join(project_home, '.env'))

# Import the Flask app
from app import app as application
```

3. Click **Save**.

## 6. Set Up Automated Scheduling (Free Tier)
Since you are on a free account, you'll use **GitHub Actions** to trigger the queue:
1. Go to your repository on GitHub.
2. Click **Settings** > **Secrets and variables** > **Actions**.
3. Click **New repository secret**.
4. Name: `WORKER_TOKEN`.
5. Value: (The same `WORKER_TOKEN` you put in your `.env`).
6. Click **Add secret**.
7. Click **New repository secret** again.
8. Name: `PA_URL`.
9. Value: `https://YOUR_USERNAME.pythonanywhere.com` (Replace with your actual site URL).
10. The file `.github/workflows/ping_worker.yml` is already in your code. It will now run every 15 minutes and ping your site to process any scheduled posts!

## 7. Launch
1. Go back to the **Web** tab.
2. Click the green **Reload YOUR_USERNAME.pythonanywhere.com** button.
3. Visit [YOUR_USERNAME.pythonanywhere.com](http://YOUR_USERNAME.pythonanywhere.com) and log in!

---
**Note**: Ensure your `.env` file on PythonAnywhere contains your production `GEMINI_API_KEY` and LinkedIn tokens.
