const form = document.querySelector("#auth-form");
const loginTab = document.querySelector("#login-tab");
const registerTab = document.querySelector("#register-tab");
const nameField = document.querySelector("#name-field");
const nameInput = document.querySelector("#name");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const submitButton = document.querySelector("#submit-button");
const message = document.querySelector("#message");
const headline = document.querySelector("#headline");
const intro = document.querySelector("#intro");
const authCard = document.querySelector(".auth-card");
const dashboard = document.querySelector("#dashboard");
const dashboardTitle = document.querySelector("#dashboard-title");
const dashboardIntro = document.querySelector("#dashboard-intro");
const tabs = document.querySelector(".tabs");
let mode = "login";

function setMessage(text, success = false) {
  message.textContent = text;
  message.classList.toggle("success", success);
}
function setMode(nextMode) {
  mode = nextMode;
  const registering = mode === "register";
  loginTab.classList.toggle("active", !registering);
  registerTab.classList.toggle("active", registering);
  loginTab.setAttribute("aria-selected", String(!registering));
  registerTab.setAttribute("aria-selected", String(registering));
  nameField.hidden = !registering;
  nameInput.required = registering;
  passwordInput.autocomplete = registering ? "new-password" : "current-password";
  headline.textContent = registering ? "Create your account" : "Welcome back";
  intro.textContent = registering ? "Start building your private knowledge workspace." : "Sign in to continue to your private workspace.";
  submitButton.querySelector("span:first-child").textContent = registering ? "Create account" : "Sign in";
  setMessage("");
}
loginTab.addEventListener("click", () => setMode("login"));
registerTab.addEventListener("click", () => setMode("register"));
document.querySelector("#bottom-register").addEventListener("click", () => setMode("register"));
document.querySelector("#toggle-password").addEventListener("click", (event) => {
  const show = passwordInput.type === "password";
  passwordInput.type = show ? "text" : "password";
  event.currentTarget.textContent = show ? "Hide" : "Show";
});
document.querySelector("#forgot-button").addEventListener("click", () => {
  setMessage("Password reset is not configured in this starter. Add a verified email reset flow before production.");
});
document.querySelectorAll("[data-provider]").forEach((button) => {
  button.addEventListener("click", () => setMessage(`${button.dataset.provider} sign-in is a visual placeholder. Configure OAuth credentials and callback routes to enable it.`));
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage("");
  submitButton.disabled = true;
  submitButton.querySelector("span:first-child").textContent = mode === "register" ? "Creating account…" : "Signing in…";
  const payload = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    password: passwordInput.value
  };
  try {
    const response = await fetch(`/api/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Something went wrong.");
    passwordInput.value = "";
    await showDashboard(data.user);
  } catch (error) {
    setMessage(error.message || "Could not connect to the server.");
  } finally {
    submitButton.disabled = false;
    submitButton.querySelector("span:first-child").textContent = mode === "register" ? "Create account" : "Sign in";
  }
});

async function showDashboard(user) {
  authCard.hidden = true;
  dashboard.hidden = false;
  dashboardTitle.textContent = `Welcome, ${user.name}`;
  dashboardIntro.textContent = `${user.email} · You are signed in to A4MP RAG Systems.`;
  try {
    await fetch("/api/dashboard", { credentials: "same-origin" });
  } catch (_) {}
}
document.querySelector("#logout-button").addEventListener("click", async () => {
  try {
    await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
    dashboard.hidden = true;
    authCard.hidden = false;
    form.reset();
    setMode("login");
  } catch (_) {
    dashboardIntro.textContent = "Could not sign out. Please try again.";
  }
});

(async function restoreSession() {
  try {
    const response = await fetch("/api/me", { credentials: "same-origin" });
    const data = await response.json();
    if (data.user) await showDashboard(data.user);
  } catch (_) {}
})();
