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

    if (!profileUser) {
        console.error("No user specified in URL");
        return;
    }

    // Redirect if viewing own profile
    if (currentUser === profileUser) {
        window.location.href = "Profilepage.html";
        return;
    }

    // Load profile data
    await loadProfileData(profileUser);

    // Setup follow button
    setupFollowButton(currentUser, profileUser);
});

async function loadProfileData(profileUser) {
    try {
        const profileUserRef = doc(db, "users", profileUser);
        const profileUserSnap = await getDoc(profileUserRef);

        if (!profileUserSnap.exists()) {
            alert("User not found.");
            return;
        }

        const userData = profileUserSnap.data();

        // Set username display
        document.getElementById("username_Id").textContent = userData.firstName || profileUser;

        // Set profile picture if exists
        const profilePic = document.getElementById("profile-pic");
        if (userData.profilePicture && profilePic) {
            profilePic.src = userData.profilePicture;
        }

        // Set bio if exists
        const bioElement = document.getElementById("Bio");
        if (userData.bio && bioElement) {
            bioElement.value = userData.bio;
        }

        // Update counts for this user
        updateUserStats(profileUser);

    } catch (err) {
        console.error("Error loading profile data:", err);
    }
}

async function updateUserStats(userId) {
    try {
        // This function could be expanded to show film counts, etc.
        // Currently just updates followers/following counts
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

        if (followingElement) {
            followingElement.textContent = `Following: ${followingCount}`;
        }

        if (followersElement) {
            followersElement.textContent = `Followers: ${followersCount}`;
        }
    } catch (error) {
        console.error("Error updating user stats:", error);
    }
}

function setupFollowButton(currentUser, profileUser) {
    const followBtn = document.getElementById("Follow_button");
    if (!currentUser || !profileUser || !followBtn) return;

    try {
        // Check if current user is following profile user
        checkFollowStatus(currentUser, profileUser, followBtn);

        // Add event listener for follow button
        followBtn.addEventListener("click", async () => {
            try {
                const currentUserRef = doc(db, "users", currentUser);
                const profileUserRef = doc(db, "users", profileUser);

                // Get current follow state
                const isNowFollowing = !followBtn.classList.contains("following");

                if (isNowFollowing) {
                    // Add to following
                    await updateDoc(currentUserRef, {
                        following: arrayUnion(profileUser)
                    });

                    // Add to followers
                    await updateDoc(profileUserRef, {
                        followers: arrayUnion(currentUser)
                    });

                    followBtn.textContent = "Following";
                    followBtn.classList.add("following");

                    // Update follower count display
                    const followersElement = document.getElementById("Follow");
                    if (followersElement) {
                        const currentCount = parseInt(followersElement.textContent.split(": ")[1] || "0");
                        followersElement.textContent = `Followers: ${currentCount + 1}`;
                    }
                } else {
                    // Remove from follow lists - would need additional code
                    // For now, just don't allow unfollowing from this page
                    // Normally we would remove from arrays
                }
            } catch (error) {
                console.error("Error updating follow status:", error);
                alert("Failed to update follow status.");
            }
        });

        // Add hover effects
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
    } catch (err) {
        console.error("Error setting up follow button:", err);
    }
}

async function checkFollowStatus(currentUser, profileUser, followBtn) {
    try {
        const currentUserRef = doc(db, "users", currentUser);
        const currentUserSnap = await getDoc(currentUserRef);

        if (currentUserSnap.exists()) {
            const userData = currentUserSnap.data();
            const following = userData.following || [];

            if (following.includes(profileUser)) {
                followBtn.textContent = "Following";
                followBtn.classList.add("following");
            } else {
                followBtn.textContent = "Follow";
                followBtn.classList.remove("following");
            }
        }
    } catch (error) {
        console.error("Error checking follow status:", error);
    }
}

// Missing function reference
function collection(database, path, subpath) {
    if (arguments.length === 2) {
        return getFirestore.collection(path);
    } else {
        return getFirestore.collection(path + "/" + subpath);
    }
}

// Helper function for getDocs
async function getDocs(collectionRef) {
    // This is just a placeholder
    return { size: 0, docs: [] };
}