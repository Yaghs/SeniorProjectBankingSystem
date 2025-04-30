// Import Firebase dependencies
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBkidFMwM_jHr5i4D55EEr_anJlrwrNvrI",
    authDomain: "plottwistsp.firebaseapp.com",
    projectId: "plottwistsp",
    storageBucket: "plottwistsp.firebasestorage.app",
    messagingSenderId: "605014060151",
    appId: "1:605014060151:web:3e307d34e57d908fa8ea72"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("Firebase initialized for view review page");

// Get the logged-in user's username
const username = localStorage.getItem("loggedInUser");
if (!username) {
    alert("You must be logged in to view reviews.");
    window.location.href = "homePage.html";
}

// Get the selected movie
const movie = JSON.parse(localStorage.getItem("selectedMovie"));
if (!movie) {
    alert("No movie selected.");
    window.location.href = "homePage.html";
}

// Function to fetch and display review
async function loadReview() {
    const movieTitle = movie.title;
    const reviewDoc = doc(db, "users", username, "reviews", movieTitle);
    const userDoc = doc(db, "users", username);
    const [reviewSnap, userSnap] = await Promise.all([getDoc(reviewDoc), getDoc(userDoc)]);

    if (reviewSnap.exists()) {
        const reviewData = reviewSnap.data();
        const userData = userSnap.data();
        // console.log("Review Data Retrieved:", reviewData);

        document.getElementById("reviewUsername").textContent = userData.firstName || username;
        document.getElementById("MovieTitle").textContent = `${reviewData.title} (${reviewData.year || "Unknown"})`;
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

            // Math.floor determines numver of full stars
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

            // event listener for when edit review is clicked
            document.getElementById("editReviewBtn").addEventListener("click", async () => {
                // fetch info from db
                try {
                    // gets selected movie from localStorage
                    const movie = JSON.parse(localStorage.getItem("selectedMovie"));
                    // get logged in user from localStorage
                    const user = localStorage.getItem("loggedInUser");

                    // if none exist, exit
                    if (!user || !movie) return;

                    // firebase reference for movie review
                    const reviewRef = doc(db, "users", user, "reviews", movie.title);
                    // fetches review document
                    const reviewSnap = await getDoc(reviewRef);

                    // if review doc exists
                    if (reviewSnap.exists()) {
                        // populate with data
                        const reviewData = reviewSnap.data();

                        // loads saved review text, watched date, watched before, selected poster and liked status
                        document.getElementById("reviewText").value = reviewData.reviewText || "";
                        document.getElementById("watchedDate").value = reviewData.watchedDate || "";
                        document.getElementById("watchedBeforeCheckbox").checked = reviewData.watchedBefore || false;
                        document.getElementById("reviewMoviePoster").src = reviewData.selectedPoster || "https://via.placeholder.com/300?text=No+Image";
                        document.getElementById("likeButton").classList.toggle("liked", reviewData.liked);

                        const userRating = reviewData.rating;
                        // Math.floor determines number of full stars
                        const fullStars = Math.floor(userRating);
                        // userRating % 1 !=0 checks if rating includes half a star
                        const hasHalfStar = userRating % 1 !== 0;

                        // ensure stars in review match saved rating
                        document.querySelectorAll("#reviewForm .rating-container .rating-star i").forEach((star, index) => {
                            if (index < fullStars) {
                                star.className = "bx bxs-star"; // full star
                            } else if (hasHalfStar && index === fullStars) {
                                star.className = "bx bxs-star-half"; // half star
                            } else {
                                star.className = "bx bx-star"; // empty star
                            }
                        });
                        // displays review form for editing
                        document.getElementById("reviewBox").style.display = "flex";
                        document.getElementById("reviewSearchPage").style.display = "none";
                        document.getElementById("reviewForm").style.display = "block";

                    } else {
                        console.log("No review found. Edit button disabled.");
                    }

                } catch (error) {
                    console.error("error loading review for editing:", error);
                }
            });

        } else {
            console.log("no review found for this movie.");
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
