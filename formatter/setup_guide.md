# Setup Guide for LinkedIn & Notion APIs

This guide walks you through getting the necessary API tokens for your pipeline.

## 1. Notion API Setup

1. Go to [Notion My Integrations](https://www.notion.so/my-integrations).
2. Click **New integration**.
3. Name it (e.g., "LinkedIn Scheduler").
4. Select the workspace where your database will live.
5. Click **Submit**. You will get an "Internal Integration Secret". This is your `NOTION_TOKEN`.
6. **Create the Database:** In Notion, create a new full-page Table Database with the following columns:
   - `Name` (Title): Short description of the post.
   - `Raw Text` (Text): Where you write the initial draft.
   - `Formatted Text` (Text): Where the script writes the AI output.
   - `Status` (Select): Create options: `Draft`, `Needs Review`, `Approved`, `Scheduled`, `Published`, `Error`.
   - `Image URL` (URL): Or Files/Media if uploading locally, but URL is easier for AI gen.
   - `Schedule Time` (Date): Include time.
7. **Connect the Database:** Open your new Notion database page. Click the `...` menu in the top right -> `Connect to` -> select your "LinkedIn Scheduler" integration.
8. **Get Database ID:** Copy the link to your database view. It looks like `https://www.notion.so/workspace/DATABASE_ID?v=...`. The `DATABASE_ID` is the 32-character string before the `?`.

## 2. LinkedIn API Setup

Getting a token to post on LinkedIn involves creating an app.

1. Go to the [LinkedIn Developer Portal](https://developer.linkedin.com/).
2. Click **Create app**.
3. Fill in the details (Name, Company Page, Privacy Policy URL).
4. Verify the app (LinkedIn will send a verification link to the Page admin).
5. Go to the **Products** tab in your app and request access to **Share on LinkedIn** and **Sign In with LinkedIn using OpenID Connect**.
31. Go to the **Auth** tab. Note your `Client ID` and `Client Secret`.
32. **Add Redirect URL**: Under OAuth 2.0 settings in the Auth tab, add exactly `http://localhost:8080/callback` as an Authorized redirect URL for your app.
33. **Generate Access Token:** We will generate it locally since online tools are unreliable.
   - Using your terminal, go to the `formatter` folder.
   - Run the included script: `python get_linkedin_token.py`
   - It will ask for your Client ID and Client Secret, then open your browser so you can log in.
   - Once authorized, the terminal script will print your Access Token.

Paste these values into your `.env` file (`LINKEDIN_ACCESS_TOKEN=your_token_here`).
