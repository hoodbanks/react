// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCGZV9wG4CYi3AjvbYKEhc6XcDdPoMbDDk",
  authDomain: "getyovo-77e7a.firebaseapp.com",
  projectId: "getyovo-77e7a",
  storageBucket: "getyovo-77e7a.firebasestorage.app",
  messagingSenderId: "236022561974",
  appId: "1:236022561974:web:3bf960533eca2f7e813a17",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export { RecaptchaVerifier, signInWithPhoneNumber };
