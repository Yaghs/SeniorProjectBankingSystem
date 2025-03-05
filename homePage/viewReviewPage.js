// Import Firebase dependencies
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD1LpIBMmZAiQFwberKbx2G29t6fNph3Xg",
    authDomain: "sample-dc6d0.firebaseapp.com",
    projectId: "sample-dc6d0",
    storageBucket: "sample-dc6d0.appspot.com",
    messagingSenderId: "650782048731",
    appId: "1:650782048731:web:d2828c5b87f0a4e62367fe",
    measurementId: "G-WJMEY6J7BR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("Firebase initialized for view review page");

// Get the logged-in user's username
const username = localStorage.getItem("loggedInUser");
if (!username) {
    alert("You must be logged in to view reviews.");
    window.location.href = "homePage.html";
}

// Get the selected movie
const movie = JSON.parse(localStorage.getItem("selectedMovie"));
if (!movie) {
    alert("No movie selected.");
    window.location.href = "homePage.html";
}

// Function to fetch and display review
async function loadReview() {
    const movieTitle = movie.title; // Define movieTitle before using it
    const reviewDoc = doc(db, "users", username, "reviews", movieTitle);
    const reviewSnap = await getDoc(reviewDoc);

    if (reviewSnap.exists()) {
        const reviewData = reviewSnap.data();
        console.log("Review Data Retrieved:", reviewData);


        document.getElementById("reviewMovieTitle").textContent = reviewData.title;
        if (reviewData.selectedPoster && reviewData.selectedPoster !== "N/A") {
            document.getElementById("reviewMoviePoster").src = reviewData.selectedPoster;
        } else {
            document.getElementById("reviewMoviePoster").src = "https://via.placeholder.com/300/222/ffffff?text=No+Image";
        }
        document.getElementById("reviewText").textContent = reviewData.reviewText || "No review written.";
        document.getElementById("watchedDate").textContent = reviewData.watchedDate && reviewData.watchedDate !== "N/A"
            ? new Date(reviewData.watchedDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
            : "Not Specified";
        document.getElementById("watchedBefore").textContent = reviewData.watchedBefore === true ? "Yes" : "No";
        document.getElementById("reviewRating").textContent = `${reviewData.rating} / 5`;
        document.getElementById("reviewLiked").textContent = reviewData.liked ? "❤️" : "❌";
    } else {
        alert("No review found for this movie.");
        window.location.href = "homePage.html";
    }
}

// Load the review when the page loads
document.addEventListener("DOMContentLoaded", loadReview);
