// our special api key
const API_KEY = "bc7c4e7c62d9e223e196bbd15978fc51";
// retrieves selected movie's data from local storage
const movie = JSON.parse(localStorage.getItem("selectedMovie"));

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
    // checks if movie is stored in local storage
    if (movie) {
        // set to movie title
        document.title = movie.title;
        // fetch details on movie based on the movie id
        fetchMovieDetails(movie.id);
    } else {
        // if move is not stored in local storage return home
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

// handles when a user selects a movie
function selectMovie(movie) {
    // saves movie object in the local storage
    localStorage.setItem("selectedMovie", JSON.stringify(movie));
    // calls fetchMovieDetails to get movie details base on movie id
    fetchMovieDetails(movie.id);
    // clears search bar
    document.getElementById("searchInput").value = "";
    // removes suggestions
    document.getElementById("suggestions").style.display = "none";
}

// fetches info on movie using its movieId
async function fetchMovieDetails(movieId) {
    // initiate request to tmdb api to get info
    try {
        // await used bc its async
        const response = await fetch(
            // /movie/${movieID} is the endpoint for getting movie details
            // ?api_key=${API_KEY} authenticates request using our api key
            // &append_to_response=credits tells tmdb to include movies cast and crew
            `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits`
        );
        // convert api response to json
        const data = await response.json();

        // sets text content of movieTitle element to movie's title
        document.getElementById("movieTitle").textContent = data.title;
        // sets background img of movieBanner using movie's backdrop img
        // https://image.tmdb.org/t/p/original base url for hq imgs
        // ${data.backdrop_path} path to backdrop img
        document.getElementById("movieBanner").style.backgroundImage = `url(https://image.tmdb.org/t/p/original${data.backdrop_path})`;
        // sets src attribute of moviePoster img element
        // https://image.tmdb.org/t/p/w500 base url for poster imgs
        // ${data.poster_path} path to movie's poster
        document.getElementById("moviePoster").src = `https://image.tmdb.org/t/p/w500${data.poster_path}`;
        // displays movies description in movieDescription container
        // if no description is available display "no description available"
        document.getElementById("movieDescription").textContent = data.overview || "No description available.";
        // displays release year
        // data.release_date.split("-")[0] splits release date with - to get only first part (year)
        document.getElementById("releaseYear").textContent = data.release_date.split("-")[0] || "Unknown Year";

        // searches through movie crew list to find director
        // loops through crew members, returns crew member whose "job" (person.job) is director
        const director = data.credits.crew.find(person => person.job === "Director");
        // displays directors name, if not available display "unknown"
        document.getElementById("movieDirector").textContent = director ? director.name : "Unknown";

        // calls displayCast function to display the movies cast
        displayCast(data.credits.cast);
    } catch (error) {
        alert("failed to load movie details");
    }
}

// displays the movies cast
function displayCast(cast) {
    // selects container where cast list will be displayed
    const castList = document.getElementById("castList");
    // clears any previous entries
    castList.innerHTML = "";

    // loops through first 25 actors in cast list
    cast.slice(0, 25).forEach(actor => {
        // creates element <li> to list each actor
        const listItem = document.createElement("li");
        // use span with class for styling and data-actor-id and data-actor-name to store actor details
        // after actors name, display the character they played
        listItem.innerHTML = `<span class="actor-name" data-actor-id="${actor.id}" data-actor-name="${actor.name}">
            ${actor.name}
        </span> as ${actor.character}`;
        // add that actor to the list and restart loop
        castList.appendChild(listItem);
    });

    // adds click event listener to castList container
    castList.addEventListener("click", function(event) {
        const target = event.target;
        // check if clicked element has actor-name class
        if (target.classList.contains("actor-name")) {
            // retrieve data-actor-id as actorId
            const actorId = target.getAttribute("data-actor-id");
            // retrieve data-actor-name as actorName
            const actorName = target.getAttribute("data-actor-name");
            // calls selectActor with these details
            selectActor(actorId, actorName);
        }
    });
}

// saves actors id and name in the local storage
function selectActor(actorId, actorName) {
    localStorage.setItem("selectedActor", JSON.stringify({ id: actorId, name: actorName }));
    window.location.href = "actorPage.html";
}