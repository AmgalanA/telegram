import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBo_0tG3zpJC1f2w9GGuhO9Y-1UW7BpX_Q",
  authDomain: "telegram-db-75fbf.firebaseapp.com",
  projectId: "telegram-db-75fbf",
  storageBucket: "telegram-db-75fbf.appspot.com",
  messagingSenderId: "8809474699",
  appId: "1:8809474699:web:d3a00b0535421f21e7c28e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore();
const auth = getAuth();
const provider = new GoogleAuthProvider();
const storage = getStorage();

export { db, auth, provider, storage };