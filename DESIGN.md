```markdown
# Design System Documentation: Editorial Scholarly Excellence

## 1. Overview & Creative North Star
**Creative North Star: "The Illuminated Manuscript"**

This design system is not a utility; it is a digital sanctuary for scholarship. It rejects the "template" look of modern SaaS in favor of a high-end editorial experience that bridges the gap between ancient manuscript tradition and contemporary digital precision.

The system moves away from rigid, centered grids. Instead, we embrace **Intentional Asymmetry**. Large-scale typography should often offset against high-quality library imagery, using the `spacing` scale to create "active" negative space. Elements should feel like they are layered on a curator’s desk—overlapping, thoughtfully placed, and connected through tonal depth rather than structural lines.

---

## 2. Colors & Surface Philosophy
The palette is rooted in the "Jade Dark" (#285B4B) and "Gold Beige" (#D8BF86) of traditional scholarly bindings, modernized through a sophisticated Material-based token system.

### The "No-Line" Rule
Standard 1px solid borders are strictly prohibited for sectioning content. Boundaries must be defined solely through background color shifts. To separate a feature section from a hero, transition from `surface` (#faf9f6) to `surface-container-low` (#f4f3f1). This creates a "soft-edge" layout that feels organic and premium.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. We use tonal nesting to define importance:
- **Level 1 (Base):** `surface` (#faf9f6).
- **Level 2 (Sectioning):** `surface-container-low` (#f4f3f1).
- **Level 3 (Interactive/Cards):** `surface-container-lowest` (#ffffff) to create a subtle "lift" against the background.

### The "Glass & Gradient" Rule
To add visual "soul," use Glassmorphism for persistent elements like the language switcher or navigation bars. Apply a `surface` color at 80% opacity with a `backdrop-blur`. For primary CTAs, avoid flat fills; use a subtle linear gradient from `primary` (#0b4335) to `primary_container` (#285b4b) to provide a soft, three-dimensional depth that evokes polished jade.

---

## 3. Typography
Our typography is a dialogue between two civilizations.

- **The Editorial Voice (English):** We use **Newsreader** (Display/Headline scales). It is a high-contrast serif that demands attention. Use `display-lg` (3.5rem) for hero statements with a negative letter-spacing of -0.02em to increase the "expensive" feel.
- **The Sacred Voice (Arabic):** **Amiri** is our anchor for Arabic script. It must be sized 120% relative to the English counterpart to maintain visual weight and legibility of its intricate diacritics.
- **The Functional Voice:** **Manrope** (Body/Label scales) handles the heavy lifting of data and scholarly citations. It provides a clean, modern contrast to the expressive serifs.

---

## 4. Elevation & Depth
In this system, depth is felt, not seen.

### The Layering Principle
Hierarchy is achieved by "stacking" surface tiers. A card (using `surface-container-lowest`) placed on a background of `surface-container-low` creates a natural, soft elevation without the need for archaic shadows.

### Ambient Shadows
If a floating element (like a modal or dropdown) requires a shadow, it must be an **Ambient Shadow**:
- **Color:** A tinted version of `on_surface` (e.g., #1a1c1a at 6% opacity).
- **Blur:** High values (e.g., 20px - 40px) to mimic natural light diffusion. Avoid tight, dark "drop shadows" at all costs.

### The "Ghost Border" Fallback
If accessibility requirements demand a container edge, use a **Ghost Border**. Use the `outline_variant` token at 15% opacity. It should be barely perceptible, providing a "suggestion" of a boundary rather than a hard wall.

---

## 5. Components

### Buttons: The Golden Touch
- **Primary:** `primary` (#0b4335) background with `on_primary` (#ffffff) text. Apply a `secondary` (#6f5c2d) 2px bottom-border "accent" or a gold-tinted glow on hover to evoke gold-leaf manuscript edges.
- **Tertiary:** Use `manrope` bold with `label-md` scale. No background. Use a `secondary` icon as a trailing element.
- **Roundedness:** Use `md` (0.375rem) for a professional, architectural feel. Avoid `full` (pill) shapes unless used for small tags/chips.

### Input Fields: Refined Inquiry
- **Container:** Use `surface-container-highest` (#e3e2e0) with a `none` border. 
- **Icons:** Use `secondary` (#6f5c2d) for icons to make them feel like decorative flourishes.
- **Focus State:** Transition the background to `surface-container-lowest` and add a `primary` ghost border (20% opacity).

### Persistent Language Switcher
- **Style:** A floating, glassmorphic pill using `surface_bright` at 70% opacity with a 12px backdrop-blur. 
- **Typography:** Toggle between `Newsreader` (EN) and `Amiri` (AR). Use the `secondary_fixed` (#fae0a4) color to highlight the active state.

### Cards & Lists
- **Rule:** Forbid the use of divider lines. 
- **Separation:** Separate list items using vertical white space (`spacing-4` or `spacing-6`). For cards, use the tonal shift between `surface-container-low` and `surface-container-lowest`.

### Geometric Overlays
- Use the `outline_variant` to create subtle, large-scale Islamic geometric patterns (8-point stars or tessellations) as background watermarks. Set these to 3-5% opacity. They should be "discovered" by the user, not seen immediately.

---

## 6. Do's and Don'ts

### Do:
- **Do** use asymmetrical layouts where text blocks are justified to the left/right and balanced by library imagery.
- **Do** use the `spacing-16` and `spacing-20` tokens for hero sections to let the scholarship "breathe."
- **Do** ensure the Arabic `Amiri` script has sufficient line-height (`leading-relaxed`) to prevent diacritics from overlapping.

### Don't:
- **Don't** use 100% black (#000000). Use `on_surface` (#1a1c1a) for better tonal harmony.
- **Don't** use standard "Material Design" blue for links. Use `primary` or `secondary` exclusively.
- **Don't** crowd the interface. If a screen feels busy, increase the background `surface` area and reduce the number of visible containers.
- **Don't** use hard, 1px lines to separate content; let the background color shifts do the work.```