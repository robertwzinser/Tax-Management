import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database"; // Import Realtime Database

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDJHPb2M2mfgFWEBQ77j-bQDif4kva8uOc",
  authDomain: "taxzilla-787ee.firebaseapp.com",
  databaseURL: "https://taxzilla-787ee-default-rtdb.firebaseio.com",
  projectId: "taxzilla-787ee",
  storageBucket: "taxzilla-787ee.appspot.com",
  messagingSenderId: "217938085702",
  appId: "1:217938085702:web:627eac7504943198968747",
  measurementId: "G-RLFSPRTKV0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app); // Realtime Database instance