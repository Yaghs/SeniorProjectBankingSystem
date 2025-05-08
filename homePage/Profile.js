
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    onSnapshot,
    orderBy,
    updateDoc,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

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
document.addEventListener("DOMContentLoaded", function () {
    const notificationBell = document.getElementById("notificationBell");
    const currentUser = localStorage.getItem("loggedInUser");
    if (!currentUser) return;

    let latestNotifications = [];
    const notifQ = query(
        collection(db, "users", currentUser, "notifications"),
        orderBy("createdAt", "desc")
    );
    onSnapshot(notifQ, snapshot => {
        latestNotifications = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        updateBellBadge(latestNotifications.filter(n => !n.read).length);
        if (document.getElementById("notificationBox")?.style.display !== "none") {
            renderNotifications();
        }
    });

    if (notificationBell) {
        notificationBell.addEventListener("click", async function (event) {
            event.stopPropagation();

            const bellRect = notificationBell.getBoundingClientRect();
            let notificationBox = document.getElementById("notificationBox");

            if (!notificationBox) {
                notificationBox = document.createElement("div");
                notificationBox.id = "notificationBox";
                notificationBox.className = "notification-box";
                notificationBox.innerHTML = `
                    <div class="notification-box-header" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #444;">
                        <span style="font-size: 18px; color: white;">Notifications</span>
                        <i class='bx bx-cog' id="notificationSettings" style="font-size: 18px; cursor: pointer; color: white;"></i>
                    </div>
                    <div class="notification-box-content" style="padding: 10px; color: white;">
                        <p>No new notifications.</p>
                    </div>
                `;
                notificationBox.style.position = "fixed";  // ← FIXED instead of absolute
                notificationBox.style.top = bellRect.bottom + "px";
                notificationBox.style.right = (window.innerWidth - bellRect.right) + "px";
                notificationBox.style.backgroundColor = "#000";
                notificationBox.style.width = "300px";
                notificationBox.style.border = "1px solid #444";
                notificationBox.style.borderRadius = "5px";
                notificationBox.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
                notificationBox.style.zIndex = 100;
                document.body.appendChild(notificationBox);

                const notificationSettings = notificationBox.querySelector("#notificationSettings");
                if (notificationSettings) {
                    notificationSettings.addEventListener("click", function (event) {
                        event.stopPropagation();
                        window.location.href = "userNotificationSettings.html";
                    });
                }

                renderNotifications();
                updateBellBadge(0);
                const unread1 = latestNotifications.filter(n => !n.read);
                await Promise.all(unread1.map(n =>
                    updateDoc(doc(db, "users", currentUser, "notifications", n.id), { read: true })
                ));
            } else {
                if (notificationBox.style.display === "none" || notificationBox.style.display === "") {
                    const newBellRect = notificationBell.getBoundingClientRect();
                    notificationBox.style.top = newBellRect.bottom + "px";
                    notificationBox.style.right = (window.innerWidth - newBellRect.right) + "px";
                    notificationBox.style.display = "block";

                    renderNotifications();
                    updateBellBadge(0);
                    const unread2 = latestNotifications.filter(n => !n.read);
                    await Promise.all(unread2.map(n =>
                        updateDoc(doc(db, "users", currentUser, "notifications", n.id), { read: true })
                    ));
                } else {
                    notificationBox.style.display = "none";
                }
            }
        });
    }

    function timeAgo(date) {
        const now = Date.now();
        const diffMs = now - date.getTime();
        const sec = Math.floor(diffMs / 1000);
        if (sec < 60) return `${sec}s ago`;
        const min = Math.floor(sec / 60);
        if (min < 60) return `${min}m ago`;
        const hr = Math.floor(min / 60);
        if (hr < 24) return `${hr}h ago`;
        const days = Math.floor(hr / 24);
        return `${days}d ago`;
    }

    function renderNotifications() {
        const content = document.querySelector(".notification-box-content");
        if (!content) return;

        if (latestNotifications.length === 0) {
            content.innerHTML = `<p>No new notifications.</p>`;
        } else {
            content.innerHTML = latestNotifications
                .map(n => {
                    const dateObj = n.createdAt?.toDate?.() || new Date();
                    const ago = timeAgo(dateObj);
                    return `
                      <div class="notification-item" style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 1px solid #444;
                        padding: 8px 0;
                        margin: 4px 0;
                      ">
                        <span>${n.message}</span>
                        <span style="
                          font-size: 12px;
                          color: #888;
                          margin-left: 8px;
                          white-space: nowrap;
                        ">${ago}</span>
                      </div>
                    `;
                })
                .join("");
        }
    }

    function updateBellBadge(count) {
        let badge = document.getElementById("notif-badge");

        if (count > 0) {
            notificationBell.style.position = 'relative';

            if (!badge) {
                badge = document.createElement("span");
                badge.id = "notif-badge";
                badge.className = "notification-badge";

                Object.assign(badge.style, {
                    position: 'absolute',
                    top: '0',
                    right: '0',
                    transform: 'translate(50%, -50%)',
                    backgroundColor: 'red',
                    color: 'white',
                    borderRadius: '50%',
                    padding: '2px 6px',
                    fontSize: '16px',
                    lineHeight: '1',
                    textAlign: 'center',
                    minWidth: '6px'
                });

                notificationBell.appendChild(badge);
            }
            badge.textContent = count;
        } else if (badge) {
            badge.remove();
        }
    }
});
document.addEventListener("click", function (e) {
    if (e.target.classList.contains("sign-out")) {
        e.preventDefault();
        localStorage.clear();
        window.location.replace("/login&create/index.html");
    }
});







