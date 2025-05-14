import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    deleteDoc,
    collection,
    getDocs,
    addDoc,
    updateDoc,
    query,
    orderBy,
    limit,
    onSnapshot,
    Timestamp,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

console.log("Hub.js is loading..."); // Debug message

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

console.log("Firebase initialized"); // Debug message

// Global variables
let currentUser = null;
let currentChatUser = null;
let messagesListener = null;
let requestsVisible = false;

// DOM elements
const searchFriends = document.getElementById("searchfriends");
const userList = document.getElementById("userList");
const chatHeader = document.getElementById("chatHeader");
const chatMessage = document.getElementById("chatMessage");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const showRequestsBtn = document.getElementById("showRequestsBtn");
const requestsContainer = document.getElementById("requestsContainer");
const requestCount = document.getElementById("requestCount");

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM loaded"); // Debug message

    // Get current logged-in user
    currentUser = localStorage.getItem("loggedInUser");

    if (!currentUser) {
        alert("You must be logged in to use direct messaging");
        window.location.href = "homePage.html";
        return;
    }

    console.log("Current user:", currentUser); // Debug message

    // Display username in header
    document.getElementById("username").textContent = currentUser;

    // Check for message requests and update counter
    await checkMessageRequests();

    // Check if a specific user was requested in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const requestedUser = urlParams.get("user");

    console.log("Requested user from URL:", requestedUser); // Debug message

    // Load user's chat history to sidebar
    await updateSidebar(currentUser);

    // If a specific user was requested, open that chat
    if (requestedUser) {
        openChatWindow(requestedUser);
    }

    // Setup event listeners
    setupEventListeners();
});

// Function to check for message requests and update the UI
async function checkMessageRequests() {
    if (!currentUser) return;

    try {
        const requests = await pendingRequest(currentUser);
        const count = requests.length;

        // Update request count badge
        if (count > 0) {
            requestCount.textContent = count;
            requestCount.classList.remove("hidden");
        } else {
            requestCount.classList.add("hidden");
        }

        return count;
    } catch (error) {
        console.error("Error checking message requests:", error);
        return 0;
    }
}

// Function to get users the current user has chatted with
async function getChatUserIds(currentUser) {
    const chatUserIds = new Set();

    try {
        // Find all chats where the current user has sent or received messages
        const sentMessagesQuery = query(
            collection(db, "chats"),
            where(`userParticipants.${currentUser}`, "==", true)
        );

        const sentChatsSnapshot = await getDocs(sentMessagesQuery);

        // If we don't have a userParticipants field yet, fall back to manual checking
        if (sentChatsSnapshot.empty) {
            // Fallback: manually check known chat IDs based on convention
            // Get all chat documents
            const chatsRef = collection(db, "chats");
            const chatsSnapshot = await getDocs(chatsRef);

            for (const chatDoc of chatsSnapshot.docs) {
                const chatId = chatDoc.id;

                // Check if this chat ID contains the current user
                // Chat IDs are in format "user1_user2" where users are alphabetically sorted
                if (chatId.includes(currentUser)) {
                    const users = chatId.split("_");
                    // Get the other user in the chat
                    const otherUser = users[0] === currentUser ? users[1] : users[0];
                    chatUserIds.add(otherUser);
                }
            }

            // If still no chats found, check directly in each potential chat's messages
            if (chatUserIds.size === 0) {
                console.log("No chats found with conventional methods, checking messages directly");

                // Get all users for potential chats (this is slow but a fallback)
                const usersRef = collection(db, "users");
                const usersSnapshot = await getDocs(usersRef);

                // Create a map to cache results and avoid redundant queries
                const chatChecked = new Map();

                // For each potential user, check only a limited number to avoid too many queries
                let checkedCount = 0;
                const MAX_TO_CHECK = 15; // Limit checks to avoid performance issues

                for (const userDoc of usersSnapshot.docs) {
                    if (checkedCount >= MAX_TO_CHECK) break;

                    const otherUser = userDoc.id;

                    // Skip self
                    if (otherUser === currentUser) continue;

                    checkedCount++;

                    // Create potential chat ID (alphabetically sorted)
                    const chatId = [currentUser, otherUser].sort().join('_');

                    // Skip if already checked
                    if (chatChecked.has(chatId)) continue;
                    chatChecked.set(chatId, true);

                    // Check if there are messages in this chat
                    const messagesRef = collection(db, "chats", chatId, "messages");
                    const messagesQuery = query(messagesRef, limit(1));
                    const messagesSnapshot = await getDocs(messagesQuery);

                    // If there are messages, add the user to the set
                    if (!messagesSnapshot.empty) {
                        console.log(`Found chat with: ${otherUser}`);
                        chatUserIds.add(otherUser);

                        // Optimize the database by adding a userParticipants field to the chat document
                        // This will make future lookups faster
                        try {
                            await setDoc(doc(db, "chats", chatId), {
                                userParticipants: {
                                    [currentUser]: true,
                                    [otherUser]: true
                                },
                                lastUpdated: serverTimestamp()
                            }, { merge: true });
                            console.log(`Added userParticipants field to chat: ${chatId}`);
                        } catch (e) {
                            console.error("Error updating chat document:", e);
                        }
                    }
                }
            }
        } else {
            // If we found chats with the userParticipants field, use those
            console.log(`Found ${sentChatsSnapshot.size} chats using userParticipants field`);

            for (const chatDoc of sentChatsSnapshot.docs) {
                const chatId = chatDoc.id;
                const users = chatId.split("_");
                // Get the other user in the chat
                const otherUser = users[0] === currentUser ? users[1] : users[0];
                chatUserIds.add(otherUser);
            }
        }
    } catch (error) {
        console.error("Error getting chat users:", error);
    }

    return chatUserIds;
}

// Load users into sidebar
async function updateSidebar(currentUser) {
    console.log("Updating sidebar for:", currentUser); // Debug message

    if (!currentUser) {
        alert("You must be logged in to view this section");
        return;
    }

    try {
        // Clear previous content
        userList.innerHTML = "<div class='loading-indicator'>Loading conversations...</div>";

        // Get users the current user has chatted with
        const chatUserIds = await getChatUserIds(currentUser);

        console.log("Found chat users:", chatUserIds.size);

        // Clear loading indicator
        userList.innerHTML = "";

        // If no chats found
        if (chatUserIds.size === 0) {
            userList.innerHTML = `
                <div class='empty-state'>
                    <i class='bx bx-message-square-detail' style='font-size: 48px; margin-bottom: 10px;'></i>
                    <p>No conversations yet</p>
                    <p class='empty-state-sub'>Search for users to start chatting</p>
                </div>
            `;
            return;
        }

        // For each user they've chatted with
        for (const userId of chatUserIds) {
            // Get user data
            const userDoc = await getDoc(doc(db, "users", userId));

            if (!userDoc.exists()) {
                continue; // Skip if user no longer exists
            }

            const userData = userDoc.data();

            // Create user row
            await createUserRow(userId, userData, userList);
        }

    } catch (error) {
        console.error("Error loading sidebar:", error);
        userList.innerHTML = "<div class='user-row'>Error loading users</div>";
    }
}

// Create a user row in the sidebar
async function createUserRow(userId, userData, container) {
    // Get profile picture if available
    const profilePic = userData.profilePicture
        ? userData.profilePicture
        : "https://as1.ftcdn.net/v2/jpg/00/64/67/52/1000_F_64675209_7ve2XQANuzuHjMZXP3aIYIpsDKEbF5dD.jpg";

    // Display name (first name if available, username otherwise)
    const displayName = userData.firstName || userId;

    // Get unread message count
    const unreadCount = await getUnreadMessageCount(currentUser, userId);
    const unreadBadge = unreadCount > 0 ? `<span class="unread-badge">${unreadCount}</span>` : '';

    // Create user row element
    const userDiv = document.createElement("div");
    userDiv.classList.add("user-row");
    userDiv.setAttribute("data-user", userId);

    userDiv.innerHTML = `
        <div class="user-info">
            <img src="${profilePic}" alt="${displayName}" class="user-avatar">
            <div class="user-details">
                <strong class="user-name">${displayName}</strong>
                <span class="user-username">@${userId}</span>
            </div>
            ${unreadBadge}
        </div>
    `;

    // Add click event to the entire row
    userDiv.addEventListener('click', () => {
        openChatWindow(userId);
    });

    // Add user row to container
    container.appendChild(userDiv);
}

// Get unread message count for a specific user
async function getUnreadMessageCount(currentUser, otherUser) {
    try {
        // Create chat ID (alphabetically sorted)
        const chatId = [currentUser, otherUser].sort().join('_');

        // Query for unread messages
        const messagesRef = collection(db, "chats", chatId, "messages");
        const unreadQuery = query(
            messagesRef,
            where("to", "==", currentUser),
            where("read", "==", false)
        );

        const unreadSnapshot = await getDocs(unreadQuery);
        return unreadSnapshot.size;
    } catch (error) {
        console.error("Error getting unread count:", error);
        return 0;
    }
}

// Setup event listeners for the page
function setupEventListeners() {
    console.log("Setting up event listeners"); // Debug message

    // Friend search
    if (searchFriends) {
        searchFriends.addEventListener("input", async (e) => {
            const searchTerm = e.target.value.trim().toLowerCase();

            if (searchTerm.length < 2) {
                // If search is cleared, reload chat history
                updateSidebar(currentUser);
                return;
            }

            // Search for users
            await searchUsers(searchTerm);
        });
    }

    // Send message when Send button is clicked
    if (sendButton) {
        sendButton.addEventListener("click", () => {
            console.log("Send button clicked"); // Debug message
            sendMessage();
        });
    }

    // Send message when Enter key is pressed
    if (messageInput) {
        messageInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                console.log("Enter key pressed"); // Debug message
                sendMessage();
            }
        });
    }

    // Show message requests
    if (showRequestsBtn) {
        showRequestsBtn.addEventListener("click", async () => {
            requestsVisible = !requestsVisible;

            if (requestsVisible) {
                // Show requests and update button
                showRequestsBtn.classList.add("active");
                requestsContainer.style.display = "block";
                await showMessageRequest(currentUser);
            } else {
                // Hide requests and update button
                showRequestsBtn.classList.remove("active");
                requestsContainer.style.display = "none";
                // Refresh sidebar with conversations
                await updateSidebar(currentUser);
            }
        });
    }

    // Close message requests when clicking outside
    document.addEventListener("click", (e) => {
        // If requests are visible and click is outside the requests container and button
        if (requestsVisible &&
            !requestsContainer.contains(e.target) &&
            !showRequestsBtn.contains(e.target)) {
            requestsVisible = false;
            showRequestsBtn.classList.remove("active");
            requestsContainer.style.display = "none";
            // Refresh sidebar with conversations
            updateSidebar(currentUser);
        }
    });
}

// Search for users
async function searchUsers(searchTerm) {
    console.log("Searching for users with term:", searchTerm); // Debug message

    userList.innerHTML = "<div class='loading-indicator'>Searching...</div>";

    try {
        // Get all users from Firestore
        const usersRef = collection(db, "users");
        const usersSnap = await getDocs(usersRef);

        // Filter users by search term
        const matchingUsers = [];

        usersSnap.forEach(doc => {
            const userData = doc.data();
            const username = doc.id.toLowerCase();
            const firstName = (userData.firstName || "").toLowerCase();
            const lastName = (userData.lastName || "").toLowerCase();

            // Skip current user
            if (doc.id === currentUser) return;

            // Check if any field matches search term
            if (username.includes(searchTerm) ||
                firstName.includes(searchTerm) ||
                lastName.includes(searchTerm)) {
                matchingUsers.push({
                    id: doc.id,
                    data: userData
                });
            }
        });

        console.log("Found matching users:", matchingUsers.length); // Debug message

        // Display results
        userList.innerHTML = "";

        if (matchingUsers.length === 0) {
            userList.innerHTML = `
                <div class='empty-state'>
                    <i class='bx bx-search-alt' style='font-size: 36px; margin-bottom: 10px;'></i>
                    <p>No users found</p>
                    <p class='empty-state-sub'>Try a different search term</p>
                </div>
            `;
            return;
        }

        // Display matching users
        for (const user of matchingUsers) {
            const userDiv = document.createElement("div");
            userDiv.classList.add("user-row", "search-result");

            const displayName = user.data.firstName || user.id;
            const profilePic = user.data.profilePicture || "https://as1.ftcdn.net/v2/jpg/00/64/67/52/1000_F_64675209_7ve2XQANuzuHjMZXP3aIYIpsDKEbF5dD.jpg";

            userDiv.innerHTML = `
                <div class="user-info">
                    <img src="${profilePic}" alt="${displayName}" class="user-avatar">
                    <div class="user-details">
                        <strong class="user-name">${displayName}</strong>
                        <span class="user-username">@${user.id}</span>
                    </div>
                </div>
                <div class="user-actions">
                    <button class="chat-btn" data-user="${user.id}">Chat</button>
                </div>
            `;

            userList.appendChild(userDiv);
        }

        // Add event listeners to chat buttons
        userList.querySelectorAll('.chat-btn').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent row click
                const user = this.getAttribute('data-user');
                openChatWindow(user);
            });
        });

        // Add event listeners to user rows
        userList.querySelectorAll('.search-result').forEach(row => {
            row.addEventListener('click', function() {
                const userProfile = this.querySelector('.user-info').getAttribute('data-user') ||
                    this.querySelector('.chat-btn').getAttribute('data-user');
                window.location.href = `OtherProfilePage.html?user=${userProfile}`;
            });
        });

    } catch (error) {
        console.error("Error searching users:", error);
        userList.innerHTML = `
            <div class='empty-state'>
                <i class='bx bx-error-circle' style='font-size: 36px; margin-bottom: 10px;'></i>
                <p>Error searching users</p>
            </div>
        `;
    }
}

// Open chat window with a specific user
async function openChatWindow(otherUser) {
    console.log("Opening chat with user:", otherUser); // Debug message

    // Don't open chat with self
    if (otherUser === currentUser) {
        alert("You cannot chat with yourself");
        return;
    }

    try {
        // Get other user's profile
        const userDoc = await getDoc(doc(db, "users", otherUser));

        if (!userDoc.exists()) {
            alert("User not found");
            return;
        }

        const userData = userDoc.data();
        const displayName = userData.firstName || otherUser;

        // Update chat header with user's profile picture
        const profilePic = userData.profilePicture || "https://as1.ftcdn.net/v2/jpg/00/64/67/52/1000_F_64675209_7ve2XQANuzuHjMZXP3aIYIpsDKEbF5dD.jpg";

        chatHeader.innerHTML = `
            <div class="chat-user-info">
                <img src="${profilePic}" alt="${displayName}" class="chat-avatar">
                <div class="chat-user-details">
                    <strong class="chat-user-name">${displayName}</strong>
                    <span class="chat-user-username">@${otherUser}</span>
                </div>
            </div>
            <a href="OtherProfilePage.html?user=${otherUser}" class="view-profile-link" title="View Profile">
                <i class='bx bx-user-circle'></i>
            </a>
        `;

        // Clear previous messages
        chatMessage.innerHTML = "";

        // Show loading indicator
        chatMessage.innerHTML = `<div class="loading-message">Loading messages...</div>`;

        // Store current chat user
        currentChatUser = otherUser;

        // Remove previous listener if exists
        if (messagesListener) {
            messagesListener();
        }

        // Create chat ID (alphabetically sorted)
        const chatId = [currentUser, otherUser].sort().join('_');

        console.log("Chat ID:", chatId); // Debug message

        // Create messages collection reference
        const messagesRef = collection(db, "chats", chatId, "messages");

        // Create query sorted by timestamp
        const q = query(messagesRef, orderBy("timestamp", "asc"));

        // Highlight active user in sidebar
        document.querySelectorAll('.user-row').forEach(row => {
            if (row.getAttribute('data-user') === otherUser) {
                row.classList.add('active');
                // Clear unread badge
                const badge = row.querySelector('.unread-badge');
                if (badge) badge.remove();
            } else {
                row.classList.remove('active');
            }
        });

        // First check if we can message this user
        if (!(await checkUser(currentUser, otherUser))) {
            // Show message request UI
            showMessageRequestPrompt(otherUser);
            return;
        }

        // Setup real-time listener for messages
        messagesListener = onSnapshot(q, (snapshot) => {
            console.log("Message snapshot received, changes:", snapshot.docChanges().length); // Debug message

            // Clear loading message if it exists
            const loadingMsg = chatMessage.querySelector('.loading-message');
            if (loadingMsg) {
                chatMessage.removeChild(loadingMsg);
            }

            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const message = change.doc.data();
                    console.log("New message:", message); // Debug message
                    displayMessage(message);

                    // Mark message as read if it's to current user
                    if (message.to === currentUser && !message.read) {
                        updateDoc(change.doc.ref, { read: true })
                            .catch(error => console.error("Error marking message as read:", error));
                    }
                }
            });

            // Scroll to bottom
            chatMessage.scrollTop = chatMessage.scrollHeight;
        }, (error) => {
            console.error("Error setting up message listener:", error);
            chatMessage.innerHTML = `
                <div class="error-message">
                    <i class='bx bx-error'></i>
                    <p>Error loading messages. Please try again.</p>
                </div>
            `;
        });

        // Focus input field
        messageInput.focus();

    } catch (error) {
        console.error("Error opening chat:", error);
        alert("Error opening chat: " + error.message);
    }
}

// Show message request prompt
function showMessageRequestPrompt(otherUser) {
    chatMessage.innerHTML = `
        <div class="message-request-prompt">
            <i class='bx bx-envelope-open'></i>
            <h3>Start a conversation with ${otherUser}</h3>
            <p>You need to send a message request before you can chat with this user.</p>
            <button id="sendRequestBtn" class="request-btn">Send Message Request</button>
        </div>
    `;

    document.getElementById("sendRequestBtn").addEventListener("click", async () => {
        try {
            await MessageRequest(currentUser, otherUser);
            chatMessage.innerHTML = `
                <div class="message-request-sent">
                    <i class='bx bx-check-circle'></i>
                    <h3>Request Sent!</h3>
                    <p>We'll notify you when ${otherUser} accepts your request.</p>
                </div>
            `;
        } catch (error) {
            console.error("Error sending message request:", error);
            alert("Error sending message request. Please try again.");
        }
    });
}

// Display a message in the chat window
function displayMessage(message) {
    console.log("Displaying message:", message); // Debug message

    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");

    // Add sent or received class
    messageDiv.classList.add(message.from === currentUser ? "sent" : "received");

    // Format timestamp
    let timestamp;
    if (message.timestamp && typeof message.timestamp.toDate === 'function') {
        timestamp = message.timestamp.toDate();
    } else if (message.timestamp && message.timestamp.seconds) {
        // Handle Firestore Timestamp object
        timestamp = new Date(message.timestamp.seconds * 1000);
    } else {
        timestamp = new Date();
    }

    const formattedTime = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Create message HTML
    messageDiv.innerHTML = `
        <div class="message-content">${message.text}</div>
        <div class="message-time">${formattedTime}</div>
    `;

    chatMessage.appendChild(messageDiv);
}

// Check if the user is allowed to message another user
async function checkUser(currentUser, otherUser) {
    try {
        // Check if the message access already exists
        const messageAccessDoc = await getDoc(doc(db, "messageAccess", currentUser));
        const hasAccess = messageAccessDoc.exists() && messageAccessDoc.data()[otherUser] === true;

        if (hasAccess) {
            return true;
        }

        // Check if the other user follows the current user
        const followDoc = await getDoc(doc(db, "users", otherUser));
        if (followDoc.exists()) {
            const follow = followDoc.data();
            if (follow.following && follow.following.includes(currentUser)) {
                // Grant automatic access if they follow each other
                await setDoc(doc(db, "messageAccess", currentUser), { [otherUser]: true }, { merge: true });
                await setDoc(doc(db, "messageAccess", otherUser), { [currentUser]: true }, { merge: true });
                return true;
            }
        }

        // Check if the current user is blocked by the other user
        const blockedDoc = await getDoc(doc(db, "users", otherUser, "blocked", currentUser));
        if (blockedDoc.exists()) {
            return false;
        }

        return false;
    } catch (error) {
        console.error("Error checking message access:", error);
        return false;
    }
}

// Send a message request
async function MessageRequest(currentUser, otherUser) {
    try {
        // Create request in the otherUser's requests collection
        const requestDoc = doc(db, "messageRequest", otherUser, "request", currentUser);
        await setDoc(requestDoc, {
            fromUser: currentUser,
            status: "pending",
            timestamp: serverTimestamp()
        });

        // Add notification
        await addDoc(collection(db, "users", otherUser, "notifications"), {
            type: "message_request",
            message: `${currentUser} wants to chat with you.`,
            createdAt: serverTimestamp(),
            read: false
        });

        console.log(`Message request sent from ${currentUser} to ${otherUser}`);
        return true;
    } catch (error) {
        console.error("Error sending message request:", error);
        throw error;
    }
}

// Get pending message requests
async function pendingRequest(currentUser) {
    try {
        const requestRef = collection(db, "messageRequest", currentUser, "request");
        const snapshot = await getDocs(requestRef);

        const requests = [];
        snapshot.forEach(doc => {
            requests.push({ id: doc.id, ...doc.data() });
        });

        return requests;
    } catch (error) {
        console.error("Error getting pending requests:", error);
        return [];
    }
}

// Accept a message request
async function acceptRequest(currentUser, otherUser) {
    try {
        // Grant message access in both directions
        await setDoc(doc(db, "messageAccess", currentUser), {
            [otherUser]: true
        }, { merge: true });

        await setDoc(doc(db, "messageAccess", otherUser), {
            [currentUser]: true
        }, { merge: true });

        // Update request status to accepted
        const requestDoc = doc(db, "messageRequest", currentUser, "request", otherUser);
        await updateDoc(requestDoc, { status: "accepted" });

        // Delete the request
        await deleteDoc(requestDoc);

        // Add notification to other user
        await addDoc(collection(db, "users", otherUser, "notifications"), {
            type: "message_request_accepted",
            message: `${currentUser} accepted your message request.`,
            createdAt: serverTimestamp(),
            read: false
        });

        console.log(`Message request accepted between ${currentUser} and ${otherUser}`);
        return true;
    } catch (error) {
        console.error("Error accepting request:", error);
        throw error;
    }
}

// Reject a message request
async function rejectRequest(currentUser, otherUser) {
    try {
        // Delete the request
        await deleteDoc(doc(db, "messageRequest", currentUser, "request", otherUser));
        console.log(`Message request rejected from ${otherUser}`);
        return true;
    } catch (error) {
        console.error("Error rejecting request:", error);
        throw error;
    }
}

// Show message requests
async function showMessageRequest(currentUser) {
    const container = document.getElementById("requestsContainer");
    container.innerHTML = "<div class='loading-indicator'>Loading requests...</div>";

    try {
        const requests = await pendingRequest(currentUser);

        // Clear loading indicator
        container.innerHTML = "";

        if (requests.length === 0) {
            container.innerHTML = `
                <div class="empty-requests">
                    <i class='bx bx-envelope-open'></i>
                    <p>No message requests</p>
                </div>
            `;
            return;
        }

        // Process each request
        for (const request of requests) {
            const { id: otherUser, fromUser, timestamp } = request;

            // Get user data
            const userDoc = await getDoc(doc(db, "users", otherUser));
            if (!userDoc.exists()) continue;

            const userData = userDoc.data();
            const displayName = userData.firstName || otherUser;
            const profilePic = userData.profilePicture || "https://as1.ftcdn.net/v2/jpg/00/64/67/52/1000_F_64675209_7ve2XQANuzuHjMZXP3aIYIpsDKEbF5dD.jpg";

            // Create request element
            const requestDiv = document.createElement("div");
            requestDiv.classList.add("request-item");

            // Format timestamp
            let timeDisplay = "Recently";
            if (timestamp) {
                const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
                timeDisplay = date.toLocaleDateString();
            }

            requestDiv.innerHTML = `
                <div class="request-user-info">
                    <img src="${profilePic}" alt="${displayName}" class="request-avatar">
                    <div class="request-details">
                        <strong class="request-name">${displayName}</strong>
                        <span class="request-username">@${otherUser}</span>
                        <span class="request-time">${timeDisplay}</span>
                    </div>
                </div>
                <div class="request-actions">
                    <button class="accept-btn" data-user="${otherUser}">Accept</button>
                    <button class="reject-btn" data-user="${otherUser}">Decline</button>
                </div>
            `;

            container.appendChild(requestDiv);
        }

        // Add event listeners for accept/reject buttons
        container.querySelectorAll('.accept-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const otherUser = this.getAttribute('data-user');
                try {
                    this.textContent = "Accepting...";
                    this.disabled = true;

                    await acceptRequest(currentUser, otherUser);

                    // Remove the request item
                    this.closest('.request-item').remove();

                    // Open chat with this user
                    openChatWindow(otherUser);

                    // Update request count
                    await checkMessageRequests();

                    // If no more requests, hide the container
                    if (container.children.length === 0) {
                        container.innerHTML = `
                            <div class="empty-requests">
                                <i class='bx bx-envelope-open'></i>
                                <p>No more message requests</p>
                            </div>
                        `;
                    }
                } catch (error) {
                    console.error("Error accepting request:", error);
                    this.textContent = "Accept";
                    this.disabled = false;
                    alert("Error accepting request. Please try again.");
                }
            });
        });

        container.querySelectorAll('.reject-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const otherUser = this.getAttribute('data-user');
                try {
                    this.textContent = "Declining...";
                    this.disabled = true;

                    await rejectRequest(currentUser, otherUser);

                    // Remove the request item
                    this.closest('.request-item').remove();

                    // Update request count
                    await checkMessageRequests();

                    // If no more requests, hide the container
                    if (container.children.length === 0) {
                        container.innerHTML = `
                            <div class="empty-requests">
                                <i class='bx bx-envelope-open'></i>
                                <p>No more message requests</p>
                            </div>
                        `;
                    }
                } catch (error) {
                    console.error("Error rejecting request:", error);
                    this.textContent = "Decline";
                    this.disabled = false;
                    alert("Error declining request. Please try again.");
                }
            });
        });

        // Add click event to user info to view profile
        container.querySelectorAll('.request-user-info').forEach(info => {
            info.addEventListener('click', function() {
                const username = this.querySelector('.request-username').textContent.substring(1); // Remove @ symbol
                window.location.href = `OtherProfilePage.html?user=${username}`;
            });
        });

    } catch (error) {
        console.error("Error showing message requests:", error);
        container.innerHTML = `
            <div class="error-message">
                <i class='bx bx-error'></i>
                <p>Error loading message requests. Please try again.</p>
            </div>
        `;
    }
}

// Send a message
async function sendMessage() {
    const text = messageInput.value.trim();

    console.log("Sending message:", text, "to user:", currentChatUser); // Debug message

    if (!text || !currentChatUser) {
        console.log("Cannot send message: empty text or no recipient"); // Debug message
        return;
    }

    try {
        // Check if we can message this user
        if (!(await checkUser(currentUser, currentChatUser))) {
            alert("You cannot message this user until they accept your request.");
            return;
        }

        // Create chat ID (alphabetically sorted)
        const chatId = [currentUser, currentChatUser].sort().join('_');

        // Create message object
        const message = {
            from: currentUser,
            to: currentChatUser,
            text: text,
            timestamp: serverTimestamp(),
            read: false
        };

        console.log("Adding message to Firestore:", message); // Debug message

        // Add message to Firestore
        await addDoc(collection(db, "chats", chatId, "messages"), message);

        // Also add or update the chat document with participants info for faster lookups
        await setDoc(doc(db, "chats", chatId), {
            userParticipants: {
                [currentUser]: true,
                [currentChatUser]: true
            },
            lastUpdated: serverTimestamp(),
            lastMessage: text,
            lastMessageTime: serverTimestamp(),
            lastMessageSender: currentUser
        }, { merge: true });

        console.log("Message added successfully"); // Debug message

        // Clear input field
        messageInput.value = "";

        // Update sidebar to include this user if it was a new conversation
        updateSidebar(currentUser);

    } catch (error) {
        console.error("Error sending message:", error);
        alert("Error sending message: " + error.message);
    }
}

// Initialize notification bell functionality
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
        latestNotifications = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
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
                    updateDoc(doc(db, "users", currentUser, "notifications", n.id), { read: true })
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
                        updateDoc(doc(db, "users", currentUser, "notifications", n.id), { read: true })
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
                    minWidth: '6px'
                });

                notificationBell.appendChild(badge);
            }
            badge.textContent = count;
        } else if (badge) {
            badge.remove();
        }
    }
    document.addEventListener("click", function (e) {
        if (e.target.classList.contains("sign-out")) {
            e.preventDefault();
            localStorage.clear();
            window.location.replace("/login&create/index.html");
        }
    });
});

