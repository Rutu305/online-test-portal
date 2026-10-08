// Enhanced Login functionality with instant validation & responsive UX
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");
  const loginAlert = document.getElementById("loginAlert");
  const alertIcon = document.getElementById("alertIcon");
  const alertMessage = document.getElementById("alertMessage");
  const submitBtn = document.getElementById("submitBtn");
  const btnSpinner = document.getElementById("btnSpinner");
  const btnText = document.getElementById("btnText");
  const togglePasswordBtn = document.getElementById("togglePasswordBtn");

  const showReset = document.getElementById("showReset");
  const resetSection = document.getElementById("resetSection");
  const resetEmail = document.getElementById("resetEmail");
  const resetEmailError = document.getElementById("resetEmailError");
  const resetBtn = document.getElementById("resetBtn");
  const resetMsg = document.getElementById("resetMsg");

  const demoStudentBtn = document.getElementById("demoStudentBtn");
  const demoAdminBtn = document.getElementById("demoAdminBtn");

  // Helper: Email format validator
  function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // Show inline alert message
  function showAlert(message, type = "error") {
    if (!loginAlert || !alertMessage) return;
    loginAlert.className = `login-alert show alert-${type}`;
    if (alertIcon) {
      alertIcon.textContent = type === "success" ? "✅" : type === "info" ? "ℹ️" : "⚠️";
    }
    alertMessage.textContent = message;
  }

  // Hide inline alert message
  function hideAlert() {
    if (loginAlert) {
      loginAlert.className = "login-alert";
    }
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
      passwordError.textContent = "Password must be at least 6 characters.";
      passwordInput.classList.add("is-invalid");
      passwordInput.classList.remove("is-valid");
      return false;
    }

    passwordError.textContent = "";
    passwordInput.classList.remove("is-invalid");
    passwordInput.classList.add("is-valid");
    return true;
  }

  // Real-time listeners
  emailInput.addEventListener("input", () => {
    hideAlert();
    validateEmail(false);
  });
  emailInput.addEventListener("blur", () => {
    validateEmail(true);
  });

  passwordInput.addEventListener("input", () => {
    hideAlert();
    validatePassword(false);
  });
  passwordInput.addEventListener("blur", () => {
    validatePassword(true);
  });

  // Toggle Password Visibility
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";
      togglePasswordBtn.textContent = isPassword ? "🙈" : "👁️";
    });
  }

  // Quick Demo Fill
  function fillDemoAccount(email, pass) {
    emailInput.value = email;
    passwordInput.value = pass;
    validateEmail(true);
    validatePassword(true);
    hideAlert();
    showAlert(`Filled credentials for ${email}. Click "Log In" to proceed.`, "info");
    emailInput.focus();
  }

  if (demoStudentBtn) {
    demoStudentBtn.addEventListener("click", () => {
      fillDemoAccount("student@test.com", "student123");
    });
  }

  if (demoAdminBtn) {
    demoAdminBtn.addEventListener("click", () => {
      fillDemoAccount("admin@test.com", "admin123");
    });
  }

  // Form Submit
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert();

    const isEmailValid = validateEmail(true);
    const isPasswordValid = validatePassword(true);

    if (!isEmailValid) {
      emailInput.focus();
      return;
    }

    if (!isPasswordValid) {
      passwordInput.focus();
      return;
    }

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    // Loading State
    submitBtn.disabled = true;
    if (btnSpinner) btnSpinner.style.display = "inline-block";
    if (btnText) btnText.textContent = "Authenticating...";

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showAlert("Login successful! Redirecting to dashboard...", "success");
        if (btnText) btnText.textContent = "Redirecting...";

        setTimeout(() => {
          window.location.href = data.redirect || (data.role === "admin" ? "/admin" : "/student");
        }, 400);
      } else {
        showAlert(data.message || "Invalid email or password. Please try again.", "error");
        submitBtn.disabled = false;
        if (btnSpinner) btnSpinner.style.display = "none";
        if (btnText) btnText.textContent = "Log In";
      }
    } catch (error) {
      console.error("Login Error:", error);
      showAlert("Network error. Please ensure the server is running and try again.", "error");
      submitBtn.disabled = false;
      if (btnSpinner) btnSpinner.style.display = "none";
      if (btnText) btnText.textContent = "Log In";
    }
  });

  // Forgot Password Toggle
  if (showReset && resetSection) {
    showReset.addEventListener("click", (e) => {
      e.preventDefault();
      const isHidden = resetSection.style.display === "none" || !resetSection.style.display;
      resetSection.style.display = isHidden ? "block" : "none";
      if (isHidden && resetEmail) {
        resetEmail.value = emailInput.value;
        resetEmail.focus();
      }
    });
  }

  // Password Reset Action
  if (resetBtn && resetEmail) {
    resetBtn.addEventListener("click", async () => {
      const email = resetEmail.value.trim();
      if (!email) {
        if (resetEmailError) resetEmailError.textContent = "Please enter your email.";
        resetEmail.classList.add("is-invalid");
        return;
      }
      if (!isValidEmail(email)) {
        if (resetEmailError) resetEmailError.textContent = "Please enter a valid email format.";
        resetEmail.classList.add("is-invalid");
        return;
      }

      if (resetEmailError) resetEmailError.textContent = "";
      resetEmail.classList.remove("is-invalid");

      resetBtn.disabled = true;
      resetBtn.textContent = "Sending...";

      try {
        const response = await fetch("/api/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });
        const data = await response.json();
        if (resetMsg) {
          resetMsg.textContent = data.message || "Instructions sent if email exists.";
          resetMsg.style.color = "#16a34a";
        }
      } catch (err) {
        if (resetMsg) {
          resetMsg.textContent = "Failed to send reset link. Try again later.";
          resetMsg.style.color = "#dc2626";
        }
      } finally {
        resetBtn.disabled = false;
        resetBtn.textContent = "Send Reset Link";
      }
    });
  }
});
