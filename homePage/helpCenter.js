import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// --- Firebase config ---
const firebaseConfig = {
    apiKey: "AIzaSyD1LpIBMmZAiQFwberKbx2G29t6fNph3Xg",
    authDomain: "sample-dc6d0.firebaseapp.com",
    projectId: "sample-dc6d0",
    storageBucket: "sample-dc6d0.appspot.com",
    messagingSenderId: "650782048731",
    appId: "1:650782048731:web:d2828c5b87f0a4e62367fe",
    measurementId: "G-WJMEY6J7BR"
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- DOM Elements ---
const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

let typingInterval;
let failedAttempts = 0; // 🛠 Track user failed attempts

// --- Bad Words List ---
const badWords = [
    "dumb", "stupid", "idiot", "loser", "jerk", "moron", "fool", "trash", "sucks",
    "shut up", "shutup", "crap", "damn", "shit", "fuck", "bitch", "bastard",
    "asshole", "ass", "dick", "piss", "prick", "slut", "whore", "cunt", "retard",
    "douche", "bollocks", "bugger", "bloody", "arse", "wanker", "twat", "git",
    "twit", "cow", "dog", "hoe", "skank", "motherfucker", "fucker", "jackass", "sucker"
];

// --- Clean input ---
function cleanText(input) {
    return input
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// --- Check profanity ---
function containsProfanity(input) {
    const cleanedInput = cleanText(input);
    return badWords.some(badWord => cleanedInput.includes(badWord));
}

// --- Typing Animation ---
function showTypingAnimation() {
    const typing = document.createElement("div");
    typing.classList.add("chat-message", "bot-message");
    typing.id = "typingIndicator";
    typing.textContent = ".";
    chatBox.appendChild(typing);
    chatBox.scrollTop = chatBox.scrollHeight;

    let dotCount = 1;
    typingInterval = setInterval(() => {
        dotCount = (dotCount % 3) + 1;
        typing.textContent = ".".repeat(dotCount);
    }, 500);
}

function removeTypingAnimation() {
    clearInterval(typingInterval);
    const typing = document.getElementById("typingIndicator");
    if (typing) typing.remove();
}

// --- Delay helper ---
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --- Send user message ---
sendBtn.addEventListener("click", handleUserMessage);
userInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        handleUserMessage();
    }
});

async function handleUserMessage() {
    const inputRaw = userInput.value.trim();
    if (!inputRaw) return;

    if (containsProfanity(inputRaw)) {
        addMessage("🚫 Please use respectful language.", "bot-message");
        userInput.value = "";
        return;
    }

    const input = cleanText(inputRaw);
    addMessage(inputRaw, "user-message");
    userInput.value = "";

    // 🛠 Check if they ask for admin directly
    if (input.includes("i want to speak to an admin")) {
        showTypingAnimation();
        await delay(1000);
        removeTypingAnimation();
        addMessage("Sure! Please click the button below to talk to an admin.", "bot-message");
        showContactAdminsOption();
        return;
    }

    showTypingAnimation();
    const response = await findBestAnswer(input);
    await delay(1500);
    removeTypingAnimation();
    addMessage(response, "bot-message");

    if (response.includes("couldn't find an answer")) {
        failedAttempts++;
        if (failedAttempts >= 3) {
            showTypingAnimation();
            await delay(1000);
            removeTypingAnimation();
            addMessage("It seems we're having trouble finding an answer. Please contact an admin for help!", "bot-message");
            showContactAdminsOption();
        }
    } else {
        failedAttempts = 0; // Reset attempts if we found an answer
    }
}

// --- Firestore: Find best answer ---
async function findBestAnswer(userInputCleaned) {
    const faqRef = collection(db, "helpcenter");
    const snapshot = await getDocs(faqRef);
    let bestMatch = null;
    let bestScore = 0;

    snapshot.forEach(doc => {
        const data = doc.data();
        const keywords = (data.keywords || []).map(word => cleanText(word));

        let score = 0;
        for (const keyword of keywords) {
            if (userInputCleaned.includes(keyword)) {
                score++;
            }
        }

        if (score > bestScore) {
            bestScore = score;
            bestMatch = data.answer;
        }
    });

    if (bestMatch) {
        return bestMatch;
    } else {
        return "😕 Sorry, I couldn't find an answer for your question.";
    }
}

// --- Add messages ---
function addMessage(message, type) {
    const div = document.createElement("div");
    div.classList.add("chat-message", type);
    div.textContent = message;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// --- Show Contact Admin Button ---
function showContactAdminsOption() {
    const container = document.createElement("div");
    container.classList.add("chat-message", "bot-message");

    const infoText = document.createElement("p");
    infoText.textContent = "Please reach out to our admins for further assistance.";

    const contactBtn = document.createElement("button");
    contactBtn.textContent = "Contact Admins";
    contactBtn.style.marginTop = "10px";
    contactBtn.style.padding = "8px 15px";
    contactBtn.style.backgroundColor = "#ffffff";
    contactBtn.style.border = "none";
    contactBtn.style.color = "#000";
    contactBtn.style.fontWeight = "bold";
    contactBtn.style.cursor = "pointer";
    contactBtn.style.borderRadius = "5px";

    contactBtn.addEventListener("click", () => {
        window.location.href = "homePage.html";
    });

    container.appendChild(infoText);
    container.appendChild(contactBtn);
    chatBox.appendChild(container);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// --- Show Initial Welcome Message when page loads ---
document.addEventListener("DOMContentLoaded", function () {
    addMessage(
        "Hi! Welcome to the Help Center page of the PlotTwist website. How can I help you today? (Please note: if you wish to speak to an admin, please type 'I want to speak to an admin')",
        "bot-message"
    );
});





