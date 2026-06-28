import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDxoJtVJFuzjaMwa5Awjm6WQInJ4fnMEas",
  authDomain: "urban-eye-64a3a.firebaseapp.com",
  projectId: "urban-eye-64a3a",
  storageBucket: "urban-eye-64a3a.firebasestorage.app",
  messagingSenderId: "1026821556255",
  appId: "1:1026821556255:web:761bc3c213926f8098ed2a",
  measurementId: "G-56YJBZN329"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
<<<<<<< HEAD
export const githubProvider = new GithubAuthProvider();
=======
export const githubProvider = new GithubAuthProvider();
>>>>>>> 4b36976952ccb9e677cb3a8e15deaa37adfb4ff5
