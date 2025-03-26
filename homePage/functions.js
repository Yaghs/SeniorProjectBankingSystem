
// OtherProfilePage.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {getFirestore, doc, getDoc, collection, getDocs, query, orderBy, limit} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
Follow_button.addEventListener('click', function () {
    let current_Follower = parseInt(Follow.textContent.split(": ")[1]);

    const isNowFollowing = !Follow_button.classList.contains("following");

    if (isNowFollowing) {
        current_Follower += 1;
        Follow_button.classList.add("following");
        Follow_button.textContent = "Following";
    } else {
        current_Follower -= 1;
        Follow_button.classList.remove("following");
        Follow_button.textContent = "Follow";
    }

    Follow.textContent = `Followers: ${current_Follower}`;
});

Follow_button.addEventListener('mouseenter', () => {
    if (Follow_button.classList.contains("following")) {
        Follow_button.textContent = "Unfollow";
        Follow_button.classList.add("unfollow-hover");
    }
});

Follow_button.addEventListener('mouseleave', () => {
    if (Follow_button.classList.contains("following")) {
        Follow_button.textContent = "Following";
        Follow_button.classList.remove("unfollow-hover");
    }
});


function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

async function loadOtherUserProfile() {
    const userId = getQueryParam("user");
    if (!userId) return;

    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            document.getElementById("username_Id").textContent = userData.firstName || userId;
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
            }
        });

        favoriteGrid.style.opacity = "1";
        console.log("Favorite movies loaded successfully!");
    } catch (error) {
        console.error("Error loading favorite movies:", error);
    }
}

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

