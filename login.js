import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // 🔽 THIS is where you place the code to get the user's role and redirect
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const role = docSnap.data().role;
      if (role === "admin") {
        window.location.href = "admin.html";
      } else if (role === "student") {
        window.location.href = "student.html";
      } else {
        alert("Unknown user role.");
      }
    } else {
      alert("User data not found in database.");
    }

  } catch (error) {
    console.error("Login Error:", error.message);
    alert("Invalid credentials or user not found.");
  }
});

document.getElementById("showReset").addEventListener("click", () => {
  document.getElementById("resetSection").style.display = "block";
});


document.getElementById("resetBtn").addEventListener("click", async () => {
  const resetEmail = document.getElementById("resetEmail").value.trim();
  const resetMsg = document.getElementById("resetMsg");

  try {
    await sendPasswordResetEmail(auth, resetEmail);
    resetMsg.textContent = "If this email is registered, a reset link has been sent.";
    resetMsg.style.color = "green";
  } catch (error) {
    console.error("🔥 FULL ERROR:", error);
    resetMsg.textContent = `Firebase error: ${error.code} - ${error.message}`;
    resetMsg.style.color = "red";
  }
});
