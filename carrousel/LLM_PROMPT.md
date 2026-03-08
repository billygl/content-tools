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
     - `background`, `primary_color`, `accent_color`
     - `hashtag`, `show_hashtag` (boolean)
     - `safe_zone`: Use "tiktok", "stories", or "none".
     - `font_size_title`: (Optional) Custom title size.
     - `font_size_body`: (Optional) Custom body/points size.

3. **Slide Fields:**
   - `title`: Main hook (Short and punchy).
   - `sub`: (Optional) Subtitle or supporting text.
   - `body`: (Optional) Detailed body text (alternative to sub).
   - `points`: (Optional) Array of strings for bullet points.
   - `image`: (Optional) Filename in `data/images/`.
   - `image_style`: (Optional) `{ zoom, fit, position }` object.
   - `type`: (Optional) set to `"outro"` for branding slides.
   - `color`: (Optional) override accent color.
   - `background`: (Optional) Override background for this specific slide.

---

### 📈 Content Strategy
- **Text Adaptation:** Break long paragraphs into punchy, short sentences.
- **Visual Balance:** If a slide has no image, the text will be **Centered and Enlarged** automatically. 
- **Shortcuts:** Apply `%` (Block) and `@` (Accent) strategically to the most important keywords in the input.

---

### 📄 Output Format (JSON ONLY)
Please provide ONLY the JSON code block, following this exact schema:

```json
{
  "project_name": "Title of Project",
  "slides": [
    {
      "id": 1,
      "title": "The mujer que se @negó a jugar",
      "sub": "Subtitle goes here",
      "color": "#6a1b9a"
    },
    {
      "id": 2,
      "title": "Why you should %care about this",
      "points": ["Reason 1", "Reason 2", "Reason 3"]
    }
  ],
  "config": {
    "font_family": "Outfit, sans-serif",
    "primary_color": "#ffffff",
    "accent_color": "#00ff88",
    "background": "linear-gradient(135deg, #000 0%, #1a1a1a 100%)",
    "show_hashtag": false
  }
}
```
