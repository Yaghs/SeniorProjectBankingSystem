// our special API key
const API_KEY = "bc7c4e7c62d9e223e196bbd15978fc51";
// retrieves selected actor's data from local storage
const actor = JSON.parse(localStorage.getItem("selectedActor"));

// waits until html is loaded before we run the code
document.addEventListener("DOMContentLoaded", () => {
    // checks if actor is stored in local storage
    if (actor) {
        // fetch details on that actor based on their actor id
        fetchActorDetails(actor.id);
    } else {
        // if actor is not stored in local storage return home
        window.location.href = "homePage.html";
    }
});


// fetches information about the actor using their id
async function fetchActorDetails(actorId) {
    // initiate request to tmdb api to get info
    try {
        // await used bc its async
        const response = await fetch(
            // /person/${actorId} is the endpoint to getting actor details
            // ?api_key=${API_KEY} authenticates request using our api key
            `https://api.themoviedb.org/3/person/${actorId}?api_key=${API_KEY}`
        );
        // convert api response to json
        const data = await response.json();

        // set src of image to display actors picture
        // ${data.profile_path} is our path to get actors img
        // placeholder img will be used if no img is available
        document.getElementById("actorImage").src = data.profile_path
            ? `https://image.tmdb.org/t/p/original${data.profile_path}`
            : "https://via.placeholder.com/300?text=No+Image";

        // display actors bio in the actorBio container
        document.getElementById("actorBio").textContent = data.biography || "Biography not available.";

        // calls fetchKnownMovies to retrieve movies actor is known for using actorId
        fetchKnownMovies(actorId);
    } catch (error) {
        console.error("error fetching actor details:", error);
        alert("failed to load actor details");
    }
}

// fetches movies actor is known for
async function fetchKnownMovies(actorId) {
    // initiate request to tmdb api to get info
    try {
        // await used bc its async
        // /person/${actorId}/movie_credits tmdb endpoint to get all movies actor has been in
        const response = await fetch(
            `https://api.themoviedb.org/3/person/${actorId}/movie_credits?api_key=${API_KEY}`
        );
        // convert api response to json
        const data = await response.json();

        // sorts movies be popularity using .sort()
        // .slice(0, 30) lists top 30 movies
        const knownMovies = data.cast.sort((a, b) => b.popularity - a.popularity).slice(0, 30);
        // selects container where list of known movies will be displayed
        const knownMoviesDiv = document.getElementById("knownMovies");

        knownMoviesDiv.innerHTML = ""; // clear previous entries

        // loop through known movies
        knownMovies.forEach(movie => {
            // create new <div>
            const movieItem = document.createElement("div");
            // add css class movie-item for styling
            movieItem.classList.add("movie-item");
            // cursor is a pointer
            movieItem.style.cursor = "pointer";
            // sets img and title for each movie
            movieItem.innerHTML = `
                <img src="https://image.tmdb.org/t/p/w300${movie.poster_path}" alt="${movie.title}">
                <p>${movie.title}</p>
            `;

            // makes movie item clickable
            movieItem.addEventListener("click", () => {
                // save selected movie into localStorage
                localStorage.setItem("selectedMovie", JSON.stringify(movie));
                // redirect to moviePage
                window.location.href = "moviePage.html";
            });

            // append each movieItem to knownMoviesDiv
            knownMoviesDiv.appendChild(movieItem);
        });
    } catch (error) {
        console.error("error fetching known movies:", error);
        alert("failed to load known movies.");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const reviewBtn = document.getElementById("reviewBtn");
    const reviewModal = document.getElementById("reviewBox");
    const closeModal = document.querySelectorAll(".close");
    const currentMovieSpan = document.getElementById("currentMovie");
    const searchPage = document.getElementById("reviewSearchPage");
    const reviewForm = document.getElementById("reviewForm");
    const backBtn = document.getElementById("backBtn");
    const reviewSearchInput = document.getElementById("reviewSearch");
    const reviewSuggestions = document.getElementById("reviewSuggestions");
    const watchedDateInput = document.getElementById("watchedDate");

    const API_KEY = "bc7c4e7c62d9e223e196bbd15978fc51";

    if (watchedDateInput) {
        // get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        watchedDateInput.value = today; // set input value
    }

    const movie = JSON.parse(localStorage.getItem("selectedMovie"));
    if (movie) {
        currentMovieSpan.textContent = `${movie.title} (${movie.release_date.split("-")[0]})`;
        document.getElementById("reviewMovieTitle").textContent = movie.title;
        document.getElementById("reviewMovieYear").textContent = movie.release_date.split("-")[0];
        document.getElementById("reviewMoviePoster").src = movie.poster_path
            ? `https://image.tmdb.org/t/p/original${movie.poster_path}`
            : "https://via.placeholder.com/300?text=No+Image";
    }

    // open pop-up when +Review is clicked
    reviewBtn.addEventListener("click", () => {
        reviewModal.style.display = "flex";
    });

    // close pop-up when X button is clicked
    closeModal.forEach(button => {
        button.addEventListener("click", () => {
            reviewModal.style.display = "none";
            searchPage.style.display = "block";
            reviewForm.style.display = "none";
            reviewSuggestions.style.display = "none"; // Hide search results when closing
        });
    });

    // transition to review form when clicking movie name
    currentMovieSpan.addEventListener("click", () => {
        searchPage.style.display = "none";
        reviewForm.style.display = "block";
    });

    // back button to return to search page
    backBtn.addEventListener("click", () => {
        searchPage.style.display = "block";
        reviewForm.style.display = "none";
    });

    reviewSearchInput.addEventListener("input", async () => {
        const query = reviewSearchInput.value.trim();
        if (query.length < 2) {
            reviewSuggestions.style.display = "none";
            return;
        }

        try {
            const movies = await fetchMovies(query);
            displayReviewSuggestions(movies);
        } catch (error) {
            console.error("Error fetching search results:", error);
        }
    });

    // sends request to tmdb api to search for movies that match what user is typing
    async function fetchMovies(query) {
        // await used bc its async
        // encodeURIComponent used to handle special characters
        const response = await fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
        );
        // converts api response to json
        const data = await response.json();
        // returns results array from api response
        return data.results;
    }

    // displays movie suggestions from the search bar in pop up
    function displayReviewSuggestions(movies) {
        reviewSuggestions.innerHTML = ""; // clears previous suggestions

        // checks if no movies were found
        if (movies.length === 0) {
            // if non were found we hide the suggestions container
            reviewSuggestions.style.display = "none";
            // exit functions
            return;
        }

        // loops through each movie in the array
        movies.forEach(movie => {
            // create new <div>
            const suggestion = document.createElement("div");
            // set text to movie title and year
            suggestion.textContent = `${movie.title} (${movie.release_date ? movie.release_date.split("-")[0] : "Unknown"})`;
            // click event listener that calls selectReviewMovie function
            suggestion.addEventListener("click", () => selectReviewMovie(movie));
            // adds suggestions to the suggestion container
            reviewSuggestions.appendChild(suggestion);
        });
        // makes suggestion container visible
        reviewSuggestions.style.display = "block";
    }

    function selectReviewMovie(movie) {
        localStorage.setItem("selectedMovie", JSON.stringify(movie));

        // Update UI in both the search page and the review form
        // currentMovieSpan.textContent = `${movie.title} (${movie.release_date ? movie.release_date.split("-")[0] : "Unknown"})`;
        document.getElementById("reviewMovieTitle").textContent = movie.title;
        document.getElementById("reviewMovieYear").textContent = movie.release_date ? movie.release_date.split("-")[0] : "Unknown";
        document.getElementById("reviewMoviePoster").src = movie.poster_path
            ? `https://image.tmdb.org/t/p/original${movie.poster_path}`
            : "https://via.placeholder.com/300?text=No+Image";

        // hide suggestions after selection
        reviewSuggestions.style.display = "none";

        // transition to the review form after selecting movie
        searchPage.style.display = "none";
        reviewForm.style.display = "block";
    }

});

// stars stores elements with class .rating-star
const stars = document.querySelectorAll(".rating-star");
// keeps track of users selected ratings (set to 0)
let selectedRating = 0;

// loops through all stars
stars.forEach(star => {
    // listens to mouse event (hover)
    star.addEventListener("mousemove", (e) => {
        // starValue gets numerical value
        const starValue = parseInt(star.getAttribute("data-value"));
        // rect stores position and size of star
        const rect = star.getBoundingClientRect();
        // position calculates if cursor is on left or right of star
        const position = (e.clientX - rect.left) / rect.width;

        // clears previous highlights, resets all stars to empty
        stars.forEach(s => {
            s.querySelector('i').classList.remove('highlighted');
            s.querySelector('i').className = 'bx bx-star';
        });

        // fills all stars before hovered star
        stars.forEach(s => {
            const sValue = parseInt(s.getAttribute("data-value"));
            if (sValue < starValue) {
                s.querySelector('i').classList.add('highlighted');
                s.querySelector('i').className = 'bx bxs-star highlighted'; // Full star
            }
        });

        // if you hover over left half of star, fills as half a star
        if (position <= 0.5) {
            star.querySelector('i').classList.add('highlighted');
            star.querySelector('i').className = 'bx bxs-star-half highlighted'; // half star
            // if you hover over right half of star, fills as full star
        } else {
            star.querySelector('i').classList.add('highlighted');
            star.querySelector('i').className = 'bx bxs-star highlighted'; // full star
        }
    });

    // event listener that listens for when user clicks on the star
    star.addEventListener("click", (e) => {
        // starValue gets numerical value
        const starValue = parseInt(star.getAttribute("data-value"));
        // rect stores position and size of star
        const rect = star.getBoundingClientRect();
        // position calculates if cursor is on left or right of star
        const position = (e.clientX - rect.left) / rect.width;

        // if the user clicks the same rating already selected, reset to 0
        if (selectedRating === starValue || selectedRating === starValue - 0.5) {
            selectedRating = 0;
        } else {
            // if you click left half, set rating to half the value
            if (position <= 0.5) {
                selectedRating = starValue - 0.5;
                // if you click right half, set rating to full value
            } else {
                selectedRating = starValue;
            }
        }
        // call updateStarsDisplay() to visually update stars based on new rating
        updateStarsDisplay();
    });
});

// when mouse leaves rating container, reset stars to reflect selected rating
document.querySelector('.rating-container').addEventListener('mouseleave', () => {
    updateStarsDisplay();
});

// function updates the stars displayed
function updateStarsDisplay() {
    // fullStars extracts whole number portion (aka 3 from 3.5)
    const fullStars = Math.floor(selectedRating);
    // hasHalfStar checks if rating includes half a star
    const hasHalfStar = selectedRating % 1 !== 0;

    // loops through each .rating-star element
    stars.forEach(s => {
        // retrieves numeric rating from stars data-value
        // converts it into an integer
        const starValue = parseInt(s.getAttribute("data-value"));
        // finds the <i> element inside the star
        const icon = s.querySelector('i');

        // remove existing highlight and selection
        icon.classList.remove('highlighted', 'selected');

        // if stars data-value is less than or equal to the selected rating
        if (starValue <= fullStars) {
            // change icon to fully filled yellow star
            // add selected class to indicate its chosen
            icon.className = 'bx bxs-star selected';
            // handles half a star
        } else if (hasHalfStar && starValue === fullStars + 1) {
            icon.className = 'bx bxs-star-half selected';
            // handles empty stars
        } else {
            icon.className = 'bx bx-star';
        }
    });
}

// selects heart icon for liking the movie
const likeButton = document.getElementById("likeButton");

// adds or removes .liked when clicked
likeButton.addEventListener("click", () => {
    likeButton.classList.toggle("liked");

    // if liked, show filled heart
    if (likeButton.classList.contains("liked")) {
        likeButton.innerHTML = "<i class='bx bxs-heart'></i>";
        // otherwise show empty heart
    } else {
        likeButton.innerHTML = "<i class='bx bx-heart'></i>";
    }
});

// wait for entire html to load before running any js code
document.addEventListener("DOMContentLoaded", () => {
    const changePosterBtn = document.getElementById("changePosterBtn");
    const posterModal = document.getElementById("posterModal");
    const closePosterModal = document.querySelector(".close");
    const posterGrid = document.getElementById("posterGrid");
    const savePosterBtn = document.getElementById("savePosterBtn");
    let selectedPosterUrl = "";

    const API_KEY = "bc7c4e7c62d9e223e196bbd15978fc51";

    // function to fetch posters when a movie is selected
    async function fetchPosters(movieId) {
        // initiate request to api to get movie info
        try {
            // await bc its async
            const response = await fetch(
                `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&append_to_response=images&include_image_language=en,null`
            );
            // convert api response to json
            const data = await response.json();
            // returns image posters
            return data.images.posters || [];
        } catch (error) {
            // console.error("Error fetching posters:", error);
            return [];
        }
    }

    // function to update the poster grid
    function updatePosterGrid(posters) {
        posterGrid.innerHTML = ""; // clear previous posters

        // loops through all posters and returns all of them
        posters.forEach(poster => {
            // create new element <img>
            const img = document.createElement("img");
            // set img src to tmdb url path
            img.src = `https://image.tmdb.org/t/p/original${poster.file_path}`;
            // add event listener for selecting the poster
            img.addEventListener("click", () => {
                // remove "selected" class from all previously selected posters
                document.querySelectorAll(".poster-grid img").forEach(img => img.classList.remove("selected"));
                // adds selected class to the img that is being clicked
                img.classList.add("selected");
                // store img src in selectedPosterUrl
                selectedPosterUrl = img.src;
            });
            // append each new poster in modal
            posterGrid.appendChild(img);
        });
    }

    // open poster modal when "Change Poster" is clicked
    if (changePosterBtn) {
        // event listener for when you click on the change poster button
        changePosterBtn.addEventListener("click", async () => {
            // retrieves currently selected movie from storage
            const storedMovie = JSON.parse(localStorage.getItem("selectedMovie"));
            // error if no movie was found
            if (!storedMovie) {
                // console.warn("No movie found in localStorage.");
                return;
            }
            // fetches alternative posters
            const posters = await fetchPosters(storedMovie.id);
            // updates grid with posters
            updatePosterGrid(posters);
            // displays the posterModal pop up
            posterModal.style.display = "flex";
        });
    }

    // close the poster modal without closing everything
    const closePosterBtn = posterModal.querySelector(".poster-close"); // ensure we target the close button inside poster modal

    if (closePosterBtn) {
        closePosterBtn.addEventListener("click", () => {
            posterModal.style.display = "none"; // only close the poster modal
            reviewForm.style.display = "block"; // ensure review form remains open
        });
    }

    // save selected poster
    if (savePosterBtn) {
        // event listener for when you click save
        savePosterBtn.addEventListener("click", () => {
            // update review form poster with newly selected poster only if a selection was made
            if (selectedPosterUrl) {
                document.getElementById("reviewMoviePoster").src = selectedPosterUrl;
            }
            // closes modal after you his save
            posterModal.style.display = "none";
        });
    }
});