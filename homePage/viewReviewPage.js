// Import Firebase dependencies
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, getDocs, collection, query, where, addDoc, serverTimestamp, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const movieTitle = movie.title;
// globally defined at top of script
let selectedRating = 0;
let selectedBannerUrl = "";
let selectedPosterUrl = "";
let wasLiked = false;

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

        // ensure poster is set
        document.getElementById("MoviePoster").src = reviewData.selectedPoster || "https://via.placeholder.com/300?text=No+Image";
        // display banner if available
        const bannerImage = document.getElementById("bannerContainer");
        const reviewContainer = document.querySelector(".review-container");

        if (reviewData.selectedBanner) {
            bannerImage.style.backgroundImage = `url(${reviewData.selectedBanner})`;
            bannerImage.style.display = "flex";
            reviewContainer.style.marginTop = "-40vh"; // overlay on banner
        } else {
            bannerImage.style.display = "none"; // hide banner space
            Object.assign(reviewContainer.style, {
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                gap: "50px",
                padding: "20px",
                marginTop: "0px"
            });
        }

        document.getElementById("reviewedIcon").innerHTML = "<i class='bx bxs-show'></i>";
        document.getElementById("likedIcon").innerHTML = reviewData.liked ? "<i class='bx bxs-heart'></i>" : "<i class='bx bx-heart'></i>";

        // Call function to load the action box
        loadReviewActionBox(movieTitle);
        loadFriendsReviews(reviewData.title, reviewData.tmdbId);

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
                try {
                    const movie = JSON.parse(localStorage.getItem("selectedMovie"));
                    const user = localStorage.getItem("loggedInUser");

                    if (!user || !movie) return;

                    const reviewRef = doc(db, "users", user, "reviews", movie.title);
                    const reviewSnap = await getDoc(reviewRef);

                    if (reviewSnap.exists()) {
                        const reviewData = reviewSnap.data();

                        // update localStorage with latest selected movie info
                        localStorage.setItem("selectedMovie", JSON.stringify({
                            id: reviewData.tmdbId,
                            title: reviewData.title,
                            release_date: reviewData.year ? `${reviewData.year}-01-01` : ""
                        }));

                        // Open the review form modal
                        document.getElementById("reviewBox").style.display = "flex";
                        document.getElementById("reviewSearchPage").style.display = "none";
                        document.getElementById("reviewForm").style.display = "block";

                        // populate UI fields
                        document.getElementById("reviewText").value = reviewData.reviewText || "";
                        document.getElementById("watchedDate").value = reviewData.watchedDate || "";
                        document.getElementById("watchedBeforeCheckbox").checked = reviewData.watchedBefore || false;
                        document.getElementById("reviewMoviePoster").src = reviewData.selectedPoster || "https://via.placeholder.com/300?text=No+Image";

                        selectedRating = reviewData.rating || 0;
                        selectedBannerUrl = reviewData.selectedBanner || "";
                        selectedPosterUrl = reviewData.selectedPoster || "";
                        wasLiked = reviewData.liked || false;

                        // update like button visually
                        const likeButton = document.getElementById("likeButton");
                        if (wasLiked) {
                            likeButton.classList.add("liked");
                        } else {
                            likeButton.classList.remove("liked");
                        }

                        // display correct stars based on stored rating
                        updateStarsDisplay();

                        setupPosterAndBannerButtons();
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

function setupPosterAndBannerButtons() {
    const changePosterBtn = document.getElementById("changePosterBtn");
    const changeBannerBtn = document.getElementById("changeBannerBtn");

    if (changePosterBtn) {
        changePosterBtn.addEventListener("click", async () => {
            const storedMovie = JSON.parse(localStorage.getItem("selectedMovie"));
            if (!storedMovie?.id) return;
            const posters = await fetchPosters(storedMovie.id);
            updatePosterGrid(posters);
            document.getElementById("posterReviewModal").style.display = "flex";
        });
    }

    if (changeBannerBtn) {
        changeBannerBtn.addEventListener("click", async () => {
            const storedMovie = JSON.parse(localStorage.getItem("selectedMovie"));
            if (!storedMovie?.id) return;
            const banners = await fetchBanners(storedMovie.id);
            updateBannerGrid(banners);
            document.getElementById("bannerReviewModal").style.display = "flex";
        });
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

async function loadComments() {
    const container = document.getElementById("commentsContainer");
    container.innerHTML = ""; // Clear existing

    const commentRef = collection(db, "users", username, "reviews", movieTitle, "comments");
    const q = query(commentRef, orderBy("timestamp", "asc"));
    const snap = await getDocs(q);

    snap.forEach(docSnap => {
        const data = docSnap.data();
        const commentDiv = document.createElement("div");
        commentDiv.className = "comment";
        const currentUser = localStorage.getItem("loggedInUser");
        const isCurrentUser = data.authorId === currentUser;

        commentDiv.innerHTML = `
          <span class="comment-author" role="button" onclick="visitUserProfile('${data.authorId}', ${isCurrentUser})">
            ${data.authorFirstName}
          </span>
          <span class="comment-text">${data.comment}</span>
        `;

        container.appendChild(commentDiv);
    });
}

window.visitUserProfile = function (userID, isCurrentUser = false) {
    if (isCurrentUser) {
        window.location.href = "ProfilePage.html";
    } else {
        window.location.href = `OtherProfilePage.html?user=${encodeURIComponent(userID)}`;
    }
};


document.getElementById("postCommentBtn").addEventListener("click", async () => {
    const commentText = document.getElementById("commentInput").value.trim();
    if (!commentText) return;

    const currentUser = localStorage.getItem("loggedInUser");
    if (!currentUser) return alert("You must be logged in to comment.");

    try {
        const currentUserSnap = await getDoc(doc(db, "users", currentUser));
        const commenterFirstName = currentUserSnap.exists() ? currentUserSnap.data().firstName : currentUser;

        const commentRef = collection(db, "users", username, "reviews", movieTitle, "comments");

        await addDoc(commentRef, {
            authorId: currentUser,
            authorFirstName: commenterFirstName,
            comment: commentText,
            timestamp: serverTimestamp()
        });

        document.getElementById("commentInput").value = "";
        await loadComments();

    } catch (err) {
        console.error("Error posting comment:", err);
        alert("Could not post comment.");
    }
});

async function loadFriendsReviews(movieTitle, tmdbId) {
    const currentUser = localStorage.getItem("loggedInUser");
    console.log("Current User:", currentUser);
    if (!currentUser) return;

    // fetch following subcollection
    const followingSnapshot = await getDocs(collection(db, "users", currentUser, "following"));
    const following = followingSnapshot.docs.map(doc => doc.id);
    console.log("Following list:", following);

    const friendsListContainer = document.getElementById("friendsList");
    const friendsCountDisplay = document.getElementById("friendsCount");

    let count = 0;
    friendsListContainer.innerHTML = ""; // Clear previous cards

    for (const friend of following) {
        console.log(`Checking friend: ${friend}`);

        // query friend's reviews for this movie
        const reviewsRef = collection(db, "users", friend, "reviews");
        let q = query(reviewsRef, where("tmdbId", "==", tmdbId));
        const querySnap = await getDocs(q);

        console.log(`Reviews found for ${friend}:`, querySnap.size);

        if (!querySnap.empty) {
            const reviewData = querySnap.docs[0].data();
            console.log(`Review data for ${friend}:`, reviewData);

            // fetch friend’s profile
            const friendProfileRef = doc(db, "users", friend);
            const profileSnap = await getDoc(friendProfileRef);

            let profilePicture = "https://via.placeholder.com/60";
            let displayName = friend; // fallback to username

            if (profileSnap.exists()) {
                const profileData = profileSnap.data();
                profilePicture = profileData.profilePicture || profilePicture;
                displayName = profileData.firstName || friend;
            }

            const rating = reviewData.rating || 0;

            // create star icons for rating
            let starsHtml = "";
            let fullStars = Math.floor(rating);
            const hasHalfStar = rating % 1 !== 0;

            for (let i = 0; i < fullStars; i++) {
                starsHtml += "<i class='bx bxs-star'></i>";
            }
            if (hasHalfStar) {
                starsHtml += "<i class='bx bxs-star-half'></i>";
            }
            while (fullStars + (hasHalfStar ? 1 : 0) < 5) {
                starsHtml += "<i class='bx bx-star'></i>";
                fullStars++;
            }

            const card = document.createElement("div");
            card.classList.add("friend-card");
            card.innerHTML = `
                <div class="friend-info">
                    <img src="${profilePicture}" alt="${displayName}" class="friend-profile-pic">
                    <span class="friend-name">${displayName}</span>
                    <div class="rating">${starsHtml}</div>
                </div>
            `;

            // click event to go to their review
            card.querySelector("img").addEventListener("click", () => {
                const url = `viewOtherReviewPage.html?user=${friend}&movie=${encodeURIComponent(movieTitle)}`;
                window.location.href = url;
            });

            friendsListContainer.appendChild(card);
            count++;
        } else {
            console.log(`${friend} has not reviewed this movie (tmdbId: ${tmdbId}).`);
        }
    }

    friendsCountDisplay.textContent = `${count} friend${count !== 1 ? "s" : ""} watched`;
    console.log(`Total friends who reviewed this movie: ${count}`);
}