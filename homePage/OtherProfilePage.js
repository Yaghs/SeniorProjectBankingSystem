import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    arrayUnion
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";

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

document.addEventListener("DOMContentLoaded", async () => {
    const currentUser = localStorage.getItem("loggedInUser");
    const urlParams = new URLSearchParams(window.location.search);
    const profileUser = urlParams.get("user");

    const followBtn = document.getElementById("Follow_button");

    if (!currentUser || !profileUser || !followBtn) return;

    // Set username display
    document.getElementById("username_Id").textContent = profileUser;

    try {
        const currentUserRef = doc(db, "users", currentUser);
        const profileUserRef = doc(db, "users", profileUser);

        const currentUserSnap = await getDoc(currentUserRef);
        const profileUserSnap = await getDoc(profileUserRef);

        if (!currentUserSnap.exists() || !profileUserSnap.exists()) {
            alert("User not found.");
            return;
        }

        const { following = [], blocked = [] } = currentUserSnap.data();


        if (blocked.includes(profileUser)) {
            followBtn.style.display = "none";
            return;
        }


        if (following.includes(profileUser)) {
            followBtn.textContent = "Following";
            followBtn.disabled = true;
        } else {
            followBtn.addEventListener("click", async () => {
                await updateDoc(currentUserRef, {
                    following: arrayUnion(profileUser)
                });
                await updateDoc(profileUserRef, {
                    followers: arrayUnion(currentUser)
                });
                followBtn.textContent = "Following";
                followBtn.disabled = true;
            });
        }

    } catch (err) {
        console.error("OtherProfilePage error:", err);
        alert("Failed to load profile.");
    }
});

