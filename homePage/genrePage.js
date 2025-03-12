// our special API key
const API_KEY = "bc7c4e7c62d9e223e196bbd15978fc51";
// retrieves selected genre's data from local storage
const genre = JSON.parse(localStorage.getItem("selectedGenre"));

let currentPage = 1; // track current page for pagination
let loading = false; // prevent multiple fetches
let totalPages = 1; // store total pages from API
let sortBy = "popularity.desc"; // default sorting

document.addEventListener("DOMContentLoaded", async () => {
    if (!genre) {
        document.body.innerHTML = "<h2>Error: No genre selected.</h2>";
        return;
    }

    const genreTitleElement = document.getElementById("genreTitle");
    const movieCountElement = document.getElementById("movieCount");
    const movieGrid = document.getElementById("movieGrid");
    const movieInfo = document.getElementById("movieInfo");
    const sortDropdown = document.getElementById("sortDropdown");

    const genreTitle = genre.name;
    const genreId = genre.id;
    document.title = `${genreTitle} Movies`;
    genreTitleElement.textContent = genreTitle;

    await loadMovies(genreId, movieCountElement, movieGrid);

    // show movie info only after first batch is loaded
    movieInfo.style.visibility = "visible";

    // add infinite scroll event listener
    window.addEventListener("scroll", async () => {
        if (
            window.innerHeight + window.scrollY >= document.body.offsetHeight - 300 &&
            !loading &&
            currentPage <= totalPages
        ) {
            await loadMovies(genreId, movieCountElement, movieGrid);
        }
    });

    // handles drop down for sorting
    if (sortDropdown) {
        sortDropdown.addEventListener("change", async (event) => {
            sortBy = event.target.value; // update sorting option
            currentPage = 1; // reset pagination
            movieGrid.innerHTML = ""; // clear current movies
            await loadMovies(genreId, movieCountElement, movieGrid); // reload with new sorting
        });
    }
});

// function to fetch and display movies
async function loadMovies(genreId, movieCountElement, movieGrid) {
    if (loading) return; // prevent multiple fetches
    loading = true;

    try {
        const response = await fetch(
            `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&sort_by=${sortBy}&page=${currentPage}&language=en-US&with_original_language=en`
        );
        const data = await response.json();

        if (currentPage === 1) {
            movieCountElement.textContent = data.total_results; // update total movie count
            totalPages = Math.ceil(data.total_results / 35); // adjust total pages based on 35 per load
        }

        data.results.slice(0, 35).forEach((movie) => {
            const movieCard = document.createElement("div");
            movieCard.classList.add("movie-card");

            movieCard.innerHTML = `
                <img src="https://image.tmdb.org/t/p/original${movie.poster_path}" alt="${movie.title}">
                <p>${movie.title}</p>
            `;

            movieCard.addEventListener("click", () => {
                localStorage.setItem("selectedMovie", JSON.stringify(movie));
                window.location.href = "moviePage.html";
            });

            movieGrid.appendChild(movieCard);
        });

        currentPage++; // move to next page

    } catch (error) {
        console.error("Error fetching movies:", error);
        document.body.innerHTML = "<h2>Error loading movies.</h2>";
    } finally {
        loading = false; // allow new fetches after this one completes
    }
}
