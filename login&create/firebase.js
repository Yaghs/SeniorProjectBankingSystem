import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBkidFMwM_jHr5i4D55EEr_anJlrwrNvrI",
    authDomain: "plottwistsp.firebaseapp.com",
    projectId: "plottwistsp",
    storageBucket: "plottwistsp.firebasestorage.app",
    messagingSenderId: "605014060151",
    appId: "1:605014060151:web:3e307d34e57d908fa8ea72"
};

// initialize firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("firebase initialized");

const passwordInput = document.getElementById("password");
const passwordError = document.getElementById("passwordError");
const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

passwordInput?.addEventListener('input', () => {
  if (!pwdRegex.test(passwordInput.value)) {
    passwordError.textContent =
      "Password must be at least 6 characters long, include uppercase, lowercase & a number!";
  } else {
    passwordError.textContent = "";
  }
});

// ← INSERT: username setup (make sure this is **after** your password block)
const usernameInput = document.getElementById("username");
const usernameError = document.getElementById("usernameError");

usernameInput?.addEventListener('input', () => {
  if (usernameInput.value.trim().length < 3) {
    usernameError.textContent =
      "Username must be at least 3 characters long!";
  } else {
    usernameError.textContent = "";
  }
});

// ← INSERT: email setup (make sure this is **after** your username block)
const emailInput     = document.getElementById("email");
const emailError     = document.getElementById("emailError");
const validDomains   = [
  "@gmail.com","@farmingdale.edu","@googlemail.com","@outlook.com","@hotmail.com",
  "@live.com","@msn.com","@yahoo.com","@yahoo.co.uk","@yahoo.co.in","@aol.com",
  "@icloud.com","@me.com","@mac.com","@gmx.com","@gmx.us","@gmx.co.uk","@mail.com",
  "@yandex.com","@yandex.ru","@zoho.com","@inbox.com","@rediffmail.com","@runbox.com",
  "@fastmail.com"
];

emailInput?.addEventListener('input', () => {
  const val = emailInput.value.trim();
  if (!validDomains.some(d => val.endsWith(d))) {
    emailError.textContent =
      "You must enter a valid email!";  // ← INSERT
  } else {
    emailError.textContent = "";
  }
});






// login handler
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
    //REMOVE IF IT DOESNT WORK
    localStorage.setItem("sessionStart", Date.now());

    window.location.href = "/homePage/homePage.html";
});

function clearUsername() {
    document.getElementById("loginUsername").value = "";
}

function clearPassword() {
    document.getElementById("loginPassword").value = "";
}

// create account handler
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

    if (!validDomains.some(d => email.endsWith(d))) {
      emailError.textContent =
        "Email must end in one of: " + validDomains.join(", ");
      return;
    } else {
      emailError.textContent = "";
    }

    if (username.length < 3) {
      usernameError.textContent =
        "Username must be at least 3 characters long.";
      return;
    } else {
        usernameError.textContent = "";
    }



    if (!pwdRegex.test(password)){
      passwordError.textContent =
        "Password must be ≥6 chars, include uppercase, lowercase & a number.";
      return;
    } else {
      passwordError.textContent = "";
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
                theme: "dark",
                profilePicture: "/imgs/blankpfp.webp"
            });

            localStorage.setItem("loggedInUser", username);
            clearAll();
            console.log("Redirecting to genreSelection.html");
            window.location.href = "/login&create/genreSelection.html";
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

export async function blockUser(currentUser, blockedUsername) {
    const userRef = doc(db, "users", currentUser);
    const blockedUserRef = doc(db, "users", blockedUsername);
    const blockSubRef = doc(db, "users", currentUser, "blocked", blockedUsername);

    const [userSnap, blockedSnap] = await Promise.all([
        getDoc(userRef),
        getDoc(blockedUserRef)
    ]);

    if (!userSnap.exists() || !blockedSnap.exists()) return;

    // Delete them from currentUser's following
    const followingDoc = doc(db, "users", currentUser, "following", blockedUsername);
    await deleteDoc(followingDoc);

    // Delete currentUser from their followers
    const followerDoc = doc(db, "users", blockedUsername, "followers", currentUser);
    await deleteDoc(followerDoc);

    // create blocked user subcollection entry
    await setDoc(blockSubRef, {
        blockedAt: Date.now()
    });
}


export { db };
