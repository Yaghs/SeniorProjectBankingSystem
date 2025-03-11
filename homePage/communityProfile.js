import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs, orderBy, limit, addDoc, Timestamp, deleteDoc, writeBatch } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

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

// Get community ID from URL
const urlParams = new URLSearchParams(window.location.search);
const communityId = urlParams.get('id');

// Get logged-in user
const loggedInUser = localStorage.getItem("loggedInUser");

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
            window.location.href = "../homePage/homePage.html";
            return;
        }

        const communityData = communitySnap.data();

        // Update UI with community data
        document.getElementById("communityName").textContent = communityData.name;
        document.getElementById("memberCount").textContent = `${communityData.memberCount || 0} Members`;
        document.getElementById("communityGenres").textContent = communityData.genres.join(", ");
        document.getElementById("communityBio").textContent = communityData.bio;

        if (communityData.profilePicture) {
            document.getElementById("communityProfilePic").src = communityData.profilePicture;
        }

        // Load banner image if available
        if (communityData.bannerImage) {
            document.getElementById("communityBannerImg").src = communityData.bannerImage;
        }

        // Update join button based on membership
        const joinButton = document.getElementById("joinButton");
        if (loggedInUser && communityData.members.includes(loggedInUser)) {
            joinButton.textContent = "Leave";
            joinButton.classList.add("leave");
        } else {
            joinButton.textContent = "Join";
            joinButton.classList.remove("leave");
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

        for (const username of membersList) {
            const userRef = doc(db, "users", username);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();

                const memberCard = document.createElement("div");
                memberCard.className = "member-card";

                // Check if this member is the creator of the community
                const communityRef = doc(db, "communities", communityId);
                const communitySnap = await getDoc(communityRef);
                const isAdmin = communitySnap.data().createdBy === username;

                memberCard.innerHTML = `
                    <img src=src="https://placehold.co/80x80/444/aaa?text=Member" alt="${userData.username}'s avatar" class="member-avatar">
                    <h3 class="member-name">${userData.username}</h3>
                    <span class="member-role${isAdmin ? ' admin' : ''}">${isAdmin ? 'Admin' : 'Member'}</span>
                `;

                membersContainer.appendChild(memberCard);
            }
        }
    } catch (error) {
        console.error("Error loading members:", error);
    }
}

// Load reviews
async function loadReviews() {
    try {
        const reviewsContainer = document.getElementById("reviewsList");
        reviewsContainer.innerHTML = "";

        // Get reviews associated with this community
        const reviewsQuery = query(
            collection(db, "reviews"),
            where("communityId", "==", communityId),
            orderBy("createdAt", "desc"),
            limit(10)
        );

        const reviewsSnapshot = await getDocs(reviewsQuery);

        if (reviewsSnapshot.empty) {
            reviewsContainer.innerHTML = `<p class="no-items">No reviews yet. Be the first to share your thoughts!</p>`;
            return;
        }

        for (const reviewDoc of reviewsSnapshot) {
            const reviewData = reviewDoc.data();
            reviewData.reviewText = undefined;
            reviewData.movieTitle = undefined;
            reviewData.rating = undefined;

            // Get user info
            const userRef = doc(db, "users", reviewData.username);
            const userSnap = await getDoc(userRef);
            const userData = userSnap.exists() ? userSnap.data() : { username: reviewData.username };

            const reviewItem = document.createElement("div");
            reviewItem.className = "review-item";

            const stars = "★".repeat(reviewData.rating) + "☆".repeat(5 - reviewData.rating);

            reviewItem.innerHTML = `
                <div class="review-header">
                    <img src="https://placehold.co/40x40/444/aaa?text=User" alt="${userData.username}'s avatar" class="user-avatar">
                    <div class="review-meta">
                        <h3 class="username">${userData.username}</h3>
                        <div class="movie-rating">
                            <span class="movie-title">${reviewData.movieTitle}</span>
                            <span class="rating">${stars}</span>
                        </div>
                    </div>
                </div>
                <p class="review-text">${reviewData.reviewText}</p>
            `;

            reviewsContainer.appendChild(reviewItem);
        }
    } catch (error) {
        console.error("Error loading reviews:", error);
    }
}

// Load discussion posts
async function loadDiscussionPosts() {
    try {
        const postsContainer = document.getElementById("discussionPosts");
        postsContainer.innerHTML = "";

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
                    <img src="https://placehold.co/40x40/444/aaa?text=User" alt="${userData.username}'s avatar" class="user-avatar">
                    <div class="post-meta">
                        <h3 class="username">${userData.username}</h3>
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
                        <img src="https://placehold.co/30x30/444/aaa?text=User" alt="${commentUserData.username}'s avatar" class="user-avatar-small">
                        <div class="comment-content">
                            <div class="comment-header">
                                <h4 class="username">${commentUserData.username}</h4>
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

        // Add event listeners to buttons
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

    } catch (error) {
        console.error("Error loading discussion posts:", error);
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

        if (isMember) {
            // Leave community
            if (communityData.createdBy === loggedInUser) {
                alert("As the creator, you cannot leave this community");
                return;
            }

            await updateDoc(communityRef, {
                members: arrayRemove(loggedInUser),
                memberCount: communityData.memberCount - 1
            });

            joinButton.textContent = "Join";
            joinButton.classList.remove("leave");
            alert("You have left the community");
        } else {
            // Join community
            await updateDoc(communityRef, {
                members: arrayUnion(loggedInUser),
                memberCount: communityData.memberCount + 1
            });

            joinButton.textContent = "Leave";
            joinButton.classList.add("leave");
            alert("You have joined the community");
        }

        // Reload members
        await loadMembers(communityData.members);

    } catch (error) {
        console.error("Error joining/leaving community:", error);
        alert("Error processing your request");
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
                <img src="https://placehold.co/30x30/444/aaa?text=User" alt="${commentUserData.username}'s avatar" class="user-avatar-small">
                <div class="comment-content">
                    <div class="comment-header">
                        <h4 class="username">${commentUserData.username}</h4>
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
        button.addEventListener("click", () => {
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

    // Refresh posts every minute when the Discussion tab is active
    setInterval(() => {
        if (document.querySelector('#discussion').classList.contains('active')) {
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
