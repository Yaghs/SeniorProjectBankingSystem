import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
// our special API key
const TMDB_API_KEY = "bc7c4e7c62d9e223e196bbd15978fc51";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

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

// initialize firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// function to get first name from Firebase and update the greeting
async function updateGreeting() {
    const username = localStorage.getItem("loggedInUser");

    if (username) {
        try {
            const userRef = doc(db, "users", username);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const firstName = userSnap.data().firstName;
                document.getElementById("greetingText").textContent = `Welcome back, ${firstName}!`;
            } else {
                console.error("user not found in firebase");
            }
        } catch (error) {
            console.error("error fetching user data:", error);
        }
    } else {
        console.error("no logged in user.");
    }
}

// Run the function after the DOM has fully loaded
document.addEventListener("DOMContentLoaded", updateGreeting);

// To track the current slide position
let currentSlide = 0;
let totalSlides = 0;

// Fetch and display popular movies
async function loadPopularMovies() {
    try {
        const response = await fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`);
        const data = await response.json();
        const movies = data.results;
        totalSlides = movies.length;

        const container = document.getElementById("popularMoviesContainer");
        container.innerHTML = ""; // Clear existing content

        // Loop through the movies and create a card for each
        movies.forEach(movie => {
            const movieItem = document.createElement("div");
            movieItem.classList.add("movie-item");
            movieItem.innerHTML = `
                <img src="https://image.tmdb.org/t/p/w300${movie.poster_path}" alt="${movie.title}" onclick="goToMoviePage(${movie.id})">
            `;
            container.appendChild(movieItem);
        });
    } catch (error) {
        console.error("Error fetching popular movies:", error);
    }
}

// Navigate to the selected movie's page
function goToMoviePage(movieId) {
    const movie = { id: movieId };
    localStorage.setItem("selectedMovie", JSON.stringify(movie));
    window.location.href = "moviePage.html";
}

// Carousel Navigation Functions
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

// Load popular movies when the page loads
document.addEventListener("DOMContentLoaded", loadPopularMovies);