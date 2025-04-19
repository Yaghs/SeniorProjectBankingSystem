// OtherProfilePage.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {getFirestore, doc, getDoc, collection, getDocs, query, orderBy, limit, setDoc, deleteDoc} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const Follow = document.getElementById('Follow');
const Follow_button = document.getElementById('Follow_button');
// Handle follow button click
Follow_button.addEventListener('click', async function () {
    const currentUser = localStorage.getItem("loggedInUser");
    const targetUser = getQueryParam("user");

    if (!currentUser || !targetUser) return;

    const isNowFollowing = !Follow_button.classList.contains("following");

    const followingRef = doc(db, "users", currentUser, "following", targetUser);
    const followerRef = doc(db, "users", targetUser, "followers", currentUser);

    try {
        if (isNowFollowing) {
            await Promise.all([
                setDoc(followingRef, { username: targetUser })
                    .then(() => console.log("following doc saved")),
                setDoc(followerRef, { username: currentUser })
                    .then(() => console.log("follower doc saved"))
            ]);

            Follow_button.classList.add("following");
            Follow_button.textContent = "Following";
            updateFollowerCount(1);
            console.log("Saving to:", `users/${currentUser}/following/${targetUser}`);

        } else {
            await Promise.all([
                deleteDoc(followingRef),
                deleteDoc(followerRef)
            ]);

            Follow_button.classList.remove("following");
            Follow_button.textContent = "Follow";
            updateFollowerCount(-1);
        }
    } catch (error) {
        console.error("error updating follow status:", error);
    }
});

// hover effect for unfollowing
Follow_button.addEventListener('mouseenter', () => {
    if (Follow_button.classList.contains("following")) {
        Follow_button.textContent = "Unfollow";
    }
});
Follow_button.addEventListener('mouseleave', () => {
    if (Follow_button.classList.contains("following")) {
        Follow_button.textContent = "Following";
    }
});

// checks if current user is following target user
async function checkIfFollowing(currentUser, targetUser) {
    const followRef = doc(db, "users", currentUser, "following", targetUser);

    try {
        const followSnap = await getDoc(followRef);
        if (followSnap.exists()) {
            Follow_button.classList.add("following");
            Follow_button.textContent = "Following";
        } else {
            Follow_button.classList.remove("following");
            Follow_button.textContent = "Follow";
        }
    } catch (error) {
        console.error("error checking follow status:", error);
    }
}

// count followers of the target user
async function updateFollowerCountDisplay(targetUser) {
    try {
        let followerCount = 0;

        // Get all user documents (to check who has this user in their 'following' list)
        const usersCollection = collection(db, "users");
        const usersSnap = await getDocs(usersCollection);

        for (const userDoc of usersSnap.docs) {
            const followingRef = doc(db, "users", userDoc.id, "following", targetUser);
            const followingSnap = await getDoc(followingRef);
            if (followingSnap.exists()) {
                followerCount++;
            }
        }

        const followerText = document.getElementById("Follow");
        if (followerText) {
            followerText.textContent = `Followers: ${followerCount}`;
        }

    } catch (error) {
        console.error("Error counting followers:", error);
    }
}

async function updateFollowingCountDisplay(targetUser) {
    try {
        const followingRef = collection(db, "users", targetUser, "following");
        const followingSnap = await getDocs(followingRef);
        const count = followingSnap.size;

        const followingText = document.getElementById("Following");
        if (followingText) {
            followingText.textContent = `Following: ${count}`;
        }
    } catch (error) {
        console.error("Error counting following:", error);
    }
}

// update followers count visually
function updateFollowerCount(change) {
    const followerElement = document.getElementById("Follow");
    if (!followerElement) return;

    let currentCount = parseInt(followerElement.textContent.split(": ")[1] || "0");
    currentCount += change;
    followerElement.textContent = `Followers: ${currentCount}`;
}


function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

async function loadOtherUserProfile() {
    const userId = getQueryParam("user");
    if (!userId) return;

    // Redirect if viewing own profile
    const currentUser = localStorage.getItem("loggedInUser");
    if (currentUser === userId) {
        window.location.href = "Profilepage.html";
        return;
    }

    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();

            // Set username
            document.getElementById("username_Id").textContent = userData.firstName || userId;

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

            // Load favorite movies and reviews
            loadFavoriteMovies(userId);
            loadRecentReviews(userId);
        } else {
            console.error("User not found in Firestore.");
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
}

async function loadFavoriteMovies(userID) {
    try {
        const userMoviesRef = collection(db, "users", userID, "favorite_movies");
        const querySnapshot = await getDocs(userMoviesRef);

        const favoriteGrid = document.querySelector(".favorite-grid");
        if (!favoriteGrid) {
            console.error("Favorite grid not found in HTML.");
            return;
        }

        if (querySnapshot.empty) {
            console.log("No favorite movies found for this user.");
            favoriteGrid.style.opacity = "1";
            return;
        }

        querySnapshot.forEach(docSnap => {
            const movieData = docSnap.data();
            const placeholder = document.querySelector(`.fav-placeholder[data-index="${movieData.index}"]`);

            if (placeholder) {
                placeholder.innerHTML = `<img src="${movieData.poster}" width="180px" height="270px" style="border-radius:10px;">`;
                placeholder.setAttribute("data-title", movieData.title);

                // remove existing listeners and attach new one
                const newPlaceholder = placeholder.cloneNode(true);
                placeholder.parentNode.replaceChild(newPlaceholder, placeholder);

                newPlaceholder.addEventListener("click", async () => {
                    try {
                        const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=bc7c4e7c62d9e223e196bbd15978fc51&query=${encodeURIComponent(movieData.title)}`);
                        const data = await response.json();

                        // match title and year if possible
                        const matchedMovie = data.results.find(
                            m => m.title === movieData.title && m.release_date?.includes(movieData.year)
                        ) || data.results[0]; // fallback

                        if (!matchedMovie || !matchedMovie.id) {
                            alert("Failed to load movie details.");
                            return;
                        }

                        localStorage.setItem("selectedMovie", JSON.stringify(matchedMovie));
                        window.location.href = "moviePage.html";
                    } catch (error) {
                        console.error("Error fetching TMDB movie:", error);
                        alert("Could not load movie details.");
                    }
                });
            }
        });

        favoriteGrid.style.opacity = "1";
        console.log("Favorite movies loaded successfully!");
    } catch (error) {
        console.error("Error loading favorite movies:", error);
    }
}

function setupDMButton() {
    const dmButton = document.querySelector(".dm");
    if (!dmButton) return;

    dmButton.addEventListener("click", () => {
        // Get the username from URL parameter
        const targetUser = getQueryParam("user");

        if (!targetUser) {
            console.error("No target user found for DM");
            return;
        }

        // Redirect to hub.html with username parameter
        window.location.href = `hub.html?user=${targetUser}`;
    });
}

// Call this function when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    // Your existing code...

    // Setup DM button
    setupDMButton();
});


async function loadRecentReviews(userID) {
    const reviewsRef = collection(db, "users", userID, "reviews");
    const recentQuery = query(reviewsRef, orderBy("timestamp", "desc"), limit(6));

    try {
        const querySnapshot = await getDocs(recentQuery);
        const recentReviewsContainer = document.getElementById("recentReviewsContainer");
        if (!recentReviewsContainer) {
            console.error("Missing recentReviewsContainer in HTML");
            return;
        }

        recentReviewsContainer.innerHTML = "";

        querySnapshot.forEach(docSnap => {
            const reviewData = docSnap.data();

            const reviewCard = document.createElement("div");
            reviewCard.classList.add("review-card");

            let starsHtml = "";
            const fullStars = Math.floor(reviewData.rating);
            const halfStar = reviewData.rating % 1 !== 0;

            for (let i = 0; i < fullStars; i++) {
                starsHtml += "<i class='bx bxs-star'></i>";
            }
            if (halfStar) {
                starsHtml += "<i class='bx bxs-star-half'></i>";
            }

            reviewCard.innerHTML = `
                <img src="${reviewData.selectedPoster || 'https://via.placeholder.com/120x180?text=No+Image'}" alt="${reviewData.title}">
                <div class="review-icons">
                    <div class="rating">${starsHtml}</div>
                    ${reviewData.liked ? "<i class='bx bxs-heart'></i>" : ""}
                    ${reviewData.watchedBefore ? "<i class='bx bxs-show'></i>" : ""}
                    ${reviewData.reviewText ? "<i class='bx bxs-comment-detail'></i>" : ""}
                </div>
            `;

            recentReviewsContainer.appendChild(reviewCard);
        });
    } catch (error) {
        console.error("Error fetching recent reviews:", error);
    }
}

document.addEventListener("DOMContentLoaded", loadOtherUserProfile);


document.addEventListener("DOMContentLoaded", async () => {
    const currentUser = localStorage.getItem("loggedInUser");
    const targetUser = getQueryParam("user");

    if (!currentUser || !targetUser) return;

    await checkIfFollowing(currentUser, targetUser);
    await updateFollowerCountDisplay(targetUser);
    await updateFollowingCountDisplay(targetUser);
});