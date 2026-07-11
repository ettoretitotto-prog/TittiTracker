import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, setDoc, doc } from 'firebase/firestore';

// Utilizziamo l'ID del progetto ricavato dal file Service Account per configurare il client Web SDK di Firebase.
// Firestore per il Web necessita solo dell'ID del progetto (project_id) per connettersi in modalità anonima/pubblica.
const firebaseConfig = {
  apiKey: "AIzaSyAs-demo-key-placeholder", 
  authDomain: "tittitracker.firebaseapp.com",
  projectId: "tittitracker",
  storageBucket: "tittitracker.appspot.com",
  messagingSenderId: "110021317666",
  appId: "1:110021317666:web:8899aabbccddeeff"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export { collection, addDoc, getDocs, setDoc, doc };
