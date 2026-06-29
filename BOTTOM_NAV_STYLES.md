# 🎨 Bottom Navigation - Style Guide

## Визуальная спецификация iOS Liquid Glass + Salomon Bottom Bar

### 📐 Размеры и отступы

```
┌─────────────────────────────────────────────┐
│                                             │
│                  Content                    │
│                                             │
├─────────────────────────────────────────────┤
│                                             │  ← 12px + Safe Area
│   ┌───────────────────────────────────┐   │
│   │    ●  ●  ⬤── Меню  ●  ●          │   │  ← 80px height
│   └───────────────────────────────────┘   │
│  16px                                16px  │
└─────────────────────────────────────────────┘
          ↑                           ↑
      Border radius: 32px
      Max-width: 420px (centered)
```

### 🎨 Цветовая палитра

#### Glass панель
```css
Background:     rgba(255, 255, 255, 0.75)
Border:         rgba(255, 255, 255, 0.2)
Shine:          linear-gradient(135deg, 
                  rgba(255,255,255,0.4) 0%, 
                  rgba(255,255,255,0) 50%)
```

#### Неактивная вкладка
```css
Icon color:     #7A7A7A
Icon size:      25px
Stroke width:   2
Scale:          0.95
Background:     transparent
```

#### Активная вкладка
```css
Icon color:     #ff3c3c (brand red)
Icon size:      25px
Stroke width:   2
Scale:          1.0
Text color:     #ff3c3c
Text size:      14px
Text weight:    700 (bold)

Container:
  Height:       52px
  Min-width:    52px
  Radius:       999px (pill)
  Padding:      0 22px
  Background:   rgba(255, 60, 60, 0.12)
  Shadow:       inset 0 0 20px rgba(255,60,60,0.1),
                0 4px 12px rgba(255,60,60,0.15)
```

#### Badge (корзина)
```css
Size:           18px × 18px (min)
Background:     #ff3c3c
Text:           white, 10px, extrabold
Shadow:         0 2px 8px rgba(255,60,60,0.4)
Position:       -8px top, -8px right (relative to icon)
Animation:      pulse (infinite)
```

### 🎬 Анимации

#### Spring Animation
```css
Timing:         cubic-bezier(0.34, 1.56, 0.64, 1)
Duration:       300ms
Easing name:    "Spring"
```

Визуализация кривой:
```
1.0 │      ╱╲
    │     ╱  ╲___
0.5 │   ╱       
    │ ╱          
0.0 └─────────────
    0ms   150ms   300ms
```

#### Slide In (текст)
```css
Keyframes:
  from {
    opacity: 0
    transform: translateX(-8px)
  }
  to {
    opacity: 1
    transform: translateX(0)
  }

Duration: 300ms
Timing:   cubic-bezier(0.34, 1.56, 0.64, 1)
```

#### Pulse (glow)
```css
Keyframes:
  0%, 100% { opacity: 1 }
  50%      { opacity: 0.6 }

Duration: 2000ms
Timing:   cubic-bezier(0.4, 0, 0.6, 1)
Iteration: infinite
```

#### Touch Feedback
```css
State:      active
Transform:  scale(0.95)
Duration:   300ms
Easing:     ease-out
```

### 📱 States Reference

#### 1. Inactive Tab (Домой)
```
┌──────┐
│      │
│  🏠  │  ← 25px, #7A7A7A
│      │
└──────┘
   No background
   No text
   Scale: 0.95
```

#### 2. Active Tab (Меню)
```
┌─────────────────┐
│  🍴  Меню      │  ← 52px height
│                 │     999px radius
│  Icon + Text    │     rgba(255,60,60,0.12) bg
└─────────────────┘
   Inner glow
   Scale: 1.0
   Text animates in
```

#### 3. Cart with Badge
```
┌──────┐
│  (9) │  ← Badge: 18px, red, pulse
│  🛒  │  ← Icon: 25px
│      │
└──────┘
   Badge position: -8px, -8px
   Badge shadow: 0 2px 8px red/40%
```

### 🔮 Glass Effect Breakdown

#### Layer Structure
```
Layer 4: Shine gradient (top-left to bottom-right)
         └─ rgba(255,255,255,0.4) → transparent
         
Layer 3: White border (1px, 20% opacity)
         └─ rgba(255,255,255,0.2)
         
Layer 2: Blur backdrop (30px blur)
         └─ backdrop-filter: blur(30px) saturate(180%)
         
Layer 1: Semi-transparent white (75% opacity)
         └─ rgba(255,255,255,0.75)
         
Layer 0: Content behind (blurred)
```

#### Shadow Structure
```
Shadow 1: Main drop shadow
  └─ 0 20px 40px rgba(0,0,0,0.08)
  
Shadow 2: Subtle shadow
  └─ 0 8px 16px rgba(0,0,0,0.06)
  
Shadow 3: Top highlight (inset)
  └─ inset 0 1px 0 rgba(255,255,255,0.6)
  
Shadow 4: Bottom shadow (inset)
  └─ inset 0 -1px 0 rgba(255,255,255,0.2)
```

### 📏 Spacing System

```
Container:
  Outer margin:     16px (left/right)
  Bottom margin:    12px + safe-area
  Inner padding:    4px (around items)

Items:
  Gap between:      Flexible (justify-around)
  Touch target:     52px × 52px minimum
  Active padding:   22px horizontal
  Inactive padding: 0
```

### 🎯 Touch Targets

```
Minimum size: 44×44px (iOS guideline)
Actual size:  52×52px (bigger for comfort)

┌────────────────┐
│                │
│   52×52 min    │  ← Comfortable touch area
│                │
└────────────────┘
```

### 🌈 Visual Effects

#### Glow Effect (Active Tab)
```css
Position:   absolute, inset-0
Shape:      radial-gradient from center
Colors:     rgba(255,60,60,0.15) → transparent
Radius:     70% of container
Animation:  pulse 2s infinite
```

Визуализация:
```
     ╱─────╲
    │  ●────│  ← Glow from center
     ╲─────╱
       70%
```

#### Shine Effect (Glass Panel)
```css
Position:   absolute, inset-0
Shape:      linear-gradient 135deg
Colors:     rgba(255,255,255,0.4) 0%
            rgba(255,255,255,0) 50%
Z-index:    top layer (pointer-events: none)
```

Направление:
```
  ╲
   ╲  ← Shine direction (135deg)
    ╲
```

### 🔤 Typography

#### Active Tab Label
```
Font family:  System (inherit)
Font size:    14px
Font weight:  700 (bold)
Color:        #ff3c3c
Letter sp.:   normal
Line height:  1
Whitespace:   nowrap
Text align:   left
```

#### Badge Text
```
Font family:  System (inherit)
Font size:    10px
Font weight:  800 (extrabold)
Color:        white (#ffffff)
Text align:   center
Vertical:     middle
```

### 📐 Alignment

```
Container:    flex, items-center, justify-around
Items:        flex, items-center, justify-center
Icon+Text:    flex-row, gap 8px (ml-2)
Badge:        absolute, flex, items-center, justify-center
```

### 🎨 Composition Example

```
Full Navigation Bar:

┌─────────────────────────────────────────────┐
│  Glass Panel (blur 30px, white 75%)        │
│  ┌────────────────────────────────────┐    │
│  │                                     │    │
│  │  ●    ●   ⬤─ Меню   ●    ●       │    │
│  │  │    │     │  │     │    │        │    │
│  │ Home Menu  └──┘  Orders Profile    │    │
│  │       └──Active──┘                  │    │
│  │                                     │    │
│  └────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘

Legend:
  ● = Inactive icon (gray)
  ⬤ = Active icon (red)
  ─ = Active container (red tint)
```

### 💡 Implementation Tips

#### Blur Performance
```css
/* Optimize blur rendering */
will-change: backdrop-filter;
transform: translateZ(0);
-webkit-transform: translateZ(0);
```

#### Animation Performance
```css
/* Use GPU-accelerated properties only */
✅ transform: scale(), translateX()
✅ opacity
❌ width, height, padding (triggers layout)
```

#### Safe Area
```css
/* Always include safe-area */
bottom: calc(12px + env(safe-area-inset-bottom, 0px));

/* Fallback for old browsers */
padding-bottom: 12px;
padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
```

### 🎨 Color Variants

#### Dark Mode (Future)
```css
Glass:          rgba(30, 30, 30, 0.75)
Border:         rgba(255, 255, 255, 0.1)
Shine:          rgba(255, 255, 255, 0.15)
Inactive:       #A0A0A0
Active icon:    #ff5555
Active bg:      rgba(255, 60, 60, 0.2)
```

### 📊 Measurements Cheatsheet

```
Panel:
  Height:         80px
  Border radius:  32px
  Padding:        4px
  Margin sides:   16px
  Margin bottom:  12px + safe-area

Icons:
  Size:           25px
  Stroke:         2px
  
Active Container:
  Height:         52px
  Min-width:      52px
  Border radius:  999px
  Padding:        0 22px

Badge:
  Size:           18px × 18px
  Font:           10px extrabold
  Offset:         -8px (top/right)

Animations:
  Duration:       300ms
  Spring:         cubic-bezier(0.34, 1.56, 0.64, 1)
  Pulse:          2000ms infinite

Colors:
  Active:         #ff3c3c
  Inactive:       #7A7A7A
  Glass:          rgba(255,255,255,0.75)
  Active BG:      rgba(255,60,60,0.12)
```

## 🎓 Design Principles

1. **Glass First** - Используй blur и прозрачность
2. **Minimal Labels** - Текст только на активной вкладке
3. **Smooth Springs** - Все анимации с spring easing
4. **Safe Areas** - Всегда учитывай notch и home indicator
5. **Touch Targets** - Минимум 44×44px, лучше 52×52px
6. **Performance** - Только GPU-accelerated свойства

## ✨ Final Result

Премиум iOS-стиль навигация с:
- ✅ Liquid Glass эффектом
- ✅ Salomon активной анимацией
- ✅ Spring transitions
- ✅ Плавающей панелью
- ✅ Современным дизайном

**Выглядит дорого. Работает плавно. Ощущается нативно.** 🎯
