// Keys
const USER_KEY = "spt-user";

// DOM
const loginModal = document.getElementById("loginModal");
const openLoginBtn = document.getElementById("openLoginBtn");
const closeLoginBtn = document.getElementById("closeLoginBtn");
const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginAccountType = document.getElementById("loginAccountType");
const loginError = document.getElementById("loginError");
const loginSubmitBtn = document.getElementById("loginSubmitBtn");
const demoAccountBtn = document.getElementById("demoAccountBtn");
const demoLoginBtn = document.getElementById("demoLoginBtn");
const togglePassword = document.getElementById("togglePassword");
const openLoginButtons = document.querySelectorAll(".open-login");
const openDemoButtons = document.querySelectorAll(".open-demo");

// Modal open/close
function openLoginModal() {
  loginModal.classList.add("open");
  loginError.textContent = "";
  loginForm.reset();
}
function closeLoginModal() {
  loginModal.classList.remove("open");
}

openLoginBtn?.addEventListener("click", openLoginModal);
demoLoginBtn?.addEventListener("click", () => {
  openLoginModal();
  loginEmail.value = "student@smartplacement.com";
  loginPassword.value = "student123";
});
closeLoginBtn?.addEventListener("click", closeLoginModal);
openLoginButtons.forEach(btn => btn.addEventListener("click", openLoginModal));
openDemoButtons.forEach(btn => btn.addEventListener("click", () => {
  openLoginModal();
  loginEmail.value = "student@smartplacement.com";
  loginPassword.value = "student123";
}));

// Toggle password
togglePassword?.addEventListener("click", () => {
  const isPass = loginPassword.type === "password";
  loginPassword.type = isPass ? "text" : "password";
  togglePassword.textContent = isPass ? "Hide" : "Show";
});

// Demo login
demoAccountBtn?.addEventListener("click", () => {
  loginEmail.value = "student@smartplacement.com";
  loginPassword.value = "student123";
  loginAccountType.value = "student";
  performLogin("student@smartplacement.com", "student");
});

// Login submit
loginForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  loginError.textContent = "";
  const email = loginEmail.value.trim();
  const password = loginPassword.value.trim();
  const role = loginAccountType.value;

  if (!email || !password) {
    loginError.textContent = "Email and password are required.";
    return;
  }

  // Simple demo validation
  if (email !== "student@smartplacement.com" || password !== "student123") {
    loginError.textContent = "Invalid email or password. Use demo account if you don't have credentials.";
    return;
  }

  performLogin(email, role);
});

function performLogin(email, role) {
  loginSubmitBtn.disabled = true;
  loginSubmitBtn.textContent = "Logging in...";

  const user = {
    email,
    role,
    loggedIn: true,
    loginAt: new Date().toISOString()
  };

  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (err) {
    loginError.textContent = "Failed to save session. Please enable localStorage.";
    loginSubmitBtn.disabled = false;
    loginSubmitBtn.textContent = "Login";
    return;
  }

  // Small delay for UX
  setTimeout(() => {
    window.location.href = "dashborad.html";
  }, 400);
}

// Close modal on outside click
loginModal?.addEventListener("click", (e) => {
  if (e.target === loginModal) {
    closeLoginModal();
  }
});