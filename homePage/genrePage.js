// Our special API key
const API_KEY = "bc7c4e7c62d9e223e196bbd15978fc51";
// Retrieves selected genre's data from local storage
const genre = JSON.parse(localStorage.getItem("selectedGenre"));

let currentPage = 1; // track current page for pagination
let loading = false; // prevent multiple fetches
let totalPages = 1; // store total pages from API
let sortBy = "popularity.desc"; // default sorting

// ensures script runs after page is loaded
document.addEventListener("DOMContentLoaded", async () => {
    // checks if no genre was chosen
    if (!genre) {
        document.body.innerHTML = "<h2>Error: No genre selected.</h2>";
        return;
    }

    const genreTitleElement = document.getElementById("genreTitle"); // displays genre title
    const movieCountElement = document.getElementById("movieCount"); // displays movie count
    const movieGrid = document.getElementById("movieGrid"); // container where movies are displayed on a grid
    const movieInfo = document.getElementById("movieInfo"); // wrapper for movie count, shows after data is loaded
    const sortDropdown = document.getElementById("sortDropdown"); // drop down menu for sorting

    const genreId = genre.id;

    // calls loadMovies to fetch and display first batch of movies
    await loadMovies(genreId, movieCountElement, movieGrid);

    // show movie info only after first batch is loaded
    movieInfo.style.visibility = "visible";

    // adds infinite scroll event listener
    // !loading prevents multiple API calls at once
    window.addEventListener("scroll", async () => {
        if (
            window.innerHeight + window.scrollY >= document.body.offsetHeight - 300 &&
            !loading &&
            currentPage <= totalPages
        ) {
            // when you reach the bottom of the page, call loadMovies to load more movies
            await loadMovies(genreId, movieCountElement, movieGrid);
        }
    });

    // sorting dropdown menu functionality
    if (sortDropdown) {
        // listens to a change in the sort
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
    loading = true; // ensures only one request runs at a time

    try {
        // calls tmdb to fetch movies based on genre and sort
        // &sort_by=${sortBy} ensures selected sorting method is used
        // page=${currentPage} loads the correct page of results
        // language=en-US&with_original_language=en filters out non-english movies
        const response = await fetch(
            `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&sort_by=${sortBy}&page=${currentPage}&language=en-US&with_original_language=en`
        );
        const data = await response.json();

        // updates the total movie count but only for the first page
        if (currentPage === 1) {
            movieCountElement.textContent = data.total_results; // update total movie count
            totalPages = Math.ceil(data.total_results / 35); // adjust total pages based on 35 per load
        }

        // loops through the first 35 movies, fetches and displays them
        data.results.slice(0, 35).forEach((movie) => {
            const movieCard = document.createElement("div");
            movieCard.classList.add("movie-card");
            // displays poster and title
            movieCard.innerHTML = `
                <img src="https://image.tmdb.org/t/p/original${movie.poster_path}" alt="${movie.title}">
                <p>${movie.title}</p>
            `;

            // if you click on any of the movies, save that selectedMovie in the localStorage and direct to moviePage
            movieCard.addEventListener("click", () => {
                localStorage.setItem("selectedMovie", JSON.stringify(movie));
                window.location.href = "moviePage.html";
            });

            // adds generated movie care to the grid
            movieGrid.appendChild(movieCard);
        });

        currentPage++; // move to next page

    } catch (error) {
        // console.error("Error fetching movies:", error);
        document.body.innerHTML = "<h2>Error loading movies.</h2>";
    } finally {
        loading = false; // Allow new fetches after this one completes
    }
}
