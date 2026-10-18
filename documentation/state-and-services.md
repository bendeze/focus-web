# State Management and Services

This document details the frontend state management architecture, background delta synchronization, API client abstraction, keyboard shortcuts, and audio feedback synthesis.

---

## 1. Centralized State Management (`useStore.ts`)

The application uses **Zustand** as its primary client-side state store. State is consolidated into a single reactive store (`useStore`) with targeted persistence.

### State Slices

#### Authentication & Account
- `user`: Currently authenticated `User` object (or `null`).
- `token`: Bearer access token string, initialized from `localStorage.getItem('token')`.
- `setUser(user)`: Updates user profile state.
- `setToken(token)`: Persists or clears authentication tokens in `localStorage`.
- `logout()`: Clears active credentials, resets sessions, and purges auth tokens.

#### Navigation & Workspace
- `activeTab`: Current visible view (`dashboard`, `focus`, `tasks`, `projects`, `analytics`).
- `setActiveTab(tab)`: Switches the active view while preserving in-flight timers and component state.
- `isZenMode`: Boolean flag indicating full-screen distraction-free mode.
- `setZenMode(enabled)`: Toggles Zen mode on and off.

#### Theme
- `theme`: Current active color scheme (`dark` or `light`).
- `setTheme(theme)`: Updates the root `<html>` class list (`dark` / `light`) and persists selection in `localStorage.getItem('focus_theme')`.

#### Focus Timer State
- `isTimerRunning`: Boolean indicating active countdown execution.
- `remainingSeconds`: Time remaining in the active sprint or break.
- `totalSeconds`: Target duration of the active sprint (for circular progress calculation).
- `selectedTaskId`: ID of the task currently attached to the timer.
- `activeSession`: Currently running `FocusSession` record returned by the backend.
- Actions:
  - `selectAndStartTask(taskId, minutes)`: Pairs a task with the timer and initializes countdown seconds.
  - `decrementTimer()`: Steps the countdown down by 1 second.
  - `pauseCurrentTimer()`: Pauses countdown execution.
  - `resumeCurrentTimer()`: Resumes countdown execution.
  - `resetCurrentTimer(minutes)`: Restores initial seconds without altering task pairing.
  - `clearTaskTimer(taskId)`: Dissolves the task pairing when a task is completed or deleted.

#### Notification System
- `toasts`: List of active `ToastMessage` objects (`id`, `type`, `message`).
- `addToast(message, type)`: Enqueues a notification with an automatic 3.2-second expiration timer.
- `removeToast(id)`: Removes a specific toast when manually dismissed.

---

## 2. Delta Synchronization Protocol

To ensure data freshness across multiple devices and browser tabs without full refetches, `App.tsx` runs an automated background delta synchronization loop:

```
[Client App]                                                 [Backend API]
     |                                                             |
     |--- Every 10 seconds ----------------------------------------|
     |                                                             |
     |--- GET /api/v1/tasks?updated_after=2026-10-18T19:00:00Z --->|
     |<-- Delta tasks array (only modified or created records) ----|
     |                                                             |
     |--- GET /api/v1/projects?updated_after=2026-10-18T19:00:00Z ->|
     |<-- Delta projects array (only modified or created records) -|
     |                                                             |
[Reconcile Map]                                                    |
     | Merge into local array preserving client order              |
     | Update lastSyncTimeRef = new Date().toISOString()           |
```

### Reconciliation Mechanism
When delta records arrive:
```typescript
setTasks((prev) => {
  const map = new Map(prev.map((t) => [t.id, t]));
  deltaTasks.forEach((t) => map.set(t.id, t));
  return Array.from(map.values());
});
```
This guarantees:
- Fast in-memory updates without re-rendering unaffected components.
- Deleted items (`is_deleted == True`) can be either purged or flagged.
- Low server CPU and network payload overhead.

---

## 3. API Service Layer (`services/api.ts`)

Located in `web/src/services/api.ts`, the `api` object encapsulates all network communication, headers, and serialization:

### Client Configuration
- Automatically injects `Authorization: Bearer <token>` when a token exists in `useStore`.
- Supports configurable backend URLs via `VITE_API_URL` environment variable (defaults to `http://localhost:8000/api/v1`).
- Provides explicit methods corresponding to all backend endpoints:
  - Account: `login`, `register`, `getMe`, `updateMe`, `changePassword`
  - Projects: `listProjects`, `getProject`, `createProject`, `updateProject`, `deleteProject`
  - Tasks: `listTasks`, `getTask`, `createTask`, `updateTask`, `reorderTasks`, `deleteTask`
  - Focus: `startFocusSession`, `getCurrentFocusSession`, `listFocusSessions`, `pauseFocusSession`, `resumeFocusSession`, `completeFocusSession`, `cancelFocusSession`, `deleteFocusSession`, `getFocusStats`

### Error Normalization
Network failures or non-2xx HTTP responses are unpacked to extract the backend `detail` string:
```typescript
if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));
  throw new Error(errorData.detail || 'Request failed');
}
```

---

## 4. Audio Feedback Synthesizer (`utils/sound.ts`)

The application incorporates a zero-dependency Web Audio API synthesizer for acoustic feedback. Because tones are generated programmatically via native oscillators, the client requires zero audio asset downloads and experiences zero playback latency.

### Audio Profiles
Located in `web/src/utils/sound.ts`:
- `playStart()`: Generates a soft ascending two-tone chime (F#5 to A#5, 740 Hz -> 932 Hz) with exponential volume decay.
- `playComplete()`: Plays a triumphant three-tone celebration chord (C5 -> E5 -> G5, 523 Hz -> 659 Hz -> 784 Hz).
- `playClick()`: Subtle high-frequency micro-click (1200 Hz for 20ms) for tactile button feedback.
- `playWarning()`: Low-frequency alert tone (220 Hz) for limit warnings.

### Mute & Preference Control
Audio playback verifies `soundEnabled` in `localStorage.getItem('pomodoro_sound_enabled')` before triggering the audio context.

---

## 5. Keyboard Shortcut System (`useKeyboardShortcuts.ts`)

Located in `web/src/hooks/useKeyboardShortcuts.ts`:
- Global listener attached to `window.addEventListener('keydown', handleKeyDown)`.
- Input Guard: Automatically suppresses shortcuts when the active focus target is an `<input>`, `<textarea>`, `<select>`, or `contentEditable` element.
- Supported Shortcuts:
  - `Space`: Toggles the focus sprint timer (Start / Pause) with sound cue.
  - `Z`: Toggles Zen Mode on and off.
