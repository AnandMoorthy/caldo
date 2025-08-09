import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDYWM_Ij3Li3-5MQRRA_dLa6cm9iC8sRfY",
  authDomain: "caldo-ae155.firebaseapp.com",
  projectId: "caldo-ae155",
  storageBucket: "caldo-ae155.firebasestorage.app",
  messagingSenderId: "1013839317911",
  appId: "1:1013839317911:web:1e9ecd2f49e519ba16d2d2",
  measurementId: "G-MP3JSVWFZ3"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

export { firebase, auth, db, googleProvider };
