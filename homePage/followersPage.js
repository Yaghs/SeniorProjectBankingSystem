import { db } from "../login&create/firebase.js";
import { getDoc, doc, collection, getDocs, deleteDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
    const currentUser = localStorage.getItem("loggedInUser");
    const listEl = document.getElementById("followersList");

    if (!currentUser) {
        alert("You must be logged in to view this page.");
        return;
    }

    listEl.innerHTML = "<li>Loading...</li>";
    const followersRef = collection(db, "users", currentUser, "followers");
    const followersSnap = await getDocs(followersRef);
    const followers = followersSnap.docs.map(doc => doc.id);

    if (followers.length === 0) {
        listEl.innerHTML = "<li>No one is following you yet.</li>";
        return;
    }

    listEl.innerHTML = "";
    // fetch the list of users you're currently following
    const followingSnap = await getDocs(collection(db, "users", currentUser, "following"));
    const following = followingSnap.docs.map(doc => doc.id);
    // get the list of users you've blocked
    const blockedSnap = await getDocs(collection(db, "users", currentUser, "blocked"));
    const blockedUsers = blockedSnap.docs.map(doc => doc.id);


    for (const username of followers) {
        const userDoc = await getDoc(doc(db, "users", username));
        if (blockedUsers.includes(username)) continue; // skip blocked users
        const data = userDoc.exists() ? userDoc.data() : null;
        const displayName = data
            ? `${data.firstName} ${data.lastName}`.trim() || username
            : username;

        const li = document.createElement("li");
        li.innerHTML = `
            <div class="user-row">
                <div class="user-info">
                    <strong>${displayName}</strong> (@${username})
                </div>
                <div class="user-actions">
                    ${!following.includes(username) ? `<button class="action-btn" data-user="${username}" data-action="follow"><i class='bx bx-user-plus'></i> Follow Back</button>` : ""}
                    <button class="action-btn" data-user="${username}" data-action="block"><i class='bx bx-block'></i> Block</button>
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
            if (action === "follow") {
                const followingRef = doc(db, "users", currentUser, "following", targetUser);
                const followersRef = doc(db, "users", targetUser, "followers", currentUser);

                // Add them to your following
                await setDoc(followingRef, {
                    followedAt: Date.now()
                });

                // Add yourself to their followers
                await setDoc(followersRef, {
                    followedAt: Date.now()
                });

                alert(`You're now following ${targetUser}.`);
                e.target.remove(); // remove the follow back button
            }
            if (action === "block") {
                const blockedRef = doc(db, "users", currentUser, "blocked", targetUser);
                await setDoc(blockedRef, {
                    blockedAt: Date.now()
                });

                // remove them from your followers
                const followersRef = doc(db, "users", currentUser, "followers", targetUser);
                await deleteDoc(followersRef);

                // remove you from their following
                const theirFollowingRef = doc(db, "users", targetUser, "following", currentUser);
                await deleteDoc(theirFollowingRef);

                // update count
                const followersCount = document.getElementById("FollowersCount");
                if (followersCount) {
                    let count = parseInt(followersCount.textContent) || 0;
                    followersCount.textContent = Math.max(0, count - 1);
                }

                // update UI
                e.target.closest("li").remove();

                alert(`${targetUser} has been blocked and removed from your followers.`);
            }
        } catch (err) {
            console.error(`Error blocking ${targetUser}:`, err);
            alert(`Failed to block ${targetUser}.`);
        }
    });
});
