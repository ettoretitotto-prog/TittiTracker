import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, setDoc, doc } from 'firebase/firestore';

// Configurazione pubblica temporanea (Firebase Anonymous Database)
// Ti consiglio di sostituirla con la tua configurazione privata da Console Firebase appena possibile!
const firebaseConfig = {
  apiKey: "AIzaSyAs-demo-key-placeholder",
  authDomain: "tittitracker-demo.firebaseapp.com",
  projectId: "tittitracker-demo",
  storageBucket: "tittitracker-demo.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export { collection, addDoc, getDocs, setDoc, doc };
