import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDIEtxAzhBw23p4lcgcKRjlOMbAMCP8FnA",
  authDomain: "test-portal-f0842.firebaseapp.com",
  projectId: "test-portal-f0842",
  storageBucket: "test-portal-f0842.firebasestorage.app",
  messagingSenderId: "906912386232",
  appId: "1:906912386232:web:5d1b46ef6d6018e774f84d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  if (!role) {
    alert("Please select a role.");
    return;
  }

  try {
    // Create user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Store role in Firestore
    await setDoc(doc(db, "users", uid), {
      role: role
    });

    alert("User signed up and role saved. Now you can log in.");
    window.location.href = "login.html";
  } catch (error) {
    alert("Signup failed: " + error.message);
  }
});
