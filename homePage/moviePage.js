// import firebase dependencies
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc,collection } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
// our special api key
const API_KEY = "bc7c4e7c62d9e223e196bbd15978fc51";
// retrieves selected movie's data from local storage
const movie = JSON.parse(localStorage.getItem("selectedMovie"));
// set our currentPosterIndex to 0, aka the first one
let currentPosterIndex = 0;
// have allPosters be an array to hold all alternative posters
let allPosters = [];
// set our currentBannerIndex to be 0, aka the first one
let currentBannerIndex = 0;
// have all banners be an array to hold all alternative banners
let allBanners = [];

// firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD1LpIBMmZAiQFwberKbx2G29t6fNph3Xg",
    authDomain: "sample-dc6d0.firebaseapp.com",
    projectId: "sample-dc6d0",
    storageBucket: "sample-dc6d0.appspot.com",
    messagingSenderId: "650782048731",
    appId: "1:650782048731:web:d2828c5b87f0a4e62367fe",
    measurementId: "G-WJMEY6J7BR"
};

// initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Log to confirm Firebase initialization
console.log("firebase initialized successfully");

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
        suggestion.textContent = `${movie.title} (${movie.release_date ? movie.release_date.split("-")[0] : "Unknown"})`;
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
    // update the current movie display in the +Review popup
    document.getElementById("currentMovie").textContent = `${movie.title} (${movie.release_date.split("-")[0]})`;
    // update the review form container
    document.getElementById("reviewMovieTitle").textContent = movie.title;
    document.getElementById("reviewMovieYear").textContent = movie.release_date ? movie.release_date.split("-")[0] : "Unknown";
    document.getElementById("reviewMoviePoster").src = movie.poster_path
        ? `https://image.tmdb.org/t/p/original${movie.poster_path}`
        : "https://via.placeholder.com/300?text=No+Image";

    // handles review action box functionality when you search a movie
    loadReviewActionBox(movie.title);

    // handles trailer button functionality when you search for a movie
    setTimeout(() => {
        attachTrailerButtonListener();
    }, 100);
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
            // ,images&include_image_language=en,null tells tmdb to include multiple movie posters in english
            `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits,images&include_image_language=en,null`
        );
        // convert api response to json
        const data = await response.json();
        console.log("Movie Data: ", data); // Debugging line to inspect data

        // sets text content of movieTitle element to movie's title
        document.getElementById("movieTitle").textContent = data.title;
        // sets background img of movieBanner using movie's backdrop img
        // https://image.tmdb.org/t/p/original base url for hq imgs
        // ${data.backdrop_path} path to backdrop img
        //document.getElementById("movieBanner").style.backgroundImage = `url(https://image.tmdb.org/t/p/original${data.backdrop_path})`;
        // sets src attribute of moviePoster img element
        // https://image.tmdb.org/t/p/w500 base url for poster imgs
        // ${data.poster_path} path to movie's poster
        //document.getElementById("moviePoster").src = `https://image.tmdb.org/t/p/w500${data.poster_path}`;
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

        // calls displayCrew function to display the movies crew
        displayCrew(data.credits.crew);

        // calls displayGenre function to display movie genre
        displayGenre(data.credits.genre);

        // calls resetTabs function to reset tabs back to cast
        resetTabs();

        // here we're gonna get alternate posters
        if (data.images && data.images.posters) {
            allPosters = data.images.posters;
            // console.log("Posters Retrieved: ", allPosters);
            displayPoster(0);
        } else {
            console.warn("No posters available for this movie.");
            allPosters = []; // Set to an empty array if no posters are found
        }
        // Store all banners
        if (data.images && data.images.backdrops) {
            allBanners = data.images.backdrops;
            // console.log("banners retrieved: ", allBanners);
            displayBanner(0); // Display the first banner
        } else {
            console.warn("no banners available.");
            allBanners = [];
        }
    } catch (error) {
        console.error("Error fetching movie details:", error);
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

// displays the alternative posters of the movie
function displayPoster(index) {
    // selects container where movie poster is displayed
    const posterContainer = document.getElementById("moviePosterContainer");
    // url of current poster
    const posterUrl = `https://image.tmdb.org/t/p/original${allPosters[index].file_path}`;
    // setting inner html of container to display poster and nav and trailer button
    posterContainer.innerHTML = `
        <img src="${posterUrl}" alt="Alternate Movie Poster" class="alternate-poster">
        <div class="poster-nav">
            <button class="nav-arrow" onclick="prevPoster()">❮</button>
            <h3>View Alternative Posters</h3>
            <button class="nav-arrow" onclick="nextPoster()">❯</button>
        </div>
        <div class="trailer-container">
            <button id="viewTrailerBtn" class="trailer-button">
                <i class='bx bxl-youtube'></i> View Trailer
            </button>
        </div>
    `;
}

// navigate to previous poster
window.prevPoster = function() {
    currentPosterIndex--; // decrease index by 1
    // if index is negative, go to last poster
    if (currentPosterIndex < 0) {
        currentPosterIndex = allPosters.length - 1; // Go to the last poster if index is negative
    }
    // display poster at new index
    displayPoster(currentPosterIndex);
};

// navigate to next poster
window.nextPoster = function() {
    currentPosterIndex++; // increase index by 1
    // if index goes past array length, go back to first poster
    if (currentPosterIndex >= allPosters.length) {
        currentPosterIndex = 0; // loops to first poster
    }
    // display poster at new index
    displayPoster(currentPosterIndex);
};

// resets to first poster when you leave the page
window.addEventListener("beforeunload", function() {
    currentPosterIndex = 0;
});

// displays alternative banners
function displayBanner(index) {
    // console.log("Displaying Banner at Index: ", index);
    // selects container where banner is displayed
    const bannerContainer = document.getElementById("bannerContainer");
    // url of current banner
    const bannerUrl = `https://image.tmdb.org/t/p/original${allBanners[index].file_path}`;
    // updates background img of container
    bannerContainer.style.backgroundImage = `url(${bannerUrl})`;
}

// navigate to previous banner
window.prevBanner = function() {
    // decrease index by 1, then loop to end if negative
    currentBannerIndex = (currentBannerIndex - 1 + allBanners.length) % allBanners.length;
    // display the banner at new index
    displayBanner(currentBannerIndex);
};

// navigate to next banner
window.nextBanner = function() {
    // increase index by 1, then loop to start if index goes past array length
    currentBannerIndex = (currentBannerIndex + 1) % allBanners.length;
    // display banner at new index
    displayBanner(currentBannerIndex);
};

// initialize tab functionality when the page loads
document.addEventListener("DOMContentLoaded", () => {
    const castTab = document.getElementById("castTab"); // tab for cast
    const crewTab = document.getElementById("crewTab"); // tab for crew
    const genreTab = document.getElementById("genreTab"); // tab for genre
    const castContent = document.getElementById("castContent"); // content for cast
    const crewContent = document.getElementById("crewContent"); // content for crew
    const genreContent = document.getElementById("genreContent"); // content for crew

    // event listeners for cast tab
    castTab.addEventListener("click", () => {
        // cast tab is activated
        castTab.classList.add("active");
        // crew tab is not activated
        crewTab.classList.remove("active");
        // genre tab is not activated
        genreTab.classList.remove("active");
        // show cast content
        castContent.style.display = "block";
        // dont show crew content
        crewContent.style.display = "none";
        // dont show genre content
        genreContent.style.display = "none";
    });
    // event listeners for crew tab
    crewTab.addEventListener("click", () => {
        // crew tab is activated
        crewTab.classList.add("active");
        // cast tab is not activated
        castTab.classList.remove("active");
        // genre tab is not activated
        genreTab.classList.remove("active");
        // show crew content
        crewContent.style.display = "block";
        // dont show cast content
        castContent.style.display = "none";
        // dont show genre content
        genreContent.style.display = "none";
    });
    // event listeners for crew tab
    genreTab.addEventListener("click", () => {
        // genre tab is activated
        genreTab.classList.add("active");
        // cast tab is not activated
        castTab.classList.remove("active");
        // crew tab is not activated
        crewTab.classList.remove("active");
        // show genre content
        genreContent.style.display = "block";
        // dont show cast content
        castContent.style.display = "none";
        // dont show crew content
        crewContent.style.display = "none";
    });
});

// displays the crew list
function displayCrew(crew) {
    const crewList = document.getElementById("crewList");
    // clears can existing crew list
    crewList.innerHTML = "";

    // we are only displaying these roles
    const relevantRoles = [
        "Director",
        "Producer",
        "Executive Producer",
        "Novel",
        "Screenplay",
        "Director of Photography",
        "Editor",
        "Casting",
        "Original Music Composer",
        "Costume Design",
        "Sound Designer",
        "Sound Mixer",
        "Visual Effects Supervisor",
        "Visual Effects Producer"
    ];

    const roles = {};
    // organize crew by role
    crew.forEach(member => {
        // console.log("Crew ID:", member.id, "Name:", member.name, "Role:", member.job);
        // check if crew member job title included in relevantRoles
        if (member.id && relevantRoles.includes(member.job)) {
            // check if crew member job title already exists in roles object
            if (!roles[member.job]) {
                // if not, initialize empty array that will store the names of the crew members
                roles[member.job] = [];
            }
            // wrap each name in a span for hover effect
            roles[member.job].push(`<span class="crew-name" data-crew-id="${member.id}" data-crew-name="${member.name}" data-crew-role="${member.job}">${member.name}</span>`);
        }
    });

    // display roles in the order defined in relevantRoles array
    relevantRoles.forEach(role => {
        // check if role exists in the roles object
        if (roles[role]) {
            // create new <li> element
            const listItem = document.createElement("li");
            // set the content of the list item
            // <strong?${role}</strong> displays role in bold lettering
            // ${roles[role].join(", ")} converts array to string separated by comma
            listItem.innerHTML = `<strong>${role}</strong>: ${roles[role].join(", ")}`;
            // adds new list item to crewList
            crewList.appendChild(listItem);
        }
    });

    // adds event listener when clicking name of crew member
    crewList.addEventListener("click", function(event) {
        // set our target
        const target = event.target;
        // if the target selected contains the crew name in tmdb, set crewId, crewName and crewJob
        if (target.classList.contains("crew-name")) {
            const crewId = target.getAttribute("data-crew-id");
            const crewName = target.getAttribute("data-crew-name");
            const crewJob = target.getAttribute("data-crew-role");
            // call selectCrew function to store these credentials
            selectCrew(crewId, crewName, crewJob);
        }
    });
}

// function to store crew member information
function selectCrew(crewId, crewName, crewRole) {
    // if no crew info returned/available
    if (!crewId || !crewName || !crewRole) {
        // console.error("invalid crew data:", crewId, crewName, crewRole);
        alert("crew info missing");
        return;
    }
    // console.log("selected crew:", crewId, crewName, crewRole); // Debugging line
    // store the crew member selected info into local storage
    localStorage.setItem("selectedCrew", JSON.stringify({ id: crewId, name: crewName, role: crewRole }));
    // open the crewPage to display that info
    window.location.href = "crewPage.html";
}

// this function will display the genre of the movie
async function displayGenre() {
    // gets selected movie from the local storage
    const selectedMovie = JSON.parse(localStorage.getItem("selectedMovie"));
    // sets the selected movie from local storage to movieID, null if none found
    const movieId = selectedMovie ? selectedMovie.id : null;

    // if theres no valid movieID, exit
    if (!movieId) {
        console.error("no movie ID found");
        return;
    }

    // selects html element where genre will be displayed
    const genreList = document.getElementById("genreList");
    // clears existing genre list
    genreList.innerHTML = "";

    try {
        // fetches details from the database
        const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&language=en-US`);
        // await bc its async
        const data = await response.json();

        // checks if data.genres exists and has more than one genre
        if (data.genres && data.genres.length > 0) {
            // clears existing genre list
            genreList.innerHTML = "";
            // loops through the genres and adds them to the list
            data.genres.forEach(genre => {
                const listItem = document.createElement("li");
                listItem.innerHTML = `<span class="genre-name" data-genre-id="${genre.id}" data-genre-name="${genre.name}">${genre.name}</span>`;
                listItem.addEventListener("click", () => {
                    // Save the selected genre in local storage
                    localStorage.setItem("selectedGenre", JSON.stringify({ id: genre.id, name: genre.name }));
                    // Redirect to the genre page
                    window.location.href = "genrePage.html";
                });
                genreList.appendChild(listItem);
            });
            // otherwise display no genres available
        } else {
            genreList.innerHTML = "<p>No genres available</p>";
        }
    } catch (error) {
        console.error("error fetching genres:", error);
        genreList.innerHTML = "<p>Error loading genres</p>";
    }
}

// resets to cast tab when a new movie is loaded
function resetTabs() {
    const castTab = document.getElementById("castTab");
    const crewTab = document.getElementById("crewTab");
    const genreTab = document.getElementById("genreTab");
    const castContent = document.getElementById("castContent");
    const crewContent = document.getElementById("crewContent");
    const genreContent = document.getElementById("genreContent");

    // reset tab classes
    castTab.classList.add("active");
    crewTab.classList.remove("active");
    genreTab.classList.remove("active");

    // display cast content and hide crew content
    castContent.style.display = "block";
    crewContent.style.display = "none";
    genreContent.style.display = "none";
}

// ensures script runs only after html is fully loaded
document.addEventListener("DOMContentLoaded", async () => {
    // gets selected movie from localStorage
    const movie = JSON.parse(localStorage.getItem("selectedMovie"));
    // if movie is found in localStorage
    if (movie) {
        // call function to update review action box
        loadReviewActionBox(movie.title);
    }
});

// function to load the review action box
async function loadReviewActionBox(movieTitle) {
    // gets logged in user from localStorage
    const user = localStorage.getItem("loggedInUser");
    // exit if no user is found
    if (!user) return;

    // firebase reference for users movie review
    const reviewRef = doc(db, "users", user, "reviews", movieTitle);

    // fetch movie review from the db
    try {
        // fetches review document
        const reviewSnap = await getDoc(reviewRef);

        // checks if review exists for the movie
        if (reviewSnap.exists()) {
            // retrieve actual review data
            const reviewData = reviewSnap.data();
            // console.log("Review Data Found:", reviewData);

            // change the reviewed icon to show movie has been reviewed
            document.getElementById("reviewedIcon").innerHTML = "<i class='bx bxs-show'></i>";
            // change the liked icon to show the movie has been liked
            document.getElementById("likedIcon").innerHTML = reviewData.liked ? "<i class='bx bxs-heart'></i>" : "<i class='bx bx-heart'></i>";
            // change label from rate to rated (indicates movie has been rated)
            document.getElementById("ratingLabel").textContent = "Rated";

            // gets the users rating, default is 0
            const userRating = reviewData.rating || 0;
            // gets ratingDisplay element
            const ratingDisplay = document.getElementById("ratingDisplay");
            // clears existing stars before displaying new ones
            ratingDisplay.innerHTML = "";

            // Math.floor determines numver of full stars
            const fullStars = Math.floor(userRating);
            // userRating % 1 !=0 checks if rating includes half a star
            const hasHalfStar = userRating % 1 !== 0;

            // loops 5 times to create the stars
            for (let i = 1; i <= 5; i++) {
                let starClass;

                if (i <= fullStars) {
                    starClass = "bxs-star"; // full star
                } else if (hasHalfStar && i === fullStars + 1) {
                    starClass = "bxs-star-half"; // half star
                } else {
                    starClass = "bx-star"; // empty star
                }
                // display the rating
                ratingDisplay.innerHTML += `<span class="rating-star"><i class='bx ${starClass}'></i></span>`;
            }

            // event listener for when edit review is clicked
            document.getElementById("editReviewBtn").addEventListener("click", async () => {
                // fetch info from db
                try {
                    // gets selected movie from localStorage
                    const movie = JSON.parse(localStorage.getItem("selectedMovie"));
                    // get logged in user from localStorage
                    const user = localStorage.getItem("loggedInUser");

                    // if none exist, exit
                    if (!user || !movie) return;

                    // firebase reference for movie review
                    const reviewRef = doc(db, "users", user, "reviews", movie.title);
                    // fetches review document
                    const reviewSnap = await getDoc(reviewRef);

                    // if review doc exists
                    if (reviewSnap.exists()) {
                        // populate with data
                        const reviewData = reviewSnap.data();

                        // loads saved review text, watched date, watched before, selected poster and liked status
                        document.getElementById("reviewText").value = reviewData.reviewText || "";
                        document.getElementById("watchedDate").value = reviewData.watchedDate || "";
                        document.getElementById("watchedBeforeCheckbox").checked = reviewData.watchedBefore || false;
                        document.getElementById("reviewMoviePoster").src = reviewData.selectedPoster || "https://via.placeholder.com/300?text=No+Image";
                        document.getElementById("likeButton").classList.toggle("liked", reviewData.liked);

                        const userRating = reviewData.rating || 0;
                        // Math.floor determines numver of full stars
                        const fullStars = Math.floor(userRating);
                        // userRating % 1 !=0 checks if rating includes half a star
                        const hasHalfStar = userRating % 1 !== 0;

                        // ensure stars in review match saved rating
                        document.querySelectorAll("#reviewForm .rating-container .rating-star i").forEach((star, index) => {
                            if (index < fullStars) {
                                star.className = "bx bxs-star"; // full star
                            } else if (hasHalfStar && index === fullStars) {
                                star.className = "bx bxs-star-half"; // half star
                            } else {
                                star.className = "bx bx-star"; // empty star
                            }
                        });
                        // displays review form for editing
                        document.getElementById("reviewBox").style.display = "flex";
                        document.getElementById("reviewSearchPage").style.display = "none";
                        document.getElementById("reviewForm").style.display = "block";

                    } else {
                        console.log("No review found. Edit button disabled.");
                    }

                } catch (error) {
                    console.error("error loading review for editing:", error);
                }
            });

            document.getElementById("viewReviewBtn").addEventListener("click", () => {
                window.location.href = "viewReviewPage.html";
            });

        } else {
            console.log("no review found for this movie.");
            // since no review exists for the movie, reset the review action box
            resetReviewActionBox();
        }
    } catch (error) {
        console.error("Error loading review:", error);
    }
}

// resets ui for the review action box
function resetReviewActionBox() {
    document.getElementById("reviewedIcon").innerHTML = "<i class='bx bx-show'></i>";
    document.getElementById("likedIcon").innerHTML = "<i class='bx bx-heart'></i>";
    document.getElementById("ratingLabel").textContent = "Rate";

    document.getElementById("ratingDisplay").innerHTML = `
        <span class="rating-star"><i class='bx bx-star'></i></span>
        <span class="rating-star"><i class='bx bx-star'></i></span>
        <span class="rating-star"><i class='bx bx-star'></i></span>
        <span class="rating-star"><i class='bx bx-star'></i></span>
        <span class="rating-star"><i class='bx bx-star'></i></span>
    `;
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

// event listener for when you press the save button after writing a review
document.getElementById("saveReview").addEventListener("click", async () => {
    // get user ID from localStorage
    const userID = localStorage.getItem("loggedInUser");
    // if there is no user logged in, give an alert
    if (!userID) {
        alert("you must be logged in to save a review.");
        return;
    }
    // if no movie is selected, give an alert
    if (!movie) {
        alert("no movie selected.");
        return;
    }

    // get review details
    const movieTitle = document.getElementById("reviewMovieTitle").textContent;
    const watchedDate = document.getElementById("watchedDate").value;
    const watchedBefore = document.getElementById("watchedBeforeCheckbox").checked;
    const reviewText = document.getElementById("reviewText").value;
    const rating = selectedRating; // get rating from stars logic
    const liked = document.getElementById("likeButton").classList.contains("liked");
    const selectedPoster = document.getElementById("reviewMoviePoster").src;

    // reference to Firestore: Users → userID → Reviews → movieTitle
    const reviewRef = doc(db, "users", userID, "reviews", movieTitle);

    // data to save
    const reviewData = {
        title: movieTitle,
        watchedDate: watchedDate || "Not Provided", // default if no date applied
        watchedBefore: watchedBefore,
        reviewText: reviewText || "", // if review text is empty, store empty string
        rating: rating || 0, // default rating if nothing is selected
        liked: liked,
        selectedPoster: selectedPoster // stores chosen poster
    };

    try {
        // saves review to firebase
        await setDoc(reviewRef, reviewData);
        // console.log(`review saved for user: ${userID} → movie: ${movieTitle}`);
        alert("your review has been saved!"); // alert to tell us we saved the review

        // reset form fields after saving
        document.getElementById("reviewText").value = "";
        document.getElementById("watchedDate").checked = false;
        document.getElementById("watchedBeforeCheckbox").checked = false;
        document.getElementById("reviewMoviePoster").src = movie.poster_path
            ? `https://image.tmdb.org/t/p/original${movie.poster_path}`
            : "https://via.placeholder.com/300?text=No+Image";
        likeButton.classList.remove("liked"); // remove liked class from button
        selectedRating = 0; // reset rating
        updateStarsDisplay(); // refresh the stars UI

        // close the review modal after saving
        document.getElementById("reviewBox").style.display = "none";

    } catch (error) {
        // console.error("error saving review:", error);
        alert("failed to save review. please try again.");
    }
});

// function to attach event listener to the view trailer button
function attachTrailerButtonListener() {
    // select necessary elements from the DOM
    const viewTrailerBtn = document.getElementById("viewTrailerBtn");
    const trailerModal = document.getElementById("trailerModal");
    const trailerFrame = document.getElementById("trailerFrame");
    const closeTrailerBtn = document.querySelector(".close-trailer");

    // when the user click the view trailer button
    if (viewTrailerBtn) {
        viewTrailerBtn.addEventListener("click", async () => {
            // retrieve the selected movie from the local storage
            const movie = JSON.parse(localStorage.getItem("selectedMovie"));
            // if no movie was selected, alert and exit
            if (!movie) {
                alert("no movie selected.");
                return;
            }

            try {
                // fetch trailer videos from tmdb api
                const response = await fetch(
                    `https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${API_KEY}`
                );
                const data = await response.json();

                // checks if move has any trailers available
                if (data.results.length > 0) {
                    // find the first youtube trailer in results
                    const trailer = data.results.find(video => video.type === "Trailer" && video.site === "YouTube");
                    // if trailer exists, put it in the iframe
                    if (trailer) {
                        trailerFrame.src = `https://www.youtube.com/embed/${trailer.key}`;
                        trailerModal.style.display = "flex"; // show the trailer pop up
                    } else {
                        alert("no trailer found for this movie.");
                    }
                } else {
                    alert("no trailer available.");
                }
            } catch (error) {
                console.error("error fetching trailer:", error);
                alert("failed to load trailer.");
            }
        });
    }

    // when user clicks the close button, we close the trailer pop up
    if (closeTrailerBtn) {
        closeTrailerBtn.addEventListener("click", () => {
            trailerModal.style.display = "none"; // hides pop up
            trailerFrame.src = ""; // reset trailer when closing
        });
    }

    // when user clicks outside the trailer pop up, close it as well
    window.addEventListener("click", (event) => {
        if (event.target === trailerModal) {
            trailerModal.style.display = "none"; // hides pop up
            trailerFrame.src = ""; // reset trailer when closing
        }
    });
}

// this ensures the trailer button loads upon refreshing the page
document.addEventListener("DOMContentLoaded", () => {
    // if movie stored in localStorage, load its details
    if (movie) {
        loadReviewActionBox(movie.title); // load review action box element
        fetchMovieDetails(movie.id); // fetch any movie details
        // ensure trailer button works properly when refreshed
        setTimeout(() => {
            attachTrailerButtonListener(); // Ensure trailer button works when page loads
        }, 100);
    }
});

document.getElementById("reviewBtn").addEventListener("click", () => {
    // Reset review form fields
    document.getElementById("reviewText").value = "";
    document.getElementById("watchedDate").value = "";
    document.getElementById("watchedBeforeCheckbox").checked = false;
    document.getElementById("likeButton").classList.remove("liked");

    // Reset stars to empty
    document.querySelectorAll(".rating-container .rating-star i").forEach(star => {
        star.className = "bx bx-star";
    });

    selectedRating = 0;

    // Open review modal
    document.getElementById("reviewBox").style.display = "flex";
});
