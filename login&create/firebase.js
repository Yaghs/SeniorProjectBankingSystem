import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

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

document.getElementById("loginSubmit").addEventListener('click', async function (e) {
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

    if (userData.password !== password) {
        console.warn("incorrect password for:", username);
        alert("incorrect password please try again.");
        clearPassword();
        return;
    }

    console.log("login successful for:", username);
    alert("login successful going to homepage");

    // window.location.href = "../dashboard.html";
});

function clearUsername() {
    document.getElementById("loginUsername").value = "";
}

function clearPassword() {
    document.getElementById("loginPassword").value = "";
}

document.getElementById("createSubmit").addEventListener('click', async function (e) {
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

    console.log("checking if username exists in firestore");

    const userRef = doc(db, "users", username);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        console.warn("username exists:", username);
        alert("username already taken choose another");
    } else {
        console.log("username is available creating account");

        // 🔥 Store user data in Firestore
        await setDoc(userRef, {
            firstName: firstName,
            lastName: lastName,
            email: email,
            username: username,
            password: password
        }).then(() => {
            alert("account created");
            console.log("data saved in firestore for user:", username);
        }).catch((error) => {
            console.error("firestore error:", error);
            alert("error saving data");
        });
    }
});