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
6. Go to the **Auth** tab. Note your `Client ID` and `Client Secret`.
7. **Generate Access Token:** The easiest way to get a long-lived access token for your own account without building a full OAuth web flow is:
   - Use the [LinkedIn API Token Generator tool](https://linkedin.github.io/oauth2-tools/) or Postman.
   - Request scopes: `w_member_social`, `r_liteprofile`, `openid`, `profile`, `email`.
   - Complete the login flow and copy the exact Access Token provided.

Paste these values into your `linkedin/.env` file.
