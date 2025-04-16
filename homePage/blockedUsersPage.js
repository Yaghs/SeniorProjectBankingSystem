import { db } from "../login&create/firebase.js";
import { collection, getDocs, deleteDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
    const currentUser = localStorage.getItem("loggedInUser");
    const listEl = document.getElementById("blockedUsersList");

    if (!currentUser) {
        alert("You must be logged in.");
        return;
    }

    try {
        const blockedRef = collection(db, "users", currentUser, "blocked");
        const blockedSnap = await getDocs(blockedRef);

        if (blockedSnap.empty) {
            listEl.innerHTML = "<li>You haven't blocked anyone.</li>";
            return;
        }

        listEl.innerHTML = "";

        for (const docSnap of blockedSnap.docs) {
            const username = docSnap.id;
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
                        <button class="action-btn unblock" data-user="${username}">Unblock</button>
                    </div>
                </div>
            `;
            listEl.appendChild(li);
        }

        listEl.addEventListener("click", async (e) => {
            if (e.target.classList.contains("unblock")) {
                const targetUser = e.target.dataset.user;
                await deleteDoc(doc(db, "users", currentUser, "blocked", targetUser));
                alert(`${targetUser} has been unblocked.`);
                location.reload();
            }
        });

    } catch (err) {
        console.error("Error loading blocked users:", err);
        listEl.innerHTML = "<li>Error loading list.</li>";
    }
});

