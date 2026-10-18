# Design System and User Interface

This document specifies the design system, color tokens, typography, dark/light theme switching, component patterns, and notification architecture implemented in Focus.

---

## 1. Design Philosophy

Focus employs a **Modern Minimalist** aesthetic inspired by Scandinavian industrial design and modern high-end software (such as Linear, Raycast, and Vercel):

- Clarity over Decoration: Visual chrome is stripped away. Borders and surfaces provide subtle depth without heavy gradients or skeuomorphism.
- Intentional Color Usage: Emerald (`#10B981`) is reserved exclusively as an accent indicating active focus, completion, or positive metrics. Neutral grays and zincs dominate the interface.
- Jitter-Free Numeric Displays: Numeric counters, countdown timers, and statistical values use `tabular-nums` (`font-variant-numeric: tabular-nums`) so that changing digits do not shift horizontal layouts.
- Micro-Interactions: Transitions use snappy spring curves (`cubic-bezier(0.16, 1, 0.3, 1)`) with durations under 250ms for responsive tactile feedback.

---

## 2. Color System & Design Tokens

Defined in `web/src/index.css` using Tailwind CSS v4 custom theme tokens and utility classes:

### Surface & Background Tokens

| Token Name | Class Name | Hex Code (Dark) | Hex Code (Light) | Purpose |
|---|---|---|---|---|
| Canvas Background | `bg-canvas-dark` / `bg-canvas-light` | `#0C0C0E` | `#F5F5F3` | Root page background |
| Primary Surface | `bg-surface-dark` / `bg-surface-light` | `#141416` | `#FFFFFF` | Cards, panels, modal windows |
| Item Background | `bg-item-dark` / `bg-item-light` | `#1D1D20` | `#F0F0EE` | Table rows, input fields, badges |
| Hover State | `bg-hover-dark` / `bg-hover-light` | `#242428` | `#EDEDEA` | Interactive row/button hover states |
| Subtle Border | `border-subtle-dark` / `border-subtle-light` | `#242428` | `#E4E4E7` | Card borders, dividers, table rules |

### Functional Accent Colors

| Purpose | Light Mode Class | Dark Mode Class | Visual Role |
|---|---|---|---|
| Focus / Success | `text-emerald-600`, `bg-emerald-500` | `text-emerald-400`, `bg-emerald-500` | Active timer, completed milestones, progress rings |
| Urgent Priority | `text-rose-600`, `bg-rose-500/10` | `text-rose-400`, `bg-rose-500/15` | Critical deadline tasks |
| High Priority | `text-amber-600`, `bg-amber-500/10` | `text-amber-400`, `bg-amber-500/15` | Elevated priority items |
| Medium Priority | `text-sky-600`, `bg-sky-500/10` | `text-sky-400`, `bg-sky-500/15` | Standard priority items |
| Low Priority | `text-zinc-600`, `bg-zinc-500/10` | `text-zinc-400`, `bg-zinc-500/15` | Routine items |

---

## 3. Typography Rules

The application uses the **Inter** typeface (`var(--font-sans)`), prioritizing readability:

```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

### Hierarchy Scale

| Role | Font Size | Weight | Tracking | Usage |
|---|---|---|---|---|
| Timer Display | `48px` - `64px` | Bold (`700`) | Tabular (`tabular-nums`) | Primary Pomodoro countdown numbers |
| Hero Metric | `28px` - `32px` | Bold (`700`) | Tight (`-0.03em`) | KPI summaries, total focus minutes |
| Section Header | `16px` - `18px` | SemiBold (`600`) | Tight (`-0.02em`) | Card titles, modal titles |
| Body / Table | `13px` - `14px` | Regular (`400`) / Medium (`500`) | Normal | Task titles, descriptions, table cells |
| Micro Meta | `10px` - `11px` | Medium (`500`) / Bold (`700`) | Wide (`0.05em`) | Badges, keyboard shortcuts, uppercase tags |

---

## 4. Theme System (Dark / Light)

The application supports seamless dark and light modes:
- Default: Dark mode (`html` default `color-scheme: dark`).
- Light variant: Activated by adding the `.light` class to the `<html>` root element.
- Tailored Tailwind v4 variants:
  ```css
  @custom-variant dark (&:where(.dark, .dark *));
  @custom-variant light (&:where(.light, .light *));
  ```
- Persistence: Stored in `localStorage.getItem('focus_theme')` and automatically restored during initialization in `useStore`.

---

## 5. Notification Architecture (`ToastContainer.tsx`)

To avoid obstructing headers, navigation elements, or the active countdown timer, the notification system is engineered with an unobtrusive design:

### Placement & Stacking
- Desktop: Anchored at the bottom-right corner (`fixed bottom-6 right-6`).
- Mobile: Centered at the bottom edge (`fixed bottom-4 inset-x-0 items-center`).
- Stacking: Uses `flex-col-reverse` so new incoming notifications stack smoothly upward.

### Micro-Indicator Design
Each toast item features a refined micro-indicator instead of large colored banners:
- Success: Emerald circular badge with a miniature check icon.
- Error: Rose circular badge with an alert icon.
- Info: Subtle neutral zinc badge with an info glyph.

### Spring Animation
Defined in `web/src/index.css`:
```css
@keyframes toast-enter {
  0% {
    opacity: 0;
    transform: translateY(8px) scale(0.97);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@utility animate-toast-in {
  animation: toast-enter 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
```

### Accessibility Standards
- Outer container includes `aria-live="polite"` for screen readers.
- Notification items declare `role="status"`.
- Close buttons include explicit `aria-label="Close notification"` tags.

---

## 6. Core Component Catalog

### 1. `PomodoroTimerWidget` (`components/PomodoroTimerWidget.tsx`)
- SVG circular ring with animated `strokeDashoffset` showing proportional elapsed time.
- Large tabular countdown timer (`MM:SS`).
- Mode switcher: Toggle between standard Pomodoro mode and Task-specific duration mode.
- Interactive controls: Play/Pause, Smart Reset, and settings trigger.

### 2. `WorkspaceTasksTable` (`components/tasks/WorkspaceTasksTable.tsx`)
- High-density backlog table with status toggle checkboxes.
- Priority indicators with color-coded badges.
- Search input, status filter tabs, project filter picker, and pagination controls.
- Clicking any row opens the `TaskDetailSidebar`.

### 3. `TaskDetailSidebar` (`components/tasks/TaskDetailSidebar.tsx`)
- Sliding right drawer for inspecting and editing task metadata.
- In-place title and description inputs.
- Project assignment dropdown, priority selector, and estimated minutes slider.
- Direct "Start Focus Sprint" action pairing the selected task directly with the global timer.

### 4. `ActivityHeatmapWidget` (`components/analytics/ActivityHeatmapWidget.tsx`)
- Year-long GitHub-style activity grid visualizing daily focus minutes.
- Color intensity thresholds mapping focus time to depth of green fill.
- Interactive hover tooltips displaying date and minutes completed.

### 5. `WeeklyBarChart` (`components/WeeklyBarChart.tsx`)
- Recharts-based weekly focus duration histogram.
- Styled custom tooltips showing minutes and task breakdown.
- Global CSS overrides suppressing SVG selection outlines for a clean interface.
