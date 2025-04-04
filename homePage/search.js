const API_KEY = "bc7c4e7c62d9e223e196bbd15978fc51";
const searchInput = document.getElementById("searchInput");
const suggestionsDiv = document.getElementById("suggestions");
const categorySelect = document.getElementById("searchCategory");

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {getFirestore, collection, query, getDocs, where} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyD1LpIBMmZAiQFwberKbx2G29t6fNph3Xg",
    authDomain: "sample-dc6d0.firebaseapp.com",
    projectId: "sample-dc6d0",
    storageBucket: "sample-dc6d0.appspot.com",
    messagingSenderId: "650782048731",
    appId: "1:650782048731:web:d2828c5b87f0a4e62367fe",
    measurementId: "G-WJMEY6J7BR"
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

    let movies = [], actors = [], users = [];

    if (selectedCategory === "movies") {
        movies = await fetchMovies(queryText);
    } else if (selectedCategory === "actors") {
        actors = await fetchActors(queryText);
    } else if (selectedCategory === "users") {
        users = await fetchUsers(queryText);
    }

    displaySuggestions(movies, actors, users);
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
    return data.results.filter(person => person.known_for_department === "Acting");
}

async function fetchUsers(queryText) {
    if (!queryText) return [];

    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);

    const lowerQuery = queryText.toLowerCase();
    const currentUser = localStorage.getItem("loggedInUser");

    const filteredUsers = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => {
            const firstName = (user.firstName || "").toLowerCase();
            const lastName = (user.lastName || "").toLowerCase();
            const username = (user.username || "").toLowerCase();

            return (
                user.id !== currentUser && ( // 👈 exclude yourself
                    firstName.includes(lowerQuery) ||
                    lastName.includes(lowerQuery) ||
                    username.includes(lowerQuery)
                )
            );
        });

    return filteredUsers;
}



function displaySuggestions(movies, actors, users) {
    suggestionsDiv.innerHTML = "";

    if (movies.length === 0 && actors.length === 0 && users.length === 0) {
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

function clearSearch() {
    searchInput.value = "";
    categorySelect.value = "";
    suggestionsDiv.style.display = "none";
}
categorySelect.addEventListener("change", () => {
    searchInput.value = "";
});


