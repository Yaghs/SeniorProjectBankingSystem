import { db } from "../login&create/firebase.js";
import { getDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
    const currentUser = localStorage.getItem("loggedInUser");
    const listEl = document.getElementById("closeFriendsList");

    if (!currentUser) {
        alert("You must be logged in.");
        return;
    }

    try {
        const userDoc = await getDoc(doc(db, "users", currentUser));
        if (!userDoc.exists()) {
            listEl.innerHTML = "<li>User not found.</li>";
            return;
        }

        const closeFriends = userDoc.data().closeFriends || [];

        if (closeFriends.length === 0) {
            listEl.innerHTML = "<li>You haven't added any close friends yet.</li>";
            return;
        }

        listEl.innerHTML = "";

        for (const username of closeFriends) {
            const friendDoc = await getDoc(doc(db, "users", username));
            const friendData = friendDoc.exists() ? friendDoc.data() : null;
            const displayName = friendData ? `${friendData.firstName} ${friendData.lastName}`.trim() || username : username;

            const li = document.createElement("li");
            li.innerHTML = `
                <div class="user-row">
                    <div class="user-info">
                        <strong>${displayName}</strong> (@${username})
                    </div>
                    <div class="user-actions">
                        <button class="action-btn remove-friend" data-user="${username}">Remove</button>
                    </div>
                </div>
            `;
            listEl.appendChild(li);
        }

        // 💥 Attach listener AFTER buttons are created
        listEl.addEventListener("click", async (e) => {
            if (e.target.classList.contains("remove-friend")) {
                const targetUser = e.target.dataset.user;
                console.log("Removing from close friends:", targetUser);

                const userRef = doc(db, "users", currentUser);
                const userSnap = await getDoc(userRef);
                const data = userSnap.data();
                const updated = (data.closeFriends || []).filter(u => u !== targetUser);

                await setDoc(userRef, { closeFriends: updated }, { merge: true });

                alert(`${targetUser} removed from close friends.`);
                location.reload();
            }
        });
    } catch (err) {
        console.error("Error loading close friends:", err);
        listEl.innerHTML = "<li>Error loading list.</li>";
    }
});
