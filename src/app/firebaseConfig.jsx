// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // 👈 1. ADICIONE ESTA LINHA

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA7YKCwVILSckUpbQkGLNXTu_JqnFrmNlY",
  authDomain: "gameoutubro-62afe.firebaseapp.com",
  projectId: "gameoutubro-62afe",
  storageBucket: "gameoutubro-62afe.firebasestorage.app",
  messagingSenderId: "628995649101",
  appId: "1:628995649101:web:d8604d6c5bd0d9e171b604",
  measurementId: "G-MRDPD54T5W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

export const db = getFirestore(app); // 👈 Verifique se esta linha existe e tem o "export"
