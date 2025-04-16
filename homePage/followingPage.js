import { db, addToCloseFriends, blockUser } from "../login&create/firebase.js";
import { getDoc, doc, collection, getDocs, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
    const currentUser = localStorage.getItem("loggedInUser");
    const listEl = document.getElementById("followingList");

    if (!currentUser) {
        alert("You must be logged in to view this page.");
        return;
    }

    listEl.innerHTML = "<li>Loading...</li>";
    const followingRef = collection(db, "users", currentUser, "following");
    const followingSnap = await getDocs(followingRef);
    const following = followingSnap.docs.map(doc => doc.id);

    try {
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
                    try {
                        // add to blocked subcollection
                        const blockedRef = doc(db, "users", currentUser, "blocked", targetUser);
                        await setDoc(blockedRef, {
                            blockedAt: Date.now()
                        });

                        // remove from currentUser's following
                        const followingRef = doc(db, "users", currentUser, "following", targetUser);
                        await deleteDoc(followingRef);

                        // remove currentUser from their followers (if exists)
                        const followersRef = doc(db, "users", targetUser, "followers", currentUser);
                        await deleteDoc(followersRef);

                        // decrement Following count on page
                        const followingCount = document.getElementById("FollowingCount");
                        if (followingCount) {
                            let count = parseInt(followingCount.textContent) || 0;
                            followingCount.textContent = Math.max(0, count - 1);
                        }

                        // remove from visual list
                        e.target.closest("li").remove();

                        alert(`${targetUser} has been blocked and unfollowed.`);
                    } catch (error) {
                        console.error(`Error blocking ${targetUser}:`, error);
                        alert(`Failed to block ${targetUser}.`);
                    }
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
