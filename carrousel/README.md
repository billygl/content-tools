# 🎡 Automated Carousel Pipeline

High-quality, dynamic social media carousels powered by **Remotion**. Generate stills, LinkedIn PDFs, and TikTok/Reels videos from a single JSON script.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Live Preview (Hot Reload)
See your changes instantly in the browser without rendering.

To preview a specific project:
```bash
# Easiest way (avoids npm warnings):
npm run dev git_working_trees

# Or using the explicit flag:
npm run dev -- --project=git_basics
```
*(This automatically handles folder paths and ensures images located next to your `script.json` are loaded correctly)*

### 3. Generate Everything (Standard 9:16)
```bash
# Render a specific project:
npm run render git_basics
```
*Outputs: `out/[project]/9-16/stills/`, `out/[project]/9-16/carousel.pdf`, `out/[project]/9-16/video.mp4`*

---

## 📐 Aspect Ratios & Resolution

You can now generate content in **9:16** (TikTok/Reels) or **4:5** (LinkedIn/Instagram) from the same script.

### 1. Render in 4:5 (Optimized Layout)
```bash
# Simplest way (Project followed by Format)
npm run render git_basics 4:5
```
*The 4:5 layout automatically reduces safe zones and margins to maximize content density.*

### 2. High Resolution (4K / Scaling)
```bash
# Double the resolution
npm run render git_basics -- --scale=2
```

### 3. Power User (Custom Asset Mix)
If you want to render different formats for different assets simultaneously without NPM interference on Windows, bypass NPM and use `npx` directly:
```bash
npx tsx scripts/render.ts git_basics --stills-format=9:16 --pdf-format=4:5 --video-format=9:16
```
> [!TIP]
> If you request a PDF in a format that hasn't been rendered yet, the script will **automatically generate the required stills** for you.

---

## 📑 Multi-Post Workflow

To organize different social media posts, keep your scripts in `data/posts/`:

### Create a new post:
1.  Create folder: `public/data/my-new-post/`
2.  Add: `script.json` (use the [LLM Prompt](./LLM_PROMPT.md) to generate it).
3.  Add: Any images to that folder `public/data/my-new-post/`.

### Render a specific post:
```bash
# Render everything for a specific project
npm run render my-new-post

# Render only video in 4:5
npm run render my-new-post -- --video --format=4:5
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
Fine-tune how your images are sized, cropped, and zoomed. You can even have different styles for 4:5:
```json
{
  "image": "my-photo.jpg",
  "image_style": { 
    "width": "50%", 
    "borderRadius": "full", 
    "zoom": 1, 
    "position": "center" 
  },
  "image_style_4_5": { "zoom": 1.5, "position": "top 20%" }
}
```

### Content Shortcuts
- **`%word`**: Block Highlight (Black text on white background).
- **`@word`**: Accent Highlight (Uses your theme color).

### Themes System (`config.theme`)
We support pre-defined themes that automatically handle alternating background colors to create visual variety across your carousel.

All global themes are now stored conveniently in **`public/data/themes.json`**.
You can add your own brand colors directly to that JSON file (e.g. "notebooklm", "whatsapp"). 

```json
{
  "config": {
    "theme": "whatsapp"
  }
}
```

#### Inline Custom Themes (One-offs)
If you don't want to save a theme to `themes.json`, you can pass an entire theme object directly inside your `script.json` for ultimate personalization!

```json
{
  "config": {
    "theme": {
      "backgrounds": ["#000000", "#111111"],
      "primary_color": "#ffffff",
      "accent_color": "#ff0000",
      "highlight_bg_color": "#ffff00", 
      "highlight_text_color": "#000000"
    }
  }
}
```

### Slide Layouts (`layout`)
Transform the style of an individual slide by declaring a layout type:
- **`"standard"`** (Default) (or **`"intro"`**): Split content (Text + Image) or centered text.
- **`"image_top"`**: Top-heavy flow. Places the image directly between the Title and the Body text, organically sandwiching it.
- **`"title_only"`**: Forces text perfectly center, ignoring any body/points.
- **`"blank"`**: Ignores all content, rendering only the blank background wrapper.
- **`"full_image"`**: Ignores safe margins, stretches the `image` to fill the entire screen, adding a cinematic dark overlay behind your text.
- **`"outro"`**: Automatically styles the slide as a final Call-to-Action. Displays the "Fin" watermark, author branding, and a "Follow" button.
- **`"code"`**: Completely bypasses the default slide and allows you to inject entirely custom React `.tsx` components from your `script.json`!

```json
{
  "title": "A Cinematic Moment",
  "image": "my-photo.jpg",
  "layout": "full_image"
}
```

### 🧩 Custom React Slides (`layout: "code"`)
For massive special occasions (like a huge Black Friday completely 3D animated slide), you can write custom code and inject it *only* for that slide, keeping the rest of the carousel intact.

1. **Create your component:** Put a file in `src/custom/` (We've provided `PromoSlide.tsx` as an example). It will automatically receive all the `config`, `title`, and `background` colors for the current alternating theme.
2. **Register it:** Export it in `src/custom/index.ts`.
3. **Trigger it in JSON:** Use `layout: "code"` and tell it the exact name of your component in the `src` string.

```json
{
  "title": "50% OFF TODAY",
  "layout": "code",
  "src": "PromoSlide"
}
```

### Text Micro-Adjustments (Offsets)
Sometimes Remotion's automated layout needs a *tiny nudge* to look perfect. You can tweak positions instantly without touching the code.

Add these properties to a slide in `script.json` (values in pixels):
- `"title_offset_x": 0`
- `"title_offset_y": -40` (pushes title up 40px)
- `"body_offset_x": 20` (pushes body right 20px)
- `"body_offset_y": 0`

---

## 🛡️ Social Media Safe Zones

Set the `safe_zone` in your `script.json` config:
- `"safe_zone": "tiktok"` (Large bottom margin for captions/buttons)
- `"safe_zone": "stories"` (Medium bottom margin)
- `"safe_zone": "none"` (Standard margins)

---

## 🤖 Content Generation

Use the [**LLM_PROMPT.md**](./LLM_PROMPT.md) to turn your raw notes into a perfectly formatted `script.json`.
