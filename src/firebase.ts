import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, setDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "ov52RwXueoe_h6ReX2vAGpSrv3GzzTKYoui9LY1UMZ0",
  authDomain: "tittitracker-prod.firebaseapp.com",
  projectId: "tittitracker-prod",
  storageBucket: "tittitracker-prod.appspot.com",
  messagingSenderId: "9876543210",
  appId: "1:9876543210:web:1234567890abcdef"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export { collection, addDoc, getDocs, setDoc, doc };
