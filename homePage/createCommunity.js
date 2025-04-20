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

// Maximum image size in bytes (1MB, slightly less than the 1,048,487 byte limit)
const MAX_IMAGE_SIZE = 1004848;

// Helper function to check image size from base64 string
function getBase64Size(base64String) {
    // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
    const base64WithoutPrefix = base64String.split(',')[1];
    // Calculate approximate size in bytes
    return Math.ceil((base64WithoutPrefix.length * 3) / 4);
}

// Format bytes to a human-readable format
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Create error message element
function createErrorMessage(message, containerId) {
    const container = document.getElementById(containerId);
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.style.color = '#ff6b6b';
    errorElement.style.marginTop = '5px';
    errorElement.style.fontSize = '14px';
    errorElement.textContent = message;

    // Remove any existing error message
    const existingError = container.querySelector('.error-message');
    if (existingError) {
        container.removeChild(existingError);
    }

    container.appendChild(errorElement);
}

// Check if user is logged in
document.addEventListener('DOMContentLoaded', function() {
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (!loggedInUser) {
        alert("You need to be logged in to create a community");
        window.location.href = "../login&create/index.html";
    }

    // Add size limit note to the form
    const profileInput = document.getElementById("profilePicture");
    const bannerInput = document.getElementById("bannerImage");

    const profileLabel = profileInput.previousElementSibling;
    profileLabel.innerHTML += ` <span style="font-weight: normal; font-size: 14px; color: #aaa;">(Max size: ${formatBytes(MAX_IMAGE_SIZE)})</span>`;

    const bannerLabel = bannerInput.previousElementSibling;
    bannerLabel.innerHTML += ` <span style="font-weight: normal; font-size: 14px; color: #aaa;">(Max size: ${formatBytes(MAX_IMAGE_SIZE)})</span>`;
});

// Handle profile picture preview
const profilePictureInput = document.getElementById("profilePicture");
const imagePreview = document.getElementById("imagePreview");
let profileImageBase64 = null;
let isProfileImageValid = false;

profilePictureInput.addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file) {
        // Check file size before processing
        if (file.size > MAX_IMAGE_SIZE * 1.33) { // Estimate: base64 is ~33% larger than binary
            createErrorMessage(`Image is too large! Maximum size is ${formatBytes(MAX_IMAGE_SIZE)}.`, "imagePreview");
            isProfileImageValid = false;
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement("img");
            img.src = e.target.result;
            profileImageBase64 = e.target.result; // Store base64 string

            // Verify base64 size
            const base64Size = getBase64Size(profileImageBase64);
            if (base64Size > MAX_IMAGE_SIZE) {
                createErrorMessage(`Image is too large (${formatBytes(base64Size)})! Maximum size is ${formatBytes(MAX_IMAGE_SIZE)}.`, "imagePreview");
                isProfileImageValid = false;
            } else {
                // Clear any error message
                const existingError = imagePreview.querySelector('.error-message');
                if (existingError) {
                    imagePreview.removeChild(existingError);
                }
                isProfileImageValid = true;
            }

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
let isBannerImageValid = false;

bannerImageInput.addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file) {
        // Check file size before processing
        if (file.size > MAX_IMAGE_SIZE * 1.33) { // Estimate: base64 is ~33% larger than binary
            createErrorMessage(`Image is too large! Maximum size is ${formatBytes(MAX_IMAGE_SIZE)}.`, "bannerPreview");
            isBannerImageValid = false;
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement("img");
            img.src = e.target.result;
            bannerImageBase64 = e.target.result; // Store base64 string

            // Verify base64 size
            const base64Size = getBase64Size(bannerImageBase64);
            if (base64Size > MAX_IMAGE_SIZE) {
                createErrorMessage(`Image is too large (${formatBytes(base64Size)})! Maximum size is ${formatBytes(MAX_IMAGE_SIZE)}.`, "bannerPreview");
                isBannerImageValid = false;
            } else {
                // Clear any error message
                const existingError = bannerPreview.querySelector('.error-message');
                if (existingError) {
                    bannerPreview.removeChild(existingError);
                }
                isBannerImageValid = true;
            }

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

    // Check if images are valid
    if (!isProfileImageValid) {
        alert("Profile picture is too large. Please choose a smaller image (maximum 1MB).");
        return;
    }

    if (!isBannerImageValid) {
        alert("Banner image is too large. Please choose a smaller image (maximum 1MB).");
        return;
    }

    try {
        // Disable submit button to prevent multiple submissions
        const submitButton = document.getElementById("createCommunitySubmit");
        submitButton.disabled = true;
        submitButton.textContent = "Creating Community...";

        // Check if community name already exists
        const communityId = communityName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const communityRef = doc(db, "communities", communityId);
        const communitySnap = await getDoc(communityRef);

        if (communitySnap.exists()) {
            alert("A community with this name already exists. Please choose another name.");
            submitButton.disabled = false;
            submitButton.textContent = "Create Community";
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

        // Handle specific Firebase errors
        if (error.message && error.message.includes("longer than")) {
            alert("Error: One of your images is too large. Please use smaller images (maximum 1MB each).");
        } else {
            alert("Error creating community. Please try again.");
        }

        // Re-enable submit button
        const submitButton = document.getElementById("createCommunitySubmit");
        submitButton.disabled = false;
        submitButton.textContent = "Create Community";
    }
});