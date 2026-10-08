// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Your Firebase configuration
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

// Handle login form submission
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    // Sign in user
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Get role from Firestore
    const userDoc = await getDoc(doc(db, "users", uid));
    if (!userDoc.exists()) {
      alert("User role not found in Firestore.");
      return;
    }

    const role = userDoc.data().role;
    console.log("Logged in with role:", role);

    // Redirect based on role
    switch (role) {
      case "admin":
        window.location.href = "admin.html";
        break;
      case "user":
        window.location.href = "student.html";
        break;
      case "guest":
        window.location.href = "guest.html";
        break;
      default:
        alert("Invalid role: " + role);
    }

  } catch (error) {
    alert("Login failed: " + error.message);
  }
});
