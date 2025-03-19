const API_KEY = "bc7c4e7c62d9e223e196bbd15978fc51";
const searchInput = document.getElementById("searchInput");
const suggestionsDiv = document.getElementById("suggestions");

searchInput.addEventListener("input", async () => {
    const query = searchInput.value.trim();
    if (query.length < 2) {
        suggestionsDiv.style.display = "none";
        return;
    }

    const [movies, actors] = await Promise.all([
        fetchMovies(query),
        fetchActors(query)
    ]);

    displaySuggestions(movies, actors);
});

async function fetchMovies(query) {
    const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    return data.results;
}

async function fetchActors(query) {
    const response = await fetch(
        `https://api.themoviedb.org/3/search/person?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
    );
    const data = await response.json();

    // Filter to only include ACTORS
    return data.results.filter(person => person.known_for_department === "Acting");
}

function displaySuggestions(movies, actors) {
    suggestionsDiv.innerHTML = "";

    if (movies.length === 0 && actors.length === 0) {
        suggestionsDiv.style.display = "none";
        return;
    }

    movies.forEach(movie => {
        const suggestion = document.createElement("div");
        suggestion.classList.add("suggestion");
        suggestion.textContent = `${movie.title} (${movie.release_date ? movie.release_date.split("-")[0] : "Unknown"})`;
        suggestion.addEventListener("click", () => selectMovie(movie));
        suggestionsDiv.appendChild(suggestion);
    });

    // Add Actors to the Dropdown
    actors.forEach(actor => {
        const suggestion = document.createElement("div");
        suggestion.classList.add("suggestion");
        suggestion.textContent = `${actor.name}`;
        suggestion.addEventListener("click", () => selectActor(actor));
        suggestionsDiv.appendChild(suggestion);
    });

    suggestionsDiv.style.display = "block";
}

function selectMovie(movie) {
    localStorage.setItem("selectedMovie", JSON.stringify(movie));
    window.location.href = "moviePage.html";
}

function selectActor(actor) {
    localStorage.setItem("selectedActor", JSON.stringify(actor));
    window.location.href = "actorPage.html";
}

