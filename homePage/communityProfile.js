import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, query,onSnapshot, where, getDocs, orderBy, limit, addDoc, Timestamp, deleteDoc, writeBatch, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// our special api key
const API_KEY = "bc7c4e7c62d9e223e196bbd15978fc51";

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

// Get community ID from URL
const urlParams = new URLSearchParams(window.location.search);
const communityId = urlParams.get('id');

// Get logged-in user
const loggedInUser = localStorage.getItem("loggedInUser");

let discussionIsLoading = false;

// Check if community ID is provided
if (!communityId) {
    alert("Community not found");
    window.location.href = "../homePage/homePage.html";
}

// Load community data
async function loadCommunityData() {
    try {
        const communityRef = doc(db, "communities", communityId);
        const communitySnap = await getDoc(communityRef);

        if (!communitySnap.exists()) {
            alert("Community not found");
            window.location.href = "../homePage/communities.html";
            return;
        }

        const communityData = communitySnap.data();

        // Check if the community is private and the user is not a member
        if (communityData.isPrivate && (!loggedInUser || !communityData.members.includes(loggedInUser))) {
            alert("This is a private community. Only members can view this page.");
            window.location.href = "../homePage/communities.html";
            return;
        }

        // Continue loading community data if authorized
        document.getElementById("communityName").textContent = communityData.name;
        document.getElementById("memberCount").textContent = `${communityData.memberCount || 0} Members`;
        document.getElementById("communityGenres").textContent = communityData.genres.join(", ");
        document.getElementById("communityBio").textContent = communityData.bio;

        // Add private badge if community is private
        if (communityData.isPrivate) {
            const nameBadge = document.createElement("span");
            nameBadge.className = "private-badge";
            nameBadge.textContent = "Private";
            nameBadge.style.display = "inline-block";
            nameBadge.style.fontSize = "14px";
            nameBadge.style.backgroundColor = "#555";
            nameBadge.style.color = "#fff";
            nameBadge.style.padding = "2px 8px";
            nameBadge.style.borderRadius = "4px";
            nameBadge.style.marginLeft = "10px";
            document.getElementById("communityName").appendChild(nameBadge);
        }

        if (communityData.profilePicture) {
            document.getElementById("communityProfilePic").src = communityData.profilePicture;
        }

        // Load banner image if available
        if (communityData.bannerImage) {
            document.getElementById("communityBannerImg").src = communityData.bannerImage;
        }

        // Update join button based on membership
        const joinButton = document.getElementById("joinButton");
        const isMember = loggedInUser && communityData.members.includes(loggedInUser);
        if (isMember) {
            joinButton.textContent = "Leave";
            joinButton.classList.add("leave");
        } else {
            joinButton.textContent = "Join";
            joinButton.classList.remove("leave");
        }

        // Check if user has a pending join request
        if (!isMember && communityData.isPrivate && loggedInUser) {
            try {
                const joinRequestsRef = collection(db, "joinRequests");
                const requestQuery = query(
                    joinRequestsRef,
                    where("userId", "==", loggedInUser),
                    where("communityId", "==", communityId),
                    where("status", "==", "pending")
                );
                const requestSnap = await getDocs(requestQuery);

                if (!requestSnap.empty) {
                    joinButton.textContent = "Request Pending";
                    joinButton.classList.add("pending");
                    joinButton.disabled = true;
                }
            } catch (error) {
                console.error("Error checking join request status:", error);
            }
        }

        // Add Edit button for community creator
        if (loggedInUser && communityData.createdBy === loggedInUser) {
            const editButton = document.createElement("button");
            editButton.className = "edit-btn";
            editButton.textContent = "Edit Community";
            editButton.style.marginTop = "10px";
            editButton.style.backgroundColor = "#333";
            editButton.style.color = "#fff";
            editButton.style.border = "1px solid #555";
            editButton.addEventListener("click", () => {
                window.location.href = `../homePage/communitySettings.html?id=${communityId}`;
            });
            document.querySelector(".community-actions").appendChild(editButton);
        }

        // Load members
        await loadMembers(communityData.members);

        // Load reviews
        await loadReviews();

        // Load discussion posts
        await loadDiscussionPosts();

    } catch (error) {
        console.error("Error loading community data:", error);
        alert("Error loading community data");
    }
}

// Load members
async function loadMembers(membersList) {
    try {
        const membersContainer = document.getElementById("membersList");
        membersContainer.innerHTML = "";

        // Check if current user is the community creator
        const isCreator = await isUserAdmin();

        for (const username of membersList) {
            const userRef = doc(db, "users", username);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();

                const memberCard = document.createElement("div");
                memberCard.className = "member-card";
                memberCard.setAttribute("data-username", username);

                // Check if this member is the creator of the community
                const communityRef = doc(db, "communities", communityId);
                const communitySnap = await getDoc(communityRef);
                const isAdmin = communitySnap.data().createdBy === username;

                // Create the member card with different functionality based on user role
                if (isCreator && username !== loggedInUser && !isAdmin) {
                    // Admin view with options to view profile or remove member
                    memberCard.innerHTML = `
                        <img src="${userData.profilePicture || 'https://placehold.co/80x80/444/aaa?text=Member'}" alt="${userData.username}'s avatar" class="member-avatar">
                        <h3 class="member-name">${userData.username}</h3>
                        <span class="member-role${isAdmin ? ' admin' : ''}">${isAdmin ? 'Admin' : 'Member'}</span>
                        <div class="member-actions">
                            <button class="view-profile-btn" data-username="${username}">View Profile</button>
                            <button class="remove-member-btn" data-username="${username}">Remove</button>
                        </div>
                    `;

                    // Apply styles to the member actions
                    const style = document.createElement('style');
                    style.textContent = `
                        .member-actions {
                            margin-top: 10px;
                            display: flex;
                            flex-direction: column;
                            gap: 5px;
                        }
                        .view-profile-btn, .remove-member-btn {
                            padding: 5px 10px;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 12px;
                            transition: background-color 0.3s;
                        }
                        .view-profile-btn {
                            background-color: #444;
                            color: white;
                        }
                        .view-profile-btn:hover {
                            background-color: #555;
                        }
                        .remove-member-btn {
                            background-color: #6e1a1a;
                            color: white;
                        }
                        .remove-member-btn:hover {
                            background-color: #8f2222;
                        }
                    `;
                    document.head.appendChild(style);
                } else {
                    // Regular view - entire card is clickable
                    memberCard.innerHTML = `
                    <img src="${userData.profilePicture || 'https://placehold.co/80x80/444/aaa?text=Member'}" alt="${userData.username}'s avatar" class="member-avatar">
                    <h3 class="member-name">${userData.username}</h3>
                    <span class="member-role${isAdmin ? ' admin' : ''}">${isAdmin ? 'Admin' : 'Member'}</span>
                    `;
                    memberCard.style.cursor = "pointer";

                    // Add click event to the entire card for regular users or non-removable members
                    memberCard.addEventListener("click", () => {
                        window.location.href = `OtherProfilePage.html?user=${encodeURIComponent(username)}`;
                    });
                }

                membersContainer.appendChild(memberCard);

                // If this is an admin view, add click handlers to the buttons
                if (isCreator && username !== loggedInUser && !isAdmin) {
                    memberCard.querySelector(".view-profile-btn").addEventListener("click", (e) => {
                        e.stopPropagation(); // Prevent bubbling to the card
                        window.location.href = `OtherProfilePage.html?user=${encodeURIComponent(username)}`;
                    });

                    memberCard.querySelector(".remove-member-btn").addEventListener("click", (e) => {
                        e.stopPropagation(); // Prevent bubbling to the card
                        handleRemoveMember(username);
                    });
                }
            }
        }
    } catch (error) {
        console.error("Error loading members:", error);
    }
}

// Function to handle removing a member from the community
async function handleRemoveMember(username) {
    if (!confirm(`Are you sure you want to remove ${username} from this community?`)) {
        return;
    }

    try {
        const communityRef = doc(db, "communities", communityId);
        const communitySnap = await getDoc(communityRef);

        if (!communitySnap.exists()) {
            alert("Community not found");
            return;
        }

        const communityData = communitySnap.data();

        // Check if the logged-in user is the creator
        if (communityData.createdBy !== loggedInUser) {
            alert("You don't have permission to remove members");
            return;
        }

        // Remove the member from the community
        await updateDoc(communityRef, {
            members: arrayRemove(username),
            memberCount: communityData.memberCount - 1
        });

        // Update the UI by reloading members
        await loadMembers(communityData.members.filter(member => member !== username));

        // Update member count in UI
        document.getElementById("memberCount").textContent = `${communityData.memberCount - 1} Members`;

        alert(`${username} has been removed from the community`);
    } catch (error) {
        console.error("Error removing member:", error);
        alert("Error removing member");
    }
}

// Make movie titles clickable
function makeMovieTitlesClickable() {
    document.querySelectorAll('.movie-title').forEach(title => {
        title.addEventListener('click', async () => {
            const movieTitle = title.textContent;
            // Search for movie in TMDB
            try {
                const response = await fetch(
                    `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(movieTitle)}`
                );
                const data = await response.json();
                if (data.results && data.results.length > 0) {
                    // Store the first result and navigate to movie page
                    localStorage.setItem("selectedMovie", JSON.stringify(data.results[0]));
                    window.location.href = "moviePage.html";
                }
            } catch (error) {
                console.error("Error searching for movie:", error);
            }
        });
    });
}

async function getMovieGenres(movieTitle) {
    try {
        const response = await fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(movieTitle)}&page=1`
        );
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            // Get the first result's genre IDs
            const genreIds = data.results[0].genre_ids || [];

            // Convert IDs to genre names
            // Note: We need to maintain a map of genre IDs to names
            const genreNames = [];

            // Map of common genre IDs to names
            const genreMap = {
                28: "Action",
                12: "Adventure",
                16: "Animation",
                35: "Comedy",
                80: "Crime",
                99: "Documentary",
                18: "Drama",
                10751: "Family",
                14: "Fantasy",
                36: "History",
                27: "Horror",
                10402: "Music",
                9648: "Mystery",
                10749: "Romance",
                878: "Science Fiction",
                10770: "TV Movie",
                53: "Thriller",
                10752: "War",
                37: "Western"
            };

            // Map genre IDs to names
            for (const id of genreIds) {
                if (genreMap[id]) {
                    genreNames.push(genreMap[id]);
                }
            }

            return genreNames;
        }

        return [];
    } catch (error) {
        console.error("Error fetching movie genres:", error);
        return [];
    }
}

async function loadReviews() {
    try {
        const reviewsContainer = document.getElementById("reviewsList");

        // Add loading indicator
        reviewsContainer.innerHTML = `<div class="loading-indicator">Loading reviews from community members...</div>`;

        // Get the community data to access member list and genres
        const communityRef = doc(db, "communities", communityId);
        const communitySnap = await getDoc(communityRef);

        if (!communitySnap.exists()) {
            console.error("Community not found");
            reviewsContainer.innerHTML = `<p class="no-items">Error loading community information.</p>`;
            return;
        }

        const communityData = communitySnap.data();
        const membersList = communityData.members || [];
        const communityGenres = communityData.genres || [];

        // Array to store all reviews
        let allReviews = [];

        // Create a batch of promises to fetch reviews from all members
        const reviewPromises = membersList.map(async (username) => {
            try {
                // Get the user reviews collection
                const userReviewsRef = collection(db, "users", username, "reviews");
                const userReviewsSnapshot = await getDocs(userReviewsRef);

                if (!userReviewsSnapshot.empty) {
                    // Get user info once for all reviews
                    const userRef = doc(db, "users", username);
                    const userSnap = await getDoc(userRef);
                    const userData = userSnap.exists() ? userSnap.data() : { username: username };

                    // Process each review from this user
                    for (const reviewDoc of userReviewsSnapshot.docs) {
                        const reviewData = reviewDoc.data();

                        // Skip reviews without movie titles or ratings
                        if (!reviewData.title) continue;

                        // Fetch movie genres from TMDB
                        const movieGenres = await getMovieGenres(reviewData.title);

                        // Check if any movie genre matches the community genres
                        const hasMatchingGenre = movieGenres.some(genre =>
                            communityGenres.includes(genre)
                        );

                        // Only add reviews with matching genres
                        if (hasMatchingGenre) {
                            // Add review to array with additional metadata
                            allReviews.push({
                                id: reviewDoc.id,
                                username: username,
                                userData: userData,
                                reviewData: reviewData,
                                movieGenres: movieGenres,
                                // Convert timestamp to Date object for sorting if available
                                timestamp: reviewData.watchedDate ? new Date(reviewData.watchedDate) : new Date(0)
                            });
                        }
                    }
                }
            } catch (error) {
                console.error(`Error fetching reviews for member ${username}:`, error);
                // Continue with other members even if one fails
            }
        });

        // Wait for all review promises to resolve
        await Promise.all(reviewPromises);

        // Sort reviews by watched date (newest first)
        allReviews.sort((a, b) => b.timestamp - a.timestamp);

        // Clear container after all reviews are fetched
        reviewsContainer.innerHTML = "";

        if (allReviews.length === 0) {
            reviewsContainer.innerHTML = `<p class="no-items">No reviews matching community genres yet. Be the first to share relevant movie reviews!</p>`;
            return;
        }

        // Display sorted reviews (limit to 10 initially)
        const reviewsToShow = allReviews.slice(0, 10);
        reviewsToShow.forEach(review => {
            const reviewItem = createReviewElement(review);
            reviewsContainer.appendChild(reviewItem);
        });

        // Make movie titles clickable
        makeMovieTitlesClickable();

        // Add "View More" button if there are more reviews
        if (allReviews.length > 10) {
            const viewMoreBtn = document.createElement("button");
            viewMoreBtn.className = "view-more-btn";
            viewMoreBtn.textContent = `View more reviews (${allReviews.length - 10} more)`;
            viewMoreBtn.addEventListener("click", () => loadMoreReviews(allReviews, 10));
            reviewsContainer.appendChild(viewMoreBtn);
        }

    } catch (error) {
        console.error("Error loading member reviews:", error);
        document.getElementById("reviewsList").innerHTML = `<p class="no-items">Error loading reviews. Please try again later.</p>`;
    }
}

function createReviewElement(review) {
    const { userData, reviewData } = review;

    // Create review item container
    const reviewItem = document.createElement("div");
    reviewItem.className = "review-item";

    // Add cursor style and click event for the entire card
    reviewItem.style.cursor = "pointer";
    reviewItem.addEventListener("click", (e) => {
        // Only navigate if the click wasn't on another interactive element
        // like the movie title which has its own click handler
        if (!e.target.closest('.movie-title')) {
            goToOtherReviewPage(userData.username, reviewData.title);
        }
    });

    // Format date as "Month Day, Year" if available
    let formattedDate = "";
    if (reviewData.watchedDate && reviewData.watchedDate !== "Not Provided") {
        try {
            const date = new Date(reviewData.watchedDate);
            formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            formattedDate = reviewData.watchedDate;
        }
    }

    // Generate stars based on the rating
    const rating = reviewData.rating || 0;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';

    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
            stars += '★'; // full star
        } else if (hasHalfStar && i === fullStars + 1) {
            stars += '½'; // half star
        } else {
            stars += '☆'; // empty star
        }
    }

    // Get user avatar - use placeholder if not available
    const userAvatar = userData.profilePicture || "https://placehold.co/40x40/444/aaa?text=User";

    // Get movie poster if available, or use placeholder
    const moviePoster = reviewData.selectedPoster || `https://placehold.co/100x150/333/aaa?text=${encodeURIComponent(reviewData.title)}`;

    // Construct the HTML for the review
    reviewItem.innerHTML = `
        <div class="review-header">
            <img src="${userAvatar}" alt="${userData.username}'s avatar" class="user-avatar">
            <div class="review-meta">
                <h3 class="username">${userData.username}</h3>
                <div class="movie-rating">
                    <span class="movie-title">${reviewData.title}</span>
                    <span class="rating">${stars} ${rating.toFixed(1)}</span>
                </div>
            </div>
        </div>
        <div class="review-content">
            <div class="movie-poster-container">
                <img src="${moviePoster}" alt="${reviewData.title} poster" class="movie-poster">
            </div>
            <div class="review-text-container">
                <p class="review-text">${reviewData.reviewText || "No review text provided."}</p>
                ${formattedDate ? `<p class="review-date">Watched on: ${formattedDate}</p>` : ''}
                ${reviewData.liked ? '<p class="review-liked"><i class="bx bxs-heart" style="color: #ff4d4d;"></i> Liked this movie</p>' : ''}
            </div>
        </div>
    `;

    return reviewItem;
}

window.goToOtherReviewPage = function (username, movieTitle) {
    const encodedUser = encodeURIComponent(username);
    const encodedMovie = encodeURIComponent(movieTitle);
    window.location.href = `viewOtherReviewPage.html?user=${encodedUser}&movie=${encodedMovie}`;
};

// Function to load more reviews when "View More" is clicked
function loadMoreReviews(allReviews, currentCount) {
    const reviewsContainer = document.getElementById("reviewsList");

    // Remove the "View More" button
    const viewMoreBtn = reviewsContainer.querySelector(".view-more-btn");
    if (viewMoreBtn) {
        viewMoreBtn.remove();
    }

    // Show the next batch of reviews (10 more)
    const nextBatch = allReviews.slice(currentCount, currentCount + 10);

    nextBatch.forEach(review => {
        const reviewItem = createReviewElement(review);
        reviewsContainer.appendChild(reviewItem);
    });

    // Make newly added movie titles clickable
    makeMovieTitlesClickable();

    // Add "View More" button if there are still more reviews
    if (allReviews.length > currentCount + 10) {
        const newViewMoreBtn = document.createElement("button");
        newViewMoreBtn.className = "view-more-btn";
        newViewMoreBtn.textContent = `View more reviews (${allReviews.length - (currentCount + 10)} more)`;
        newViewMoreBtn.addEventListener("click", () => loadMoreReviews(allReviews, currentCount + 10));
        reviewsContainer.appendChild(newViewMoreBtn);
    }
}

// Load discussion posts
async function loadDiscussionPosts() {
    if (discussionIsLoading) return; // Prevent concurrent loads
    discussionIsLoading = true;

    try {
        const postsContainer = document.getElementById("discussionPosts");
        postsContainer.innerHTML = ""; // Clear existing posts

        // Get discussion posts for this community
        const postsQuery = query(
            collection(db, "posts"),
            where("communityId", "==", communityId),
            orderBy("createdAt", "desc"),
            limit(10)
        );

        const postsSnapshot = await getDocs(postsQuery);

        if (postsSnapshot.empty) {
            postsContainer.innerHTML = `<p class="no-items">No discussion posts yet. Start the conversation!</p>`;
            return;
        }

        for (const postDoc of postsSnapshot.docs) {
            const postData = postDoc.data();

            // Get user info
            const userRef = doc(db, "users", postData.username);
            const userSnap = await getDoc(userRef);
            const userData = userSnap.exists() ? userSnap.data() : { username: postData.username };

            const postElement = document.createElement("div");
            postElement.className = "discussion-post";
            postElement.id = `post-${postDoc.id}`;

            // Format timestamp
            let postDate;
            let timeAgo;

            if (postData.createdAt instanceof Timestamp) {
                postDate = postData.createdAt.toDate();
                timeAgo = getTimeAgo(postDate);
            } else if (typeof postData.createdAt === 'string') {
                postDate = new Date(postData.createdAt);
                timeAgo = getTimeAgo(postDate);
            } else {
                timeAgo = "Recently";
            }

            // Check if current user is post owner or community admin
            let deleteButton = '';
            if (loggedInUser && (loggedInUser === postData.username || await isUserAdmin())) {
                deleteButton = `<button class="delete-post-btn" data-post-id="${postDoc.id}">🗑️</button>`;
            }

            postElement.innerHTML = `
                    <div class="post-header">
                        <img src="${userData.profilePicture || 'https://placehold.co/40x40/444/aaa?text=User'}" alt="${userData.username}'s avatar" class="user-avatar user-profile-link" data-username="${userData.username}">
                        <div class="post-meta">
                            <h3 class="username user-profile-link" data-username="${userData.username}">${userData.username}</h3>
                            <span class="post-time">${timeAgo}</span>
                        </div>
                        ${deleteButton}
                    </div>
                    <p class="post-content">${formatPostContent(postData.content)}</p>
                    <div class="post-actions">
                        <button class="like-btn ${(postData.likes && postData.likes.includes(loggedInUser)) ? 'liked' : ''}" data-post-id="${postDoc.id}">
                            ${(postData.likes && postData.likes.includes(loggedInUser)) ? '❤️' : '🤍'} ${postData.likes ? postData.likes.length : 0}
                        </button>
                        <button class="comment-btn" data-post-id="${postDoc.id}">💬 ${postData.commentCount || 0}</button>
                    </div>
                `;

            // If the post has comments, load and display them
            if (postData.commentCount > 0) {
                const commentsSection = document.createElement("div");
                commentsSection.className = "comments-section";

                // Get comments for this post
                const commentsQuery = query(
                    collection(db, "comments"),
                    where("postId", "==", postDoc.id),
                    orderBy("createdAt", "asc"),
                    limit(3)
                );

                const commentsSnapshot = await getDocs(commentsQuery);

                for (const commentDoc of commentsSnapshot.docs) {
                    const commentData = commentDoc.data();

                    // Get comment user info
                    const commentUserRef = doc(db, "users", commentData.username);
                    const commentUserSnap = await getDoc(commentUserRef);
                    const commentUserData = commentUserSnap.exists() ? commentUserSnap.data() : { username: commentData.username };

                    // Check if current user is comment owner
                    let deleteCommentButton = '';
                    if (loggedInUser && (loggedInUser === commentData.username || await isUserAdmin())) {
                        deleteCommentButton = `<button class="delete-comment-btn" data-comment-id="${commentDoc.id}">🗑️</button>`;
                    }

                    const commentElement = document.createElement("div");
                    commentElement.className = "comment";
                    commentElement.id = `comment-${commentDoc.id}`;

                    // Format timestamp for comment
                    let commentDate;
                    let commentTimeAgo;

                    if (commentData.createdAt instanceof Timestamp) {
                        commentDate = commentData.createdAt.toDate();
                        commentTimeAgo = getTimeAgo(commentDate);
                    } else if (typeof commentData.createdAt === 'string') {
                        commentDate = new Date(commentData.createdAt);
                        commentTimeAgo = getTimeAgo(commentDate);
                    } else {
                        commentTimeAgo = "Recently";
                    }

                    commentElement.innerHTML = `
                        <img src="${commentUserData.profilePicture || 'https://placehold.co/30x30/444/aaa?text=User'}" alt="${commentUserData.username}'s avatar" class="user-avatar-small user-profile-link" data-username="${commentUserData.username}">
                        <div class="comment-content">
                            <div class="comment-header">
                                <h4 class="username user-profile-link" data-username="${commentUserData.username}">${commentUserData.username}</h4>
                                <span class="comment-time">${commentTimeAgo}</span>
                                ${deleteCommentButton}
                            </div>
                            <p>${formatPostContent(commentData.content)}</p>
                        </div>
                    `;

                    commentsSection.appendChild(commentElement);
                }

                // Add comment form
                const commentFormElement = document.createElement("div");
                commentFormElement.className = "comment-form";
                commentFormElement.innerHTML = `
                    <div class="add-comment-form" id="comment-form-${postDoc.id}" style="display: none;">
                        <textarea class="comment-input" placeholder="Write a comment..."></textarea>
                        <button class="submit-comment-btn" data-post-id="${postDoc.id}">Post</button>
                    </div>
                `;
                commentsSection.appendChild(commentFormElement);

                if (postData.commentCount > 3) {
                    const viewMoreElement = document.createElement("div");
                    viewMoreElement.className = "view-more";
                    viewMoreElement.innerHTML = `<button class="view-more-btn" data-post-id="${postDoc.id}">View all ${postData.commentCount} comments</button>`;
                    commentsSection.appendChild(viewMoreElement);
                }

                postElement.appendChild(commentsSection);
            } else {
                // No comments yet, but add the comment form
                const commentsSection = document.createElement("div");
                commentsSection.className = "comments-section";
                commentsSection.innerHTML = `
                    <div class="add-comment-form" id="comment-form-${postDoc.id}" style="display: none;">
                        <textarea class="comment-input" placeholder="Write a comment..."></textarea>
                        <button class="submit-comment-btn" data-post-id="${postDoc.id}">Post</button>
                    </div>
                `;
                postElement.appendChild(commentsSection);
            }

            postsContainer.appendChild(postElement);
        }

        // Add event listeners to buttons and user profile links
        document.querySelectorAll(".like-btn").forEach(button => {
            button.addEventListener("click", handleLikePost);
        });

        document.querySelectorAll(".comment-btn").forEach(button => {
            button.addEventListener("click", handleShowCommentForm);
        });

        document.querySelectorAll(".submit-comment-btn").forEach(button => {
            button.addEventListener("click", handleSubmitComment);
        });

        document.querySelectorAll(".delete-post-btn").forEach(button => {
            button.addEventListener("click", handleDeletePost);
        });

        document.querySelectorAll(".delete-comment-btn").forEach(button => {
            button.addEventListener("click", handleDeleteComment);
        });

        document.querySelectorAll(".view-more-btn").forEach(button => {
            button.addEventListener("click", handleViewMoreComments);
        });

        // Add click handlers for user profile links
        document.querySelectorAll(".user-profile-link").forEach(element => {
            element.addEventListener("click", function() {
                const username = this.getAttribute("data-username");
                window.location.href = `OtherProfilePage.html?user=${encodeURIComponent(username)}`;
            });
        });

    } catch (error) {
        console.error("Error loading discussion posts:", error);
    } finally {
        discussionIsLoading = false;
    }
}

// Handle joining/leaving community
async function handleJoinCommunity() {
    if (!loggedInUser) {
        alert("You need to be logged in to join communities");
        return;
    }

    try {
        const communityRef = doc(db, "communities", communityId);
        const communitySnap = await getDoc(communityRef);

        if (!communitySnap.exists()) {
            alert("Community not found");
            return;
        }

        const communityData = communitySnap.data();
        const isMember = communityData.members.includes(loggedInUser);

        const joinButton = document.getElementById("joinButton");

        // Disable button during operation
        joinButton.disabled = true;
        joinButton.textContent = isMember ? "Leaving..." : "Joining...";

        if (isMember) {
            // Leave community
            if (communityData.createdBy === loggedInUser) {
                alert("As the creator, you cannot leave this community");
                // Reset button state
                joinButton.disabled = false;
                joinButton.textContent = "Leave";
                return;
            }

            await updateDoc(communityRef, {
                members: arrayRemove(loggedInUser),
                memberCount: communityData.memberCount - 1
            });

            joinButton.textContent = "Join";
            joinButton.classList.remove("leave");

            // Update member count in UI
            document.getElementById("memberCount").textContent = `${communityData.memberCount - 1} Members`;

            // If we're on the Members tab, refresh the members list
            if (document.querySelector('[data-tab="members"]').classList.contains('active')) {
                // Get updated members list
                const updatedCommunitySnap = await getDoc(communityRef);
                const updatedMembers = updatedCommunitySnap.data().members;
                await loadMembers(updatedMembers);
            }

        } else {
            // Join community
            await updateDoc(communityRef, {
                members: arrayUnion(loggedInUser),
                memberCount: communityData.memberCount + 1
            });

            joinButton.textContent = "Leave";
            joinButton.classList.add("leave");

            // Update member count in UI
            document.getElementById("memberCount").textContent = `${communityData.memberCount + 1} Members`;

            // If we're on the Members tab, refresh the members list
            if (document.querySelector('[data-tab="members"]').classList.contains('active')) {
                // Get updated members list
                const updatedCommunitySnap = await getDoc(communityRef);
                const updatedMembers = updatedCommunitySnap.data().members;
                await loadMembers(updatedMembers);
            }
        }

        // Re-enable button
        joinButton.disabled = false;

    } catch (error) {
        console.error("Error joining/leaving community:", error);
        alert("Error processing your request");

        // Reset button state
        const joinButton = document.getElementById("joinButton");
        joinButton.disabled = false;
        joinButton.textContent = communityData.members.includes(loggedInUser) ? "Leave" : "Join";
    }
}

// Handle creating a new post
async function handleCreatePost() {
    if (!loggedInUser) {
        alert("You need to be logged in to post");
        return;
    }

    const postContent = document.getElementById("newPost").value.trim();

    if (!postContent) {
        alert("Please enter something to post");
        return;
    }

    try {
        const newPost = {
            username: loggedInUser,
            communityId: communityId,
            content: postContent,
            createdAt: Timestamp.now(),
            likes: [],
            commentCount: 0
        };

        await addDoc(collection(db, "posts"), newPost);

        // Clear the form and reload posts
        document.getElementById("newPost").value = "";
        await loadDiscussionPosts();

    } catch (error) {
        console.error("Error creating post:", error);
        alert("Error creating post");
    }
}

// Handle liking a post
async function handleLikePost(event) {
    if (!loggedInUser) {
        alert("You need to be logged in to like posts");
        return;
    }

    const postId = event.currentTarget.getAttribute("data-post-id");
    const likeButton = event.currentTarget; // Store reference to the button that was clicked

    try {
        const postRef = doc(db, "posts", postId);
        const postSnap = await getDoc(postRef);

        if (!postSnap.exists()) {
            alert("Post not found");
            return;
        }

        const postData = postSnap.data();
        const likes = postData.likes || [];
        const hasLiked = likes.includes(loggedInUser);

        if (hasLiked) {
            // Unlike post
            await updateDoc(postRef, {
                likes: arrayRemove(loggedInUser)
            });

            // Update UI
            likeButton.innerHTML = `🤍 ${likes.length - 1}`;
            likeButton.classList.remove('liked');
        } else {
            // Like post
            await updateDoc(postRef, {
                likes: arrayUnion(loggedInUser)
            });

            // ─── SEND notification to the post’s author ───
            const postOwner = postData.username;
            if (postOwner && postOwner !== loggedInUser) {
              // fetch owner’s settings
              const ownerRef  = doc(db, "users", postOwner);
              const ownerSnap = await getDoc(ownerRef);
              const ownerPrefs = ownerSnap.data()?.notificationPreferences || {};

              // only send if they allow “like” notifications
              if (ownerPrefs.likes_off) {
                await addDoc(
                  collection(db, "users", postOwner, "notifications"),
                  {
                    type: "like",
                    message: `${loggedInUser} liked your post.`,
                    createdAt: serverTimestamp(),
                    read: false
                  }
                );
              }
            }

            // Update UI
            likeButton.innerHTML = `❤️ ${likes.length + 1}`;
            likeButton.classList.add('liked');
        }

    } catch (error) {
        console.error("Error liking post:", error);
        alert("Error processing your request");
    }
}

// Handle showing comment form
function handleShowCommentForm(event) {
    const postId = event.currentTarget.getAttribute("data-post-id");
    const commentForm = document.getElementById(`comment-form-${postId}`);

    if (commentForm) {
        // Toggle comment form visibility
        if (commentForm.style.display === "none" || !commentForm.style.display) {
            commentForm.style.display = "flex";
            commentForm.querySelector("textarea").focus();
        } else {
            commentForm.style.display = "none";
        }
    }
}

// Handle submitting a comment
async function handleSubmitComment(event) {
    if (!loggedInUser) {
        alert("You need to be logged in to comment");
        return;
    }

    const postId = event.currentTarget.getAttribute("data-post-id");
    const commentForm = document.getElementById(`comment-form-${postId}`);
    const commentInput = commentForm.querySelector(".comment-input");
    const commentContent = commentInput.value.trim();

    if (!commentContent) {
        alert("Please enter a comment");
        return;
    }

    try {
        // Get the post reference
        const postRef = doc(db, "posts", postId);
        const postSnap = await getDoc(postRef);

        if (!postSnap.exists()) {
            alert("Post not found");
            return;
        }

        const postData = postSnap.data();

        // Create new comment
        const newComment = {
            postId: postId,
            communityId: communityId,
            username: loggedInUser,
            content: commentContent,
            createdAt: Timestamp.now()
        };

        // Add comment to the comments collection
        await addDoc(collection(db, "comments"), newComment);

        // Update comment count on the post
        const currentCommentCount = postData.commentCount || 0;
        await updateDoc(postRef, {
            commentCount: currentCommentCount + 1
        });

        // ─── SEND notification to the post’s author ───
        const postOwner = postData.username;
        if (postOwner && postOwner !== loggedInUser) {
          // fetch owner’s settings
          const ownerRef  = doc(db, "users", postOwner);
          const ownerSnap = await getDoc(ownerRef);
          const ownerPrefs = ownerSnap.data()?.notificationPreferences || {};

          // only send if they allow comment notifications
          if (ownerPrefs.comments_off) {
            await addDoc(
              collection(db, "users", postOwner, "notifications"),
              {
                type: "comment",
                message: `${loggedInUser} commented on your post.`,
                createdAt: serverTimestamp(),
                read: false
              }
            );
          }
        }

        // Clear input and hide form
        commentInput.value = "";
        commentForm.style.display = "none";

        // Reload discussion posts to show the new comment
        await loadDiscussionPosts();

    } catch (error) {
        console.error("Error adding comment:", error);
        alert("Error adding comment");
    }
}

// Handle deleting a post
async function handleDeletePost(event) {
    if (!loggedInUser) {
        alert("You need to be logged in to delete posts");
        return;
    }

    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
        return;
    }

    const postId = event.currentTarget.getAttribute("data-post-id");

    try {
        // Delete all comments for this post
        const commentsQuery = query(
            collection(db, "comments"),
            where("postId", "==", postId)
        );

        const commentsSnapshot = await getDocs(commentsQuery);

        const batch = writeBatch(db);

        commentsSnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });

        // Delete the post
        const postRef = doc(db, "posts", postId);
        batch.delete(postRef);

        await batch.commit();

        // Remove post from UI
        document.getElementById(`post-${postId}`).remove();

    } catch (error) {
        console.error("Error deleting post:", error);
        alert("Error deleting post");
    }
}

// Handle deleting a comment
async function handleDeleteComment(event) {
    if (!loggedInUser) {
        alert("You need to be logged in to delete comments");
        return;
    }

    if (!confirm("Are you sure you want to delete this comment?")) {
        return;
    }

    const commentId = event.currentTarget.getAttribute("data-comment-id");

    try {
        // Get the comment to find its post
        const commentRef = doc(db, "comments", commentId);
        const commentSnap = await getDoc(commentRef);

        if (!commentSnap.exists()) {
            alert("Comment not found");
            return;
        }

        const commentData = commentSnap.data();
        const postId = commentData.postId;

        // Update the post's comment count
        const postRef = doc(db, "posts", postId);
        const postSnap = await getDoc(postRef);

        if (postSnap.exists()) {
            const postData = postSnap.data();
            const currentCommentCount = postData.commentCount || 0;

            if (currentCommentCount > 0) {
                await updateDoc(postRef, {
                    commentCount: currentCommentCount - 1
                });
            }
        }

        // Delete the comment
        await deleteDoc(commentRef);

        // Remove comment from UI
        document.getElementById(`comment-${commentId}`).remove();

    } catch (error) {
        console.error("Error deleting comment:", error);
        alert("Error deleting comment");
    }
}

// Handle viewing more comments
async function handleViewMoreComments(event) {
    const postId = event.currentTarget.getAttribute("data-post-id");

    try {
        // Get all comments for this post
        const commentsQuery = query(
            collection(db, "comments"),
            where("postId", "==", postId),
            orderBy("createdAt", "asc")
        );

        const commentsSnapshot = await getDocs(commentsQuery);

        // Get the comments section element
        const post = document.getElementById(`post-${postId}`);
        const commentsSection = post.querySelector(".comments-section");

        // Clear existing comments (except the comment form)
        const commentForm = commentsSection.querySelector(".add-comment-form").cloneNode(true);
        commentsSection.innerHTML = "";
        commentsSection.appendChild(commentForm);

        // Re-add event listener to the comment form button
        const submitCommentBtn = commentForm.querySelector(".submit-comment-btn");
        if (submitCommentBtn) {
            submitCommentBtn.addEventListener("click", handleSubmitComment);
        }

        // Add all comments
        for (const commentDoc of commentsSnapshot.docs) {
            const commentData = commentDoc.data();

            // Get comment user info
            const commentUserRef = doc(db, "users", commentData.username);
            const commentUserSnap = await getDoc(commentUserRef);
            const commentUserData = commentUserSnap.exists() ? commentUserSnap.data() : { username: commentData.username };

            // Check if current user is comment owner
            let deleteCommentButton = '';
            if (loggedInUser && (loggedInUser === commentData.username || await isUserAdmin())) {
                deleteCommentButton = `<button class="delete-comment-btn" data-comment-id="${commentDoc.id}">🗑️</button>`;
            }

            const commentElement = document.createElement("div");
            commentElement.className = "comment";
            commentElement.id = `comment-${commentDoc.id}`;

            // Format timestamp for comment
            let commentDate;
            let commentTimeAgo;

            if (commentData.createdAt instanceof Timestamp) {
                commentDate = commentData.createdAt.toDate();
                commentTimeAgo = getTimeAgo(commentDate);
            } else if (typeof commentData.createdAt === 'string') {
                commentDate = new Date(commentData.createdAt);
                commentTimeAgo = getTimeAgo(commentDate);
            } else {
                commentTimeAgo = "Recently";
            }

            commentElement.innerHTML = `
                <img src="${commentUserData.profilePicture || 'https://placehold.co/30x30/444/aaa?text=User'}" alt="${commentUserData.username}'s avatar" class="user-avatar-small user-profile-link" data-username="${commentUserData.username}">
                <div class="comment-content">
                    <div class="comment-header">
                        <h4 class="username user-profile-link" data-username="${commentUserData.username}">${commentUserData.username}</h4>
                        <span class="comment-time">${commentTimeAgo}</span>
                        ${deleteCommentButton}
                    </div>
                    <p>${formatPostContent(commentData.content)}</p>
                </div>
            `;

            commentsSection.insertBefore(commentElement, commentForm);
        }

        // Add event listeners to delete comment buttons
        commentsSection.querySelectorAll(".delete-comment-btn").forEach(button => {
            button.addEventListener("click", handleDeleteComment);
        });

        // Add click handlers for user profile links
        commentsSection.querySelectorAll(".user-profile-link").forEach(element => {
            element.addEventListener("click", function() {
                const username = this.getAttribute("data-username");
                window.location.href = `OtherProfilePage.html?user=${encodeURIComponent(username)}`;
            });
        });

        // Hide "View more" button
        event.currentTarget.style.display = "none";

    } catch (error) {
        console.error("Error loading more comments:", error);
        alert("Error loading comments");
    }
}

// Tab switching functionality
function setupTabs() {
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabPanels = document.querySelectorAll(".tab-panel");

    tabButtons.forEach(button => {
        button.addEventListener("click", async () => {
            const targetTab = button.getAttribute("data-tab");

            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");

            // Show target tab panel
            tabPanels.forEach(panel => {
                panel.classList.remove("active");
                if (panel.id === targetTab) {
                    panel.classList.add("active");
                }
            });

            // Refresh content based on the active tab
            if (targetTab === "members") {
                // Get fresh community data for up-to-date members list
                const communityRef = doc(db, "communities", communityId);
                const communitySnap = await getDoc(communityRef);

                if (communitySnap.exists()) {
                    const communityData = communitySnap.data();
                    await loadMembers(communityData.members);
                }
            } else if (targetTab === "reviews") {
                await loadReviews();
            } else if (targetTab === "discussion") {
                await loadDiscussionPosts();
            }
        });
    });
}

// Helper function to format time ago
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) return interval + " years ago";
    if (interval === 1) return "1 year ago";

    interval = Math.floor(seconds / 2592000);
    if (interval > 1) return interval + " months ago";
    if (interval === 1) return "1 month ago";

    interval = Math.floor(seconds / 86400);
    if (interval > 1) return interval + " days ago";
    if (interval === 1) return "1 day ago";

    interval = Math.floor(seconds / 3600);
    if (interval > 1) return interval + " hours ago";
    if (interval === 1) return "1 hour ago";

    interval = Math.floor(seconds / 60);
    if (interval > 1) return interval + " minutes ago";
    if (interval === 1) return "1 minute ago";

    return "Just now";
}

// Helper function to check if current user is admin
async function isUserAdmin() {
    if (!loggedInUser) return false;

    try {
        const communityRef = doc(db, "communities", communityId);
        const communitySnap = await getDoc(communityRef);

        if (communitySnap.exists()) {
            return communitySnap.data().createdBy === loggedInUser;
        }

        return false;
    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
}

// Format post content (convert URLs to links, handle line breaks, etc.)
function formatPostContent(content) {
    if (!content) return '';

    // Replace URLs with clickable links
    const urlRegex = /(https?:\/\/\S+)/g;
    let formattedContent = content.replace(urlRegex, url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);

    // Replace line breaks with <br> tags
    formattedContent = formattedContent.replace(/\n/g, '<br>');

    return formattedContent;
}

// Real-time updates for new posts
function setupRealTimeUpdates() {
    // Set up a listener on the Discussion tab to check for new posts
    const discussionTab = document.querySelector('[data-tab="discussion"]');
    discussionTab.addEventListener('click', () => {
        loadDiscussionPosts();
    });

    // Refresh posts only if not actively commenting
    setInterval(() => {
        if (document.querySelector('#discussion').classList.contains('active') &&
            !document.querySelector('.comment-input:focus')) {
            loadDiscussionPosts();
        }
    }, 60000); // 60 seconds
}

// Initialize the page
document.addEventListener("DOMContentLoaded", function() {
    // Set up event listeners
    document.getElementById("joinButton").addEventListener("click", handleJoinCommunity);
    document.getElementById("submitPost").addEventListener("click", handleCreatePost);

    // Set up tab switching
    setupTabs();

    // Set up real-time updates
    setupRealTimeUpdates();

    // Load community data
    loadCommunityData();
});
document.addEventListener("DOMContentLoaded", function () {
    const notificationBell = document.getElementById("notificationBell");
    const currentUser = localStorage.getItem("loggedInUser");
    if (!currentUser) return;

    let latestNotifications = [];
    const notifQ = query(
        collection(db, "users", currentUser, "notifications"),
        orderBy("createdAt", "desc")
    );
    onSnapshot(notifQ, snapshot => {
        latestNotifications = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
        updateBellBadge(latestNotifications.filter(n => !n.read).length);
        if (document.getElementById("notificationBox")?.style.display !== "none") {
            renderNotifications();
        }
    });

    if (notificationBell) {
        notificationBell.addEventListener("click", async function (event) {
            event.stopPropagation();

            const bellRect = notificationBell.getBoundingClientRect();
            let notificationBox = document.getElementById("notificationBox");

            if (!notificationBox) {
                notificationBox = document.createElement("div");
                notificationBox.id = "notificationBox";
                notificationBox.className = "notification-box";
                notificationBox.innerHTML = `
                    <div class="notification-box-header" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #444;">
                        <span style="font-size: 18px; color: white;">Notifications</span>
                        <i class='bx bx-cog' id="notificationSettings" style="font-size: 18px; cursor: pointer; color: white;"></i>
                    </div>
                    <div class="notification-box-content" style="padding: 10px; color: white;">
                        <p>No new notifications.</p>
                    </div>
                `;
                notificationBox.style.position = "fixed";  // ← FIXED instead of absolute
                notificationBox.style.top = bellRect.bottom + "px";
                notificationBox.style.right = (window.innerWidth - bellRect.right) + "px";
                notificationBox.style.backgroundColor = "#000";
                notificationBox.style.width = "300px";
                notificationBox.style.border = "1px solid #444";
                notificationBox.style.borderRadius = "5px";
                notificationBox.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
                notificationBox.style.zIndex = 100;
                document.body.appendChild(notificationBox);

                const notificationSettings = notificationBox.querySelector("#notificationSettings");
                if (notificationSettings) {
                    notificationSettings.addEventListener("click", function (event) {
                        event.stopPropagation();
                        window.location.href = "userNotificationSettings.html";
                    });
                }

                renderNotifications();
                updateBellBadge(0);
                const unread1 = latestNotifications.filter(n => !n.read);
                await Promise.all(unread1.map(n =>
                    updateDoc(doc(db, "users", currentUser, "notifications", n.id), {read: true})
                ));
            } else {
                if (notificationBox.style.display === "none" || notificationBox.style.display === "") {
                    const newBellRect = notificationBell.getBoundingClientRect();
                    notificationBox.style.top = newBellRect.bottom + "px";
                    notificationBox.style.right = (window.innerWidth - newBellRect.right) + "px";
                    notificationBox.style.display = "block";

                    renderNotifications();
                    updateBellBadge(0);
                    const unread2 = latestNotifications.filter(n => !n.read);
                    await Promise.all(unread2.map(n =>
                        updateDoc(doc(db, "users", currentUser, "notifications", n.id), {read: true})
                    ));
                } else {
                    notificationBox.style.display = "none";
                }
            }
        });
    }

    function timeAgo(date) {
        const now = Date.now();
        const diffMs = now - date.getTime();
        const sec = Math.floor(diffMs / 1000);
        if (sec < 60) return `${sec}s ago`;
        const min = Math.floor(sec / 60);
        if (min < 60) return `${min}m ago`;
        const hr = Math.floor(min / 60);
        if (hr < 24) return `${hr}h ago`;
        const days = Math.floor(hr / 24);
        return `${days}d ago`;
    }

    function renderNotifications() {
        const content = document.querySelector(".notification-box-content");
        if (!content) return;

        if (latestNotifications.length === 0) {
            content.innerHTML = `<p>No new notifications.</p>`;
        } else {
            content.innerHTML = latestNotifications
                .map(n => {
                    const dateObj = n.createdAt?.toDate?.() || new Date();
                    const ago = timeAgo(dateObj);
                    return `
                      <div class="notification-item" style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 1px solid #444;
                        padding: 8px 0;
                        margin: 4px 0;
                      ">
                        <span>${n.message}</span>
                        <span style="
                          font-size: 12px;
                          color: #888;
                          margin-left: 8px;
                          white-space: nowrap;
                        ">${ago}</span>
                      </div>
                    `;
                })
                .join("");
        }
    }

    function updateBellBadge(count) {
        let badge = document.getElementById("notif-badge");

        if (count > 0) {
            notificationBell.style.position = 'relative';

            if (!badge) {
                badge = document.createElement("span");
                badge.id = "notif-badge";
                badge.className = "notification-badge";

                Object.assign(badge.style, {
                    position: 'absolute',
                    top: '0',
                    right: '0',
                    transform: 'translate(50%, -50%)',
                    backgroundColor: 'red',
                    color: 'white',
                    borderRadius: '50%',
                    padding: '2px 6px',
                    fontSize: '16px',
                    lineHeight: '1',
                    textAlign: 'center',
                    minWidth: '6px',
                });

                notificationBell.appendChild(badge);
            }
            badge.textContent = count;
        } else if (badge) {
            badge.remove();
        }
    }
});