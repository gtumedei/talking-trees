// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBO7ikPkYkz6gjyDHl9vT0mdb0uJtxDV1Y",
  authDomain: "tesi-tree.firebaseapp.com",
  projectId: "tesi-tree",
  storageBucket: "tesi-tree.firebasestorage.app",
  messagingSenderId: "233258963049",
  appId: "1:233258963049:web:d68298d740140ce76752f8",
  measurementId: "G-XL9G5TZGVR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);