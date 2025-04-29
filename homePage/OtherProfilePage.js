import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// initialize firebase
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
