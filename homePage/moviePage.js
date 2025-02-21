const API_KEY = "bc7c4e7c62d9e223e196bbd15978fc51";
const movie = JSON.parse(localStorage.getItem("selectedMovie"));

document.addEventListener("DOMContentLoaded", () => {

    const searchInput = document.getElementById("searchInput");
    const suggestionsDiv = document.getElementById("suggestions");

    if (searchInput) {
        searchInput.addEventListener("input", async () => {
            const query = searchInput.value.trim();

            if (query.length < 2) {
                suggestionsDiv.style.display = "none";
                return;
            }

            const movies = await fetchMovies(query);
            displaySuggestions(movies);
        });
    }

    if (movie) {
        document.title = movie.title;
        fetchMovieDetails(movie.id);
    } else {
        window.location.href = "homePage.html";
    }
});

async function fetchMovies(query) {
    const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    return data.results;
}

function displaySuggestions(movies) {
    const suggestionsDiv = document.getElementById("suggestions");
    suggestionsDiv.innerHTML = ""; // Clear previous suggestions

    if (movies.length === 0) {
        suggestionsDiv.style.display = "none";
        return;
    }

    movies.forEach(movie => {
        const suggestion = document.createElement("div");
        suggestion.classList.add("suggestion");
        suggestion.textContent = movie.title;
        suggestion.addEventListener("click", () => selectMovie(movie));
        suggestionsDiv.appendChild(suggestion);
    });

    suggestionsDiv.style.display = "block";
    suggestionsDiv.style.zIndex = "999";
}

function selectMovie(movie) {
    console.log("🎬 Selected Movie:", movie);
    localStorage.setItem("selectedMovie", JSON.stringify(movie));
    fetchMovieDetails(movie.id);
    document.getElementById("searchInput").value = "";
    document.getElementById("suggestions").style.display = "none";
}

async function fetchMovieDetails(movieId) {
    try {
        const response = await fetch(
            `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits`
        );
        const data = await response.json();

        document.getElementById("movieTitle").textContent = data.title;
        document.getElementById("movieBanner").style.backgroundImage = `url(https://image.tmdb.org/t/p/original${data.backdrop_path})`;
        document.getElementById("moviePoster").src = `https://image.tmdb.org/t/p/w500${data.poster_path}`;
        document.getElementById("movieDescription").textContent = data.overview || "No description available.";
        document.getElementById("releaseYear").textContent = data.release_date.split("-")[0] || "Unknown Year";

        const director = data.credits.crew.find(person => person.job === "Director");
        document.getElementById("movieDirector").textContent = director ? director.name : "Unknown";

        const castList = document.getElementById("castList");
        castList.innerHTML = "";
        data.credits.cast.slice(0, 25).forEach(actor => {
            const listItem = document.createElement("li");
            listItem.textContent = `${actor.name} as ${actor.character}`;
            castList.appendChild(listItem);
        });
    } catch (error) {
        alert("Failed to load movie details");
    }
}

