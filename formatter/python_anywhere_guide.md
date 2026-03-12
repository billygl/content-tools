# PythonAnywhere Deployment Guide for LinkedIn Scheduler

This guide details the steps to deploy the LinkedIn Batch Scheduler to your **YOUR_USERNAME** PythonAnywhere account.

## 1. Deploy via Git (Preferred)
The easiest way to get your code onto PythonAnywhere is to clone your GitHub repository:
1. Log in to your PythonAnywhere dashboard and go to the **Consoles** tab.
2. Open a **Bash** console.
3. Run the following command:
   ```bash
   git clone https://github.com/YOUR_USERNAME/content-tools.git tools
   ```
4. **Important**: Since `.env` is gitignored, you MUST create it manually:
   - Go to the **Files** tab.
   - Navigate to `/home/YOUR_USERNAME/tools/formatter`.
   - Create a new file named `.env` and paste your production credentials (LinkedIn tokens, Gemini API key, `WEB_USERNAME`, `WEB_PASSWORD`, `FLASK_SECRET_KEY`, and `WORKER_TOKEN`).

## 1.1 Manual Upload (Alternative)
If you prefer not to use Git, you can still upload files via the **Files** tab...

## 2. Set Up the Virtual Environment
1. Go to the **Consoles** tab and open a **Bash** console.
2. Run the following commands:
   ```bash
   mkvirtualenv --python=python3.10 linkedin-env
   pip install flask flask-login requests python-dotenv google-genai flask-sqlalchemy
   ```

## 3. Create the Web App
1. Go to the **Web** tab.
2. Click **"Add a new web app"**.
3. Click **Next**, then choose **"Manual Configuration"** (do NOT choose Flask here).
4. Select **Python 3.10**.
5. Click **Next** to finish the wizard.

## 4. Configure Web App Paths
Since the LinkedIn tool is in a **subdirectory** of your repo, you must point to that specific folder:
- **Source code**: `/home/YOUR_USERNAME/tools/formatter`
- **Working directory**: `/home/YOUR_USERNAME/tools/formatter`
- **Virtualenv**: `/home/YOUR_USERNAME/.virtualenvs/linkedin-env`

## 5. Update WSGI Configuration
1. In the **Web** tab, under the **Code** section, click the link for the **WSGI configuration file**.
2. Delete the existing content and paste this exactly:

```python
import sys
import os
from dotenv import load_dotenv

# Path to your project (Note the /tools/formatter nesting)
project_home = '/home/YOUR_USERNAME/tools/formatter'
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

## 8. Quick Refresh (After Code Changes)
Whenever you push new changes from your computer to GitHub, run these commands in your PythonAnywhere **Bash** console to update your app:

1. **Pull the latest code**:
   ```bash
   cd ~/tools/formatter
   git pull origin feature/linkedin-batch-scheduler
   ```

2. **Restart the Web Server** (The "Touch" trick):
   ```bash
   touch /var/www/YOUR_USERNAME_pythonanywhere_com_wsgi.py
   ```
   *(Note: Replace `YOUR_USERNAME` with your actual username. This command is the same as clicking the green 'Reload' button in the Web tab).*

---
**Note**: Ensure your `.env` file on PythonAnywhere contains your production `GEMINI_API_KEY` and LinkedIn tokens.
