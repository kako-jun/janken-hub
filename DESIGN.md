# DESIGN.md

Janken Hub — Design System

## 1. Visual Theme & Atmosphere

Vibrant arcade game aesthetic. Bold blue-to-purple gradients fill the background while white cards float above with generous shadows. Emoji-heavy UI makes the game instantly approachable — you see a fist, scissors, and hand before reading any text. The design feels like a polished mobile game lobby.

Inspirations: mobile game UIs, arcade cabinets, party game apps.

## 2. Color Palette & Roles

Tailwind CSS utility classes. No custom CSS variables.

| Role              | Tailwind Class                  | Hex Approximation | Usage                     |
| ----------------- | ------------------------------- | ----------------- | ------------------------- |
| Background        | `from-blue-500 to-purple-600`   | `#3b82f6 → #9333ea` | Page gradient background |
| Card surface      | `bg-white`                      | `#ffffff`          | Game cards, panels        |
| Primary text      | `text-gray-800`                 | `#1f2937`          | Body text on white cards  |
| Secondary text    | `text-gray-600`                 | `#4b5563`          | Descriptions, hints       |
| Win               | `text-green-500`                | `#22c55e`          | Victory state             |
| Lose              | `text-red-500`                  | `#ef4444`          | Defeat state              |
| Draw              | `text-yellow-500`               | `#eab308`          | Draw state                |
| Disabled bg       | `bg-gray-300`                   | `#d1d5db`          | Disabled buttons          |
| Disabled text     | `text-gray-500`                 | `#6b7280`          | Disabled labels           |

Light theme only. The gradient background provides visual richness.

## 3. Typography Rules

### Font Family

| Context | Family                          |
| ------- | ------------------------------- |
| Default | `Inter`, `system-ui`, sans-serif |

### Type Scale

| Element          | Class      | Weight    | Notes               |
| ---------------- | ---------- | --------- | -------------------- |
| Page title       | `text-5xl` | `font-bold` | ~48px              |
| Section header   | `text-2xl` | `font-bold` | ~24px              |
| Card title       | `text-xl`  | `font-bold` | ~20px              |
| Body text        | `text-base` | normal   | 16px                 |
| Small text       | `text-sm`  | normal    | 14px                 |

## 4. Component Stylings

### Hand Buttons (Emoji)

```
bg-white text-gray-800
rounded-lg shadow-lg
p-4 text-center
hover:scale-105 hover:shadow-2xl
active:scale-95
transition-transform
```

Large emoji (text-4xl to text-5xl) as the primary visual. Label text below.

### Rule Selector Cards

```
bg-white rounded-lg shadow-lg p-6
hover:shadow-2xl
transition-shadow
cursor-pointer
```

Grid layout: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`

Disabled state: `bg-gray-300 opacity-50 cursor-not-allowed`

### Result Display

- Win: `text-green-500 text-3xl font-bold`
- Lose: `text-red-500 text-3xl font-bold`
- Draw: `text-yellow-500 text-3xl font-bold`

### Score Display

White card with shadow, centered text. Player names and scores in large bold text.

### VS Indicator

Centered between player hands, `text-2xl font-bold text-gray-400`.

## 5. Layout Principles

### Container

- Centered: flex column, items-center
- Padding: `p-8`
- Max content width defined by card grid

### Spacing Scale

| Token        | Value |
| ------------ | ----- |
| Card gap     | `gap-6` (24px) |
| Section gap  | `mb-8` (32px) |
| Card padding | `p-6` or `p-8` |

### Grid

- Rule selector: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Hand buttons: flex row with gap

## 6. Depth & Elevation

### Shadows

- Default cards: `shadow-lg`
- Hover: `shadow-2xl`
- No inset shadows

### Z-Index

Simple stacking — no overlapping layers or modals in current UI.

### Border Radius

- Cards and buttons: `rounded-lg` (8px)
- Full round for decorative elements: `rounded-full`

## 7. Do's and Don'ts

### Do

- Use blue-to-purple gradient background on all pages
- Place white cards with `shadow-lg` for all content containers
- Use emoji at large sizes (text-4xl+) for game actions
- Apply `hover:scale-105` + `hover:shadow-2xl` on interactive cards
- Use `active:scale-95` for press feedback
- Color-code results: green (win), red (lose), yellow (draw)
- Use the responsive grid for rule selection

### Don't

- Use dark backgrounds or dark theme
- Add complex animations beyond scale/shadow transitions
- Use small or hidden emoji — they are the primary UI language
- Override Tailwind classes with custom CSS
- Add borders to cards — shadows handle elevation

### Transitions

| Context        | Effect                | Duration |
| -------------- | --------------------- | -------- |
| Card hover     | `shadow-lg → shadow-2xl` | default |
| Button hover   | `scale(1.05)`         | default  |
| Button press   | `scale(0.95)`         | default  |

## 8. Responsive Behavior

### Breakpoints (Tailwind defaults)

| Name | Value  | Grid columns |
| ---- | ------ | ------------ |
| sm   | 640px  | 1            |
| md   | 768px  | 2            |
| lg   | 1024px | 3            |

The rule selector grid collapses from 3 → 2 → 1 columns.

### Mobile

- Full-width cards with adequate padding
- Touch targets: hand buttons are large emoji (48px+)
- Stack layout on small screens

## 9. Agent Prompt Guide

### Color Quick Reference

```
Background gradient:  from-blue-500 (#3b82f6) to purple-600 (#9333ea)
Card surface:         white (#ffffff)
Text:                 gray-800 (#1f2937)
Win:                  green-500 (#22c55e)
Lose:                 red-500 (#ef4444)
Draw:                 yellow-500 (#eab308)
Disabled:             gray-300 (#d1d5db)
```

### When generating UI for this project

- Blue-to-purple gradient background is the brand. Always present
- White cards with `shadow-lg` for all panels. No dark surfaces
- Emoji are the primary visual language — hand gestures at 48px+
- Three result colors: green/red/yellow. These are the only semantic colors
- Scale transforms for interaction (1.05 hover, 0.95 press)
- Responsive grid: 1/2/3 columns at sm/md/lg
- Inter font, no monospace, no decorative fonts
- Keep it playful and approachable — this is a party game

### Color Emotion Reference

- **Blue→Purple gradient:** Energy, play, competition
- **White cards:** Clarity, focus, clean game board
- **Green (#22c55e):** Victory, success, celebration
- **Red (#ef4444):** Defeat, try again
- **Yellow (#eab308):** Tie, tension, not yet decided
