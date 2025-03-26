import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

const TMDB_API_KEY = "bc7c4e7c62d9e223e196bbd15978fc51";

let profilepic = document.getElementById('profile-pic');
let inputFile = document.getElementById('fileinput');
const editButton = document.getElementById('Edit');
const Bio=document.getElementById("Bio")

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

profilepic.addEventListener("click",function (){
    inputFile.click()
})

inputFile.onchange = function (){

        profilepic.src = URL.createObjectURL(inputFile.files[0]);

}

editButton.addEventListener("click",()=>{
  if(Bio.disabled){
      Bio.removeAttribute("disabled"); //enable text
      editButton.textContent="Save";
  }else{
      Bio.setAttribute("disabled",true);
      editButton.textContent="Edit";
  }

})

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
                index: index // store data-index to correctly load movies
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
                }
            });

            favoriteGrid.style.opacity = "1"; // Reveal grid after loading
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
            // console.log("Review found:", reviewData);

            const reviewCard = document.createElement("div");
            reviewCard.classList.add("review-card");

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


// Load recent reviews when profile page loads
document.addEventListener("DOMContentLoaded", loadRecentReviews);