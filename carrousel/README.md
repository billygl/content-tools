# 🎡 Automated Carousel Pipeline

High-quality, dynamic social media carousels powered by **Remotion**. Generate stills, LinkedIn PDFs, and TikTok/Reels videos from a single JSON script.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Live Preview (Hot Reload)
See your changes instantly in the browser without rendering:
```bash
npm run dev
```

### 3. Generate Everything (Standard)
```bash
npm run render:all
```
*Outputs: `out/stills/`, `out/carousel.pdf`, `out/video.mp4`*

---

## 📑 Multi-Post Workflow

To organize different social media posts, keep your scripts in `data/posts/`:

### Create a new post:
1.  Create folder: `data/posts/my-new-post/`
2.  Add: `script.json` (use the [LLM Prompt](./LLM_PROMPT.md) to generate it).
3.  Add: Any images to `public/data/`.

### Render a specific post:
```bash
# Render everything for a specific project
npm run render:post -- --script=data/posts/judit-polgar/script.json

# Render only stills for a specific project
npm run render:stills -- --script=data/posts/judit-polgar/script.json
```
*Output will be saved in: `out/[project-name-from-json]/`*

---

## 🎨 Content Shortcuts

You can use these directly in your `script.json` (Title, Subtitle, or Points):

- **`%word`**: Block Highlight (Black text on white background).
- **`@word`**: Accent Highlight (Uses your theme color).

---

## 🛡️ Social Media Safe Zones

Set the `safe_zone` in your `script.json` config:
- `"safe_zone": "tiktok"` (Large bottom margin for captions/buttons)
- `"safe_zone": "stories"` (Medium bottom margin)
- `"safe_zone": "none"` (Standard margins)

---

## 🤖 Content Generation

Use the [**LLM_PROMPT.md**](./LLM_PROMPT.md) to turn your raw notes into a perfectly formatted `script.json`.
