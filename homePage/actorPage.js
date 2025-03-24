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