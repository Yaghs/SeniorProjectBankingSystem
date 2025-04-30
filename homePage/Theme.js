import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// 🔥 Firebase Config (reuse your config)
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

// ⚡ Load and apply user theme
(async function () {
    const username = localStorage.getItem("loggedInUser");
    if (!username) return;

    try {
        const userRef = doc(db, "users", username);
        const userSnap = await getDoc(userRef);

        let theme = "light";
        if (userSnap.exists() && userSnap.data().theme === "dark") {
            theme = "dark";
        }

        document.body.classList.remove("light-mode", "dark-mode");
        document.body.classList.add(`${theme}-mode`);
    } catch (err) {
        console.error("Theme load failed:", err);
    }
})();
