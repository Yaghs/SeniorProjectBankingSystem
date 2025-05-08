import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { deleteDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// 🔧 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBkidFMwM_jHr5i4D55EEr_anJlrwrNvrI",
  authDomain: "plottwistsp.firebaseapp.com",
  projectId: "plottwistsp",
  storageBucket: "plottwistsp.firebasestorage.app",
  messagingSenderId: "605014060151",
  appId: "1:605014060151:web:3e307d34e57d908fa8ea72"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ Navigation Click Handlers
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("aboutUs")?.addEventListener("click", () => window.location.href = "aboutUs.html");
  document.getElementById("communities")?.addEventListener("click", () => window.location.href = "myCommunities.html");
  document.getElementById("helpCenter")?.addEventListener("click", () => window.location.href = "helpCenter.html");
  document.getElementById("accountCenter")?.addEventListener("click", () => window.location.href = "accountCenter.html");
  document.getElementById("blockedUsers")?.addEventListener("click", () => window.location.href = "blockedUsersPage.html");
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



document.getElementById("logOut")?.addEventListener("click", function (e) {
  e.preventDefault();
  document.getElementById("signOutModal").style.display = "block";
});

document.getElementById("cancelSignOut")?.addEventListener("click", function () {
  document.getElementById("signOutModal").style.display = "none";
});

document.getElementById("confirmSignOut")?.addEventListener("click", function () {
  localStorage.clear(); // ✅ Clear user session
  window.location.replace("/login&create/index.html"); // ✅ Prevents back nav
});


document.addEventListener("click", function (e) {
  if (e.target.classList.contains("sign-out")) {
    e.preventDefault();
    localStorage.clear();
    window.location.replace("/login&create/index.html");
  }
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
// Handle Delete Account
document.getElementById("DeleteAccount")?.addEventListener("click", async function () {
  const confirmed = confirm("Are you sure you want to delete your account? This action is irreversible.");
  if (!confirmed) return;

  const username = localStorage.getItem("loggedInUser");
  if (!username) {
    alert("User not logged in.");
    return;
  }

  try {
    // Delete subcollections (e.g., genres)
    const genresSnap = await getDocs(collection(db, "users", username, "genres"));
    for (const genreDoc of genresSnap.docs) {
      await deleteDoc(doc(db, "users", username, "genres", genreDoc.id));
    }

    // Delete main user document
    await deleteDoc(doc(db, "users", username));

    // Clear local storage
    localStorage.removeItem("loggedInUser");

    alert("Your account has been deleted.");
    window.location.href = "../login&create/login&create.html";
  } catch (error) {
    console.error("Error deleting account:", error);
    alert("An error occurred while deleting your account. Please try again.");
  }
});

// Handle Delete Account
document.getElementById("DeleteAccount")?.addEventListener("click", async function () {
  const confirmed = confirm("Are you sure you want to delete your account? This action is irreversible.");
  if (!confirmed) return;

  const username = localStorage.getItem("loggedInUser");
  if (!username) {
    alert("User not logged in.");
    return;
  }

  try {
    const genresSnap = await getDocs(collection(db, "users", username, "genres"));
    for (const genreDoc of genresSnap.docs) {
      await deleteDoc(doc(db, "users", username, "genres", genreDoc.id));
    }

    // Delete main user document
    await deleteDoc(doc(db, "users", username));

    // Clear local storage
    localStorage.removeItem("loggedInUser");

    alert("Your account has been deleted.");
    window.location.href = "../login&create/index.html";
  } catch (error) {
    console.error("Error deleting account:", error);
    alert("An error occurred while deleting your account. Please try again.");
  }
});
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("sign-out")) {
    e.preventDefault();
    localStorage.clear();

    window.location.replace("/login&create/index.html");
  }
});