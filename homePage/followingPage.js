import { db, addToCloseFriends, blockUser, getFollowingList } from "../login&create/firebase.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
    const currentUser = localStorage.getItem("loggedInUser");
    const listEl = document.getElementById("followingList");

    if (!currentUser) {
        alert("You must be logged in to view this page.");
        return;
    }

    listEl.innerHTML = "<li>Loading...</li>";

    try {
        const following = await getFollowingList(currentUser);
        const userRef = doc(db, "users", currentUser);
        const userSnap = await getDoc(userRef);
        const closeFriends = userSnap.exists() ? userSnap.data().closeFriends || [] : [];

        if (following.length === 0) {
            listEl.innerHTML = "<li>You aren't following anyone yet.</li>";
            return;
        }

        listEl.innerHTML = "";

        for (const username of following) {
            const userDoc = await getDoc(doc(db, "users", username));
            const data = userDoc.exists() ? userDoc.data() : null;
            const displayName = data
                ? `${data.firstName} ${data.lastName}`.trim() || username
                : username;

            const isCloseFriend = closeFriends.includes(username);

            const li = document.createElement("li");
            li.innerHTML = `
                <div class="user-row">
                    <div class="user-info">
                        <strong>${displayName}</strong> (@${username})
                    </div>
                    <div class="user-actions">
                        ${!isCloseFriend
                ? `<button class="action-btn" data-user="${username}" data-action="closeFriend">+ Close Friend</button>`
                : ""}
                        <button class="action-btn" data-user="${username}" data-action="block">🚫 Block</button>
                    </div>
                </div>
            `;
            listEl.appendChild(li);
        }

        // Button logic
        listEl.addEventListener("click", async (e) => {
            if (!e.target.classList.contains("action-btn")) return;

            const action = e.target.dataset.action;
            const targetUser = e.target.dataset.user;

            if (!action || !targetUser) return;

            try {
                if (action === "closeFriend") {
                    await addToCloseFriends(currentUser, targetUser);
                    e.target.remove(); // Remove button after adding
                    alert(`${targetUser} added to close friends.`);
                }

                if (action === "block") {
                    await blockUser(currentUser, targetUser);

                    //  Decrement Following count
                    const countEl = document.getElementById("followingCountNum");
                    if (countEl) {
                        let count = parseInt(countEl.textContent) || 0;
                        countEl.textContent = Math.max(0, count - 1);
                    }

                    // Remove user from list
                    e.target.closest("li").remove();

                    alert(`${targetUser} has been blocked and unfollowed.`);
                }

            } catch (err) {
                console.error(`Error performing ${action} on ${targetUser}:`, err);
                alert(`Failed to ${action} ${targetUser}.`);
            }
        });

    } catch (err) {
        console.error("Error loading following list:", err);
        listEl.innerHTML = "<li>Failed to load following list.</li>";
    }
});








