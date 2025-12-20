# S-01: UI/UX Design System

**Version**: 1.0
**Last Updated**: 2025-12-08
**Status**: ✅ Spec Complete

---

## Quick Reference

**Purpose**: Comprehensive design system for Idea War Room, inspired by solopreneur.global aesthetic - professional, clean, focused on content clarity and strategic use of whitespace.

**Dependencies**: None

**Used By**: All feature specifications (F-01 through F-09)

**Design Philosophy**: Professional war room aesthetic - serious analysis deserves serious design. Clean typography, strategic color use for severity levels, generous whitespace to reduce cognitive load during intensive analysis sessions.

---

## Design Principles

### 1. Desktop-First, Content-Centric
- Primary use case: Founders spending 30-45 minutes on focused analysis
- Large viewport optimized (1440px+ primary target)
- Mobile responsive but not primary concern for MVP

### 2. Professional & Trustworthy
- War room metaphor: Serious, data-driven, no-nonsense
- Avoid playful elements (this is about hard truths, not gamification)
- Typography and spacing convey authority and structure

### 3. Progressive Disclosure
- Start simple (intake form), progressively reveal complexity
- Damage report unfolds section by section (executive summary → vector details → recommendations)
- Use accordions, tabs, and progressive loading to manage information density

### 4. Severity-Driven Visual Language
- Color-coded vulnerability scores (1 = catastrophic red → 5 = resilient green)
- Visual weight reflects criticality (bold, large for catastrophic threats)
- Clear visual hierarchy for scan ability

### 5. Evidence Transparency
- Always show research sources ("Based on 3 Reddit threads, 2 competitor reviews")
- Cite evidence inline with vulnerability descriptions
- Use subtle visual indicators for evidence-backed vs. speculative claims

---

## Color System

### Primary Palette (Inspired by solopreneur.global)

```css
:root {
  /* Neutrals (Base) */
  --color-bg-primary: #FFFFFF;
  --color-bg-secondary: #F9FAFB;
  --color-bg-tertiary: #F3F4F6;
  --color-text-primary: #111827;
  --color-text-secondary: #6B7280;
  --color-text-tertiary: #9CA3AF;

  /* Borders & Dividers */
  --color-border-light: #E5E7EB;
  --color-border-medium: #D1D5DB;
  --color-border-dark: #9CA3AF;

  /* Brand Accent (Strategic, Sparingly Used) */
  --color-brand-primary: #2563EB; /* Professional blue */
  --color-brand-hover: #1D4ED8;
  --color-brand-light: #DBEAFE;

  /* Severity Scale (MVTA Vulnerability Scoring) */
  --color-severity-1-catastrophic: #DC2626; /* Red 600 */
  --color-severity-1-bg: #FEE2E2; /* Red 100 */
  --color-severity-2-critical: #EA580C; /* Orange 600 */
  --color-severity-2-bg: #FFEDD5; /* Orange 100 */
  --color-severity-3-significant: #D97706; /* Amber 600 */
  --color-severity-3-bg: #FEF3C7; /* Amber 100 */
  --color-severity-4-moderate: #059669; /* Emerald 600 */
  --color-severity-4-bg: #D1FAE5; /* Emerald 100 */
  --color-severity-5-resilient: #10B981; /* Green 500 */
  --color-severity-5-bg: #D1FAE5; /* Green 100 */

  /* Semantic Colors */
  --color-success: #10B981;
  --color-success-bg: #D1FAE5;
  --color-warning: #F59E0B;
  --color-warning-bg: #FEF3C7;
  --color-error: #DC2626;
  --color-error-bg: #FEE2E2;
  --color-info: #3B82F6;
  --color-info-bg: #DBEAFE;
}
```

### Color Usage Guidelines

**Neutrals**:
- 90% of UI surface (backgrounds, text, borders)
- Creates calm, distraction-free environment for intensive reading

**Brand Blue**:
- Primary CTAs (Start Analysis, Export Report)
- Links and interactive elements
- Progress indicators

**Severity Colors**:
- Only in damage report (vulnerability scores, cascading failure indicators)
- Used sparingly for maximum impact
- Always paired with text label (not color-only information)

**Semantic Colors**:
- Success: Completed steps, validated inputs
- Warning: Missing optional fields, non-blocking issues
- Error: Validation errors, API failures
- Info: Help text, tooltips, research evidence badges

---

## Typography

### Font Stack

```css
:root {
  /* Primary (UI Text) */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  /* Secondary (Headings, Emphasis) */
  --font-display: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  /* Monospace (Code, JSON, Technical) */
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}
```

**Font Loading**:
- Use `next/font` to optimize Inter loading
- Variable font for performance (single file, all weights)

### Type Scale

```css
:root {
  /* Display (Hero, Page Titles) */
  --text-5xl: 3rem;      /* 48px - Main landing headline */
  --text-4xl: 2.25rem;   /* 36px - Section headlines */
  --text-3xl: 1.875rem;  /* 30px - Damage Report title */

  /* Headings */
  --text-2xl: 1.5rem;    /* 24px - H2, Vector names */
  --text-xl: 1.25rem;    /* 20px - H3, Component headings */
  --text-lg: 1.125rem;   /* 18px - H4, Subheadings */

  /* Body */
  --text-base: 1rem;     /* 16px - Primary body text */
  --text-sm: 0.875rem;   /* 14px - Secondary text, captions */
  --text-xs: 0.75rem;    /* 12px - Labels, metadata */
}
```

### Font Weights

```css
:root {
  --font-normal: 400;    /* Body text */
  --font-medium: 500;    /* Subtle emphasis, UI labels */
  --font-semibold: 600;  /* Headings, buttons */
  --font-bold: 700;      /* Strong emphasis, critical alerts */
}
```

### Line Heights

```css
:root {
  --leading-tight: 1.25;   /* Headings */
  --leading-snug: 1.375;   /* Short paragraphs */
  --leading-normal: 1.5;   /* Body text (default) */
  --leading-relaxed: 1.625; /* Long-form content */
  --leading-loose: 2;      /* Special cases */
}
```

### Typography Usage

**Display (5xl-3xl)**:
- Landing page hero: "Stress-test your startup idea"
- Damage Report main title: "Damage Report: [Idea Name]"
- Section breaks in analysis

**Headings (2xl-lg)**:
- Vector names: "Market & Economic Viability"
- Attack simulation names: "Competitor War Game"
- Recommendation sections

**Body (base)**:
- Primary reading content: vulnerability descriptions, rationales
- Form fields and input labels
- Button text

**Small (sm-xs)**:
- Metadata: timestamps, research source counts
- Tooltips and help text
- Evidence citations

---

## Spacing System

### Scale (Tailwind-inspired)

```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
}
```

### Spacing Guidelines

**Micro (1-2)**: Between icon and label, inline badges
**Small (3-4)**: Within components (button padding, input padding)
**Medium (6-8)**: Between related elements (form fields, list items)
**Large (10-12)**: Between sections within a page
**XL (16-20)**: Between major page sections
**XXL (24)**: Page margins, hero spacing

**Generous Whitespace Strategy**:
- Left/right page margins: `space-12` (desktop), `space-6` (tablet), `space-4` (mobile)
- Section vertical spacing: `space-16` minimum
- Damage report vector sections: `space-12` between vectors
- Card padding: `space-8` (large content), `space-6` (compact)

---

## Layout System

### Grid System

**Max Width Container**:
```css
.container {
  max-width: 1280px; /* Comfortable reading for long reports */
  margin: 0 auto;
  padding: 0 var(--space-12); /* Desktop */
}

@media (max-width: 768px) {
  .container {
    padding: 0 var(--space-4);
  }
}
```

**Grid Columns**:
```css
.grid-2-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-8);
}

.grid-sidebar {
  display: grid;
  grid-template-columns: 300px 1fr; /* Sidebar + Main */
  gap: var(--space-12);
}

/* Responsive: stack on mobile */
@media (max-width: 1024px) {
  .grid-2-col,
  .grid-sidebar {
    grid-template-columns: 1fr;
  }
}
```

### Breakpoints

```css
:root {
  --breakpoint-sm: 640px;   /* Mobile landscape */
  --breakpoint-md: 768px;   /* Tablet */
  --breakpoint-lg: 1024px;  /* Desktop */
  --breakpoint-xl: 1280px;  /* Large desktop */
  --breakpoint-2xl: 1536px; /* Extra large */
}
```

**Primary Target**: 1280px - 1920px (desktop monitors)
**Secondary**: 768px - 1024px (tablet, small laptop)
**Tertiary**: 375px - 640px (mobile)

---

## Component Patterns

### Buttons

```tsx
// Primary CTA
<button className="
  px-6 py-3
  bg-brand-primary text-white
  font-semibold text-base
  rounded-lg
  hover:bg-brand-hover
  transition-colors duration-200
  focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2
">
  Start MVTA Analysis
</button>

// Secondary
<button className="
  px-6 py-3
  bg-white text-text-primary
  border border-border-medium
  font-medium text-base
  rounded-lg
  hover:bg-bg-secondary
  transition-colors duration-200
">
  Save Draft
</button>

// Destructive
<button className="
  px-4 py-2
  bg-error text-white
  font-medium text-sm
  rounded-md
  hover:bg-red-700
">
  Delete Idea
</button>
```

### Cards

```tsx
// Standard Card
<div className="
  bg-white
  border border-border-light
  rounded-lg
  p-8
  shadow-sm
  hover:shadow-md
  transition-shadow duration-200
">
  {/* Content */}
</div>

// Severity Card (Vulnerability)
<div className="
  bg-white
  border-l-4 border-severity-1-catastrophic
  rounded-lg
  p-6
  shadow-sm
">
  <div className="flex items-start justify-between">
    <div>
      <span className="
        inline-block px-2 py-1
        bg-severity-1-bg text-severity-1-catastrophic
        text-xs font-semibold
        rounded-full
      ">
        Score: 1 - Catastrophic
      </span>
      <h3 className="text-xl font-semibold mt-3">
        Competitor War Game
      </h3>
      <p className="text-text-secondary mt-2">
        {/* Vulnerability description */}
      </p>
    </div>
  </div>
</div>
```

### Forms

```tsx
// Input Field
<div className="space-y-2">
  <label className="
    block
    text-sm font-medium
    text-text-primary
  ">
    High Concept
  </label>
  <input
    type="text"
    className="
      w-full
      px-4 py-3
      border border-border-medium
      rounded-lg
      text-base
      focus:outline-none
      focus:ring-2
      focus:ring-brand-primary
      focus:border-transparent
      transition-all duration-200
    "
    placeholder="One-sentence description of your idea..."
  />
  <p className="text-xs text-text-tertiary">
    Keep it concise (max 150 characters)
  </p>
</div>

// Textarea
<textarea
  rows={4}
  className="
    w-full
    px-4 py-3
    border border-border-medium
    rounded-lg
    text-base
    resize-none
    focus:outline-none
    focus:ring-2
    focus:ring-brand-primary
  "
  placeholder="Describe the problem you're solving..."
/>
```

### Progress Indicators

```tsx
// Step Progress (Intake → Research → Analysis → Report)
<div className="flex items-center space-x-4">
  {steps.map((step, idx) => (
    <div key={idx} className="flex items-center">
      <div className={`
        w-10 h-10
        rounded-full
        flex items-center justify-center
        font-semibold text-sm
        ${step.completed ? 'bg-brand-primary text-white' : 'bg-bg-tertiary text-text-tertiary'}
      `}>
        {step.completed ? '✓' : idx + 1}
      </div>
      {idx < steps.length - 1 && (
        <div className={`
          w-16 h-1 mx-2
          ${step.completed ? 'bg-brand-primary' : 'bg-border-light'}
        `} />
      )}
    </div>
  ))}
</div>

// Loading Spinner (Research Phase)
<div className="flex items-center space-x-3">
  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-primary" />
  <span className="text-text-secondary text-sm">
    Analyzing 47 Reddit threads...
  </span>
</div>
```

### Badges & Tags

```tsx
// Severity Badge
<span className="
  inline-flex items-center
  px-3 py-1
  bg-severity-1-bg
  text-severity-1-catastrophic
  text-xs font-semibold
  rounded-full
">
  Score: 1
</span>

// Research Evidence Badge
<span className="
  inline-flex items-center
  px-2 py-1
  bg-info-bg
  text-info
  text-xs font-medium
  rounded-md
">
  3 sources
</span>

// Vector Tag
<span className="
  px-2 py-1
  bg-bg-tertiary
  text-text-secondary
  text-xs
  rounded
">
  Market & Economic
</span>
```

### Tooltips

```tsx
// Tooltip (using Radix UI or similar)
<Tooltip content="This score indicates a fundamental threat to your business model">
  <InfoIcon className="w-4 h-4 text-text-tertiary hover:text-text-secondary" />
</Tooltip>
```

---

## Page Layouts

### 1. Landing Page

```
┌─────────────────────────────────────────┐
│ Header (Logo + Nav)                     │ 80px
├─────────────────────────────────────────┤
│                                         │
│   Hero Section                          │ 600px
│   "Stress-test your startup idea"      │
│   [Start Analysis CTA]                  │
│                                         │
├─────────────────────────────────────────┤
│   Feature Grid (How it works)          │ 400px
│   [3 columns: Intake / Research / Report] │
├─────────────────────────────────────────┤
│   Social Proof (optional for MVP)       │ 200px
├─────────────────────────────────────────┤
│ Footer                                  │ 120px
└─────────────────────────────────────────┘
```

### 2. Idea Intake Form

```
┌─────────────────────────────────────────┐
│ Header + Progress (Step 1 of 4)        │ 80px
├─────────────────────────────────────────┤
│                                         │
│   Center Column (max 720px)            │
│                                         │
│   [Form Fields]                         │ Variable
│   - High Concept                        │
│   - Value Proposition                   │
│   - Success Metric                      │
│   - Assumptions (Market/Tech/Biz)       │
│   - Assets & Environment                │
│                                         │
│   [Continue Button]                     │
│                                         │
└─────────────────────────────────────────┘
```

### 3. Research Phase (Loading)

```
┌─────────────────────────────────────────┐
│ Header + Progress (Step 2 of 4)        │ 80px
├─────────────────────────────────────────┤
│                                         │
│   Center Column (max 720px)            │
│                                         │
│   [Animated Progress]                   │
│   ⏳ Generating research queries...     │
│   ✓ Found 12 competitors                │
│   ⏳ Analyzing 47 Reddit threads...     │
│   ⏳ Reviewing product reviews...       │
│                                         │
│   [Research Summary Cards]              │
│   (appears progressively)               │
│                                         │
└─────────────────────────────────────────┘
```

### 4. Damage Report (Primary UI)

```
┌─────────────────────────────────────────────────────────┐
│ Header + [Export] [Follow-up Q&A]                      │ 80px
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Sidebar (300px)          │  Main Content (flex)       │
│                           │                             │
│  [Table of Contents]      │  ┌──────────────────────┐  │
│  • Executive Summary      │  │ Executive Summary    │  │
│  • Market & Economic      │  │ Top 3 Vulnerabilities│  │
│  • Technical & Product    │  │ Cascading Failures   │  │
│  • Social & Ethical       │  └──────────────────────┘  │
│  • Legal & Regulatory     │                             │
│  • Narrative & Political  │  ┌──────────────────────┐  │
│  • Recommendations        │  │ Vector: Market       │  │
│                           │  │ [Vulnerability Cards]│  │
│  [Feedback Button]        │  │ [Synthesis Summary]  │  │
│                           │  └──────────────────────┘  │
│                           │                             │
│                           │  (Repeat for all vectors)  │
│                           │                             │
│                           │  ┌──────────────────────┐  │
│                           │  │ Recommendations      │  │
│                           │  └──────────────────────┘  │
│                           │                             │
└───────────────────────────┴─────────────────────────────┘
```

### 5. Follow-up Q&A Overlay

```
┌─────────────────────────────────────────┐
│ [Modal/Drawer overlaying Damage Report] │
│                                         │
│   "Ask a follow-up question"           │
│                                         │
│   [Text Input]                          │
│   [Send Button]                         │
│                                         │
│   [Conversation Thread]                 │
│   User: How can I reduce market risk?   │
│   AI: Based on the Competitor War Game  │
│       finding, here are 3 actions...    │
│                                         │
│   [Context: Grounded in damage report]  │
│                                         │
└─────────────────────────────────────────┘
```

---

## Responsive Behavior

### Desktop (1280px+)
- Full layout as designed
- Sidebar + main content (damage report)
- Multi-column grids for feature cards
- Generous whitespace

### Tablet (768px - 1024px)
- Stack sidebar below main content (or collapsible drawer)
- Reduce grid columns (3 → 2 → 1)
- Maintain readability (font sizes stay same)

### Mobile (< 768px)
- Single column everything
- Collapsible sections for damage report
- Sticky header with minimal navigation
- Bottom sheet for Q&A instead of modal

---

## Accessibility

### WCAG 2.1 AA Compliance

**Color Contrast**:
- Text on white: Minimum 4.5:1 ratio
- Large text (18px+): Minimum 3:1 ratio
- Severity colors tested for contrast

**Keyboard Navigation**:
- All interactive elements reachable via Tab
- Visible focus states (ring-2 ring-brand-primary)
- Skip to main content link

**Screen Readers**:
- Semantic HTML (nav, main, article, aside)
- ARIA labels for icons and interactive elements
- Alt text for images (if any)

**Motion**:
- Respect prefers-reduced-motion
- Disable animations if user preference set

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Animation & Transitions

### Principles
- Subtle, purposeful (no gratuitous effects)
- Fast (200-300ms for most transitions)
- Communicate state changes (loading, success, error)

### Standard Transitions

```css
/* Hover transitions */
.hover-effect {
  transition: all 200ms ease-in-out;
}

/* Loading states */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.loading {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Page transitions (Next.js) */
.page-transition {
  transition: opacity 300ms ease-in-out;
}
```

### Micro-interactions
- Button press: scale(0.98) on active
- Card hover: shadow-sm → shadow-md
- Success state: brief green flash on vulnerability card when analysis completes

---

## Icons

### Icon Library
- **Lucide React** (lightweight, consistent, MIT license)
- Stroke width: 2px (medium weight)
- Size: 20px (default), 24px (larger), 16px (smaller)

### Common Icons
- `AlertTriangle` - Warnings, severity indicators
- `CheckCircle` - Success, completed steps
- `XCircle` - Errors, failures
- `Info` - Tooltips, help text
- `Search` - Research phase
- `Download` - Export report
- `MessageSquare` - Q&A, feedback
- `TrendingDown` - Negative trends (market threats)
- `Shield` - Security, resilience
- `Users` - User personas, target audience

---

## Dark Mode (Future Enhancement)

**Not included in MVP**, but design tokens are structured for easy dark mode addition:

```css
[data-theme="dark"] {
  --color-bg-primary: #111827;
  --color-bg-secondary: #1F2937;
  --color-text-primary: #F9FAFB;
  --color-text-secondary: #D1D5DB;
  /* ... all other tokens ... */
}
```

---

## Internationalization (i18n)

### Bilingual Support

The application supports English and Chinese (Simplified). Language is determined by parent project and cannot be changed by users.

**See [S-06: Internationalization](./S-06-internationalization.md) for full specification.**

### Chinese Typography

For Chinese text, extend the font stack to include Chinese-specific fonts:

```css
:root {
  /* Extended font stack for Chinese support */
  --font-sans-chinese:
    'Inter',                    /* English text */
    system-ui,                  /* System default */
    -apple-system,              /* macOS/iOS */
    'Segoe UI',                 /* Windows */
    'Noto Sans SC',             /* Google's Chinese font */
    'PingFang SC',              /* macOS Chinese */
    'Microsoft YaHei',          /* Windows Chinese */
    'Hiragino Sans GB',         /* Older macOS */
    sans-serif;
}
```

**Font Loading Strategy**:
- English: Continue using `next/font` for Inter
- Chinese: Use system fonts (no additional font loading)
- Fallback: System default Chinese fonts available on all platforms

### Text Length Considerations

Chinese text is typically **30-50% shorter** than equivalent English text:

| Content Type | English | Chinese | Ratio |
|--------------|---------|---------|-------|
| Button labels | "Start New Analysis" | "开始新分析" | ~50% |
| Form labels | "Describe your idea in one sentence" | "用一句话描述你的想法" | ~60% |
| Paragraphs | Long descriptions | Shorter equivalent | ~60-70% |

**Design Implications**:
- Buttons and labels may appear tighter in Chinese
- No need for major layout adjustments
- Character count validation may need adjustment (Chinese characters vs English words)

### Translation Key Naming

Follow hierarchical naming convention:

```
{page}.{section}.{element}

Examples:
- dashboard.welcome
- intake.step1.highConceptLabel
- report.severity.catastrophic
- common.loading
```

---

## Related Documents

- [S-00: Architecture Overview](./S-00-architecture.md)
- [S-02: Testing Strategy](./S-02-testing-strategy.md)
- [S-06: Internationalization](./S-06-internationalization.md) - i18n specification
- [F-02: Idea Intake Form](../features/F-02-idea-intake-form.md) - Implements form design patterns
- [F-05: Damage Report Display](../features/F-05-damage-report-display.md) - Primary UI implementation

---

## Notes

### Design References
- **solopreneur.global**: Clean typography, professional aesthetic, strategic whitespace
- **Linear.app**: Keyboard-first, fast interactions, minimal chrome
- **Tailwind UI**: Component patterns, responsive utilities

### Implementation Notes
- Use Tailwind CSS for rapid development
- Extract common patterns into reusable components
- Use CSS variables for design tokens (easier theming later)

### Known Limitations
- No dark mode in MVP (plan for future)
- Mobile experience is functional but not optimized (desktop primary)
- No animation library (use CSS transitions only)
