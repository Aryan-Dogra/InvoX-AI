// =========================================================
// InvoX AI — Authentication
// Signup + Login + Password visibility
// Connected to Node/Express backend
// =========================================================

const API_BASE_URL = "http://localhost:5000/api";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

document.addEventListener("DOMContentLoaded", () => {
    setupPasswordToggles();
    setupLoginForm();
    setupSignupForm();
});


// =========================================================
// PASSWORD VISIBILITY
// =========================================================

function setupPasswordToggles() {

    document.querySelectorAll(".password-toggle").forEach((toggle) => {

        toggle.addEventListener("click", () => {

            const input = document.getElementById(toggle.dataset.target);

            if (!input) return;

            const isHidden = input.type === "password";

            input.type = isHidden ? "text" : "password";

        });

    });

}


// =========================================================
// SIGNUP
// =========================================================

function setupSignupForm() {

    const form = document.getElementById("signupForm");

    if (!form) return;

    const name = document.getElementById("name");
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        const nameValue = name.value.trim();
        const emailValue = email.value.trim();
        const passwordValue = password.value;
        const confirmValue = confirmPassword.value;

        // -------------------------
        // Validation
        // -------------------------

        if (!nameValue) {
            showStatus("signupForm", "Please enter your full name.");
            return;
        }

        if (!emailValue) {
            showStatus("signupForm", "Please enter your email address.");
            return;
        }

        if (!EMAIL_PATTERN.test(emailValue)) {
            showStatus("signupForm", "Please enter a valid email address.");
            return;
        }

        if (!passwordValue) {
            showStatus("signupForm", "Please enter a password.");
            return;
        }

        if (passwordValue !== confirmValue) {
            showStatus("signupForm", "Passwords do not match.");
            return;
        }

        // -------------------------
        // Button
        // -------------------------

        const button = form.querySelector('button[type="submit"]');

        setButtonLoading(button, true);

        try {

            const response = await fetch(
                `${API_BASE_URL}/auth/signup`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        name: nameValue,
                        email: emailValue,
                        password: passwordValue
                    })
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {

                throw new Error(
                    data.message || "Account creation failed."
                );

            }

            showStatus(
                "signupForm",
                "Account created successfully! Redirecting to login..."
            );

            setTimeout(() => {

                window.location.href = "login.html";

            }, 1000);

        } catch (error) {

            console.error("Signup error:", error);

            showStatus(
                "signupForm",
                error.message || "Unable to connect to the server."
            );

        } finally {

            setButtonLoading(button, false);

        }

    });

}


// =========================================================
// LOGIN
// =========================================================

function setupLoginForm() {

    const form = document.getElementById("loginForm");

    if (!form) return;

    /*
       Supports either:
       loginEmail / loginPassword

       OR

       email / password
    */

    const email =
        document.getElementById("loginEmail") ||
        document.getElementById("email");

    const password =
        document.getElementById("loginPassword") ||
        document.getElementById("password");

    if (!email || !password) return;

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        const emailValue = email.value.trim();
        const passwordValue = password.value;

        // -------------------------
        // Validation
        // -------------------------

        if (!emailValue) {

            showStatus(
                "loginForm",
                "Please enter your email address."
            );

            return;
        }

        if (!EMAIL_PATTERN.test(emailValue)) {

            showStatus(
                "loginForm",
                "Please enter a valid email address."
            );

            return;
        }

        if (!passwordValue) {

            showStatus(
                "loginForm",
                "Please enter your password."
            );

            return;
        }

        // -------------------------
        // Button
        // -------------------------

        const button = form.querySelector('button[type="submit"]');

        setButtonLoading(button, true);

        try {

            const response = await fetch(
                `${API_BASE_URL}/auth/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email: emailValue,
                        password: passwordValue
                    })
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {

                throw new Error(
                    data.message || "Login failed."
                );

            }

            // -------------------------
            // Save JWT
            // -------------------------

            localStorage.setItem(
                "invoxToken",
                data.token
            );

            // Save user if backend sends it
            if (data.user) {

                localStorage.setItem(
                    "invoxUser",
                    JSON.stringify(data.user)
                );

            }

            showStatus(
                "loginForm",
                "Login successful! Redirecting..."
            );

            setTimeout(() => {

                window.location.href = "dashboard.html";

            }, 700);

        } catch (error) {

            console.error("Login error:", error);

            showStatus(
                "loginForm",
                error.message || "Unable to connect to the server."
            );

        } finally {

            setButtonLoading(button, false);

        }

    });

}


// =========================================================
// BUTTON LOADING
// =========================================================

function setButtonLoading(button, loading) {

    if (!button) return;

    button.disabled = loading;

    if (loading) {

        button.dataset.originalText = button.textContent;

        button.textContent = "Please wait...";

    } else {

        button.textContent =
            button.dataset.originalText || button.textContent;

    }

}


// =========================================================
// STATUS MESSAGE
// =========================================================

function showStatus(formId, message) {

    const form = document.getElementById(formId);

    if (!form) return;

    let status = form.parentElement.querySelector(".auth-status");

    // Create status element if HTML doesn't have one
    if (!status) {

        status = document.createElement("p");

        status.className = "auth-status";

        status.style.marginTop = "14px";
        status.style.textAlign = "center";
        status.style.fontSize = "14px";

        form.parentElement.appendChild(status);

    }

    status.textContent = message;

}


// =========================================================
// LOGOUT
// =========================================================

function logout() {

    localStorage.removeItem("invoxToken");
    localStorage.removeItem("invoxUser");

    window.location.href = "login.html";

}