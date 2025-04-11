import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// 🔥 Firebase Config (reuse your config)
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
