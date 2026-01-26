# GoSwish - Uber-Like Design System

## 🎨 Design Philosophy

**Inspired by Uber's clean, minimal, and professional aesthetic**

### Core Principles
1. **Bold & Simple** - Strong typography, minimal colors
2. **Black & White First** - Use color sparingly for emphasis
3. **Clear Hierarchy** - Large headings, obvious CTAs
4. **Generous Spacing** - Lots of white space
5. **Strong Shadows** - Subtle depth with clean shadows

---

## 🎨 Color Palette

### Primary Colors
```css
Black:     #000000  /* Primary actions, text */
White:     #FFFFFF  /* Backgrounds, cards */
Gray-50:   #F5F5F5  /* Light backgrounds */
Gray-100:  #E5E5E5  /* Borders, dividers */
Gray-900:  #171717  /* Dark text */
```

### Accent Colors
```css
Uber Green: #06C167  /* Success, earnings, positive actions */
Warning:    #F59E0B  /* Alerts, pending states */
Error:      #EF4444  /* Errors, destructive actions */
```

### Usage Rules
- **Black** for primary buttons and important text
- **White** for backgrounds and cards
- **Green** for money, success, and positive actions
- **Gray** for secondary text and borders
- **Minimal color** - use sparingly for emphasis

---

## 🔤 Typography

### Font Family
```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

### Type Scale
```css
Display:  32px / 700 weight  /* Page titles */
H1:       24px / 700 weight  /* Section headers */
H2:       20px / 600 weight  /* Card titles */
H3:       18px / 600 weight  /* Subsections */
Body:     16px / 400 weight  /* Regular text */
Small:    14px / 400 weight  /* Secondary text */
Tiny:     12px / 400 weight  /* Labels, captions */
```

### Text Colors
```css
Primary:   #000000  /* Headings, important text */
Secondary: #737373  /* Body text */
Tertiary:  #A3A3A3  /* Captions, labels */
```

---

## 🔘 Buttons

### Primary Button (Black)
```css
Background: #000000
Text: #FFFFFF
Border-radius: 12px
Padding: 12px 24px
Font-weight: 600
Shadow: 0 2px 8px rgba(0,0,0,0.15)

Hover:
  Background: #1A1A1A
  Shadow: 0 4px 12px rgba(0,0,0,0.2)
```

### Secondary Button (Green)
```css
Background: #06C167
Text: #FFFFFF
Border-radius: 12px
Padding: 12px 24px
Font-weight: 600
Shadow: 0 2px 8px rgba(6,193,103,0.25)

Hover:
  Background: #059669
  Shadow: 0 4px 12px rgba(6,193,103,0.3)
```

### Outline Button
```css
Background: #FFFFFF
Text: #000000
Border: 2px solid #E5E5E5
Border-radius: 12px
Padding: 12px 24px
Font-weight: 600

Hover:
  Border-color: #000000
  Background: #F5F5F5
```

### Ghost Button
```css
Background: transparent
Text: #737373
Padding: 12px 24px
Font-weight: 500

Hover:
  Background: #F5F5F5
  Text: #000000
```

---

## 📦 Cards

### Standard Card
```css
Background: #FFFFFF
Border-radius: 16px
Padding: 16px
Shadow: 0 2px 8px rgba(0,0,0,0.06)

Hover (if interactive):
  Shadow: 0 4px 16px rgba(0,0,0,0.1)
  Transform: translateY(-2px)
```

### Elevated Card
```css
Background: #FFFFFF
Border-radius: 16px
Padding: 20px
Shadow: 0 4px 16px rgba(0,0,0,0.08)
```

---

## 📱 Navigation

### Bottom Navigation
```css
Background: rgba(255,255,255,0.95)
Backdrop-filter: blur(20px)
Border-top: 1px solid #E5E5E5
Height: 64px + safe-area

Inactive Icon: #A3A3A3
Active Icon: #000000
Active Indicator: 2px black underline
```

### Top App Bar
```css
Background: rgba(255,255,255,0.95)
Backdrop-filter: blur(20px)
Border-bottom: 1px solid #E5E5E5
Height: 56px + safe-area

Title: 18px / 600 weight / #000000
```

---

## 🎯 Interactive Elements

### Input Fields
```css
Background: #FFFFFF
Border: 2px solid #E5E5E5
Border-radius: 12px
Padding: 14px 16px
Font-size: 16px
Color: #000000

Focus:
  Border-color: #000000
  Box-shadow: 0 0 0 4px rgba(0,0,0,0.05)

Error:
  Border-color: #EF4444
  Box-shadow: 0 0 0 4px rgba(239,68,68,0.1)
```

### Switches/Toggles
```css
Off: #E5E5E5
On: #000000
Size: 48px × 28px
Thumb: 24px circle
```

### Checkboxes
```css
Unchecked: 2px border #E5E5E5
Checked: #000000 background, white checkmark
Size: 20px × 20px
Border-radius: 4px
```

---

## 💰 Money Display

### Large Amounts
```css
Font-size: 32px
Font-weight: 700
Color: #000000
Format: $XXX.XX
```

### Earnings (Positive)
```css
Color: #06C167
Font-weight: 600
```

### Pending
```css
Color: #F59E0B
Font-weight: 600
```

---

## 🏷️ Badges & Tags

### Status Badges
```css
Padding: 4px 12px
Border-radius: 12px
Font-size: 12px
Font-weight: 600

Success:
  Background: #DCFCE7
  Color: #059669

Warning:
  Background: #FEF3C7
  Color: #D97706

Error:
  Background: #FEE2E2
  Color: #DC2626

Neutral:
  Background: #F5F5F5
  Color: #737373
```

---

## 📊 Lists & Items

### List Item
```css
Padding: 16px
Border-bottom: 1px solid #F5F5F5
Background: #FFFFFF

Hover:
  Background: #FAFAFA

Active:
  Background: #F5F5F5
```

### Icon + Text Pattern
```css
Icon: 24px, #737373
Title: 16px / 600 / #000000
Subtitle: 14px / 400 / #737373
Spacing: 12px gap
```

---

## 🎭 Shadows

### Elevation System
```css
Level 1 (Cards):
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);

Level 2 (Modals):
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);

Level 3 (Dropdowns):
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);

Level 4 (Overlays):
  box-shadow: 0 16px 48px rgba(0,0,0,0.16);
```

---

## 🎬 Animations

### Transitions
```css
Default: 200ms ease-out
Hover: 150ms ease-out
Page transitions: 300ms ease-in-out
```

### Micro-interactions
```css
Button press: scale(0.98)
Card hover: translateY(-2px)
Fade in: opacity 0 → 1 (300ms)
Slide up: translateY(20px) → 0 (300ms)
```

---

## 📐 Spacing System

### Scale (8px base)
```css
xs:  4px
sm:  8px
md:  16px
lg:  24px
xl:  32px
2xl: 48px
3xl: 64px
```

### Layout Padding
```css
Mobile: 16px horizontal
Tablet: 24px horizontal
Desktop: 32px horizontal
```

---

## 🖼️ Component Patterns

### Hero Section
```css
Background: #FFFFFF or gradient
Padding: 48px 16px
Title: 32px / 700
Subtitle: 18px / 400 / #737373
CTA: Black primary button
```

### Empty State
```css
Icon: 64px, #E5E5E5
Title: 20px / 600 / #000000
Description: 16px / 400 / #737373
CTA: Outline button
Center-aligned
```

### Loading State
```css
Skeleton: #F5F5F5 background
Shimmer: Linear gradient animation
Border-radius: Match component
```

---

## 🎨 Design Tokens

### Border Radius
```css
sm: 8px   /* Tags, badges */
md: 12px  /* Buttons, inputs */
lg: 16px  /* Cards */
xl: 24px  /* Modals, sheets */
full: 9999px  /* Pills, avatars */
```

### Line Heights
```css
Tight: 1.2   /* Headings */
Normal: 1.5  /* Body text */
Relaxed: 1.75  /* Long-form content */
```

---

## ✅ Do's and Don'ts

### ✅ Do
- Use black for primary actions
- Keep backgrounds white or light gray
- Use generous white space
- Make CTAs obvious and large
- Use green for money and success
- Keep text hierarchy clear
- Use subtle shadows
- Animate interactions smoothly

### ❌ Don't
- Use multiple bright colors
- Overcrowd the interface
- Use small touch targets (<44px)
- Mix different shadow styles
- Use gradients (except subtle ones)
- Overuse animations
- Hide important actions
- Use decorative elements

---

## 📱 Mobile-First Patterns

### Bottom Sheet
```css
Background: #FFFFFF
Border-radius: 24px 24px 0 0
Shadow: 0 -4px 24px rgba(0,0,0,0.12)
Handle: 32px × 4px, #E5E5E5
Padding: 24px
```

### Full-Screen Modal
```css
Background: #FFFFFF
Header: 56px with close button
Content: Scrollable
Footer: Fixed with CTA
```

### Pull-to-Refresh
```css
Indicator: Black spinner
Threshold: 80px
Animation: Smooth spring
```

---

## 🎯 Key Screens

### Home Screen
- Large greeting
- Quick action card (black button)
- Recent activity list
- Bottom navigation

### List Screen
- Search bar at top
- Filter chips (outline style)
- List items with icons
- Empty state if no items

### Detail Screen
- Back button (top left)
- Title (center or left)
- Content cards
- Fixed bottom CTA

### Profile Screen
- Avatar at top
- List of settings
- Logout at bottom (ghost button)

---

## 🚀 Implementation Checklist

- [x] Update color palette to black/white/green
- [x] Change primary buttons to solid black
- [x] Change secondary buttons to Uber green
- [ ] Update all component backgrounds to white
- [ ] Increase spacing between elements
- [ ] Make headings bolder and larger
- [ ] Simplify card designs
- [ ] Update shadows to be more subtle
- [ ] Remove unnecessary colors
- [ ] Add more white space
- [ ] Update bottom navigation style
- [ ] Simplify top app bar

---

**Design System Version**: 2.0 (Uber-inspired)  
**Last Updated**: January 16, 2026  
**Status**: In Progress
