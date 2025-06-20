import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elements
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const roleSelect = document.getElementById("role");

const nameError = document.getElementById("nameError");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const roleError = document.getElementById("roleError");

// ✅ Real-time name validation
nameInput.addEventListener("input", () => {
  const name = nameInput.value;
  if (!/^[A-Za-z\s]*$/.test(name)) {
    nameError.textContent = "Only letters and spaces are allowed.";
    nameInput.style.border = "2px solid red";
  } else if (name.length < 3) {
    nameError.textContent = "Name must be at least 3 characters.";
    nameInput.style.border = "2px solid red";
  } else {
    nameError.textContent = "";
    nameInput.style.border = "2px solid green";
  }
});

// ✅ Real-time email validation
emailInput.addEventListener("input", () => {
  const email = emailInput.value;
  if (!validateEmail(email)) {
    emailError.textContent = "Invalid email format.";
    emailInput.style.border = "2px solid red";
  } else {
    emailError.textContent = "";
    emailInput.style.border = "2px solid green";
  }
});

// ✅ Real-time password validation
passwordInput.addEventListener("input", () => {
  const password = passwordInput.value;
  if (password.length < 6) {
    passwordError.textContent = "Password must be at least 6 characters.";
    passwordInput.style.border = "2px solid red";
  } else {
    passwordError.textContent = "";
    passwordInput.style.border = "2px solid green";
  }
});

// ✅ Real-time role selection validation
roleSelect.addEventListener("change", () => {
  if (!roleSelect.value) {
    roleError.textContent = "Please select a role.";
    roleSelect.style.border = "2px solid red";
  } else {
    roleError.textContent = "";
    roleSelect.style.border = "2px solid green";
  }
});

// ✅ On submit
document.getElementById("signupForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const role = roleSelect.value;

  // Final checks
  let valid = true;

  if (!/^[A-Za-z\s]+$/.test(name) || name.length < 3) {
    nameError.textContent = "Name must contain only letters & be at least 3 characters.";
    nameInput.style.border = "2px solid red";
    valid = false;
  }

  if (!validateEmail(email)) {
    emailError.textContent = "Invalid email format.";
    emailInput.style.border = "2px solid red";
    valid = false;
  }

  if (password.length < 6) {
    passwordError.textContent = "Password must be at least 6 characters.";
    passwordInput.style.border = "2px solid red";
    valid = false;
  }

  if (!role) {
    roleError.textContent = "Please select a role.";
    roleSelect.style.border = "2px solid red";
    valid = false;
  }

  if (!valid) return;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      name,
      email,
      role,
      uid: user.uid,
      createdAt: new Date().toISOString()
    });

    alert("Signup successful! Please log in.");
window.location.href = "login.html";

  } catch (error) {
    alert("Signup failed: " + error.message);
  }
});

// ✅ Email validation function
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}
