// our special api key
const API_KEY = "bc7c4e7c62d9e223e196bbd15978fc51";
// retrieves selected crew members data from local storage
const crew = JSON.parse(localStorage.getItem("selectedCrew"));

// waits until html is loaded before we run the code
document.addEventListener("DOMContentLoaded", () => {
    // checks if crew data is available
    if (crew) {
        // if true call fetchCrewDetails function
        fetchCrewDetails(crew.id, crew.name, crew.role);
    }
    else {
            window.location.href = "homePage.html";
        }
});

// function fetches information about the crew member using their id, name and role
async function fetchCrewDetails(crewId, crewName, crewRole) {
    // initiate request to tmdb api to get info
    try {
        // await used bc its async
        const response = await fetch(
            // /person/${crewId} is the endpoint to getting crew member details
            // ?api_key=${API_KEY} authenticates request using our api key
            `https://api.themoviedb.org/3/person/${crewId}?api_key=${API_KEY}`
        );
        // convert api response to json
        const data = await response.json();

        document.getElementById("roleTitle").textContent = `${getRoleTitle(crewRole)} ${crewName}`;

        // set src of image to display crew members picture
        // ${data.profile_path} is our path to get crew members img
        // placeholder img will be used if no img is available
        document.getElementById("crewImage").src = data.profile_path
            ? `https://image.tmdb.org/t/p/original${data.profile_path}`
            : "https://via.placeholder.com/300?text=No+Image";

        // display crew members bio in the crewBio container
        document.getElementById("crewBio").textContent = data.biography || "Biography not available.";

        // calls fetchCrewMovies using crewId and crewRole to get movies this crew member was involved with
        fetchCrewMovies(crewId, crewRole);
    } catch (error) {
        // console.error("error fetching crew details:", error);
        alert("Failed to load crew details.");
    }
}

// function fetches movies crew member has been involved with
async function fetchCrewMovies(crewId, crewRole) {
    // initiate request to tmdb api to get info
    try {
        // await used bc its async
        // /person/${crewId}/movie_credits tmdb endpoint to get all movies crew member has been in
        const response = await fetch(
            `https://api.themoviedb.org/3/person/${crewId}/movie_credits?api_key=${API_KEY}`
        );
        // convert api response to json
        const data = await response.json();

        // sorts movies be popularity using .sort()
        const crewMovies = data.crew.filter(movie => movie.job === crewRole && !movie.adult)
            .sort((a, b) => b.popularity - a.popularity);

        // selects container where list of known movies will be displayed
        const crewMoviesDiv = document.getElementById("crewMovies");
        crewMoviesDiv.innerHTML = ""; // clear previous entries

        // loop through each movie and display them
        crewMovies.forEach(movie => {
            // create new <div>
            const movieItem = document.createElement("div");
            // add css class movie-item for styling
            movieItem.classList.add("movie-item");
            // sets img and title for each movie
            const isAdult = movie.adult === true;
            const blurClass = isAdult ? "blurred-poster" : "";

            movieItem.innerHTML = `
                <img src="https://image.tmdb.org/t/p/w300${movie.poster_path}" alt="${movie.title}" class="${blurClass}">
                <p>${movie.title}</p>
            `;

            // makes movie item clickable
            movieItem.addEventListener("click", () => {
                // save selected movie into localStorage
                localStorage.setItem("selectedMovie", JSON.stringify(movie));
                // redirect to moviePage
                window.location.href = "moviePage.html";
            });
            // append each movieItem to crewMoviesDiv
            crewMoviesDiv.appendChild(movieItem);
        });
    } catch (error) {
        console.error("Error fetching crew movies:", error);
        alert("Failed to load crew movies.");
    }
}

// function will convert roles to readable titles in display
function getRoleTitle(job) {
    const roleTitles = {
        "Director": "Films Directed By",
        "Producer": "Films Produced By",
        "Executive Producer": "Films Executive Produced By",
        "Novel": "Films Written By",
        "Screenplay": "Films With Screenplays By",
        "Director of Photography": "Films Shot By",
        "Editor": "Films Edited By",
        "Casting": "Films Cast By",
        "Original Music Composer": "Films With Music Composed By",
        "Costume Design": "Films With Costumes Designed By",
        "Sound Designer": "Films With Sound Designed By",
        "Sound Mixer": "Films With Sound Mixed By",
        "Visual Effects Supervisor": "Films With Visual Effects Supervised By",
        "Visual Effects Producer": "Films With Visual Effects Produced By"
    };

    // default if role is not available
    return roleTitles[job] || "involved with";
}
document.addEventListener("click", function (e) {
    if (e.target.classList.contains("sign-out")) {
        e.preventDefault();
        localStorage.clear();
        window.location.replace("/login&create/index.html");
    }
});
