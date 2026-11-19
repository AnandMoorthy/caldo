// Environment-driven configuration with safe defaults
// For local development, you can create a .env file with Vite-style variables like:
// VITE_FIREBASE_API_KEY=...

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDYWM_Ij3Li3-5MQRRA_dLa6cm9iC8sRfY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "caldo-ae155.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "caldo-ae155",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "caldo-ae155.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1013839317911",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1013839317911:web:1e9ecd2f49e519ba16d2d2",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-MP3JSVWFZ3",
};

// Web Push VAPID public key (safe to ship in the client). Private key lives in
// GitHub Actions secret WEB_PUSH_VAPID_PRIVATE_KEY for the reminder cron.
export const webPushConfig = {
  vapidPublicKey:
    import.meta.env.VITE_WEB_PUSH_VAPID_PUBLIC_KEY ||
    "BMsJLbL9Ydew3uV9Zs-debZdnJSM-hDMGzVr3Si3UMr5PQtxQW9XR_DgA0WDbxDUxLKQi5M8Wv9xMHPTGGu8QM4",
  vapidSubject: import.meta.env.VITE_WEB_PUSH_SUBJECT || "mailto:caldo@anandhere.xyz",
};


