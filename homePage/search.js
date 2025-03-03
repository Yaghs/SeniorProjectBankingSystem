const API_KEY = "bc7c4e7c62d9e223e196bbd15978fc51";
const searchInput = document.getElementById("searchInput");
const suggestionsDiv = document.getElementById("suggestions");
const movie = JSON.parse(localStorage.getItem("selectedMovie"));

searchInput.addEventListener("input", async () => {
    const query = searchInput.value.trim();
    if (query.length < 2) {
        suggestionsDiv.style.display = "none";
        return;
    }

    const movies = await fetchMovies(query);
    displaySuggestions(movies);
});

async function fetchMovies(query) {
    const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    return data.results;
}

function displaySuggestions(movies) {
    suggestionsDiv.innerHTML = "";
    if (movies.length === 0) {
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

    suggestionsDiv.style.display = "block";
}

function selectMovie(movie) {
    localStorage.setItem("selectedMovie", JSON.stringify(movie));
    if (window.location.href.includes("homePage")) {
        window.location.href = "moviePage.html";
    } else {
        window.location.href = "moviePage.html";
    }
}
