import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import {
    getFirestore,
    doc,
    getDoc,
    collection,
    getDocs,
    query,
    orderBy,
    limit,
    onSnapshot,
    updateDoc,
    serverTimestamp, addDoc, arrayUnion, where
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

const TMDB_API_KEY = "bc7c4e7c62d9e223e196bbd15978fc51";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

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
            <a href="#" id="notificationBell"><i class='bx bx-bell' style="font-size: 24px;"></i></a>
            <select id="searchCategory">
                <option value="">Search For...</option>
                <option value="movies">Movies</option>
                <option value="actors">Actors</option>
                <option value="users">Users</option>
                <option value="genres">Genres</option>
                <option value="crew">Crew</option>
            </select>
            <input type="text" id="searchInput" placeholder="Search..." autocomplete="off">
            <div id="suggestions"></div>
        `;
        // Dynamically re-attach search.js after injecting DOM
        const script = document.createElement("script");
        script.type = "module";
        script.src = "./search.js";
        document.body.appendChild(script);
    } else {
        authContainer.innerHTML = `
            <a href="../login&create/index.html">Log In / Sign Up</a>

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
    //loadRecommendedMovies();
    getRandomActorFact();
    loadGenreBasedCarousels();
    loadPendingJoinRequests();

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

/*async function loadRecommendedMovies() {
    const username = localStorage.getItem("loggedInUser");
    if (!username) return;

    const recommendedContainer = document.getElementById("recommendedMoviesContainer");
    recommendedContainer.innerHTML = "";

    try {
        // Step 1: Get user's favorite films
        const favoritesRef = collection(db, "users", username, "favorites");
        const favoritesSnap = await getDocs(favoritesRef);

        const favoriteMovieIds = new Set();
        favoritesSnap.forEach(doc => {
            const data = doc.data();
            if (data.tmdbId) favoriteMovieIds.add(data.tmdbId);
        });

        // Step 2: Fetch similar movies from TMDB
        const recommendedMap = new Map();

        for (const tmdbId of favoriteMovieIds) {
            const res = await fetch(`${TMDB_BASE_URL}/movie/${tmdbId}/similar?api_key=${TMDB_API_KEY}&language=en-US&page=1`);
            const data = await res.json();

            data.results.forEach(movie => {
                const titleKey = movie.title.toLowerCase();
                if (!recommendedMap.has(titleKey)) {
                    recommendedMap.set(titleKey, movie);
                }
            });
        }

        if (recommendedMap.size === 0) {
            recommendedContainer.innerHTML = "<p>No recommendations yet. Add favorite films to get suggestions!</p>";
            return;
        }

        // Step 3: Render the recommendations
        for (const movie of recommendedMap.values()) {
            const movieItem = document.createElement("div");
            movieItem.classList.add("movie-item");
            movieItem.innerHTML = `
                <img src="https://image.tmdb.org/t/p/original${movie.poster_path}" alt="${movie.title}" onclick="goToMoviePage(${movie.id})">
                <p class="movie-title">${movie.title}</p>
            `;
            recommendedContainer.appendChild(movieItem);
        }

    } catch (err) {
        console.error("Error loading recommended movies:", err);
        recommendedContainer.innerHTML = "<p>Failed to load recommendations.</p>";
    }
}*/



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
            <img src="${reviewData.selectedPoster || 'https://via.placeholder.com/180x270?text=No+Image'}" alt="${reviewData.title}" onclick="goToOtherReviewPage('${reviewData.username}', '${reviewData.title}')">
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

window.goToOtherReviewPage = function (username, movieTitle) {
    const encodedUser = encodeURIComponent(username);
    const encodedMovie = encodeURIComponent(movieTitle);
    window.location.href = `viewOtherReviewPage.html?user=${encodedUser}&movie=${encodedMovie}`;
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

// MOVIES WE RECOMMEND
async function loadGenreBasedCarousels() {
    const currentUser = localStorage.getItem("loggedInUser");
    if (!currentUser) return;

    const genreSnap = await getDocs(collection(db, "users", currentUser, "genres"));
    const genreData = genreSnap.docs.map(doc => doc.data());

    const container = document.getElementById("genreRecommendationsContainer");
    container.innerHTML = "";

    for (const { id, name } of genreData) {
        const genreKey = name.replace(/\s+/g, "-");

        const response = await fetch(
            `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}
               &with_genres=${id}
               &sort_by=popularity.desc
               &vote_count.gte=100
               &include_adult=false
               &language=en-US
               &with_original_language=en`
                .replace(/\s+/g, "")
        );

        const data = await response.json();

        const section = document.createElement("section");
        section.classList.add("recommended-genre-section");
        section.innerHTML = `
            <h2>${name} Movies We Recommend</h2>
            <div class="movie-carousel">
                <button class="carousel-arrow left-arrow" onclick="scrollGenreCarousel('${genreKey}', -1)">❮</button>
                <div class="carousel-container" id="carousel-${genreKey}"></div>
                <button class="carousel-arrow right-arrow" onclick="scrollGenreCarousel('${genreKey}', 1)">❯</button>
            </div>
        `;
        container.appendChild(section);

        const carousel = document.getElementById(`carousel-${genreKey}`);
        data.results.slice(0, 20).forEach(movie => {
            const movieItem = document.createElement("div");
            movieItem.classList.add("movie-item");
            movieItem.innerHTML = `
                <img src="https://image.tmdb.org/t/p/original${movie.poster_path}" alt="${movie.title}" onclick="goToMoviePage(${movie.id})">
                <p class="movie-title">${movie.title}</p>
            `;
            carousel.appendChild(movieItem);
        });
    }
}

window.prevRecommendedMovie = function () {
    const container = document.getElementById("recommendedMoviesContainer");
    container.scrollBy({ left: -220, behavior: "smooth" });
};

window.nextRecommendedMovie = function () {
    const container = document.getElementById("recommendedMoviesContainer");
    container.scrollBy({ left: 220, behavior: "smooth" });
};

window.scrollGenreCarousel = function (genreKey, direction) {
    const container = document.getElementById(`carousel-${genreKey}`);
    if (!container) return;

    container.scrollBy({
        left: direction * 220,
        behavior: "smooth"
    });
};

// Communities Join Request Functions
async function handleAcceptJoinRequest(event) {
    const requestId = event.currentTarget.getAttribute("data-id");

    try {
        // Get the request data
        const requestRef = doc(db, "joinRequests", requestId);
        const requestSnap = await getDoc(requestRef);

        if (!requestSnap.exists()) {
            alert("Join request not found");
            return;
        }

        const requestData = requestSnap.data();
        const { userId, communityId, communityName } = requestData;

        // Update the request status
        await updateDoc(requestRef, {
            status: "accepted",
            responseTimestamp: serverTimestamp()
        });

        // Add user to community members
        const communityRef = doc(db, "communities", communityId);
        const communitySnap = await getDoc(communityRef);

        if (!communitySnap.exists()) {
            alert("Community not found");
            return;
        }

        const communityData = communitySnap.data();

        await updateDoc(communityRef, {
            members: arrayUnion(userId),
            memberCount: (communityData.memberCount || 0) + 1
        });

        // Send notification to user
        const notificationRef = collection(db, "users", userId, "notifications");
        await addDoc(notificationRef, {
            type: "joinRequestAccepted",
            message: `Your request to join "${communityName}" has been accepted`,
            communityId: communityId,
            createdAt: serverTimestamp(),
            read: false
        });

        // Reload all pending requests instead of trying to manipulate the DOM
        await loadPendingJoinRequests();

    } catch (error) {
        console.error("Error accepting join request:", error);
        alert("Error accepting join request");
    }
}

async function handleDenyJoinRequest(event) {
    const requestId = event.currentTarget.getAttribute("data-id");

    try {
        // Get the request data
        const requestRef = doc(db, "joinRequests", requestId);
        const requestSnap = await getDoc(requestRef);

        if (!requestSnap.exists()) {
            alert("Join request not found");
            return;
        }

        const requestData = requestSnap.data();
        const { userId, communityName } = requestData;

        // Update the request status
        await updateDoc(requestRef, {
            status: "denied",
            responseTimestamp: serverTimestamp()
        });

        // Send notification to user
        const notificationRef = collection(db, "users", userId, "notifications");
        await addDoc(notificationRef, {
            type: "joinRequestDenied",
            message: `Your request to join "${communityName}" has been denied`,
            createdAt: serverTimestamp(),
            read: false
        });

        // Reload all pending requests instead of trying to manipulate the DOM
        await loadPendingJoinRequests();

    } catch (error) {
        console.error("Error denying join request:", error);
        alert("Error denying join request");
    }
}

async function loadPendingJoinRequests() {
    const currentUser = localStorage.getItem("loggedInUser");
    if (!currentUser) return;

    try {
        // First, remove any existing join requests section
        const existingSection = document.getElementById("joinRequestsSection");
        if (existingSection) {
            existingSection.remove();
        }

        // Get communities created by the current user
        const communitiesRef = collection(db, "communities");
        const createdCommunitiesQuery = query(communitiesRef, where("createdBy", "==", currentUser));
        const communitiesSnapshot = await getDocs(createdCommunitiesQuery);

        if (communitiesSnapshot.empty) return; // User hasn't created any communities

        // Get all pending join requests for the user's communities
        const joinRequestsRef = collection(db, "joinRequests");
        const pendingRequestsQuery = query(
            joinRequestsRef,
            where("creatorId", "==", currentUser),
            where("status", "==", "pending")
        );
        const requestsSnapshot = await getDocs(pendingRequestsQuery);

        if (requestsSnapshot.empty) return; // No pending requests

        // Create the join requests section
        let requestsSection = document.createElement("section");
        requestsSection.id = "joinRequestsSection";
        requestsSection.className = "join-requests-section";

        // Find where to insert this section - after the welcome message
        const welcomeMessage = document.querySelector(".welcome-message");
        welcomeMessage.insertAdjacentElement("afterend", requestsSection);

        // Populate with join requests
        requestsSection.innerHTML = `
            <h2>Pending Community Join Requests</h2>
            <div class="join-requests-container">
                ${requestsSnapshot.docs.map(doc => {
            const requestData = doc.data();
            return `
                        <div class="join-request-item">
                            <a href="OtherProfilePage.html?user=${encodeURIComponent(requestData.userId)}" class="request-username">${requestData.userId}</a> wants to join 
                            <span class="request-community">${requestData.communityName}</span>
                            <div class="request-actions">
                                <button class="accept-request-btn" data-id="${doc.id}">Accept</button>
                                <button class="deny-request-btn" data-id="${doc.id}">Deny</button>
                            </div>
                        </div>
                    `;
        }).join("")}
            </div>
        `;

        // Add CSS for this section if it doesn't already exist
        if (!document.getElementById("join-requests-style")) {
            const style = document.createElement("style");
            style.id = "join-requests-style";
            style.textContent = `
                .join-requests-section {
                    padding: 20px;
                    background-color: #2a2a2a;
                    border-radius: 8px;
                    margin: 20px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }
                
                .join-requests-section h2 {
                    color: white;
                    border-bottom: 2px solid #555;
                    padding-bottom: 10px;
                    margin-top: 0;
                }
                
                .join-requests-container {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                
                .join-request-item {
                    background-color: #333;
                    padding: 15px;
                    border-radius: 5px;
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    color: white;
                }
                
                .request-username {
                    font-weight: bold;
                    margin: 0 5px;
                    color: #ffcc00;
                    text-decoration: none;
                    transition: all 0.2s ease;
                }
                
                .request-username:hover {
                    text-decoration: underline;
                    color: #ffd700;
                }
                
                .request-community {
                    font-weight: bold;
                    margin: 0 5px;
                }
                
                .request-actions {
                    margin-left: auto;
                    display: flex;
                    gap: 10px;
                }
                
                .accept-request-btn, .deny-request-btn {
                    padding: 8px 15px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                }
                
                .accept-request-btn {
                    background-color: #4CAF50;
                    color: white;
                }
                
                .deny-request-btn {
                    background-color: #f44336;
                    color: white;
                }
                
                @media (max-width: 768px) {
                    .join-request-item {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 10px;
                    }
                    
                    .request-actions {
                        margin-left: 0;
                        width: 100%;
                        justify-content: flex-end;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // Add event listeners for accept/deny buttons
        document.querySelectorAll(".accept-request-btn").forEach(button => {
            button.addEventListener("click", handleAcceptJoinRequest);
        });

        document.querySelectorAll(".deny-request-btn").forEach(button => {
            button.addEventListener("click", handleDenyJoinRequest);
        });
    } catch (error) {
        console.error("Error loading join requests:", error);
    }
}

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

document.addEventListener("DOMContentLoaded", function() {  //notification bell logic
    const notificationBell = document.getElementById("notificationBell");
        const currentUser = localStorage.getItem("loggedInUser");
        if (!currentUser) return;  // bail out if not logged in

        // 1) Real-time listener
        let latestNotifications = [];
        const notifQ = query(
          collection(db, "users", currentUser, "notifications"),
          orderBy("createdAt", "desc")
        );
        onSnapshot(notifQ, snapshot => {
          latestNotifications = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          updateBellBadge(latestNotifications.filter(n => !n.read).length);
          // if dropdown is open, refresh its contents
          if (document.getElementById("notificationBox")?.style.display !== "none") {
            renderNotifications();
          }
        });

        // 2) Your existing click handler, with renderNotifications() calls added
        if (notificationBell) {
            notificationBell.addEventListener("click", async function(event) {
                event.stopPropagation();

                const bellRect = notificationBell.getBoundingClientRect();
                let notificationBox = document.getElementById("notificationBox");

                if (!notificationBox) {
                    // create the box
                    notificationBox = document.createElement("div");
                    notificationBox.id = "notificationBox";
                    notificationBox.className = "notification-box";
                    notificationBox.innerHTML = `
                        <div class="notification-box-header" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #444;">
                            <span style="font-size: 18px; color: white;">Notifications</span>
                            <i class='bx bx-cog' id="notificationSettings" style="font-size: 18px; cursor: pointer; color: white;"></i>
                        </div>
                        <div class="notification-box-content" style="padding: 10px; color: white;">
                            <!-- Populate notifications here -->
                            <p>No new notifications.</p>
                        </div>
                    `;
                    notificationBox.style.position = "absolute";
                    notificationBox.style.top = (bellRect.bottom + window.scrollY) + "px";
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
                        notificationSettings.addEventListener("click", function(event) {
                            event.stopPropagation();
                            window.location.href = "userNotificationSettings.html";
                        });
                    }

                    // **render the fetched notifications**
                    renderNotifications();
                    // **clear the badge**
                    updateBellBadge(0);
                    // **mark all unread as read**
                    const unread1 = latestNotifications.filter(n => !n.read);
                    await Promise.all(unread1.map(n =>
                        updateDoc(doc(db, "users", currentUser, "notifications", n.id), { read: true })
                    ));

                } else {
                    if (notificationBox.style.display === "none" || notificationBox.style.display === "") {
                        const newBellRect = notificationBell.getBoundingClientRect();
                        notificationBox.style.top = (newBellRect.bottom + window.scrollY) + "px";
                        notificationBox.style.right = (window.innerWidth - newBellRect.right) + "px";
                        notificationBox.style.display = "block";

                        // **refresh and clear the badge**
                        renderNotifications();
                        updateBellBadge(0);
                        // **mark all unread as read**
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
          const now    = Date.now();
          const diffMs = now - date.getTime();
          const sec    = Math.floor(diffMs / 1000);
          if (sec < 60) return `${sec}s ago`;
          const min = Math.floor(sec / 60);
          if (min < 60) return `${min}m ago`;
          const hr = Math.floor(min / 60);
          if (hr < 24) return `${hr}h ago`;
          const days = Math.floor(hr / 24);
          return `${days}d ago`;
        }

        // ─── helper functions (inside the same DOMContentLoaded) ───
        function renderNotifications() {
            const content = document.querySelector(".notification-box-content");
            if (!content) return;

            if (latestNotifications.length === 0) {
                content.innerHTML = `<p>No new notifications.</p>`;
            } else {
                content.innerHTML = latestNotifications
                    .map(n => {
                        // convert Firestore timestamp to Date
                        const dateObj = n.createdAt?.toDate?.() || new Date();
                        const ago     = timeAgo(dateObj);

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
            // ensure bell is position: relative for absolute badge placement
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
