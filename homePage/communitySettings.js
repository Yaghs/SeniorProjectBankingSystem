import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import {
    getFirestore,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    collection,
    getDocs,
    query,
    where,
    writeBatch
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBkidFMwM_jHr5i4D55EEr_anJlrwrNvrI",
    authDomain: "plottwistsp.firebaseapp.com",
    projectId: "plottwistsp",
    storageBucket: "plottwistsp.firebasestorage.app",
    messagingSenderId: "605014060151",
    appId: "1:605014060151:web:3e307d34e57d908fa8ea72"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Maximum image size in bytes (1MB, slightly less than the 1,048,487 byte limit)
const MAX_IMAGE_SIZE = 1000000;

// Get community ID from URL
const urlParams = new URLSearchParams(window.location.search);
const communityId = urlParams.get('id');

// Get logged-in user
const loggedInUser = localStorage.getItem("loggedInUser");

// Global variables to store current community data
let currentCommunityData = null;
let profileImageBase64 = null;
let bannerImageBase64 = null;
let isProfileImageValid = true;
let isBannerImageValid = true;

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
    errorElement.textContent = message;

    // Remove any existing error message
    const existingError = container.querySelector('.error-message');
    if (existingError) {
        container.removeChild(existingError);
    }

    container.appendChild(errorElement);
    return errorElement;
}

// Check if the current user is the community creator
async function checkPermission() {
    if (!loggedInUser) {
        alert("You need to be logged in to edit a community");
        window.location.href = "../login&create/index.html";
        return false;
    }

    if (!communityId) {
        alert("Community not found");
        window.location.href = "../homePage/communities.html";
        return false;
    }

    try {
        const communityRef = doc(db, "communities", communityId);
        const communitySnap = await getDoc(communityRef);

        if (!communitySnap.exists()) {
            alert("Community not found");
            window.location.href = "../homePage/communities.html";
            return false;
        }

        const communityData = communitySnap.data();

        // Check if current user is the creator
        if (communityData.createdBy !== loggedInUser) {
            alert("You do not have permission to edit this community");
            window.location.href = `../homePage/communityProfile.html?id=${communityId}`;
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error checking permission:", error);
        alert("Error checking permissions");
        return false;
    }
}

// Load community data and populate form
async function loadCommunityData() {
    try {
        // Show loading state
        document.getElementById("saveChangesBtn").disabled = true;
        document.getElementById("saveChangesBtn").textContent = "Loading...";

        const communityRef = doc(db, "communities", communityId);
        const communitySnap = await getDoc(communityRef);

        if (!communitySnap.exists()) {
            alert("Community not found");
            window.location.href = "../homePage/communities.html";
            return;
        }

        currentCommunityData = communitySnap.data();

        // Populate form with existing data
        document.getElementById("communityName").value = currentCommunityData.name;
        document.getElementById("communityBio").value = currentCommunityData.bio;

        // Check if the community has a privacy setting
        if (currentCommunityData.isPrivate) {
            document.getElementById("privacyToggle").checked = true;
            document.getElementById("privacyStatus").textContent = "Private";
            document.querySelector(".public-description").style.display = "none";
            document.querySelector(".private-description").style.display = "block";
        }

        // Set selected genres
        const genres = currentCommunityData.genres || [];
        genres.forEach(genre => {
            const checkbox = document.querySelector(`input[value="${genre}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });

        // Display existing profile picture
        if (currentCommunityData.profilePicture) {
            profileImageBase64 = currentCommunityData.profilePicture;
            const img = document.createElement("img");
            img.src = profileImageBase64;

            const imagePreview = document.getElementById("imagePreview");
            imagePreview.innerHTML = "";
            imagePreview.appendChild(img);
        }

        // Display existing banner image
        if (currentCommunityData.bannerImage) {
            bannerImageBase64 = currentCommunityData.bannerImage;
            const img = document.createElement("img");
            img.src = bannerImageBase64;

            const bannerPreview = document.getElementById("bannerPreview");
            bannerPreview.innerHTML = "";
            bannerPreview.appendChild(img);
        }

        // Enable save button
        document.getElementById("saveChangesBtn").disabled = false;
        document.getElementById("saveChangesBtn").textContent = "Save Changes";

    } catch (error) {
        console.error("Error loading community data:", error);
        alert("Error loading community data");
    }
}

// Handle profile picture preview and validation
function setupProfileImageInput() {
    const profilePictureInput = document.getElementById("profilePicture");
    const imagePreview = document.getElementById("imagePreview");

    // Add size limit note to the label
    const profileLabel = profilePictureInput.previousElementSibling;
    profileLabel.innerHTML += ` <span style="font-weight: normal; font-size: 14px; color: #aaa;">(Max size: ${formatBytes(MAX_IMAGE_SIZE)})</span>`;

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
}

// Handle banner image preview and validation
function setupBannerImageInput() {
    const bannerImageInput = document.getElementById("bannerImage");
    const bannerPreview = document.getElementById("bannerPreview");

    // Add size limit note to the label
    const bannerLabel = bannerImageInput.previousElementSibling;
    bannerLabel.innerHTML += ` <span style="font-weight: normal; font-size: 14px; color: #aaa;">(Max size: ${formatBytes(MAX_IMAGE_SIZE)})</span>`;

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
}

// Setup privacy toggle functionality
function setupPrivacyToggle() {
    const privacyToggle = document.getElementById("privacyToggle");
    const privacyStatus = document.getElementById("privacyStatus");
    const publicDesc = document.querySelector(".public-description");
    const privateDesc = document.querySelector(".private-description");

    privacyToggle.addEventListener("change", function() {
        if (this.checked) {
            privacyStatus.textContent = "Private";
            publicDesc.style.display = "none";
            privateDesc.style.display = "block";
        } else {
            privacyStatus.textContent = "Public";
            publicDesc.style.display = "block";
            privateDesc.style.display = "none";
        }
    });
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();

    const communityName = document.getElementById("communityName").value.trim();
    const communityBio = document.getElementById("communityBio").value.trim();
    const isPrivate = document.getElementById("privacyToggle").checked;

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

    // Check if images are valid if they were changed
    if (profileImageBase64 !== currentCommunityData.profilePicture && !isProfileImageValid) {
        alert("Profile picture is too large. Please choose a smaller image (maximum 1MB).");
        return;
    }

    if (bannerImageBase64 !== currentCommunityData.bannerImage && !isBannerImageValid) {
        alert("Banner image is too large. Please choose a smaller image (maximum 1MB).");
        return;
    }

    try {
        // Disable submit button to prevent multiple submissions
        const submitButton = document.getElementById("saveChangesBtn");
        submitButton.disabled = true;
        submitButton.textContent = "Saving Changes...";

        // Build the update object with only the fields that changed
        const updateData = {};

        if (communityName !== currentCommunityData.name) {
            updateData.name = communityName;
        }

        if (communityBio !== currentCommunityData.bio) {
            updateData.bio = communityBio;
        }

        if (JSON.stringify(selectedGenres) !== JSON.stringify(currentCommunityData.genres)) {
            updateData.genres = selectedGenres;
        }

        if (profileImageBase64 !== currentCommunityData.profilePicture) {
            updateData.profilePicture = profileImageBase64;
        }

        if (bannerImageBase64 !== currentCommunityData.bannerImage) {
            updateData.bannerImage = bannerImageBase64;
        }

        // Add privacy setting
        if (isPrivate !== !!currentCommunityData.isPrivate) {
            updateData.isPrivate = isPrivate;
        }

        // Only update if there are changes
        if (Object.keys(updateData).length > 0) {
            const communityRef = doc(db, "communities", communityId);
            await updateDoc(communityRef, updateData);

            alert("Community updated successfully!");
        } else {
            alert("No changes were made.");
        }

        // Redirect back to community profile
        window.location.href = `../homePage/communityProfile.html?id=${communityId}`;

    } catch (error) {
        console.error("Error updating community:", error);

        // Handle specific Firebase errors
        if (error.message && error.message.includes("longer than")) {
            alert("Error: One of your images is too large. Please use smaller images (maximum 1MB each).");
        } else {
            alert("Error updating community. Please try again.");
        }

        // Re-enable submit button
        const submitButton = document.getElementById("saveChangesBtn");
        submitButton.disabled = false;
        submitButton.textContent = "Save Changes";
    }
}

// Handle community deletion
async function setupDeleteFunctionality() {
    const deleteBtn = document.getElementById("deleteCommunityBtn");
    const modal = document.getElementById("deleteConfirmModal");
    const confirmBtn = document.getElementById("confirmDeleteBtn");
    const cancelBtn = document.getElementById("cancelDeleteBtn");

    // Show modal when delete button is clicked
    deleteBtn.addEventListener("click", function() {
        modal.style.display = "block";
    });

    // Hide modal when cancel button is clicked
    cancelBtn.addEventListener("click", function() {
        modal.style.display = "none";
    });

    // Hide modal when clicking outside of it
    window.addEventListener("click", function(event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    // Handle delete confirmation
    confirmBtn.addEventListener("click", async function() {
        try {
            confirmBtn.disabled = true;
            confirmBtn.textContent = "Deleting...";

            // Delete all posts for this community
            const postsQuery = query(collection(db, "posts"), where("communityId", "==", communityId));
            const postsSnapshot = await getDocs(postsQuery);

            // Get all post IDs for later comment deletion
            const postIds = postsSnapshot.docs.map(doc => doc.id);

            // Create a batch for deletion
            const batch = writeBatch(db);

            // Add posts to batch delete
            postsSnapshot.docs.forEach(postDoc => {
                batch.delete(postDoc.ref);
            });

            // Delete all comments for community posts
            if (postIds.length > 0) {
                const commentsQuery = query(collection(db, "comments"), where("communityId", "==", communityId));
                const commentsSnapshot = await getDocs(commentsQuery);

                commentsSnapshot.docs.forEach(commentDoc => {
                    batch.delete(commentDoc.ref);
                });
            }

            // Delete the community document itself
            const communityRef = doc(db, "communities", communityId);
            batch.delete(communityRef);

            // Commit all the deletion operations
            await batch.commit();

            alert("Community deleted successfully");
            window.location.href = "../homePage/communities.html";

        } catch (error) {
            console.error("Error deleting community:", error);
            alert("Error deleting community. Please try again.");
            confirmBtn.disabled = false;
            confirmBtn.textContent = "Yes, Delete Community";
        }
    });
}

// Initialize the page
document.addEventListener("DOMContentLoaded", async function() {
    // Check if user has permission to edit
    const hasPermission = await checkPermission();
    if (!hasPermission) return;

    // Set up event listeners and load data
    setupProfileImageInput();
    setupBannerImageInput();
    setupPrivacyToggle();
    setupDeleteFunctionality();

    // Load community data
    await loadCommunityData();

    // Set up form submission
    document.getElementById("editCommunityForm").addEventListener("submit", handleFormSubmit);

    // Set up cancel button
    document.getElementById("cancelBtn").addEventListener("click", function(e) {
        e.preventDefault();
        if (confirm("Discard all changes?")) {
            window.location.href = `../homePage/communityProfile.html?id=${communityId}`;
        }
    });

});
document.addEventListener("click", function (e) {
    if (e.target.classList.contains("sign-out")) {
        e.preventDefault();
        localStorage.clear();
        window.location.replace("/login&create/index.html");
    }
});