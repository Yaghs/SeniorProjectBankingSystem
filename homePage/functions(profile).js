import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

const TMDB_API_KEY = "bc7c4e7c62d9e223e196bbd15978fc51";

let profilepic = document.getElementById('profile-pic');
let inputFile = document.getElementById('fileinput');
const editButton = document.getElementById('Edit');
const Bio = document.getElementById("Bio");

// Maximum image size in bytes (slightly less than 1MB Firestore limit)
const MAX_IMAGE_SIZE = 1000000;

// Helper function to check image size from base64 string
function getBase64Size(base64String) {
    // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
    const base64WithoutPrefix = base64String.split(',')[1];
    // Calculate approximate size in bytes
    return Math.ceil((base64WithoutPrefix.length * 3) / 4);
}

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

document.addEventListener("DOMContentLoaded", updateProfilePage);

async function updateProfilePage() {
    const username = localStorage.getItem("loggedInUser");
    if (username) {
        try {
            const userRef = doc(db, "users", username);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();

                document.getElementById("username_Id").textContent = userData.firstName;

                // Load profile picture if it exists
                if (userData.profilePicture) {
                    profilepic.src = userData.profilePicture;
                }

                // Load bio if it exists
                if (userData.bio) {
                    Bio.value = userData.bio;
                }

                await updateFollowCounts(username);
                await updateFollowersCount(username);
            } else {
                console.error("User not found in Firebase.");
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    } else {
        console.error("No logged-in user found.");
    }
}

profilepic.addEventListener("click", function() {
    inputFile.click();
});

inputFile.onchange = async function() {
    const file = inputFile.files[0];
    if (file) {
        // Check if file is an image
        if (!file.type.startsWith('image/')) {
            alert("Please select an image file.");
            return;
        }

        // Check file size before processing
        if (file.size > MAX_IMAGE_SIZE * 1.33) { // Base64 is ~33% larger than binary
            alert("Image is too large! Maximum size is 1MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = async function(e) {
            const imageBase64 = e.target.result;

            // Verify base64 size
            const base64Size = getBase64Size(imageBase64);
            if (base64Size > MAX_IMAGE_SIZE) {
                alert("Image is too large! Maximum size is 1MB.");
                return;
            }

            // Update UI
            profilepic.src = imageBase64;

            // Save to Firebase
            const username = localStorage.getItem("loggedInUser");
            if (username) {
                try {
                    const userRef = doc(db, "users", username);
                    await setDoc(userRef, {
                        profilePicture: imageBase64
                    }, { merge: true });
                    console.log("Profile picture saved successfully");
                } catch (error) {
                    console.error("Error saving profile picture:", error);
                    alert("Failed to save profile picture. Please try again.");
                }
            }
        };
        reader.readAsDataURL(file);
    }
};

editButton.addEventListener("click", async () => {
    if (Bio.disabled) {
        Bio.removeAttribute("disabled"); // enable text
        editButton.textContent = "Save";
    } else {
        Bio.setAttribute("disabled", true);
        editButton.textContent = "Edit";

        // Save bio to Firebase
        const username = localStorage.getItem("loggedInUser");
        const bioText = Bio.value.trim();

        if (username) {
            try {
                const userRef = doc(db, "users", username);
                await setDoc(userRef, {
                    bio: bioText
                }, { merge: true });
                console.log("Bio saved successfully");
            } catch (error) {
                console.error("Error saving bio:", error);
                alert("Failed to save bio. Please try again.");
            }
        }
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    const placeholders = document.querySelectorAll(".fav-placeholder");
    const favBox = document.getElementById("favBox");
    const favSearchPage = document.getElementById("favSearchPage");
    const closeBtn = document.querySelector(".close");
    const favSearch = document.getElementById("favSearch");
    const favSuggestions = document.getElementById("favSuggestions");
    const posterModal = document.getElementById("posterModal");
    const posterGrid = document.getElementById("posterGrid");
    const posterClose = document.querySelector(".poster-close");
    const savePosterBtn = document.getElementById("savePosterBtn");

    let selectedPlaceholder;
    let selectedMovie = null;
    let selectedPosterUrl = "";

    const userID = localStorage.getItem("loggedInUser");
    if (userID) {
        await loadFavoriteMovies(userID); // load saved movies when profile opens
    }

    placeholders.forEach(placeholder => {
        placeholder.addEventListener("click", () => {
            selectedPlaceholder = placeholder;
            favBox.style.display = "flex"; // show the background
            favSearchPage.style.display = "block"; // show the search box
        });
    });

    closeBtn.addEventListener("click", () => {
        favBox.style.display = "none"; // hide the background
        favSearchPage.style.display = "none"; // hide the search box
        favSuggestions.style.display = "none"; // hide search results
    });

    favSearch.addEventListener("input", async () => {
        const query = favSearch.value.trim();
        if (query.length > 2) {
            const response = await fetch(`https://api.themoviedb.org/3/search/movie?query=${query}&api_key=${TMDB_API_KEY}`);
            const data = await response.json();
            favSuggestions.innerHTML = ""; // clear previous results
            favSuggestions.style.display = "block"; // show search results

            if (data.results.length === 0) {
                favSuggestions.innerHTML = "<div>No results found</div>";
                return;
            }

            data.results.forEach(movie => {
                const movieItem = document.createElement("div");
                movieItem.textContent = `${movie.title} (${movie.release_date ? movie.release_date.substring(0, 4) : "N/A"})`;
                movieItem.classList.add("movie-result");
                movieItem.addEventListener("click", () => {
                    chooseMovie(movie);
                    favSearch.value = ""; // clear the search bar after selection
                });
                favSuggestions.appendChild(movieItem);
            });
        } else {
            favSuggestions.style.display = "none"; // hide if search input is too short
        }
    });

    async function chooseMovie(movie) {
        selectedMovie = movie; // store selected movie
        favSearchPage.style.display = "none"; // hide search box
        favSuggestions.style.display = "none"; // hide search results
        fetchPosters(movie);
    }

    async function fetchPosters(movie) {
        posterModal.style.display = "flex"; // show the modal
        posterGrid.innerHTML = ""; // clear previous posters
        selectedPosterUrl = ""; // reset selection

        const response = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/images?api_key=${TMDB_API_KEY}&append_to_response=images&include_image_language=en,null`);
        const data = await response.json();

        if (data.posters.length === 0) {
            posterGrid.innerHTML = "<div>No posters available</div>";
            return;
        }

        data.posters.forEach(poster => {
            const img = document.createElement("img");
            img.src = `https://image.tmdb.org/t/p/original${poster.file_path}`;
            img.classList.add("poster-option");

            img.addEventListener("click", () => {
                document.querySelectorAll(".poster-option").forEach(img => img.classList.remove("selected"));
                img.classList.add("selected");
                selectedPosterUrl = img.src;
            });

            posterGrid.appendChild(img);
        });
    }

    posterClose.addEventListener("click", () => {
        posterModal.style.display = "none"; // closes poster modal
        favBox.style.display = "none"; // hides the background
    });

    savePosterBtn.addEventListener("click", async () => {
        if (!selectedMovie) {
            alert("No movie selected.");
            return;
        }
        if (!selectedPosterUrl) {
            alert("Please select a poster.");
            return;
        }

        if (!userID) {
            alert("You must be logged in to save a favorite movie.");
            return;
        }

        posterModal.style.display = "none"; // hide modal
        favBox.style.display = "none"; // hide background overlay
        const index = selectedPlaceholder.getAttribute("data-index"); // get placeholder's data-index
        selectedPlaceholder.innerHTML = `<img src="${selectedPosterUrl}" width="150px" height="225px">`;

        await saveToFirebase(userID, selectedMovie, selectedPosterUrl, index);
    });

    async function saveToFirebase(userID, movie, posterUrl, index) {
        try {
            const movieRef = doc(db, "users", userID, "favorite_movies", index.toString());
            const movieData = {
                title: movie.title,
                poster: posterUrl,
                index: index,
                year: movie.release_date ? movie.release_date.split("-")[0] : "Unknown"
            };
            await setDoc(movieRef, movieData);
            alert("Your favorite movie has been saved!");
        } catch (error) {
            console.error("Error saving favorite movie:", error);
            alert("Failed to save favorite movie. Please try again.");
        }
    }

    async function loadFavoriteMovies(userID) {
        try {
            const userMoviesRef = collection(db, "users", userID, "favorite_movies");
            const querySnapshot = await getDocs(userMoviesRef);

            const favoriteGrid = document.querySelector(".favorite-grid");

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

                    // remove any previous event listeners
                    const newPlaceholder = placeholder.cloneNode(true);
                    placeholder.parentNode.replaceChild(newPlaceholder, placeholder);

                    // redirect to movie page on click, but first fetch full TMDB movie
                    newPlaceholder.addEventListener("click", async () => {
                        try {
                            const response = await fetch(
                                `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movieData.title)}`
                            );
                            const data = await response.json();

                            // try to find the best match based on both title and year
                            let tmdbMovie = data.results.find(movie =>
                                movie.title.toLowerCase() === movieData.title.toLowerCase() &&
                                movie.release_date &&
                                movie.release_date.startsWith(movieData.year)
                            );

                            if (!tmdbMovie) {
                                console.warn("Exact match not found, falling back to first result.");
                                tmdbMovie = data.results[0];
                            }

                            if (!tmdbMovie || !tmdbMovie.id) {
                                alert("Failed to load movie details.");
                                return;
                            }

                            localStorage.setItem("selectedMovie", JSON.stringify(tmdbMovie));
                            window.location.href = "moviePage.html";
                        } catch (error) {
                            console.error("Error fetching TMDB movie:", error);
                            alert("Could not load movie details.");
                        }
                    });

                }
            });

            favoriteGrid.style.opacity = "1"; // reveal grid after loading
            console.log("Favorite movies loaded successfully!");
        } catch (error) {
            console.error("Error loading favorite movies:", error);
        }
    }
});

// load the 6 most recent reviews and display them in the profile page
async function loadRecentReviews() {
    const userID = localStorage.getItem("loggedInUser");
    console.log("Fetching reviews for user ID:", userID);
    if (!userID) {
        console.log("No logged-in user.");
        return;
    }

    const db = getFirestore();
    const reviewsRef = collection(db, "users", userID, "reviews");
    const recentQuery = query(reviewsRef, orderBy("timestamp", "desc"), limit(6));

    try {
        const querySnapshot = await getDocs(recentQuery);
        const recentReviewsContainer = document.getElementById("recentReviewsContainer");
        recentReviewsContainer.innerHTML = ""; // clear existing reviews

        // console.log("Fetched reviews count:", querySnapshot.size);

        querySnapshot.forEach(docSnap => {
            const reviewData = docSnap.data();

            const reviewCard = document.createElement("div");
            reviewCard.classList.add("review-card");

            // takes you to your review when you click on the poster in recent reviews
            reviewCard.addEventListener("click", () => {
                localStorage.setItem("selectedMovie", JSON.stringify(reviewData));
                window.location.href = "viewReviewPage.html";
            });

            // generate star rating with half-star support
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


        // console.log("Recent reviews loaded successfully!");
    } catch (error) {
        console.error("Error fetching recent reviews:", error);
    }
}

async function updateFollowCounts(username) {
    try {
        const followingRef = collection(db, "users", username, "following");
        const followingSnap = await getDocs(followingRef);
        const followingCount = followingSnap.size;

        document.getElementById("FollowingCount").textContent = `Following: ${followingCount}`;
    } catch (error) {
        console.error("error fetching following count:", error);
    }
}

async function updateFollowersCount(username) {
    try {
        const followersRef = collection(db, "users", username, "followers");
        const followersSnap = await getDocs(followersRef);
        const followersCount = followersSnap.size;

        document.getElementById("FollowersCount").textContent = `Followers: ${followersCount}`;
    } catch (error) {
        console.error("error fetching followers count:", error);
    }
}

// load recent reviews when profile page loads
document.addEventListener("DOMContentLoaded", loadRecentReviews);

document.addEventListener("DOMContentLoaded", () => {
    const followCount = document.getElementById("FollowingCount");

    if (followCount) {
        followCount.style.cursor = "pointer"; // make it look clickable
        followCount.title = "View who you're following";

        followCount.addEventListener("click", () => {
            window.location.href = "followingPage.html"; // adjust the path if needed
        });
    }
});