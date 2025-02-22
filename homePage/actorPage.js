// our special API key
const API_KEY = "bc7c4e7c62d9e223e196bbd15978fc51";
// retrieves selected actor's data from local storage
const actor = JSON.parse(localStorage.getItem("selectedActor"));

// waits until html is loaded before we run the code
document.addEventListener("DOMContentLoaded", () => {
    // search bar
    const searchInput = document.getElementById("searchInput");
    // suggestions that appear below search bar
    const suggestionsDiv = document.getElementById("suggestions");

    // checks if search bar exists on page
    if (searchInput) {
        // adds input event listener to detect when user starts to type
        searchInput.addEventListener("input", async () => {
            // retrieves value in search bar, trims an whitespaces
            const query = searchInput.value.trim();
            // starts searching if at least two characters are typed
            if (query.length < 2) {
                suggestionsDiv.style.display = "none";
                return;
            }
            // calls fetchMovies to get suggestions, use await bc its async
            const movies = await fetchMovies(query);
            // displays those suggestions
            displaySuggestions(movies);
        });
    }
    // checks if actor is stored in local storage
    if (actor) {
        // fetch details on that actor based on their actor id
        fetchActorDetails(actor.id);
    } else {
        // if actor is not stored in local storage return home
        window.location.href = "homePage.html";
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

// displays the movie suggestions from the search bar
function displaySuggestions(movies) {
    // initialize our suggestions container as suggestionDiv
    const suggestionsDiv = document.getElementById("suggestions");
    suggestionsDiv.innerHTML = ""; // clears previous suggestions

    // checks if no movies were found
    if (movies.length === 0) {
        // if none were found we hide the suggestions container
        suggestionsDiv.style.display = "none";
        // exit function
        return;
    }

    // loops through each movie in the array
    movies.forEach(movie => {
        // create new <div>
        const suggestion = document.createElement("div");
        // add css class suggestion for styling
        suggestion.classList.add("suggestion");
        // set text to the movies title
        suggestion.textContent = movie.title;
        // click event listener that calls selectMovie function
        suggestion.addEventListener("click", () => selectMovie(movie));
        // adds suggestions to the suggestion container
        suggestionsDiv.appendChild(suggestion);
    });

    // make suggestion container visible
    suggestionsDiv.style.display = "block";
    // makes sure suggestion container is above all other elements on page
    suggestionsDiv.style.zIndex = "999";
}

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
            ? `https://image.tmdb.org/t/p/w500${data.profile_path}`
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
                // log each movie title for debugging
                console.log("selected Movie:", movie.title);
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

// handles when a user selects a movie
function selectMovie(movie) {
    // saves movie object in the local storage
    localStorage.setItem("selectedMovie", JSON.stringify(movie));
    if (window.location.href.includes("homePage")) {
        window.location.href = "moviePage.html";
    } else {
        window.location.href = "moviePage.html";
    }
}