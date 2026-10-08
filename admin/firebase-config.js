
// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDIEtxAzhBw23p4lcgcKRjlOMbAMCP8FnA",
  authDomain: "test-portal-f0842.firebaseapp.com",
  projectId: "test-portal-f0842",
  storageBucket: "test-portal-f0842.firebasestorage.app",
  messagingSenderId: "906912386232",
  appId: "1:906912386232:web:5d1b46ef6d6018e774f84d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
