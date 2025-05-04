import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyANxNYeOVvo7O8b_4hMKNWuyZggdCiAjB8",
  authDomain: "timerapp-3be2d.firebaseapp.com",
  databaseURL: "https://timerapp-3be2d-default-rtdb.firebaseio.com/",
  projectId: "timerapp-3be2d",
  storageBucket: "timerapp-3be2d.appspot.com",
  messagingSenderId: "1030546598066",
  appId: "1:1030546598066:web:d9e8f24a170cb092fac1ab",
  measurementId: "G-SLF27750XH",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
