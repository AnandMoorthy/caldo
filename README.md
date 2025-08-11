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
