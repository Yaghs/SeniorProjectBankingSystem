const API_KEY = "bc7c4e7c62d9e223e196bbd15978fc51";
const searchInput = document.getElementById("searchInput");
const suggestionsDiv = document.getElementById("suggestions");
const categorySelect = document.getElementById("searchCategory");

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore,
    collection,
    query,
    getDocs,
    where,
    getDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBkidFMwM_jHr5i4D55EEr_anJlrwrNvrI",
    authDomain: "plottwistsp.firebaseapp.com",
    projectId: "plottwistsp",
    storageBucket: "plottwistsp.firebasestorage.app",
    messagingSenderId: "605014060151",
    appId: "1:605014060151:web:3e307d34e57d908fa8ea72"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

searchInput.addEventListener("input", async () => {
    const queryText = searchInput.value.trim();
    const selectedCategory = categorySelect.value;

    if (queryText.length < 2 || !selectedCategory) {
        suggestionsDiv.style.display = "none";
        return;
    }

    let movies = [], actors = [], users = [], genres = [], crew = [];

    if (selectedCategory === "movies") {
        movies = await fetchMovies(queryText);
    } else if (selectedCategory === "actors") {
        actors = await fetchActors(queryText);
    } else if (selectedCategory === "users") {
        users = await fetchUsers(queryText);
    } else if (selectedCategory === "genres") {
        genres = await fetchGenres(queryText);
    } else if (selectedCategory === "crew") {
        crew = await fetchCrew(queryText);
    }

    displaySuggestions(movies, actors, users, genres, crew);
});

async function fetchMovies(query) {
    const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`
    );
    const data = await response.json();
    console.log("TMDb movie data:", data.results); // 👈
    return data.results;
}

async function fetchActors(query) {
    const response = await fetch(
        `https://api.themoviedb.org/3/search/person?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    return data.results.filter(person => person.known_for_department === "Acting");
}

async function fetchUsers(queryText) {
    if (!queryText) return [];

    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);

    const lowerQuery = queryText.toLowerCase();
    const currentUser = localStorage.getItem("loggedInUser");

    // blocked user filtering
    const currentUserDoc = await getDoc(doc(db, "users", currentUser));
    const blocked = currentUserDoc.exists() ? currentUserDoc.data().blocked || [] : [];

    const filteredUsers = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => {
            const firstName = (user.firstName || "").toLowerCase();
            const lastName = (user.lastName || "").toLowerCase();
            const username = (user.username || "").toLowerCase();

            return (
                user.id !== currentUser && // exclude yourself
                !blocked.includes(user.id) && // exclude blocked users
                (
                    firstName.includes(lowerQuery) ||
                    lastName.includes(lowerQuery) ||
                    username.includes(lowerQuery)
                )
            );
        });

    return filteredUsers;
}

const genreNames = [
    "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary",
    "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Mystery",
    "Romance", "Science Fiction", "TV Movie", "Thriller", "War", "Western"
];

async function fetchGenres(queryText) {
    return genreNames.filter(genre =>
        genre.toLowerCase().startsWith(queryText.toLowerCase())
    );
}

async function fetchCrew(query) {
    const response = await fetch(
        `https://api.themoviedb.org/3/search/person?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
    );
    const data = await response.json();

    return data.results.map(person => ({
        id: person.id,
        name: person.name
    }));
}

function displaySuggestions(movies, actors, users, genres, crew) {
    suggestionsDiv.innerHTML = "";

    if (movies.length === 0 && actors.length === 0 && users.length === 0 && genres.length === 0 && crew.length === 0) {
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

    actors.forEach(actor => {
        const suggestion = document.createElement("div");
        suggestion.classList.add("suggestion");
        suggestion.textContent = `${actor.name}`;
        suggestion.addEventListener("click", () => selectActor(actor));
        suggestionsDiv.appendChild(suggestion);
    });

    users.forEach(user => {
        const suggestion = document.createElement("div");
        suggestion.classList.add("suggestion");
        suggestion.innerHTML = `
            <strong>${user.firstName || "Unknown"}</strong> &nbsp;
            <span style="color: gray">@${user.username}</span>
        `;
        suggestion.addEventListener("click", () => selectUser(user));
        suggestionsDiv.appendChild(suggestion);
    });

    genres.forEach(genre => {
        const suggestion = document.createElement("div");
        suggestion.classList.add("suggestion");
        suggestion.textContent = genre;
        suggestion.addEventListener("click", () => selectGenre(genre));
        suggestionsDiv.appendChild(suggestion);
    });

    crew.forEach(crewMember => {
        const suggestion = document.createElement("div");
        suggestion.classList.add("suggestion");
        suggestion.textContent = crewMember.name;
        suggestion.addEventListener("click", () => selectCrew(crewMember));
        suggestionsDiv.appendChild(suggestion);
    });

    suggestionsDiv.style.display = "block";
}

function selectMovie(movie) {
    localStorage.setItem("selectedMovie", JSON.stringify(movie));
    clearSearch();
    window.location.href = "moviePage.html";
}

function selectActor(actor) {
    localStorage.setItem("selectedActor", JSON.stringify(actor));
    clearSearch();
    window.location.href = "actorPage.html";
}

function selectUser(user) {
    clearSearch();
    window.location.href = `OtherProfilePage.html?user=${encodeURIComponent(user.id)}`;
}

function selectGenre(genreName) {
    const genreId = getGenreIdByName(genreName);
    if (!genreId) {
        console.error("Genre ID not found for:", genreName);
        return;
    }

    localStorage.setItem("selectedGenre", JSON.stringify({
        id: genreId,
        name: genreName
    }));

    clearSearch();
    window.location.href = "genrePage.html";
}

async function selectCrew(crew) {
    if (!crew.id || !crew.name) {
        alert("Crew info is incomplete.");
        return;
    }

    try {
        const response = await fetch(`https://api.themoviedb.org/3/person/${crew.id}/movie_credits?api_key=${API_KEY}`);
        const data = await response.json();

        const rolePriority = {
            "Director": 1,
            "Original Music Composer": 2,
            "Screenplay": 3,
            "Producer": 4,
            "Executive Producer": 5,
            "Novel": 6,
            "Director of Photography": 7,
            "Editor": 8,
            "Casting": 9,
            "Costume Design": 10,
            "Sound Designer": 11,
            "Sound Mixer": 12,
            "Visual Effects Supervisor": 13,
            "Visual Effects Producer": 14
        };

        let bestJob = "involved with";
        let bestScore = Infinity;

        for (const credit of data.crew) {
            const job = credit.job;
            if (rolePriority[job] && rolePriority[job] < bestScore) {
                bestScore = rolePriority[job];
                bestJob = job;
            }
        }

        localStorage.setItem("selectedCrew", JSON.stringify({
            id: crew.id,
            name: crew.name,
            role: bestJob
        }));

        clearSearch();
        window.location.href = "crewPage.html";

    } catch (error) {
        console.error("Error fetching crew credits:", error);
        alert("Failed to retrieve crew member info.");
    }
}

function getGenreIdByName(name) {
    const genreMap = {
        "Action": 28, "Adventure": 12, "Animation": 16, "Comedy": 35, "Crime": 80,
        "Documentary": 99, "Drama": 18, "Family": 10751, "Fantasy": 14, "History": 36,
        "Horror": 27, "Music": 10402, "Mystery": 9648, "Romance": 10749,
        "Science Fiction": 878, "TV Movie": 10770, "Thriller": 53, "War": 10752, "Western": 37
    };
    return genreMap[name] || null;
}

function clearSearch() {
    searchInput.value = "";
    categorySelect.value = "";
    suggestionsDiv.style.display = "none";
}

categorySelect.addEventListener("change", () => {
    searchInput.value = "";
});
