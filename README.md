# Caldo v2 - Local-first React + Tailwind App

## Quick start

1. Install dependencies:
```bash
npm install
```

2. Run dev server:
```bash
npm run dev
```

3. Open the URL shown by Vite (typically http://localhost:5173)

## Chrome extension (new tab)

The extension build opens CalDo as the Chrome new tab page.

```bash
npm run build:extension
```

1. Open `chrome://extensions`.
2. Turn on Developer mode.
3. Choose Load unpacked and select the `dist-extension` folder.
4. Open a new tab. CalDo replaces the new tab page.

`npm run dev:extension` rebuilds `dist-extension` when files change. Click the reload button on `chrome://extensions` after each rebuild.

Unpacked loads use a stable extension id of `kbcncpiopmdlgmlbdokgkhnabacefojh` (from the public `key` in `extension/manifest.json`). Local data lives in that extension origin, separate from the website. Sign in to sync through Firebase.

Google sign-in inside the extension needs a Chrome extension OAuth client in the same Google Cloud project as Firebase (`caldo-ae155`):

1. In Google Cloud → APIs & Services → Credentials, create an OAuth client ID of type Chrome extension.
2. Use the extension id above.
3. Rebuild with the client id:

```bash
VITE_CHROME_OAUTH_CLIENT_ID="your-id.apps.googleusercontent.com" npm run build:extension
```

The website keeps using the normal Google popup. Journal reminders and the Pomodoro timer can notify while a CalDo tab is open.

## Notes
- This is a frontend-first app with optional cloud sync via Firebase Auth + Firestore.
- Local data is stored in `localStorage` and merged with cloud data on sign-in.
- Tasks can be exported/imported via JSON from the profile menu.
- Built with React 18, Vite, TailwindCSS, date-fns, framer-motion, and lucide-react.

## Features

### Search
- **Global Search**: Press `⌘K` (Mac) or `Ctrl+K` (Windows/Linux) to open search
- **Search Everything**: Find tasks and day notes by title, content, or subtasks
- **Smart Navigation**: Click any result to jump to that date and item
- **Real-time Results**: See results as you type
- **Keyboard Navigation**: Use arrow keys, Enter, and Escape for quick navigation

## Project structure

```
src/
  components/
    Calendar.jsx
    Header.jsx
    TaskList.jsx
    SearchModal.jsx
    modals/
      AddTaskModal.jsx
      EditTaskModal.jsx
    CelebrationCanvas.jsx
  utils/
    date.js
    storage.js
    uid.js
    search.js
  constants.js
  App.jsx
  main.jsx
  index.css
```

The app separates reusable UI and logic into components and utilities for clarity and maintainability.
