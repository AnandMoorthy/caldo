# Caldo - Minimalist Todo Calendar with Google OAuth

A beautiful, minimalist todo calendar app with Google OAuth authentication and cloud storage using Firebase.

## Features

- 📅 **Calendar-based todo management** - Organize tasks by date
- 🔐 **Google OAuth authentication** - Secure sign-in with your Google account
- ☁️ **Cloud storage** - Your todos are synced across devices via Firebase
- 📱 **Responsive design** - Works perfectly on desktop and mobile
- 🎉 **Confetti celebration** - Visual feedback when completing all tasks for a day
- 📤 **Import/Export** - Backup and restore your todos
- 🌙 **Dark theme** - Easy on the eyes

## Setup Instructions

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "caldo-todo-app")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Click on "Google" provider
5. Enable it and configure:
   - **Project support email**: Your email address
   - **Authorized domains**: Add your domain (for production) or leave as is for local development
6. Click "Save"

### 3. Create Firestore Database

1. In your Firebase project, go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location close to your users
5. Click "Done"

### 4. Get Firebase Configuration

1. In your Firebase project, click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>)
5. Register your app with a nickname (e.g., "caldo-web")
6. Copy the configuration object

### 5. Update Firebase Configuration

1. Open `firebase-config.js` in your project
2. Replace the placeholder values with your actual Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

### 6. Set Up Firestore Security Rules

1. In your Firebase project, go to "Firestore Database"
2. Click on the "Rules" tab
3. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/todos/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

4. Click "Publish"

### 7. Run the Application

1. Open `index.html` in your web browser
2. Click "Sign in with Google"
3. Authorize the application
4. Start using your todo calendar!

## Project Structure

```
Todo/
├── index.html          # Main HTML file with auth UI
├── script.js           # Main JavaScript with Firebase integration
├── styles.css          # CSS styles including auth components
├── firebase-config.js  # Firebase configuration (update with your credentials)
└── README.md           # This file
```

## How It Works

### Authentication Flow
1. User clicks "Sign in with Google"
2. Firebase opens a popup for Google OAuth
3. User authorizes the application
4. Firebase returns user credentials
5. App shows the main todo interface

### Data Storage
- **Authenticated users**: Data is stored in Firebase Firestore under `users/{userId}/todos/{monthKey}`
- **Unauthenticated users**: Data falls back to localStorage
- **Data structure**: Each month's todos are stored as a separate document for efficient loading

### Security
- Users can only access their own data
- Firestore security rules ensure data isolation
- Google OAuth provides secure authentication

## Features in Detail

### Calendar View
- Navigate between months with arrow buttons
- Visual indicators for days with tasks:
  - 🟢 Green: All tasks completed
  - 🟠 Orange: Some tasks completed
  - 🔴 Red: No tasks completed
  - ⚪ Gray: No tasks

### Task Management
- Add tasks for any selected date
- Mark tasks as complete/incomplete
- Delete tasks
- Confetti animation when all tasks for a day are completed

### Data Sync
- Real-time cloud storage with Firebase
- Automatic sync across devices
- Offline support with localStorage fallback

### Import/Export
- Export all todos as JSON file
- Import todos from JSON file
- Works with both cloud and local storage

## Troubleshooting

### Common Issues

1. **"Firebase not initialized" error**
   - Make sure you've updated `firebase-config.js` with your actual Firebase credentials

2. **"Permission denied" error**
   - Check that your Firestore security rules are set up correctly
   - Ensure you're signed in with Google

3. **Google sign-in not working**
   - Verify that Google authentication is enabled in Firebase Console
   - Check that your domain is authorized (for production)

4. **Data not syncing**
   - Check your internet connection
   - Verify Firebase configuration is correct
   - Check browser console for errors

### Browser Compatibility
- Chrome (recommended)
- Firefox
- Safari
- Edge

## Deployment

### Local Development
Simply open `index.html` in your browser. For testing authentication, you may need to use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

### Production Deployment
1. **Firebase Hosting** (Recommended):
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init hosting
   firebase deploy
   ```

2. **GitHub Pages**: Push to a GitHub repository and enable Pages

3. **Netlify/Vercel**: Drag and drop your project folder

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the [MIT License](LICENSE). 