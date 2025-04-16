// Import Firebase dependencies
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD1LpIBMmZAiQFwberKbx2G29t6fNph3Xg",
    authDomain: "sample-dc6d0.firebaseapp.com",
    projectId: "sample-dc6d0",
    storageBucket: "sample-dc6d0.appspot.com",
    messagingSenderId: "650782048731",
    appId: "1:650782048731:web:d2828c5b87f0a4e62367fe",
    measurementId: "G-WJMEY6J7BR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("Firebase initialized for view review page");

const params = new URLSearchParams(window.location.search);
const username = params.get("user");
const movieTitle = params.get("movie");

if (!username || !movieTitle) {
    alert("Missing review details.");
    window.location.href = "homePage.html";
}

// Function to fetch and display review
async function loadReview() {
    const reviewDoc = doc(db, "users", username, "reviews", movieTitle);
    const userDoc = doc(db, "users", username);
    const [reviewSnap, userSnap] = await Promise.all([getDoc(reviewDoc), getDoc(userDoc)]);

    if (reviewSnap.exists()) {
        const reviewData = reviewSnap.data();
        const userData = userSnap.data();
        // console.log("Review Data Retrieved:", reviewData);

        document.getElementById("reviewUsername").textContent = userData.firstName || username;
        document.getElementById("MovieTitle").textContent = `${reviewData.title} (${reviewData.year || "Unknown"})`;
        const rating = reviewData.rating || 0;
        let starsHtml = "";

        // full and half stars logic
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            starsHtml += "<i class='bx bxs-star'></i>";
        }
        if (hasHalfStar) {
            starsHtml += "<i class='bx bxs-star-half'></i>";
        }

        // add to the container
        document.getElementById("MovieRatingStars").innerHTML = starsHtml;
        document.getElementById("Text").textContent = reviewData.reviewText || "No review written.";
        document.getElementById("watchDate").textContent = reviewData.watchedDate
            ? new Date(reviewData.watchedDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
            : "Not Specified";

        // Ensure poster is set
        document.getElementById("MoviePoster").src = reviewData.selectedPoster || "https://via.placeholder.com/300?text=No+Image";

        document.getElementById("reviewedIcon").innerHTML = "<i class='bx bxs-show'></i>";
        document.getElementById("likedIcon").innerHTML = reviewData.liked ? "<i class='bx bxs-heart'></i>" : "<i class='bx bx-heart'></i>";

        // Call function to load the action box
        loadReviewActionBox(movieTitle);

    } else {
        alert("No review found for this movie.");
        window.location.href = "homePage.html";
    }
}

// Load the review when the page loads
document.addEventListener("DOMContentLoaded", loadReview);

// function to load the review action box
async function loadReviewActionBox(movieTitle) {
    // gets logged in user from localStorage
    const user = localStorage.getItem("loggedInUser");
    // exit if no user is found
    if (!user) return;

    // firebase reference for users movie review
    const reviewRef = doc(db, "users", user, "reviews", movieTitle);

    // fetch movie review from the db
    try {
        // fetches review document
        const reviewSnap = await getDoc(reviewRef);

        // checks if review exists for the movie
        if (reviewSnap.exists()) {
            // retrieve actual review data
            const reviewData = reviewSnap.data();
            // console.log("Review Data Found:", reviewData);

            // change the reviewed icon to show movie has been reviewed
            document.getElementById("reviewedIcon").innerHTML = `<i class='bx bxs-show'></i><div class="icon-label" id="watchLabel">${reviewData.watchedBefore ? "Watched" : "Watch"}</div>`;
            // change the liked icon to show the movie has been liked
            document.getElementById("likedIcon").innerHTML = `<i class='bx ${reviewData.liked ? "bxs-heart" : "bx-heart"}'></i><div class="icon-label" id="likeLabel">${reviewData.liked ? "Liked" : "Like"}</div>`;
            document.getElementById("watchlistIcon").innerHTML = `<i class='bx bx-plus'></i><div class="icon-label" id="watchlistLabel">Watchlist</div>`;
            // change label from rate to rated (indicates movie has been rated)
            document.getElementById("ratingLabel").textContent = reviewData.rating && reviewData.rating > 0 ? "Rated" : "Rate";

            // gets the users rating, default is 0
            const userRating = reviewData.rating || 0;
            // gets ratingDisplay element
            const ratingDisplay = document.getElementById("ratingDisplay");
            // clears existing stars before displaying new ones
            ratingDisplay.innerHTML = "";

            // Math.floor determines number of full stars
            const fullStars = Math.floor(userRating);
            // userRating % 1 !=0 checks if rating includes half a star
            const hasHalfStar = userRating % 1 !== 0;

            // loops 5 times to create the stars
            for (let i = 1; i <= 5; i++) {
                let starClass;

                if (i <= fullStars) {
                    starClass = "bxs-star"; // full star
                } else if (hasHalfStar && i === fullStars + 1) {
                    starClass = "bxs-star-half"; // half star
                } else {
                    starClass = "bx-star"; // empty star
                }
                // display the rating
                ratingDisplay.innerHTML += `<span class="rating-star"><i class='bx ${starClass}'></i></span>`;
            }

            const viewReviewBtn = document.getElementById("viewReviewBtn");

            // If review exists
            viewReviewBtn.textContent = "View Review";
            viewReviewBtn.onclick = () => {
                window.location.href = "viewReviewPage.html";
            };

        } else {
            console.log("no review found for this movie.");
            const viewReviewBtn = document.getElementById("viewReviewBtn");
            viewReviewBtn.textContent = "Add Review";
            viewReviewBtn.onclick = () => {
                document.getElementById("reviewBox").style.display = "flex";
            };
            // since no review exists for the movie, reset the review action box
            resetReviewActionBox();
        }
    } catch (error) {
        console.error("Error loading review:", error);
    }
}

// resets ui for the review action box
function resetReviewActionBox() {
    // Reset icons with labels
    document.getElementById("reviewedIcon").innerHTML = `
        <i class='bx bx-show'></i>
        <div class="icon-label" id="watchLabel">Watch</div>
    `;

    document.getElementById("likedIcon").innerHTML = `
        <i class='bx bx-heart'></i>
        <div class="icon-label" id="likeLabel">Like</div>
    `;

    document.getElementById("watchlistIcon").innerHTML = `
        <i class='bx bx-plus'></i>
        <div class="icon-label" id="watchlistLabel">Watchlist</div>
    `;

    // Reset rating label and stars
    document.getElementById("ratingLabel").textContent = "Rate";

    document.getElementById("ratingDisplay").innerHTML = `
        <span class="rating-star"><i class='bx bx-star'></i></span>
        <span class="rating-star"><i class='bx bx-star'></i></span>
        <span class="rating-star"><i class='bx bx-star'></i></span>
        <span class="rating-star"><i class='bx bx-star'></i></span>
        <span class="rating-star"><i class='bx bx-star'></i></span>
    `;
}

const closeButtons = document.querySelectorAll(".close");
const reviewBox = document.getElementById("reviewBox");
const reviewForm = document.getElementById("reviewForm");
const reviewSearchPage = document.getElementById("reviewSearchPage");
const reviewSuggestions = document.getElementById("reviewSuggestions");

closeButtons.forEach(button => {
    button.addEventListener("click", () => {
        reviewBox.style.display = "none";
        reviewForm.style.display = "none";
        reviewSearchPage.style.display = "block";
        reviewSuggestions.style.display = "none";
    });
});