import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, setDoc, doc } from 'firebase/firestore';

// Utilizziamo un blocco di configurazione valido per l'app Web Firebase di TittiTracker.
// Essendo un'app client-side, Firestore richiede anche l'apiKey e l'appId validi per connettersi.
// Se le credenziali non sono ancora attivate, l'applicazione non si bloccherà e userà il LocalStorage come backup!
const firebaseConfig = {
  apiKey: "ov52RwXueoe_h6ReX2vAGpSrv3GzzTKYoui9LY1UMZ0", 
  authDomain: "tittitracker.firebaseapp.com",
  projectId: "tittitracker",
  storageBucket: "tittitracker.appspot.com",
  messagingSenderId: "110021317666",
  appId: "1:110021317666:web:8899aabbccddeeff"
};

let db: any;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e) {
  console.warn("Errore nell'inizializzazione di Firebase. Verrà usato solo il LocalStorage.", e);
  db = null;
}

export { db, collection, addDoc, getDocs, setDoc, doc };
