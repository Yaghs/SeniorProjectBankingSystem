import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    getDocs,
    addDoc,
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

console.log("Firebase initialized"); // Debug message

// Global variables
let currentUser = null;
let currentChatUser = null;
let messagesListener = null;

// DOM elements
const searchFriends = document.getElementById("searchfriends");
const userList = document.getElementById("userList");
const chatHeader = document.getElementById("chatHeader");
const chatMessage = document.getElementById("chatMessage");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

console.log("DOM elements accessed:", {
    searchFriends: !!searchFriends,
    userList: !!userList,
    chatHeader: !!chatHeader,
    chatMessage: !!chatMessage,
    messageInput: !!messageInput,
    sendButton: !!sendButton
}); // Debug message

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

    const sidebar = document.getElementById("userList");

    if (!currentUser) {
        alert("You must be logged in to view this section");
        return;
    }

    try {
        // Clear previous content
        sidebar.innerHTML = "";

        // Get users the current user has chatted with
        const chatUserIds = await getChatUserIds(currentUser);

        console.log("Found chat users:", chatUserIds.size);

        // If no chats found
        if (chatUserIds.size === 0) {
            sidebar.innerHTML = "<div class='user-row'>No conversations yet</div>";
            sidebar.innerHTML += "<div class='user-row' style='text-align: center; padding: 10px;'>Use the search box above to find users and start a conversation</div>";
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

            // Create user row in sidebar
            const userDiv = document.createElement("div");
            userDiv.classList.add("user-row");

            // Get profile picture if available
            const profilePic = userData.profilePicture
                ? userData.profilePicture
                : "https://as1.ftcdn.net/v2/jpg/00/64/67/52/1000_F_64675209_7ve2XQANuzuHjMZXP3aIYIpsDKEbF5dD.jpg";

            // Display name (first name if available, username otherwise)
            const displayName = userData.firstName || userId;

            userDiv.innerHTML = `
                <div class="user-info">
                    <img src="${profilePic}" alt="${displayName}" style="width: 30px; height: 30px; border-radius: 50%; margin-right: 10px;">
                    <strong>${displayName}</strong>
                </div>
                <div class="user-actions">
                    <button class="chat-btn" data-user="${userId}">Chat</button>
                </div>            
            `;

            sidebar.appendChild(userDiv);
        }

        // Add event listeners to chat buttons
        sidebar.querySelectorAll('.chat-btn').forEach(button => {
            button.addEventListener('click', function() {
                const user = this.getAttribute('data-user');
                console.log("Chat button clicked for user:", user); // Debug message
                openChatWindow(user);
            });
        });

    } catch (error) {
        console.error("Error loading sidebar:", error);
        sidebar.innerHTML = "<div class='user-row'>Error loading users</div>";
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

    // Message requests button
    const requestsButton = document.querySelector(".request_mess");
    if (requestsButton) {
        requestsButton.addEventListener("click", () => {
            alert("Message requests feature coming soon!");
        });
    }
}

// Search for users
async function searchUsers(searchTerm) {
    console.log("Searching for users with term:", searchTerm); // Debug message

    const sidebar = document.getElementById("userList");
    sidebar.innerHTML = "<div class='user-row'>Searching...</div>";

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
        if (matchingUsers.length === 0) {
            sidebar.innerHTML = "<div class='user-row'>No users found</div>";
            return;
        }

        sidebar.innerHTML = "";

        matchingUsers.forEach(user => {
            const userDiv = document.createElement("div");
            userDiv.classList.add("user-row");

            const displayName = user.data.firstName || user.id;
            const profilePic = user.data.profilePicture || "https://as1.ftcdn.net/v2/jpg/00/64/67/52/1000_F_64675209_7ve2XQANuzuHjMZXP3aIYIpsDKEbF5dD.jpg";

            userDiv.innerHTML = `
                <div class="user-info">
                    <img src="${profilePic}" alt="${displayName}" style="width: 30px; height: 30px; border-radius: 50%; margin-right: 10px;">
                    <strong>${displayName}</strong> (@${user.id})
                </div>
                <div class="user-actions">
                    <button class="chat-btn" data-user="${user.id}">Chat</button>
                </div>
            `;

            sidebar.appendChild(userDiv);
        });

        // Add event listeners to chat buttons
        sidebar.querySelectorAll('.chat-btn').forEach(button => {
            button.addEventListener('click', function() {
                const user = this.getAttribute('data-user');
                openChatWindow(user);
            });
        });

    } catch (error) {
        console.error("Error searching users:", error);
        sidebar.innerHTML = "<div class='user-row'>Error searching users</div>";
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
            <div style="display: flex; align-items: center;">
                <img src="${profilePic}" alt="${displayName}" style="width: 30px; height: 30px; border-radius: 50%; margin-right: 10px;">
                <span>Chat with ${displayName} (@${otherUser})</span>
            </div>
        `;

        // Clear previous messages
        chatMessage.innerHTML = "";

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

        // Setup real-time listener for messages
        messagesListener = onSnapshot(q, (snapshot) => {
            console.log("Message snapshot received, changes:", snapshot.docChanges().length); // Debug message

            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const message = change.doc.data();
                    console.log("New message:", message); // Debug message
                    displayMessage(message);
                }
            });

            // Scroll to bottom
            chatMessage.scrollTop = chatMessage.scrollHeight;
        }, (error) => {
            console.error("Error setting up message listener:", error);
        });

        // Focus input field
        messageInput.focus();

    } catch (error) {
        console.error("Error opening chat:", error);
        alert("Error opening chat: " + error.message);
    }
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

//check if you can send to user(if your following them)

async function checkUser(currentUser,otherUser){
    const followDoc = await  getDoc(doc(db,"follows",currentUser));
    if(followDoc.exists()){
        const follows = followDoc.data();
        return follows[otherUser]==true;
    }
    return false
}

async function MessageRequest(currentUser,otherUser){
    try{
        const  request = doc(db,"messageRequest",otherUser,"request",currentUser);
        await  setDoc(request,{
            timestamp: serverTimestamp(),
            fromUser: currentUser
        });
        console.log(`Message Request sent from ${currentUser} to ${otherUser}`)
    }catch (error){
        console.error("Error with sending message request")
    }

}

// Send a message
async function sendMessage() {
    const otherUser = currentChatUser;
    const text = messageInput.value.trim();

    console.log("Sending message:", text, "to user:", currentChatUser); // Debug message

    if (!text || !currentChatUser) {
        console.log("Cannot send message: empty text or no recipient"); // Debug message
        return;
    }

    if(!(await checkUser(currentUser,otherUser))){
        alert("Send message request frist!")
        await MessageRequest(currentUser,otherUser);
        alert("Request sent, wait to see if they accepts")
        return;
    }

    try {
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
            lastUpdated: serverTimestamp()
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

// Add CSS for messages
const style = document.createElement('style');
style.textContent = `
    .message {
        max-width: 70%;
        margin-bottom: 10px;
        padding: 10px;
        border-radius: 10px;
        position: relative;
    }
    
    .sent {
        align-self: flex-end;
        background-color: #65558F;
        color: white;
        margin-left: auto;
    }
    
    .received {
        align-self: flex-start;
        background-color: #444;
        color: white;
    }
    
    .message-content {
        word-wrap: break-word;
    }
    
    .message-time {
        font-size: 0.7em;
        color: rgba(255,255,255,0.7);
        text-align: right;
        margin-top: 5px;
    }
    
    .unread-badge {
        background-color: red;
        color: white;
        border-radius: 50%;
        padding: 3px 6px;
        font-size: 0.8em;
        margin-left: 5px;
    }
    
    .user-info {
        display: flex;
        align-items: center;
    }
`;

document.head.appendChild(style);

console.log("Hub.js fully loaded"); // Debug message