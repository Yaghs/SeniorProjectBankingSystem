import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs,
    orderBy,
    addDoc,
    serverTimestamp,
    query,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// initialize firebase
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

// on page load
document.addEventListener("DOMContentLoaded", async () => {
    const currentUser = localStorage.getItem("loggedInUser");
    const urlParams = new URLSearchParams(window.location.search);
    const profileUser = urlParams.get("user");

    if (!profileUser) {
        console.error("No user specified in URL");
        return;
    }

    if (currentUser === profileUser) {
        window.location.href = "Profilepage.html";
        return;
    }

    await loadProfileData(profileUser);
    setupFollowButton(currentUser, profileUser);
});

// load profile data (bio, picture, username)
async function loadProfileData(profileUser) {
    try {
        const profileUserRef = doc(db, "users", profileUser);
        const profileUserSnap = await getDoc(profileUserRef);

        if (!profileUserSnap.exists()) {
            alert("User not found.");
            return;
        }

        const userData = profileUserSnap.data();

        const usernameElement = document.getElementById("username_Id");
        const profilePicElement = document.getElementById("profile-pic");
        const bioElement = document.getElementById("bioDisplayText");

        if (usernameElement) usernameElement.textContent = userData.firstName || profileUser;
        if (profilePicElement && userData.profilePicture) profilePicElement.src = userData.profilePicture;
        if (bioElement) bioElement.textContent = userData.bio || "No bio available yet.";

        await updateUserStats(profileUser);
    } catch (error) {
        console.error("Error loading profile data:", error);
    }
}

// update followers/following counts
async function updateUserStats(userId) {
    try {
        const followingRef = collection(db, "users", userId, "following");
        const followersRef = collection(db, "users", userId, "followers");

        const [followingSnap, followersSnap] = await Promise.all([
            getDocs(followingRef),
            getDocs(followersRef)
        ]);

        const followingCount = followingSnap.size;
        const followersCount = followersSnap.size;

        const followingElement = document.getElementById("Following");
        const followersElement = document.getElementById("Follow");

        if (followingElement) followingElement.textContent = `Following: ${followingCount}`;
        if (followersElement) followersElement.textContent = `Followers: ${followersCount}`;
    } catch (error) {
        console.error("Error updating user stats:", error);
    }
}

// setup follow button (initial state + logic)
function setupFollowButton(currentUser, profileUser) {
  const followBtn = document.getElementById("Follow_button");
  if (!currentUser || !profileUser || !followBtn) return;

  checkFollowStatus(currentUser, profileUser, followBtn);

  followBtn.addEventListener("click", async () => {
    try {
      const currentUserRef = doc(
        db,
        "users",
        currentUser,
        "following",
        profileUser
      );
      const profileUserRef = doc(
        db,
        "users",
        profileUser,
        "followers",
        currentUser
      );

      const isFollowing = followBtn.classList.contains("following");

      if (!isFollowing) {
        // 1️⃣ existing follow logic
        await setDoc(currentUserRef, { followedAt: Date.now() });
        await setDoc(profileUserRef, { followedAt: Date.now() });

        // 2️⃣ NEW: push a notification into profileUser’s notifications
        await addDoc(
          collection(db, "users", profileUser, "notifications"),
          {
            type: "new_follower",
            message: `${currentUser} started following you.`,
            createdAt: serverTimestamp(),
            read: false
          }
        );

        followBtn.textContent = "Following";
        followBtn.classList.add("following");
      }

      // Update follower count
      await updateUserStats(profileUser);
    } catch (error) {
      console.error("Error updating follow status:", error);
      alert("Failed to update follow status.");
    }
  });

  // hover effects
  followBtn.addEventListener("mouseenter", () => {
    if (followBtn.classList.contains("following")) {
      followBtn.textContent = "Unfollow";
    }
  });
  followBtn.addEventListener("mouseleave", () => {
    if (followBtn.classList.contains("following")) {
      followBtn.textContent = "Following";
    }
  });
}

// check if user is already following
async function checkFollowStatus(currentUser, profileUser, followBtn) {
    try {
        const followingDocRef = doc(db, "users", currentUser, "following", profileUser);
        const followingDocSnap = await getDoc(followingDocRef);

        if (followingDocSnap.exists()) {
            followBtn.textContent = "Following";
            followBtn.classList.add("following");
        } else {
            followBtn.textContent = "Follow";
            followBtn.classList.remove("following");
        }
    } catch (error) {
        console.error("Error checking follow status:", error);
    }
}
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