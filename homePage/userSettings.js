import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";

// 🔧 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyD1LpIBMmZAiQFwberKbx2G29t6fNph3Xg",
  authDomain: "sample-dc6d0.firebaseapp.com",
  projectId: "sample-dc6d0",
  storageBucket: "sample-dc6d0.appspot.com",
  messagingSenderId: "650782048731",
  appId: "1:650782048731:web:d2828c5b87f0a4e62367fe",
  measurementId: "G-WJMEY6J7BR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ Navigation Click Handlers
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("aboutUs")?.addEventListener("click", () => window.location.href = "aboutUs.html");
  document.getElementById("communities")?.addEventListener("click", () => window.location.href = "myCommunities.html");
  document.getElementById("helpCenter")?.addEventListener("click", () => window.location.href = "helpCenter.html");
  document.getElementById("accountCenter")?.addEventListener("click", () => window.location.href = "accountCenter.html");
  document.getElementById("notifications")?.addEventListener("click", () => window.location.href = "userNotificationSettings.html");
});

// ✅ Save Settings Form
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("settingsForm");
  const messageEl = document.getElementById("message");
  const usernameInput = document.getElementById("username");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const notificationsInput = document.getElementById("notifications");

  const savedSettings = JSON.parse(localStorage.getItem("userSettings"));
  if (savedSettings) {
    usernameInput.value = savedSettings.username || "";
    emailInput.value = savedSettings.email || "";
    notificationsInput.checked = savedSettings.notifications || false;
  }

  form?.addEventListener("submit", function (e) {
    e.preventDefault();

    const settings = {
      username: usernameInput.value,
      email: emailInput.value,
      password: passwordInput.value,
      notifications: notificationsInput.checked
    };

    localStorage.setItem("userSettings", JSON.stringify(settings));
    messageEl.textContent = "Settings saved successfully!";
    messageEl.style.color = "green";
    passwordInput.value = "";
  });
});


document.getElementById('logOut')?.addEventListener('click', function (e) {
  e.preventDefault();
  document.getElementById('signOutModal').style.display = 'block';
});

document.getElementById('cancelSignOut')?.addEventListener('click', function () {
  document.getElementById('signOutModal').style.display = 'none';
});

document.getElementById('confirmSignOut')?.addEventListener('click', function () {
  window.location.href = "../login%26create/login%26create.html";
});


(async function () {
  const toggle = document.getElementById("modeToggle");
  const username = localStorage.getItem("loggedInUser");

  console.log("Toggle found:", toggle);
  console.log("Logged-in user:", username);

  if (!toggle || !username) return;

  const userRef = doc(db, "users", username);
  const userSnap = await getDoc(userRef);

  let theme = "light";

  if (userSnap.exists()) {
    console.log("User doc exists in Firestore");
    theme = userSnap.data().theme || "light";
    console.log("Theme loaded from Firestore:", theme);
  } else {
    console.log("User doc not found in Firestore.");
  }

  applyTheme(theme);
  toggle.checked = (theme === "dark");

  toggle.addEventListener("change", async () => {
    const newTheme = toggle.checked ? "dark" : "light";
    applyTheme(newTheme);
    console.log("Saving new theme:", newTheme);
    await setDoc(userRef, { theme: newTheme }, { merge: true });
  });

  function applyTheme(theme) {
    document.body.classList.remove("light-mode", "dark-mode");
    document.body.classList.add(`${theme}-mode`);
    console.log("Applied theme:", theme);
  }
})();

