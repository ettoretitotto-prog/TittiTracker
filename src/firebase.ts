import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, setDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBqoMkTUH7UuEq8nmEr1H_U68DLNrS6Plc",
  authDomain: "tittitracker.firebaseapp.com",
  projectId: "tittitracker",
  storageBucket: "tittitracker.firebasestorage.app",
  messagingSenderId: "134188088467",
  appId: "1:134188088467:web:4dba4fb6d4e74cc4c82166",
  measurementId: "G-DR89FH0X60"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc, getDocs, setDoc, doc };
