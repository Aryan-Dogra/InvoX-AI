// =========================================================
// InvoX AI — Auth Pages Behavior
// Handles password visibility toggles and client-side
// validation for both login.html and signup.html.
//
// NOTE: There is no backend wired up yet. On a valid submit,
// this only reports that validation passed — it never claims
// sign-in/sign-up succeeded. Replace `submitLogin` /
// `submitSignup` below with real API calls once the backend
// auth endpoints exist.
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  setupPasswordToggles();
  setupLoginForm();
  setupSignupForm();
});

/**
 * Wires up every eye-icon button to toggle the visibility
 * of the password input it's paired with via data-target.
 */
function setupPasswordToggles() {
  document.querySelectorAll(".field__toggle").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const input = document.getElementById(toggle.dataset.target);
      if (!input) return;

      const isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";
      toggle.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
      toggle.classList.toggle("is-visible", isHidden);
      toggle.innerHTML = isHidden ? eyeOffIcon() : eyeIcon();
    });
  });
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ---------------------------------------------------------
   Login form
   --------------------------------------------------------- */

function setupLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  const email = document.getElementById("loginEmail");
  const password = document.getElementById("loginPassword");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    let isValid = true;
    isValid = validateEmail(email, "loginEmailError") && isValid;
    isValid = validateRequired(password, "loginPasswordError", "Password is required") && isValid;

    if (!isValid) return;

    submitLogin({
      email: email.value.trim(),
      password: password.value,
    });
  });
}

/**
 * Placeholder submit handler. Structured so a real fetch()
 * call to the backend auth endpoint can replace the body
 * without touching the validation logic above.
 */
function submitLogin(credentials) {
  const button = document.getElementById("loginSubmit");
  setButtonLoading(button, true);

  // TODO: replace with the real request once the backend exists, e.g.
  // const res = await fetch("/api/auth/login", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(credentials),
  // });

  window.setTimeout(() => {
    setButtonLoading(button, false);
    showStatus(
      "loginStatus",
      "Form validated. This isn't connected to a backend yet — wire submitLogin() in auth.js to your /api/auth/login endpoint."
    );
  }, 500);
}


function setupSignupForm() {
  const form = document.getElementById("signupForm");
  if (!form) return;

  const name = document.getElementById("signupName");
  const email = document.getElementById("signupEmail");
  const password = document.getElementById("signupPassword");
  const confirm = document.getElementById("signupConfirm");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    let isValid = true;
    isValid = validateRequired(name, "signupNameError", "Full name is required") && isValid;
    isValid = validateEmail(email, "signupEmailError") && isValid;
    isValid = validateRequired(password, "signupPasswordError", "Password is required") && isValid;

    if (confirm.value !== password.value || !confirm.value) {
      setFieldError(confirm, "signupConfirmError", "Passwords do not match");
      isValid = false;
    } else {
      clearFieldError(confirm, "signupConfirmError");
    }

    if (!isValid) return;

    submitSignup({
      name: name.value.trim(),
      email: email.value.trim(),
      password: password.value,
    });
  });
}

function submitSignup(details) {
  const button = document.getElementById("signupSubmit");
  setButtonLoading(button, true);

  // TODO: replace with the real request once the backend exists, e.g.
  // const res = await fetch("/api/auth/signup", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(details),
  // });

  window.setTimeout(() => {
    setButtonLoading(button, false);
    showStatus(
      "signupStatus",
      "Form validated. This isn't connected to a backend yet — wire submitSignup() in auth.js to your /api/auth/signup endpoint."
    );
  }, 500);
}

function validateEmail(input, errorId) {
  const value = input.value.trim();

  if (!value) {
    setFieldError(input, errorId, "Email address is required");
    return false;
  }
  if (!EMAIL_PATTERN.test(value)) {
    setFieldError(input, errorId, "Enter a valid email address");
    return false;
  }

  clearFieldError(input, errorId);
  return true;
}

function validateRequired(input, errorId, message) {
  if (!input.value.trim()) {
    setFieldError(input, errorId, message);
    return false;
  }
  clearFieldError(input, errorId);
  return true;
}

function setFieldError(input, errorId, message) {
  input.classList.add("has-error");
  const el = document.getElementById(errorId);
  if (el) el.textContent = message;
}

function clearFieldError(input, errorId) {
  input.classList.remove("has-error");
  const el = document.getElementById(errorId);
  if (el) el.textContent = "";
}

function setButtonLoading(button, isLoading) {
  if (!button) return;
  button.disabled = isLoading;
  button.classList.toggle("is-loading", isLoading);
}

function showStatus(elementId, message) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.classList.add("is-visible");
}

function eyeIcon() {
  return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/></svg>';
}

function eyeOffIcon() {
  return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 3l18 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M10.6 5.2C11 5.1 11.5 5 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.4 4.3M6.7 6.7A17.7 17.7 0 0 0 2 12s3.6 7 10 7c1.3 0 2.5-.2 3.6-.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M9.9 10a3 3 0 0 0 4.2 4.2" stroke="currentColor" stroke-width="1.5"/></svg>';
}