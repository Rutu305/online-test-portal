// Enhanced Signup functionality with instant validation & responsive UX
document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const roleSelect = document.getElementById("role");

  const nameError = document.getElementById("nameError");
  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");
  const roleError = document.getElementById("roleError");

  const signupAlert = document.getElementById("signupAlert");
  const alertIcon = document.getElementById("alertIcon");
  const alertMessage = document.getElementById("alertMessage");

  const submitBtn = document.getElementById("submitBtn");
  const btnSpinner = document.getElementById("btnSpinner");
  const btnText = document.getElementById("btnText");
  const togglePasswordBtn = document.getElementById("togglePasswordBtn");

  function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  function showAlert(message, type = "error") {
    if (!signupAlert || !alertMessage) return;
    signupAlert.className = `login-alert show alert-${type}`;
    if (alertIcon) {
      alertIcon.textContent = type === "success" ? "✅" : "⚠️";
    }
    alertMessage.textContent = message;
  }

  function hideAlert() {
    if (signupAlert) {
      signupAlert.className = "login-alert";
    }
  }

  // Name Validation
  function validateName(showEmptyError = false) {
    const val = nameInput.value.trim();
    if (!val) {
      if (showEmptyError) {
        nameError.textContent = "Full name is required.";
        nameInput.classList.add("is-invalid");
        nameInput.classList.remove("is-valid");
        return false;
      }
      nameError.textContent = "";
      nameInput.classList.remove("is-invalid", "is-valid");
      return false;
    }

    if (!/^[A-Za-z\s]+$/.test(val)) {
      nameError.textContent = "Name must only contain letters and spaces.";
      nameInput.classList.add("is-invalid");
      nameInput.classList.remove("is-valid");
      return false;
    }

    if (val.length < 3) {
      nameError.textContent = "Name must be at least 3 characters long.";
      nameInput.classList.add("is-invalid");
      nameInput.classList.remove("is-valid");
      return false;
    }

    nameError.textContent = "";
    nameInput.classList.remove("is-invalid");
    nameInput.classList.add("is-valid");
    return true;
  }

  // Email Validation
  function validateEmail(showEmptyError = false) {
    const val = emailInput.value.trim();
    if (!val) {
      if (showEmptyError) {
        emailError.textContent = "Email address is required.";
        emailInput.classList.add("is-invalid");
        emailInput.classList.remove("is-valid");
        return false;
      }
      emailError.textContent = "";
      emailInput.classList.remove("is-invalid", "is-valid");
      return false;
    }

    if (!isValidEmail(val)) {
      emailError.textContent = "Please enter a valid email address.";
      emailInput.classList.add("is-invalid");
      emailInput.classList.remove("is-valid");
      return false;
    }

    emailError.textContent = "";
    emailInput.classList.remove("is-invalid");
    emailInput.classList.add("is-valid");
    return true;
  }

  // Password Validation
  function validatePassword(showEmptyError = false) {
    const val = passwordInput.value;
    if (!val) {
      if (showEmptyError) {
        passwordError.textContent = "Password is required.";
        passwordInput.classList.add("is-invalid");
        passwordInput.classList.remove("is-valid");
        return false;
      }
      passwordError.textContent = "";
      passwordInput.classList.remove("is-invalid", "is-valid");
      return false;
    }

    if (val.length < 6) {
      passwordError.textContent = "Password must be at least 6 characters long.";
      passwordInput.classList.add("is-invalid");
      passwordInput.classList.remove("is-valid");
      return false;
    }

    passwordError.textContent = "";
    passwordInput.classList.remove("is-invalid");
    passwordInput.classList.add("is-valid");
    return true;
  }

  // Role Validation
  function validateRole(showEmptyError = false) {
    const val = roleSelect.value;
    if (!val) {
      if (showEmptyError) {
        roleError.textContent = "Please select an account role.";
        roleSelect.classList.add("is-invalid");
        roleSelect.classList.remove("is-valid");
        return false;
      }
      roleError.textContent = "";
      roleSelect.classList.remove("is-invalid", "is-valid");
      return false;
    }

    roleError.textContent = "";
    roleSelect.classList.remove("is-invalid");
    roleSelect.classList.add("is-valid");
    return true;
  }

  // Event Listeners
  nameInput.addEventListener("input", () => { hideAlert(); validateName(false); });
  nameInput.addEventListener("blur", () => { validateName(true); });

  emailInput.addEventListener("input", () => { hideAlert(); validateEmail(false); });
  emailInput.addEventListener("blur", () => { validateEmail(true); });

  passwordInput.addEventListener("input", () => { hideAlert(); validatePassword(false); });
  passwordInput.addEventListener("blur", () => { validatePassword(true); });

  roleSelect.addEventListener("change", () => { hideAlert(); validateRole(true); });

  // Toggle Password Visibility
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";
      togglePasswordBtn.textContent = isPassword ? "🙈" : "👁️";
    });
  }

  // Form Submit
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert();

    const isNameOk = validateName(true);
    const isEmailOk = validateEmail(true);
    const isPasswordOk = validatePassword(true);
    const isRoleOk = validateRole(true);

    if (!isNameOk) { nameInput.focus(); return; }
    if (!isEmailOk) { emailInput.focus(); return; }
    if (!isPasswordOk) { passwordInput.focus(); return; }
    if (!isRoleOk) { roleSelect.focus(); return; }

    const name = nameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const role = roleSelect.value;

    submitBtn.disabled = true;
    if (btnSpinner) btnSpinner.style.display = "inline-block";
    if (btnText) btnText.textContent = "Creating Account...";

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showAlert("Account created successfully! Redirecting to login...", "success");
        if (btnText) btnText.textContent = "Redirecting...";

        setTimeout(() => {
          window.location.href = "/login";
        }, 1200);
      } else {
        showAlert(data.message || "Failed to create account. Please try again.", "error");
        submitBtn.disabled = false;
        if (btnSpinner) btnSpinner.style.display = "none";
        if (btnText) btnText.textContent = "Create Account";
      }
    } catch (err) {
      console.error("Signup error:", err);
      showAlert("Network error occurred. Please ensure server is running.", "error");
      submitBtn.disabled = false;
      if (btnSpinner) btnSpinner.style.display = "none";
      if (btnText) btnText.textContent = "Create Account";
    }
  });
});
