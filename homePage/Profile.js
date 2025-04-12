
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { db } from "../login&create/firebase.js"; // Adjust the path as needed

document.addEventListener("DOMContentLoaded", async () => {
    const currentUser = localStorage.getItem("loggedInUser");
    const profileUsername = document.getElementById("username_Id")?.textContent.trim();

    if (!currentUser || !profileUsername) return;

    // 🔒 Blocked User Protection: Redirect if blocked
    if (currentUser !== profileUsername) {
        try {
            const profileDoc = await getDoc(doc(db, "users", profileUsername));
            if (profileDoc.exists()) {
                const blockedList = profileDoc.data().blocked || [];
                if (blockedList.includes(currentUser)) {
                    alert("You are blocked by this user.");
                    window.location.href = "homePage.html"; // Redirect if blocked
                    return;
                }
            }
        } catch (err) {
            console.error("Error checking block status:", err);
        }
    }

    // ✅ FOLLOW BUTTON LOGIC
    const followBtn = document.getElementById("followBtn");
    if (!followBtn) return;

    followBtn.addEventListener("click", async () => {
        const followedUser = profileUsername;
        if (!followedUser) {
            console.error("No user to follow found");
            return;
        }

        if (currentUser === followedUser) {
            alert("You cannot follow yourself.");
            return;
        }

        try {
            const userRef = doc(db, "users", currentUser);
            const userSnap = await getDoc(userRef);

            let followingArray = [];
            if (userSnap.exists()) {
                followingArray = userSnap.data().following || [];
            }

            if (followingArray.includes(followedUser)) {
                alert(`You are already following ${followedUser}.`);
            } else {
                followingArray.push(followedUser);
                await setDoc(userRef, { following: followingArray }, { merge: true });
                alert(`Now following ${followedUser}.`);

                const followingCountNum = document.getElementById("followingCountNum");
                if (followingCountNum) {
                    let count = parseInt(followingCountNum.textContent) || 0;
                    followingCountNum.textContent = count + 1;
                }
            }
        } catch (error) {
            console.error("Error updating follow status:", error);
            alert("There was an error following the user. Please try again.");
        }
    });
});







