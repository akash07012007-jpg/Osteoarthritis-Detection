// Firebase configuration
// Replace these values with your actual Firebase project config from:
// https://console.firebase.google.com/project/<your-project>/settings/general
import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Enable offline persistence (backbone of offline-first requirement)
// All writes succeed locally even with zero connectivity,
// sync automatically when connection returns
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open — persistence available in one tab only
    console.warn('Firestore persistence unavailable: multiple tabs open');
  } else if (err.code === 'unimplemented') {
    // Browser doesn't support persistence
    console.warn('Firestore persistence not supported in this browser');
  }
});

export default app;
