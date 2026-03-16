# Carousel Content Generator Prompt

Copy and paste this prompt into any LLM (ChatGPT, Claude, Gemini) to generate high-quality content for your automated carousel.

---

## 🤖 LLM Prompt Template

**Role:** Expert Data Formatter & JSON Specialist.

**Task:** Transform the provided raw content into a valid `script.json` file for a Remotion carousel engine. You must preserve the source meaning while optimizing the structure for a 9:16 visual layout.

**Input Content:** [PASTE YOUR RAW CONTENT HERE]

---

### 🎨 Formatting Rules (CRITICAL)

1. **Shortcuts:**
   - Use **`%word`** for a **Block Highlight** (Black text on white background). Use this for the most important words.
   - Use **`@word`** for an **Accent Highlight** (Uses the accent color). Use this for secondary emphasis.

2. **JSON Structure:**
   - `project_name`: Descriptive name.
   - `slides`: An array of slide objects.
   - `config`: Global styles:
     - `theme`: (Optional) `"default"`, `"whatsapp"`, `"notebooklm"`, etc (pulls from `themes.json`). OR, you can provide an entire inline theme object for a custom brand: `{"backgrounds": ["#HEX1", "#HEX2"], "primary_color": "#HEX", "accent_color": "#HEX", "highlight_bg_color": "#HEX", "highlight_text_color": "#HEX"}`.
     - `background`, `primary_color`, `accent_color`: (Optional manual overrides).
     - `hashtag`, `show_hashtag` (boolean)
     - `safe_zone`: Use "tiktok", "stories", or "none".
     - `font_size_title`: (Optional) Custom title size.
     - `font_size_body`: (Optional) Custom body/points size.

3. **Slide Fields:**
   - `layout`: (Optional) `"standard"` (or `"intro"`), `"title_only"`, `"blank"`, `"full_image"`, `"image_top"`, `"outro"`, or `"code"`.
   - `src`: (Optional) If `layout: "code"`, the exact name of your custom React component (e.g., `"PromoSlide"`).
   - `title`: Main hook (Short and punchy).
   - `sub`: (Optional) Subtitle or supporting text.
   - `body`: (Optional) Detailed body text (alternative to sub).
   - `points`: (Optional) Array of strings for bullet points.
   - `image`: (Optional) Filename in `data/images/`.
   - `image_style`: (Optional) `{ zoom, fit, position, width, height, borderRadius }` object. Set `width` to shrink logos and `borderRadius: "full"` for circle avatars.
   - `title_offset_x`, `title_offset_y`, `body_offset_x`, `body_offset_y`: (Optional) numeric. Micro-spacing tweaks.
   - `color`: (Optional) override accent color.
   - `background`: (Optional) Override background for this specific slide.

---

### 📈 Content Strategy
- **Text Adaptation:** Break long paragraphs into punchy, short sentences.
- **Visual Balance:** If a slide has no image, the text will be **Centered and Enlarged** automatically. 
- **Shortcuts:** Apply `%` (Block) and `@` (Accent) strategically to the most important keywords in the input.

---

### 🧩 Custom Component Generation (`layout: "code"`)
If the user requests a **complex visual layout** that cannot be served by the standard templates (e.g., "a custom 3D grid layout" or "a special promo slide with bouncing arrows"), you must:
1. Set the slide's `layout` to `"code"` and `src` to a new component name.
2. Provide the JSON as normal.
3. Then, provide the React code for that new component using `AbsoluteFill` and `SlideProps` from `remotion`, ensuring it applies the current `background` and `accentColor` passed from the Root.
4. Tell the user to save it in `src/custom/ComponentName.tsx` and register it in `src/custom/index.ts`.

---

### 📄 Output Format
For standard requests, provide ONLY the JSON code block.
For complex custom layouts, provide the JSON block AND the React `.tsx` block.

```json
{
  "project_name": "Title of Project",
  "slides": [
    {
      "id": 1,
      "title": "The mujer que se @negó a jugar",
      "sub": "Subtitle goes here",
      "layout": "full_image",
      "image": "portrait.jpg",
      "title_offset_y": -40,
      "color": "#6a1b9a"
    },
    {
      "id": 2,
      "title": "Why you should %care about this",
      "points": ["Reason 1", "Reason 2", "Reason 3"]
    }
  ],
  "config": {
    "theme": {
      "backgrounds": ["#26b93f", "#ffffff"],
      "primary_color": "#000000",
      "accent_color": "#128C7E",
      "highlight_bg_color": "#000000",
      "highlight_text_color": "#ffffff"
    },
    "font_family": "Outfit, sans-serif",
    "show_hashtag": false
  }
}
```
