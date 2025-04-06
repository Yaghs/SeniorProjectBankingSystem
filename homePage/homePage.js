import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, doc, getDoc, collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

const TMDB_API_KEY = "bc7c4e7c62d9e223e196bbd15978fc51";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

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

// ------------------- GREETING & LOGIN CHECK -------------------

async function updateGreeting() {
    const username = localStorage.getItem("loggedInUser");
    if (username) {
        try {
            const userRef = doc(db, "users", username);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                document.getElementById("greetingText").textContent = `Welcome back, ${userSnap.data().firstName}!`;
            } else {
                console.error("User not found in Firebase");
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    } else {
        console.error("No logged-in user.");
    }
}

// ------------------- HEADER & VIEW SWITCHING -------------------

function updateViewForAuth(user) {
    const authContainer = document.getElementById("authLinks");
    const welcomeMessage = document.getElementById("welcomeMessage");
    const friendsSection = document.querySelector(".new-from-friends");
    const reviewBox = document.getElementById("reviewBox");
    const didYouKnow = document.querySelector(".did-you-know-section");
    const popularMovies = document.querySelector(".popular-movies-section");

    if (user) {
        authContainer.innerHTML = `
            <span id="username">${user}</span>
            <a href="#">Home</a>
            <div class="dropdown">
                <a href="#" id="accountLink">Account</a>
                <div class="dropdown-content">
                    <a href="Profilepage.html">Profile</a>
                    <a href="userSettings.html">Settings</a>
                    <a href="#" class="sign-out">Sign out</a>
                </div>
            </div>
            <a href="#">Activity</a>
            <a href="#" id="reviewBtn">+Review</a>
            <a href="../homePage/communities.html">Communities</a>
            <select id="searchCategory">
                <option value="">Search For...</option>
                <option value="movies">Movies</option>
                <option value="actors">Actors</option>
                <option value="users">Users</option>
            </select>
            <input type="text" id="searchInput" placeholder="Search..." autocomplete="off">
        `;
    } else {
        authContainer.innerHTML = `
            <a href="../login&create/login&create.html">Log In / Sign Up</a>

        `;

        if (welcomeMessage) welcomeMessage.style.display = "none";
        if (friendsSection) friendsSection.style.display = "none";
        if (reviewBox) reviewBox.style.display = "none";

        const msg = document.createElement("p");
        msg.className = "logged-out-message";
        msg.textContent = "Log in to access reviews, friends' activity, and more!";
        popularMovies.appendChild(msg);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const user = localStorage.getItem("loggedInUser");

    updateGreeting();
    updateViewForAuth(user);
    loadPopularMovies();
    loadFriendsReviews();
    getRandomActorFact();

    document.addEventListener("click", function (e) {
        if (e.target.classList.contains("sign-out")) {
            e.preventDefault();
            localStorage.removeItem("loggedInUser");
            location.reload();
        }
    });

    // Restrict review button if not logged in
    const reviewBtn = document.getElementById("reviewBtn");
    if (reviewBtn) {
        reviewBtn.addEventListener("click", () => {
            const user = localStorage.getItem("loggedInUser");
            if (!user) {
                alert("Please log in to leave a review.");
                return;
            }
            document.getElementById("reviewBox").style.display = "flex";
        });
    }
});

// ------------------- MOVIES -------------------

let currentSlide = 0;
let totalSlides = 0;

async function loadPopularMovies() {
    try {
        const response = await fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&region=US&sort_by=popularity.desc&vote_count.gte=50&page=1`);
        const data = await response.json();
        totalSlides = data.results.length;

        const container = document.getElementById("popularMoviesContainer");
        container.innerHTML = "";

        data.results
            .filter(movie => movie.original_language === "en")
            .forEach(movie => {
                const movieItem = document.createElement("div");
                movieItem.classList.add("movie-item");
                movieItem.innerHTML = `
                    <img src="https://image.tmdb.org/t/p/original${movie.poster_path}" alt="${movie.title}" onclick="goToMoviePage(${movie.id})">
                    <p class="movie-title">${movie.title}</p>
                `;
                container.appendChild(movieItem);
            });
    } catch (error) {
        console.error("Error fetching popular movies:", error);
    }
}

window.goToMoviePage = function (movieId) {
    fetch(`${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=credits,videos`)
        .then(response => response.json())
        .then(movie => {
            localStorage.setItem("selectedMovie", JSON.stringify(movie));
            window.location.href = "moviePage.html";
        })
        .catch(error => console.error("Error fetching movie details:", error));
};

window.prevPopularMovie = function () {
    const container = document.getElementById("popularMoviesContainer");
    if (currentSlide > 0) {
        currentSlide--;
    } else {
        currentSlide = totalSlides - 1;
    }
    container.scrollTo({
        left: currentSlide * 220,
        behavior: "smooth"
    });
};

window.nextPopularMovie = function () {
    const container = document.getElementById("popularMoviesContainer");
    if (currentSlide < totalSlides - 1) {
        currentSlide++;
    } else {
        currentSlide = 0;
    }
    container.scrollTo({
        left: currentSlide * 220,
        behavior: "smooth"
    });
};

// ------------------- FRIENDS REVIEWS -------------------

async function loadFriendsReviews() {
    const currentUser = localStorage.getItem("loggedInUser");
    if (!currentUser) return;

    const friendsMoviesContainer = document.getElementById("friendsMoviesContainer");
    friendsMoviesContainer.innerHTML = "";

    const followingRef = collection(db, "users", currentUser, "following");
    const followingSnapshot = await getDocs(followingRef);

    const allRecentReviews = [];

    for (const docSnap of followingSnapshot.docs) {
        const friendUsername = docSnap.id;

        const friendRef = doc(db, "users", friendUsername);
        const friendSnap = await getDoc(friendRef);

        const friendData = friendSnap.exists() ? friendSnap.data() : {};
        const friendFirstName = friendData.firstName || friendUsername;

        const reviewsRef = collection(db, "users", friendUsername, "reviews");
        const recentReviewQuery = query(reviewsRef, orderBy("timestamp", "desc"), limit(1));
        const reviewSnapshot = await getDocs(recentReviewQuery);

        reviewSnapshot.forEach(reviewDoc => {
            const reviewData = reviewDoc.data();
            reviewData.username = friendUsername;
            reviewData.firstName = friendFirstName;
            reviewData.timestamp = reviewData.timestamp?.toDate?.() || new Date(0);

            allRecentReviews.push(reviewData);
        });
    }

    allRecentReviews.sort((a, b) => b.timestamp - a.timestamp);

    allRecentReviews.forEach(reviewData => {
        const movieItem = document.createElement("div");
        movieItem.classList.add("friend-movie-item");

        let starsHtml = "";
        const fullStars = Math.floor(reviewData.rating || 0);
        const hasHalfStar = reviewData.rating % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            starsHtml += "<i class='bx bxs-star'></i>";
        }
        if (hasHalfStar) {
            starsHtml += "<i class='bx bxs-star-half'></i>";
        }

        movieItem.innerHTML = `
            <img src="${reviewData.selectedPoster || 'https://via.placeholder.com/180x270?text=No+Image'}" alt="${reviewData.title}" onclick="goToMoviePageFromReview('${reviewData.title}')">
            <div class="review-author" role="button" onclick="visitUserProfile('${reviewData.username}')">${reviewData.firstName}</div>
            <div class="review-icons">
                <div class="rating">${starsHtml}</div>
                ${reviewData.liked ? "<i class='bx bxs-heart'></i>" : ""}
                ${reviewData.watchedBefore ? "<i class='bx bxs-show'></i>" : ""}
                ${reviewData.reviewText ? "<i class='bx bxs-comment-detail'></i>" : ""}
            </div>
        `;
        friendsMoviesContainer.appendChild(movieItem);
    });
}

window.visitUserProfile = function (userID) {
    window.location.href = `OtherProfilePage.html?user=${encodeURIComponent(userID)}`;
};

window.goToMoviePageFromReview = function (movieTitle) {
    localStorage.setItem("searchedMovieTitle", movieTitle);
    window.location.href = "moviePage.html";
};

window.prevFriendMovie = function () {
    const container = document.getElementById("friendsMoviesContainer");
    container.scrollBy({ left: -220, behavior: "smooth" });
};

window.nextFriendMovie = function () {
    const container = document.getElementById("friendsMoviesContainer");
    container.scrollBy({ left: 220, behavior: "smooth" });
};

// ------------------- ACTOR FACT --------------------

async function getRandomActorFact() {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/person/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`);
        const data = await response.json();

        if (data.results.length === 0) {
            throw new Error("No actors found.");
        }
        //tries up to 10 times to find an actor that has an image and bio
        for (let i = 0; i <= 10; i++){

        }
        const randomActor = data.results[Math.floor(Math.random() * data.results.length)];
        const actorDetailsResponse = await fetch(`https://api.themoviedb.org/3/person/${randomActor.id}?api_key=${TMDB_API_KEY}&language=en-US`);
        const actorDetails = await actorDetailsResponse.json();

        const actorMoviesResponse = await fetch(`https://api.themoviedb.org/3/person/${randomActor.id}/movie_credits?api_key=${TMDB_API_KEY}&language=en-US`);
        const actorMoviesData = await actorMoviesResponse.json();

        let bio = actorDetails.biography;
        if (!bio || bio.length < 50) {
            bio = "This actor's biography is not available.";
        } else {
            let sentences = bio.split(". ");
            bio = sentences.slice(0, 2).join(". ") + ".";
        }

        document.getElementById("actorName").textContent = actorDetails.name;
        document.getElementById("actorImage").src = `https://image.tmdb.org/t/p/w200${actorDetails.profile_path}`;
        document.getElementById("actorFact").innerHTML = `${bio}<br>`;
    } catch (error) {
        console.error("Error fetching actor fact:", error);
        document.getElementById("actorFact").textContent = "Could not load an actor fact.";
    }
}
