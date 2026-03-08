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

### 3. Generate Everything (Standard 9:16)
```bash
npm run render
```
*Outputs: `out/[project]/9-16/stills/`, `out/[project]/9-16/carousel.pdf`, `out/[project]/9-16/video.mp4`*

---

## 📐 Aspect Ratios & Resolution

You can now generate content in **9:16** (TikTok/Reels) or **4:5** (LinkedIn/Instagram) from the same script.

### 1. Render in 4:5 (Optimized Layout)
```bash
npm run render -- --format=4:5
```
*The 4:5 layout automatically reduces safe zones and margins to maximize content density.*

### 2. High Resolution (4K / Scaling)
```bash
# Double the resolution (3840x2160 for 16:9 equivalent)
npm run render -- --scale=2
```

### 3. Advanced Asset Overrides
Mix and match formats for different assets in one command:
```bash
npm run render -- --stills-format=9:16 --pdf-format=4:5 --video-format=9:16
```
> [!TIP]
> If you request a PDF in a format that hasn't been rendered yet, the script will **automatically generate the required stills** for you.

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
npm run render -- --script=data/posts/judit-polgar/script.json

# Render only video in 4:5
npm run render:video -- --script=data/posts/judit-polgar/script.json --format=4:5
```

---

## 🎨 Advanced Configuration (`script.json`)

### Thumbnail & Social Performance (`thumbnail_mode`)
To ensure social networks capture a clean title slide as the thumbnail:
- **`"freeze"` (Best)**: Video starts with Slide 1 already fully visible and static for 15 frames before animating.
- **`"static"`**: Slide 1 appears instantly without its "fly-in" animation. 
- **`"none"`**: Standard animated start for all slides.

```json
{
  "config": {
    "thumbnail_mode": "freeze"
  }
}
```

### Format-Specific Styling
You can define overrides in the `config` section of your `script.json`:
- **`font_size_title_4_5`**: Custom title size for 4:5 format.
- **`font_size_body_4_5`**: Custom body size for 4:5 format.

### Image Styling (`image_style`)
Fine-tune how your images are cropped and zoomed. You can even have different styles for 4:5:
```json
{
  "image": "my-photo.jpg",
  "image_style": { "zoom": 1, "position": "center" },
  "image_style_4_5": { "zoom": 1.5, "position": "top 20%" }
}
```

### Content Shortcuts
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
