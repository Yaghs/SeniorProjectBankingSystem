import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD1LpIBMmZAiQFwberKbx2G29t6fNph3Xg",
    authDomain: "sample-dc6d0.firebaseapp.com",
    projectId: "sample-dc6d0",
    storageBucket: "sample-dc6d0.appspot.com",
    messagingSenderId: "650782048731",
    appId: "1:650782048731:web:d2828c5b87f0a4e62367fe",
    measurementId: "G-WJMEY6J7BR"
};

// initialize firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("🔥 Firebase Initialized Successfully");

// 🔐 Login handler
document.getElementById("loginSubmit")?.addEventListener('click', async function (e) {
    e.preventDefault();

    let username = document.getElementById("loginUsername").value.trim();
    let password = document.getElementById("loginPassword").value.trim();

    if (!username || !password) {
        alert("please enter both username and password");
        return;
    }

    console.log("checking firebase for user:", username);

    const userRef = doc(db, "users", username);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        console.warn("username does not exist:", username);
        alert("username not found please try again");
        clearUsername();
        return;
    }

    const userData = userSnap.data();

    if (userData.dateJoined) {
        const joinDate = userData.dateJoined.toDate();
        const formattedDate = joinDate.toLocaleDateString("en-US", {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        console.log("Date Joined:", formattedDate);
    }

    if (userData.password !== password) {
        console.warn("incorrect password for:", username);
        alert("incorrect password please try again.");
        clearPassword();
        return;
    }

    console.log("login successful for:", username, "going to homepage");
    localStorage.setItem("loggedInUser", username);

    window.location.href = "../homePage/homePage.html";
});

function clearUsername() {
    document.getElementById("loginUsername").value = "";
}

function clearPassword() {
    document.getElementById("loginPassword").value = "";
}

// 📝 Create account handler
document.getElementById("createSubmit")?.addEventListener('click', async function (e) {
    e.preventDefault();

    let firstName = document.getElementById("firstName").value.trim();
    let lastName = document.getElementById("lastName").value.trim();
    let username = document.getElementById("username").value.trim();
    let email = document.getElementById("email").value.trim();
    let password = document.getElementById("password").value.trim();

    if (!firstName || !lastName || !email || !username || !password) {
        alert("please fill all fields");
        return;
    }

    const userRef = doc(db, "users", username);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        alert("username already taken choose another");
    } else {
        try {
            await setDoc(userRef, {
                firstName,
                lastName,
                email,
                username,
                password,
                dateJoined: serverTimestamp(),
                followers: [],
                following: [],
                closeFriends: [],
                blocked: [],
                theme: "light"
            });

            localStorage.setItem("loggedInUser", username);
            clearAll();
            window.location.href = "./genreSelection.html";
        } catch (error) {
            console.error("firestore error:", error);
            alert("error saving data");
        }
    }
});

function clearAll() {
    document.getElementById("firstName").value = "";
    document.getElementById("lastName").value = "";
    document.getElementById("email").value = "";
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
}



// Utility function to retrieve the list of followed users
export async function getFollowingList(username) {
    const userRef = doc(db, "users", username);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return [];
    return userSnap.data().following || [];
}

// Additional utility functions (if needed)
export async function addToCloseFriends(currentUser, friendUsername) {
    const userRef = doc(db, "users", currentUser);
    const userSnap = await getDoc(userRef);
    const data = userSnap.data();
    const updated = new Set(data.closeFriends || []);
    updated.add(friendUsername);
    await setDoc(userRef, { closeFriends: Array.from(updated) }, { merge: true });
}

export async function blockUser(currentUser, blockedUsername) {
    const userRef = doc(db, "users", currentUser);
    const blockedUserRef = doc(db, "users", blockedUsername);

    const [userSnap, blockedSnap] = await Promise.all([
        getDoc(userRef),
        getDoc(blockedUserRef)
    ]);

    if (!userSnap.exists() || !blockedSnap.exists()) return;

    const userData = userSnap.data();
    const blockedData = blockedSnap.data();

    const updatedBlocked = new Set(userData.blocked || []);
    const updatedFollowing = new Set(userData.following || []);
    const updatedFollowers = new Set(blockedData.followers || []);

    updatedBlocked.add(blockedUsername);
    updatedFollowing.delete(blockedUsername);
    updatedFollowers.delete(currentUser);

    await Promise.all([
        setDoc(userRef, {
            blocked: Array.from(updatedBlocked),
            following: Array.from(updatedFollowing)
        }, { merge: true }),

        setDoc(blockedUserRef, {
            followers: Array.from(updatedFollowers)
        }, { merge: true })
    ]);
}


export { db };
