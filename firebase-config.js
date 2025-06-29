// Firebase Configuration
// Replace these values with your Firebase project configuration
// const firebaseConfig = {
//   apiKey: "YOUR_API_KEY",
//   authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
//   projectId: "YOUR_PROJECT_ID",
//   storageBucket: "YOUR_PROJECT_ID.appspot.com",
//   messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
//   appId: "YOUR_APP_ID"
// };

const firebaseConfig = {
    apiKey: "AIzaSyDYWM_Ij3Li3-5MQRRA_dLa6cm9iC8sRfY",
    authDomain: "caldo-ae155.firebaseapp.com",
    projectId: "caldo-ae155",
    storageBucket: "caldo-ae155.firebasestorage.app",
    messagingSenderId: "1013839317911",
    appId: "1:1013839317911:web:1e9ecd2f49e519ba16d2d2",
    measurementId: "G-MP3JSVWFZ3"
  };
  

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile'); 