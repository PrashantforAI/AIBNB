import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAlMW2OOda6y4Le7T9gylceXALRD2jHtTg",
  authDomain: "staysphere-nsmv7.firebaseapp.com",
  projectId: "staysphere-nsmv7",
  storageBucket: "staysphere-nsmv7.firebasestorage.app",
  messagingSenderId: "466407366315",
  appId: "1:466407366315:web:c9ac5d45774959f6d2a1ee"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);