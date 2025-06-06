import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Redirect user based on role after login (can also be placed in login.js if preferred)
onAuthStateChanged(auth, (user) => {
  if (user) {
    const storedRole = localStorage.getItem("userRole");

    if (storedRole === "admin" && !window.location.href.includes("admin.html")) {
      window.location.href = "admin.html";
    } else if (storedRole === "student" && !window.location.href.includes("student.html")) {
      window.location.href = "student.html";
    }
  } else {
    // If user not logged in, redirect to login
    if (!window.location.href.includes("login.html")) {
      window.location.href = "login.html";
    }
  }
});

// Optional: Logout function
window.signOutUser = function () {
  signOut(auth)
    .then(() => {
      localStorage.removeItem("userRole");
      window.location.href = "login.html";
    })
    .catch((error) => {
      alert("Sign-out failed: " + error.message);
    });
};
