// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCvqreWrDBTwWMoRNuGIotTwXbytrwuKtU",
  authDomain: "practice-app-3c074.firebaseapp.com",
  projectId: "practice-app-3c074",
  storageBucket: "practice-app-3c074.firebasestorage.app",
  messagingSenderId: "24989276985",
  appId: "1:24989276985:web:673bb89d3e9a2a35c266e8",
  measurementId: "G-GG7ZH801Z4",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
