import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

const TMDB_API_KEY = "bc7c4e7c62d9e223e196bbd15978fc51";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

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

async function updateGreeting() {
    const username = localStorage.getItem("loggedInUser");
    if (username) {
        try {
            const userRef = doc(db, "users", username);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                document.getElementById("greetingText").textContent = `Welcome back, ${userSnap.data().firstName}!`;
            } else {
                console.error("User not found in Firebase");
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    } else {
        console.error("No logged-in user.");
    }
}

document.addEventListener("DOMContentLoaded", updateGreeting);

let currentSlide = 0;
let totalSlides = 0;

async function loadPopularMovies() {
    try {
        const response = await fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&region=US&sort_by=popularity.desc&vote_count.gte=50&page=1`);
        const data = await response.json();
        totalSlides = data.results.length;

        const container = document.getElementById("popularMoviesContainer");
        container.innerHTML = "";

        data.results
            .filter(movie => movie.original_language === "en") // only include english movies
            .forEach(movie => {
                const movieItem = document.createElement("div");
                movieItem.classList.add("movie-item");
                movieItem.innerHTML = `
                    <img src="https://image.tmdb.org/t/p/original${movie.poster_path}" alt="${movie.title}" onclick="goToMoviePage(${movie.id})">
                    <p class="movie-title">${movie.title}</p>
                `;
                container.appendChild(movieItem);
            });

    } catch (error) {
        console.error("Error fetching popular movies:", error);
    }
}

// make goToMoviePage globally accessible
window.goToMoviePage = function(movieId) {
    fetch(`${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=credits,videos`)
        .then(response => response.json())
        .then(movie => {
            localStorage.setItem("selectedMovie", JSON.stringify(movie));
            window.location.href = "moviePage.html";
        })
        .catch(error => console.error("Error fetching movie details:", error));
};

window.prevPopularMovie = function() {
    const container = document.getElementById("popularMoviesContainer");
    if (currentSlide > 0) {
        currentSlide--;
    } else {
        currentSlide = totalSlides - 1;
    }
    container.scrollTo({
        left: currentSlide * 220,
        behavior: "smooth"
    });
};

window.nextPopularMovie = function() {
    const container = document.getElementById("popularMoviesContainer");
    if (currentSlide < totalSlides - 1) {
        currentSlide++;
    } else {
        currentSlide = 0;
    }
    container.scrollTo({
        left: currentSlide * 220,
        behavior: "smooth"
    });
};

document.addEventListener("DOMContentLoaded", loadPopularMovies);