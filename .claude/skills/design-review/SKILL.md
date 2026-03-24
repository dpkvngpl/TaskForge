---
name: design-review
description: Compare the built UI against design screenshots in the designs/ folder. Use this before committing any UI changes to verify they match the intended design.
---

## Design Review Process

When reviewing UI against design screenshots:

1. **Read the design screenshot** from the `designs/` folder that corresponds to the view being reviewed
2. **Read the current component code** for the view
3. **Compare these specific aspects:**
   - Layout structure (columns, rows, spacing, alignment)
   - Color accuracy (backgrounds, text, borders, accents)
   - Typography (font sizes, weights, line heights)
   - Component sizing (icons, buttons, badges, cards)
   - Spacing and padding (margins, gaps, padding)
   - Interactive elements (buttons, inputs, toggles)
   - Dark theme consistency
4. **List specific fixes needed** with exact CSS/style values
5. **Apply the fixes** to the component code
6. **Verify the build still compiles** after changes

## Design Token Reference

Use these exact values from the TaskForge design system:

- App background: `#0f1117`
- Surface/cards: `#1a1d27`
- Elevated surface: `#12141b`
- Border: `rgba(255,255,255,0.06)`
- Border hover: `rgba(255,255,255,0.12)`
- Text primary: `#e2e2e6`
- Text secondary: `#a5a5af`
- Text muted: `#6b7280`
- Accent: `#6366f1`
- Priority high: `#ef4444`
- Priority medium: `#f59e0b`
- Priority low: `#3b82f6`
- Success: `#22c55e`
- Border radius: 8px (cards), 6px (buttons), 4px (tags)

## Important

- Use inline `style={{}}` for SVG sizing — Tailwind classes don't apply to SVGs reliably in this project's Tailwind v4 setup
- All icons must have explicit width/height via inline styles
- Test that the build compiles after every change
