import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

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

// Check if user is logged in
document.addEventListener('DOMContentLoaded', function() {
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (!loggedInUser) {
        alert("You need to be logged in to create a community");
        window.location.href = "../login&create/login&create.html";
    }
});

// Handle profile picture preview
const profilePictureInput = document.getElementById("profilePicture");
const imagePreview = document.getElementById("imagePreview");
let profileImageBase64 = null;

profilePictureInput.addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement("img");
            img.src = e.target.result;
            profileImageBase64 = e.target.result; // Store base64 string
            imagePreview.innerHTML = "";
            imagePreview.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
});

// Handle banner image preview
const bannerImageInput = document.getElementById("bannerImage");
const bannerPreview = document.getElementById("bannerPreview");
let bannerImageBase64 = null;

bannerImageInput.addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement("img");
            img.src = e.target.result;
            bannerImageBase64 = e.target.result; // Store base64 string
            bannerPreview.innerHTML = "";
            bannerPreview.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
});

// Handle form submission
document.getElementById("createCommunityForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const loggedInUser = localStorage.getItem("loggedInUser");
    if (!loggedInUser) {
        alert("You need to be logged in to create a community");
        return;
    }

    const communityName = document.getElementById("communityName").value.trim();
    const communityBio = document.getElementById("communityBio").value.trim();

    // Get selected genres
    const selectedGenres = [];
    document.querySelectorAll('input[name="genres"]:checked').forEach(checkbox => {
        selectedGenres.push(checkbox.value);
    });

    // Validation
    if (!communityName) {
        alert("Please enter a community name");
        return;
    }

    if (!communityBio) {
        alert("Please enter a community bio");
        return;
    }

    if (selectedGenres.length === 0) {
        alert("Please select at least one genre");
        return;
    }

    if (!profileImageBase64) {
        alert("Please upload a profile picture");
        return;
    }

    if (!bannerImageBase64) {
        alert("Please upload a banner image");
        return;
    }

    try {
        // Check if community name already exists
        const communityId = communityName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const communityRef = doc(db, "communities", communityId);
        const communitySnap = await getDoc(communityRef);

        if (communitySnap.exists()) {
            alert("A community with this name already exists. Please choose another name.");
            return;
        }

        // Create community document in Firestore
        await setDoc(communityRef, {
            name: communityName,
            bio: communityBio,
            profilePicture: profileImageBase64,
            bannerImage: bannerImageBase64,
            genres: selectedGenres,
            createdBy: loggedInUser,
            createdAt: new Date().toISOString(),
            members: [loggedInUser],
            memberCount: 1
        });

        alert("Community created successfully!");
        window.location.href = `../homePage/communityProfile.html?id=${communityId}`;
    } catch (error) {
        console.error("Error creating community:", error);
        alert("Error creating community. Please try again.");
    }
});