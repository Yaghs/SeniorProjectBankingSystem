import {initializeApp} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import {
    arrayRemove,
    arrayUnion,
    collection,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    limit,
    orderBy,
    query,
    startAfter,
    updateDoc,
    where
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

// Get logged-in user
const loggedInUser = localStorage.getItem("loggedInUser");

// Global variables for pagination
let lastVisible = null;
let selectedGenres = [];
let currentSort = "popular";
let currentSearch = "";
let isLoading = false;
const communitiesPerPage = 12;

// Initialize the page
document.addEventListener("DOMContentLoaded", function () {
    // Set up event listeners
    document.getElementById("searchButton").addEventListener("click", handleSearch);
    document.getElementById("communitySearch").addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            handleSearch();
        }
    });

    document.getElementById("sortBy").addEventListener("change", handleSortChange);

    document.querySelectorAll(".genre-pill").forEach(pill => {
        pill.addEventListener("click", handleGenreFilter);
    });

    document.getElementById("loadMoreButton").addEventListener("click", loadMoreCommunities);

    // Initial load of communities
    loadCommunities();

    // Load user's communities if logged in
    if (loggedInUser) {
        loadMyCommunities();
    } else {
        // Show message for not logged in users
        document.getElementById("myCommunities").innerHTML = "";
        document.getElementById("noMyCommunities").innerHTML = `
            <h3>You need to log in to see your communities</h3>
            <p>Log in to join communities and start discussions with other movie fans!</p>
            <a href="../login&create/index.html" class="create-btn" style="background-color: #ffcc00;">Login</a>
        `;
        document.getElementById("noMyCommunities").style.display = "block";
    }
});

// Handle search
function handleSearch() {
    currentSearch = document.getElementById("communitySearch").value.trim();
    lastVisible = null;
    loadCommunities(true);
}

// Handle sort change
function handleSortChange(event) {
    currentSort = event.target.value;
    lastVisible = null;
    loadCommunities(true);
}

// Handle genre filter
function handleGenreFilter(event) {
    const pill = event.target;
    const genre = pill.getAttribute("data-genre");

    // Special case for "All" button
    if (genre === "all") {
        // Clear all selections when "All" is clicked
        document.querySelectorAll(".genre-pill").forEach(p => {
            p.classList.remove("active");
        });
        pill.classList.add("active");
        selectedGenres = []; // Empty array means no specific genre filter (all genres)
        lastVisible = null;
        loadCommunities(true);
        return;
    }

    // Remove "All" selection if any other genre is selected
    const allPill = document.querySelector('.genre-pill[data-genre="all"]');
    allPill.classList.remove("active");

    // Toggle this genre selection
    if (pill.classList.contains("active")) {
        // If already active, remove from selection
        pill.classList.remove("active");
        selectedGenres = selectedGenres.filter(g => g !== genre);

        // If no genres are selected, activate "All" again
        if (selectedGenres.length === 0) {
            allPill.classList.add("active");
        }
    } else {
        // Add to selection
        pill.classList.add("active");
        selectedGenres.push(genre);
    }

    lastVisible = null;
    loadCommunities(true);
}

// Load communities
async function loadCommunities(isNewQuery = false) {
    if (isLoading) return;

    isLoading = true;

    try {
        // Show loading state
        if (isNewQuery) {
            document.getElementById("communitiesGrid").innerHTML = '<div class="loading">Loading communities...</div>';
            document.getElementById("noResults").style.display = "none";
        }

        // Build query
        let communitiesQuery;
        const communitiesRef = collection(db, "communities");

        // Apply sort
        let sortField, sortDirection;
        switch (currentSort) {
            case "newest":
                sortField = "createdAt";
                sortDirection = "desc";
                break;
            case "alphabetical":
                sortField = "name";
                sortDirection = "asc";
                break;
            case "members":
                sortField = "memberCount";
                sortDirection = "desc";
                break;
            case "popular":
            default:
                // Popular could be based on a combination of members and activity
                sortField = "memberCount";
                sortDirection = "desc";
                break;
        }

        if (selectedGenres.length > 0) {
            // Using array-contains-any for multiple genre filtering
            communitiesQuery = query(
                communitiesRef,
                where("genres", "array-contains-any", selectedGenres),
                orderBy(sortField, sortDirection),
                limit(currentSearch ? 100 : communitiesPerPage) // Fetch more if searching
            );
        } else {
            communitiesQuery = query(
                communitiesRef,
                orderBy(sortField, sortDirection),
                limit(currentSearch ? 100 : communitiesPerPage) // Fetch more if searching
            );
        }

        // Apply pagination for "load more" if not searching
        if (lastVisible && !isNewQuery && !currentSearch) {
            if (selectedGenres.length > 0) {
                communitiesQuery = query(
                    communitiesRef,
                    where("genres", "array-contains-any", selectedGenres),
                    orderBy(sortField, sortDirection),
                    startAfter(lastVisible),
                    limit(communitiesPerPage)
                );
            } else {
                communitiesQuery = query(
                    communitiesRef,
                    orderBy(sortField, sortDirection),
                    startAfter(lastVisible),
                    limit(communitiesPerPage)
                );
            }
        }

        // Execute query
        const communitiesSnapshot = await getDocs(communitiesQuery);

        // Clear previous results if new query
        if (isNewQuery) {
            document.getElementById("communitiesGrid").innerHTML = "";
        }

        // Process and filter results
        const communitiesGrid = document.getElementById("communitiesGrid");
        let communitiesHTML = "";
        let filteredDocs = [];

        // Handle results and filtering
        if (selectedGenres.length > 1) {
            // The Firebase query with array-contains-any returns communities that match ANY of the selected genres
            communitiesSnapshot.docs.forEach(doc => {
                const communityData = doc.data();

                // Skip private communities if user is not a member
                if (communityData.isPrivate && (!loggedInUser || !communityData.members.includes(loggedInUser))) {
                    return;
                }

                // Check if the community has ALL the selected genres
                const hasAllSelectedGenres = selectedGenres.every(genre =>
                    communityData.genres.includes(genre)
                );

                if (hasAllSelectedGenres) {
                    filteredDocs.push(doc);
                }
            });
        } else {
            // Filter out private communities if user is not a member
            filteredDocs = communitiesSnapshot.docs.filter(doc => {
                const communityData = doc.data();
                return !communityData.isPrivate || (loggedInUser && communityData.members.includes(loggedInUser));
            });
        }

        // Additional search term filtering if needed
        if (currentSearch) {
            const searchLower = currentSearch.toLowerCase();
            filteredDocs = filteredDocs.filter(doc => {
                const communityData = doc.data();
                const communityName = communityData.name.toLowerCase();
                return communityName.includes(searchLower);
            });

            // Only take the first 'communitiesPerPage' results for search
            filteredDocs = filteredDocs.slice(0, communitiesPerPage);
        }

        // If no results
        if (filteredDocs.length === 0) {
            if (isNewQuery) {
                document.getElementById("noResults").style.display = "block";
                document.getElementById("loadMoreButton").style.display = "none";
            } else {
                document.getElementById("loadMoreButton").style.display = "none";
            }
            isLoading = false;
            return;
        }

        // Update lastVisible for pagination (only if not searching)
        if (!currentSearch) {
            lastVisible = communitiesSnapshot.docs[communitiesSnapshot.docs.length - 1];
        } else {
            // Disable pagination when searching
            lastVisible = null;
        }

        // Process results for display
        filteredDocs.forEach(doc => {
            const communityData = doc.data();
            const communityId = doc.id;

            // Check if user is a member
            const isMember = loggedInUser && communityData.members && communityData.members.includes(loggedInUser);

            // Format genres with a maximum of 3 displayed
            const displayedGenres = communityData.genres.slice(0, 3).map(genre =>
                `<span class="genre-tag">${genre}</span>`
            ).join("");

            // Create community card
            communitiesHTML += `
            <div class="community-card">
                <div class="community-header">
                    <img src="${communityData.bannerImage || 'https://placehold.co/400x120/333/888?text=Banner'}" alt="Community banner" onerror="this.src='https://placehold.co/400x120/333/888?text=Banner'">
                    <div class="community-profile-pic">
                        <img src="${communityData.profilePicture || 'https://placehold.co/80x80/444/aaa?text=Profile'}" alt="${communityData.name}" onerror="this.src='https://placehold.co/80x80/444/aaa?text=Profile'">
                    </div>
                </div>
                <div class="community-body">
                    <h3 class="community-name">
                        ${communityData.name}
                        ${communityData.isPrivate ? '<span class="private-badge">Private</span>' : ''}
                    </h3>
                    <div class="community-meta">Created ${formatDate(communityData.createdAt)}</div>
                    <div class="community-genres">
                        ${displayedGenres}
                        ${communityData.genres.length > 3 ? `<span class="genre-tag">+${communityData.genres.length - 3}</span>` : ''}
                    </div>
                    <p class="community-description">${communityData.bio || 'No description available.'}</p>
                </div>
                <div class="community-footer">
                    <span class="members-count">${communityData.memberCount || 0} members</span>
                    <div class="actions">
                        ${isMember || !communityData.isPrivate ?
                `<a href="../homePage/communityProfile.html?id=${communityId}" class="view-btn">View</a>` :
                `<span class="locked-view-btn" title="Only members can view private communities"><i class="bx bxs-lock"></i> Members Only</span>`
            }
                        <button class="join-btn ${isMember ? 'joined' : ''}" data-id="${communityId}">
                            ${isMember ? 'Leave' : 'Join'}
                        </button>
                    </div>
                </div>
            </div>
        `;
        });

        // Append new communities to grid
        communitiesGrid.innerHTML += communitiesHTML;

        // Show or hide "Load More" button
        document.getElementById("loadMoreButton").style.display =
            (currentSearch || communitiesSnapshot.size < communitiesPerPage) ? "none" : "block";

        // Add event listeners to join buttons
        document.querySelectorAll(".join-btn").forEach(button => {
            button.addEventListener("click", handleJoinCommunity);
        });

        // Hide no results message
        document.getElementById("noResults").style.display = "none";

    } catch (error) {
        console.error("Error loading communities:", error);
        // Show error message
        if (isNewQuery) {
            document.getElementById("communitiesGrid").innerHTML = `
                <div class="loading error">
                    Error loading communities. Please try again.
                </div>
            `;
        }
    } finally {
        isLoading = false;
    }
}

// Load more communities
function loadMoreCommunities() {
    loadCommunities(false);
}

// Load user's communities
async function loadMyCommunities() {
    try {
        // Query for communities where user is a member
        const myCommunityQuery = query(
            collection(db, "communities"),
            where("members", "array-contains", loggedInUser),
            orderBy("name"),
            limit(6)
        );

        const communitiesSnapshot = await getDocs(myCommunityQuery);

        const myCommunitiesGrid = document.getElementById("myCommunities");

        // Check if user has no communities
        if (communitiesSnapshot.empty) {
            myCommunitiesGrid.innerHTML = "";
            document.getElementById("noMyCommunities").style.display = "block";
            return;
        }

        // Process and display user's communities
        let communitiesHTML = "";

        communitiesSnapshot.forEach(doc => {
            const communityData = doc.data();
            const communityId = doc.id;

            // Format genres with a maximum of 3 displayed
            const displayedGenres = communityData.genres.slice(0, 3).map(genre =>
                `<span class="genre-tag">${genre}</span>`
            ).join("");

            // Create community card
            communitiesHTML += `
                <div class="community-card">
                    <div class="community-header">
                        <img src="${communityData.bannerImage || 'https://placehold.co/400x120/333/888?text=Banner'}" alt="Community banner" onerror="this.src='https://placehold.co/400x120/333/888?text=Banner'">
                        <div class="community-profile-pic">
                            <img src="${communityData.profilePicture || 'https://placehold.co/80x80/444/aaa?text=Profile'}" alt="${communityData.name}" onerror="this.src='https://placehold.co/80x80/444/aaa?text=Profile'">
                        </div>
                    </div>
                    <div class="community-body">
                        <h3 class="community-name">${communityData.name}</h3>
                        <div class="community-meta">Created ${formatDate(communityData.createdAt)}</div>
                        <div class="community-genres">
                            ${displayedGenres}
                            ${communityData.genres.length > 3 ? `<span class="genre-tag">+${communityData.genres.length - 3}</span>` : ''}
                        </div>
                        <p class="community-description">${communityData.bio || 'No description available.'}</p>
                    </div>
                    <div class="community-footer">
                        <span class="members-count">${communityData.memberCount || 0} members</span>
                        <a href="../homePage/communityProfile.html?id=${communityId}" class="view-btn">View</a>
                    </div>
                </div>
            `;
        });

        // Display user's communities
        myCommunitiesGrid.innerHTML = communitiesHTML;
        document.getElementById("noMyCommunities").style.display = "none";

    } catch (error) {
        console.error("Error loading user communities:", error);
        document.getElementById("myCommunities").innerHTML = `
            <div class="loading error">
                Error loading your communities. Please try again.
            </div>
        `;
    }
}

// Handle joining/leaving a community
async function handleJoinCommunity(event) {
    if (!loggedInUser) {
        alert("You need to be logged in to join communities");
        return;
    }

    const button = event.currentTarget;
    const communityId = button.getAttribute("data-id");
    const isJoined = button.classList.contains("joined");

    try {
        const communityRef = doc(db, "communities", communityId);
        const communitySnap = await getDoc(communityRef);

        if (!communitySnap.exists()) {
            alert("Community not found");
            return;
        }

        const communityData = communitySnap.data();

        if (isJoined) {
            // Don't allow creator to leave
            if (communityData.createdBy === loggedInUser) {
                alert("As the creator, you cannot leave this community");
                return;
            }

            // Leave community
            await updateDoc(communityRef, {
                members: arrayRemove(loggedInUser),
                memberCount: (communityData.memberCount || 1) - 1
            });

            button.textContent = "Join";
            button.classList.remove("joined");

        } else {
            // Join community
            await updateDoc(communityRef, {
                members: arrayUnion(loggedInUser),
                memberCount: (communityData.memberCount || 0) + 1
            });

            button.textContent = "Leave";
            button.classList.add("joined");
        }

        // Refresh my communities section
        loadMyCommunities();

    } catch (error) {
        console.error("Error joining/leaving community:", error);
        alert("Error processing your request");
    }
}

// Helper function to format date
function formatDate(dateString) {
    if (!dateString) return "recently";

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (isNaN(diffDays)) return "recently";

    if (diffDays === 0) {
        return "today";
    } else if (diffDays === 1) {
        return "yesterday";
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
        return date.toLocaleDateString();
    }
}