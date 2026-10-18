# Focus — Web Client

A minimalist, high-performance focus sprint and task management interface built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS**. Designed following the **Obsidian Dark & Minimal Stone** aesthetic principles.

---

## Features

* **Focused Sprint Workflow**: Integrated Pomodoro timer supporting custom duration sprint sessions (`15m`, `25m`, `45m`, `60m`, or custom minutes), break timers, and audio chimes.
* **Workspace Tasks Backlog**: Clean, high-density tasks table with full status tracking, inline sprint launcher, custom duration, and search & filter dropdowns.
* **Task Details & Editing Drawer**: Slide-out right sidebar for reading long descriptions and full in-place editing (title, notes, project goal, priority, duration, and status).
* **Project Analytics**: Interactive charts for daily sprint distributions, milestone progress tracking, GitHub-style activity contribution heatmaps, and project-specific task tables.
* **Project Management**: Project portfolio with completion rates, focus time logged, and edit/archive capabilities.
* **Keyboard-First Experience**: Global shortcuts (<kbd>Space</kbd> for sprint toggle, <kbd>Z</kbd> for Zen mode, <kbd>Esc</kbd> for closing drawers/modals).
* **Dual Theme System**: Flawless contrast fidelity in both **Obsidian Dark** and **Minimal Stone Light** modes.

---

## Architecture & Separation of Concerns

The frontend follows a domain-driven, modular directory layout with clean separation of presentation, state, and API communication:

```
web/src/
├── components/
│   ├── analytics/       # Analytics widgets, distribution charts, project tasks table
│   ├── dashboard/       # Next Up backlog, metric cards, weekly widgets, duration picker
│   ├── heatmap/         # GitHub-style contribution and activity heatmap engine
│   ├── projects/        # Project cards, creation modal, and editing dialogs
│   ├── tasks/           # Backlog table, project picker, priority dropdown, task sidebar
│   ├── ui/              # Headless UI primitives (Kbd, Tooltip)
│   ├── FocusTimer.tsx   # Standalone zen focus sprint timer
│   ├── Navbar.tsx       # Minimalist top navigation bar and user profile controls
│   └── SettingsSidebar.tsx # Right slide-out preferences drawer (audio, DND, durations)
├── hooks/
│   └── useKeyboardShortcuts.ts # Global hotkey listeners with input-guarding
├── services/
│   └── api.ts           # Strongly typed HTTP client with auth token interceptors
├── store/
│   └── useStore.ts      # Reactive Zustand store (auth, active timer, filters, theme)
├── types/
│   └── index.ts         # Shared TypeScript interfaces (Task, Project, FocusSession)
├── utils/
│   └── sound.ts         # Audio synthesize & sound chimes manager
└── App.tsx              # Root application router and layout shell
```

---

## Design System & Palette Guidelines

1. **Obsidian & Stone Monochrome Foundation**:
   * Dark theme uses deep obsidian zincs (`bg-zinc-950/98`, `bg-zinc-900/60`, `border-subtle-dark`).
   * Light theme uses warm minimal stone surfaces (`bg-surface-light`, `bg-hover-light`, `border-subtle-light`).
   * Primary action buttons utilize high-contrast monochrome inversion (`bg-white text-black` on dark, `bg-black text-white` on light).

2. **Disciplined Accent Usage**:
   * **Emerald**: Reserved strictly as an aside/accent for completion states (checkboxes, completed badges, and focus sprint logged metrics).
   * **Priority Hierarchy**: Semantic badges for `Urgent` (Red), `High` (Amber), `Medium` (Neutral), and `Low` (Subtle).

---

## Keyboard Shortcuts

| Shortcut | Action | Scope |
| :--- | :--- | :--- |
| <kbd>Space</kbd> | Start / Pause active focus sprint | Global (when not typing in inputs) |
| <kbd>Z</kbd> | Toggle Zen distraction-free mode | Global (when not typing in inputs) |
| <kbd>Esc</kbd> | Close active drawer or modal | Global |

---

## Getting Started

### Prerequisites
* **Node.js** >= 18.0.0
* **npm** or **pnpm**

### Installation
```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run Oxlint checks
npm run lint

# Build production bundle with TypeScript typecheck
npm run build

# Preview production build locally
npm run preview
```

---

## Environment Configuration

Create a `.env` file in the `web/` root directory if pointing to an external backend:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

If left unset, requests default to `/api/v1` and are proxied to the local FastAPI backend during development.
