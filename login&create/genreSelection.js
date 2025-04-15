import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

const genreNames = [
  "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary",
  "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Mystery",
  "Romance", "Science Fiction", "TV Movie", "Thriller", "War", "Western"
];

const genreColors = {
  "Action": "lightcoral",         // light red
  "Adventure": "yellow",          // yellow
  "Animation": "lightblue",       // light blue
  "Comedy": "lightgreen",         // light green
  "Crime": "lightgray",           // light gray
  "Documentary": "skyblue",       // lighter blue for documentary
  "Drama": "magenta",                // pink
  "Family": "gold",        // light yellow
  "Fantasy": "orange",            // orange
  "History": "hotpink",             // brown
  "Horror": "MediumPurple",             // purple
  "Music": "green",               // green
  "Mystery": "gray",              // gray
  "Romance": "red",               // red
  "Science Fiction": "lavender",  // light purple for science fiction
  "TV Movie": "goldenrod",       // dark orange
  "Thriller": "orangered",        // red orange (using orangered)
  "War": "darkred",               // dark red
  "Western": "burlywood"          // light brown (using burlywood)
};

const genreMap = {
  "Action": 28,
  "Adventure": 12,
  "Animation": 16,
  "Comedy": 35,
  "Crime": 80,              //pairs id and movie genre into firebase together
  "Documentary": 99,
  "Drama": 18,
  "Family": 10751,
  "Fantasy": 14,
  "History": 36,
  "Horror": 27,
  "Music": 10402,
  "Mystery": 9648,
  "Romance": 10749,
  "Science Fiction": 878,
  "TV Movie": 10770,
  "Thriller": 53,
  "War": 10752,
  "Western": 37
};

function getGenreIdByName(name) {
  return genreMap[name] || null;
}

const genreListDiv = document.getElementById("genre-list");
const submitButton = document.getElementById("submitGenres");

const selectedGenres = new Set();

genreNames.forEach(genre => {
  const genreElement = document.createElement("div");
  genreElement.textContent = genre;

  genreElement.style.backgroundColor = genreColors[genre] || "#fff";

  genreElement.addEventListener("click", () => {
    if (selectedGenres.has(genre)) {
      selectedGenres.delete(genre);
      genreElement.classList.remove("selected");
    } else {
      selectedGenres.add(genre);
      genreElement.classList.add("selected");
    }
  });
  genreListDiv.appendChild(genreElement);
});

submitButton.addEventListener("click", async () => {
  const userId = localStorage.getItem("loggedInUser");
  if (!userId) {
    alert("User not logged in. Please log in and try again.");
    return;
  }

  if (selectedGenres.size === 0) {
    alert("Please select at least one genre to continue.");
    return;
  }

  const selectedGenreObjects = Array.from(selectedGenres).map(genre => ({
    id: getGenreIdByName(genre),
    name: genre
  }));

  try {
    await updateDoc(doc(db, "users", userId), {
      genres: selectedGenreObjects
    });

    window.location.href = "../homePage/homePage.html";
  } catch (error) {
    console.error("Error updating user genres:", error);
    alert("There was an error saving your choices. Please try again.");
  }
});