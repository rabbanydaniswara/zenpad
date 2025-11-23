// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// GANTI isi objek ini dengan config dari Firebase Console-mu
const firebaseConfig = {
  apiKey: "AIzaSyA5wA9_Ign3ctmP9RHLF95Z3ovRndEfivc",
  authDomain: "only-a-test-2b894.firebaseapp.com",
  projectId: "only-a-test-2b894",
  storageBucket: "only-a-test-2b894.firebasestorage.app",
  messagingSenderId: "345905639102",
  appId: "1:345905639102:web:763ea6201026106ca538ef",
  measurementId: "G-BHRJ8TKHXR"
};

const app = initializeApp(firebaseConfig);

// Auth untuk anonymous login
export const auth = getAuth(app);

// Firestore database
export const db = getFirestore(app);
