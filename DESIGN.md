---
name: Protest Editorial
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#e2beba'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#aa8986'
  outline-variant: '#5a403e'
  surface-tint: '#ffb4ac'
  primary: '#ffb4ac'
  on-primary: '#690007'
  primary-container: '#b22222'
  on-primary-container: '#ffc8c2'
  inverse-primary: '#b52424'
  secondary: '#f6be39'
  on-secondary: '#402d00'
  secondary-container: '#c59300'
  on-secondary-container: '#433000'
  tertiary: '#cac6be'
  on-tertiary: '#32302b'
  tertiary-container: '#5e5c56'
  on-tertiary-container: '#d9d4cd'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb4ac'
  on-primary-fixed: '#410003'
  on-primary-fixed-variant: '#92030f'
  secondary-fixed: '#ffdfa0'
  secondary-fixed-dim: '#f6be39'
  on-secondary-fixed: '#261a00'
  on-secondary-fixed-variant: '#5c4300'
  tertiary-fixed: '#e7e2da'
  tertiary-fixed-dim: '#cac6be'
  on-tertiary-fixed: '#1d1c17'
  on-tertiary-fixed-variant: '#494741'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-hero:
    fontFamily: Noto Serif Devanagari
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: Noto Serif Devanagari
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg:
    fontFamily: Noto Serif Devanagari
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Noto Serif Devanagari
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Noto Sans Devanagari
    fontSize: 20px
    fontWeight: '400'
    lineHeight: '1.8'
  body-md:
    fontFamily: Noto Sans Devanagari
    fontSize: 17px
    fontWeight: '400'
    lineHeight: '1.75'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.03em
spacing:
  unit: 4px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  section-gap: 80px
---

## Brand & Style

The design system is built for a dual-purpose identity: a premium editorial magazine and a living movement archive. It captures the urgency of a manifesto with the sophistication of a long-form broadsheet. The emotional response is one of serious intellectual engagement and passionate advocacy.

The style is a hybrid of **High-Contrast Bold** and **Minimalist Editorial**. It avoids decorative fluff in favor of structural clarity. Movement and energy are conveyed through color blocking—transitioning between "Deep Ink" immersive dark modes and "Aged Paper" readability layers. The visual language draws from protest posters—using heavy borders and striking accents—but refines them with precise spacing and luxury-grade typography.

## Colors

This design system utilizes a high-contrast palette to distinguish between news delivery and opinionated deep-dives. 

- **Deep Ink Black (#0F0F0F):** The primary canvas for the platform, providing a cinematic, focused environment for discovery.
- **Aged Paper (#FFFFFF):** Used for article reading surfaces to reduce eye strain and evoke the feeling of physical print media.
- **Deep Brick Crimson (#B22222):** The voice of urgency. Used for breaking news, primary calls to action, and critical emphasis.
- **Muted Gold (#D4A017):** Represents authority and the "archive" aspect. Used for featured analysis, historical context, and premium markers.
- **Divider System:** Use #2C2C2C for dark surfaces and a 10% opacity version of the accent color for light surfaces.

## Typography

Typography is the core of this design system. It prioritizes Devanagari script legibility and hierarchy.

- **Display & Headlines:** Use Noto Serif Devanagari to provide an authoritative, editorial voice. Hero titles should use tight leading to feel like a newspaper masthead.
- **Body Text:** Use Noto Sans Devanagari with a generous 1.75 to 1.8 line-height. This ensures that complex Hindi conjuncts are clearly legible and the "ink" doesn't feel cramped on the "paper" surface.
- **Functional UI:** Inter is used for all Latin-character UI elements, metadata, and labels to provide a sharp, modern contrast to the traditional serif headlines. Use uppercase for labels to enhance the "archival tag" aesthetic.

## Layout & Spacing

The layout philosophy follows a **Fixed Editorial Grid** on desktop and a **Fluid Single Column** on mobile.

- **The Grid:** A 12-column system with wide 24px gutters. Elements should "snap" to the grid to maintain a structured, disciplined feel.
- **Color-Blocking Layout:** Use full-bleed background sections to separate content types. For example, the Hero section may be Deep Ink (#0F0F0F), while the main article body transitions into an Aged Paper (#FFFFFF) container.
- **Rhythm:** Use a baseline grid based on 4px units. Section headers should have significant top-margin (80px+) to allow the content to breathe, mimicking high-end magazine layouts.

## Elevation & Depth

This design system rejects soft, ambient shadows in favor of structural depth.

- **Borders as Depth:** Use 1px solid borders (#2C2C2C) to define cards and containers.
- **The "Lift":** For interactive elements or featured cards, use a "hard lift" aesthetic. Instead of a blur, use a 2px offset solid shadow in the Accent Crimson (#B22222) or Muted Gold (#D4A017) to create a tactile, poster-like effect.
- **Layering:** Articles use a "Paper on Ink" metaphor. The background is #0F0F0F, and article content sits on #FFFFFF containers with zero border-radius, creating a sharp, cut-out look.

## Shapes

The shape language is **Sharp (0)**. 

To maintain the "Movement Archive" and "Broadsheet" aesthetic, all corners are strictly 90 degrees. This includes buttons, input fields, images, and cards. This sharpness communicates discipline, urgency, and a non-corporate, grassroots-yet-refined authority.

## Components

### Buttons
- **Primary:** Solid Deep Brick Crimson (#B22222) with White text. Sharp corners. No gradient. 
- **Secondary:** Transparent background with a 2px solid #D4A017 (Gold) border.
- **Hover State:** Shift the button 2px up and 2px left, revealing a solid black offset "shadow" behind it.

### Cards (Editorial)
- **Standard Card:** Surface #1A1A1A, 1px border #2C2C2C.
- **Featured Card:** Surface #FFFFFF, text in #0F0F0F, 1px border #D4A017.
- **Images:** All images should have a slight desaturation or a subtle warm filter to match the Aged Paper aesthetic.

### Input Fields
- Underline style only for a "signed document" feel, or a full 1px box. 
- Background: Transparent or #1A1A1A. 
- Focus state: Border color changes to Crimson (#B22222).

### Lists & Navigation
- **Navigation:** Use Inter Medium, all-caps. Active links are underlined in Gold (#D4A017).
- **Dividers:** Use horizontal rules (HR) that span the full container width to separate news items, mimicking newspaper columns.

### Chips/Tags
- Rectangular with 1px borders. No fills unless it's a "Live" or "Breaking" tag, which uses a solid Crimson (#B22222) fill.