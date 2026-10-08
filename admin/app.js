import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

let userRole = "";
let isLoginMode = true;

const authForm = document.getElementById("authForm");
const authActionBtn = document.getElementById("authActionBtn");
const switchModeLink = document.getElementById("switchModeLink");
const toggleText = document.getElementById("toggleMode");

// Role selection
document.getElementById("adminBtn").addEventListener("click", () => {
  userRole = "admin";
  alert("Admin selected");
  authForm.style.display = "block";
});

document.getElementById("studentBtn").addEventListener("click", () => {
  userRole = "student";
  alert("Student selected");
  authForm.style.display = "block";
});

// Toggle Auth Mode
function toggleAuthMode() {
  isLoginMode = !isLoginMode;
  authActionBtn.textContent = isLoginMode ? "Login" : "Sign Up";
  toggleText.innerHTML = isLoginMode
    ? `Don't have an account? <a href="#" id="switchModeLink">Sign Up</a>`
    : `Already have an account? <a href="#" id="switchModeLink">Login</a>`;

  document.getElementById("switchModeLink").addEventListener("click", (e) => {
    e.preventDefault();
    toggleAuthMode();
  });
}

switchModeLink.addEventListener("click", (e) => {
  e.preventDefault();
  toggleAuthMode();
});

// Handle login/signup
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!userRole) {
    alert("Please select a role first.");
    return;
  }

  if (isLoginMode) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const role = docSnap.data().role;
        console.log("Detected role:", role);

        localStorage.setItem("userRole", role);
        alert("Login successful!");

        if (role === "admin") {
          window.location.href = "admin.html";
        } else if (role === "student") {
          window.location.href = "student.html";
        } else {
          alert("Unknown role: " + role);
        }
      } else {
        alert("No user role found. Contact admin.");
      }
    } catch (err) {
      alert("Login failed: " + err.message);
    }
  } else {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email,
        role: userRole
      });

      localStorage.setItem("userRole", userRole);
      alert("Signup successful!");
      window.location.href = userRole === "admin" ? "admin.html" : "student.html";
    } catch (err) {
      alert("Signup failed: " + err.message);
    }
  }
});
