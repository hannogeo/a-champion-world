import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDgtqkQP6Y6d-2YB-mzKVusD-qpUeuqDeA",
    authDomain: "a-champion-world.firebaseapp.com",
    projectId: "a-champion-world",
    storageBucket: "a-champion-world.firebasestorage.app",
    messagingSenderId: "904979293281",
    appId: "1:904979293281:web:574a483004914fefe67620",
    measurementId: "G-DREJ95CCCH"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time.
        console.warn('Persistence failed: Multiple tabs open');
    } else if (err.code == 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        console.warn('Persistence failed: Browser not supported');
    }
});

export { auth, db };
