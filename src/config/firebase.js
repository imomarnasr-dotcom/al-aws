import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDazsu-Il1mWYzqunKue5l9-guhszwW7Z0",
  authDomain: "al-aws.firebaseapp.com",
  projectId: "al-aws",
  storageBucket: "al-aws.firebasestorage.app",
  messagingSenderId: "778455390666",
  appId: "1:778455390666:web:a7f80a6e2effeeeb185733",
  measurementId: "G-XTL04MD41M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
