import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";


const firebaseConfig = {
  apiKey: "AIzaSyAIOS-HQoAOjAZWcJ22dqu45-WRajAZ-q4",
  authDomain: "footbaz.firebaseapp.com",
  databaseURL: "https://footbaz-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "footbaz",
  storageBucket: "footbaz.firebasestorage.app",
  messagingSenderId: "719543232765",
  appId: "1:719543232765:web:95e3663096cc5d09417694"
};


const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);

export const db = getDatabase(app);