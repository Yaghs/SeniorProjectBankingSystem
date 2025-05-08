import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, getDocs, setDoc, deleteDoc, collection } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBkidFMwM_jHr5i4D55EEr_anJlrwrNvrI",
  authDomain: "plottwistsp.firebaseapp.com",
  projectId: "plottwistsp",
  storageBucket: "plottwistsp.firebasestorage.app",
  messagingSenderId: "605014060151",
  appId: "1:605014060151:web:3e307d34e57d908fa8ea72"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function copySubcollections(oldUsername, newUsername) {
  const subcollectionNames = ["reviews", "following", "followers", "favorite_movies"];

  for (const sub of subcollectionNames) {
    console.log(`\n➡Copying subcollection: ${sub}`);

    const oldSubRef = collection(db, "users", oldUsername, sub);
    const newSubRef = collection(db, "users", newUsername, sub);

    const snapshot = await getDocs(oldSubRef);
    console.log(`Found ${snapshot.size} docs in "${sub}"`);

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const newDocRef = doc(db, "users", newUsername, sub, docSnap.id);
      console.log(`Copying doc: ${docSnap.id} →`, data);
      await setDoc(newDocRef, data);
    }
  }

  console.log("All subcollections copied.");
}


document.addEventListener("DOMContentLoaded", async function () {
  const usernameDisplay = document.getElementById("usernameDisplay");
  const changeUsernameLink = document.getElementById("changeUsernameLink");
  const usernameEdit = document.querySelector(".username-edit");
  const usernameInput = document.getElementById("usernameInput");
  const confirmUsernameButton = document.getElementById("confirmUsernameButton");
  const firstNameDisplay = document.getElementById("firstNameDisplay");
  const lastNameDisplay = document.getElementById("lastNameDisplay");
  const emailDisplay = document.getElementById("emailDisplay");
  const bioDisplay = document.getElementById("bioDisplay");

  let currentUsername = localStorage.getItem("loggedInUser") || "DefaultUser";
  usernameDisplay.textContent = currentUsername;
  usernameInput.value = currentUsername;

  // fetch first and last name from Firebase
  try {
    const userRef = doc(db, "users", currentUsername);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      firstNameDisplay.textContent = userData.firstName || "N/A";
      lastNameDisplay.textContent = userData.lastName || "N/A";
      emailDisplay.textContent = userData.email || "N/A";
      bioDisplay.textContent = userData.bio || "N/A";
    } else {
      console.warn("user document not found for:", currentUsername);
    }
  } catch (error) {
    console.error("error fetching user info:", error);
  }

  changeUsernameLink.addEventListener("click", function (e) {
    e.preventDefault();
    usernameDisplay.style.display = "none";
    changeUsernameLink.style.display = "none";
    usernameEdit.style.display = "flex";
    usernameInput.focus();
  });

  confirmUsernameButton.addEventListener("click", async function () {
    const newUsername = usernameInput.value.trim();

    if (newUsername && newUsername !== currentUsername) {
      try {
        const oldUserRef = doc(db, "users", currentUsername);
        const newUserRef = doc(db, "users", newUsername);
        const oldUserSnap = await getDoc(oldUserRef);

        if (oldUserSnap.exists()) {
          const userData = oldUserSnap.data();
          const newSnap = await getDoc(newUserRef);
          if (newSnap.exists()) {
            alert("username is already taken.");
            return;
          }

          await setDoc(newUserRef, {...userData, username: newUsername});
          await copySubcollections(currentUsername, newUsername);
          await deleteDoc(oldUserRef);

          currentUsername = newUsername;
          usernameDisplay.textContent = currentUsername;
          localStorage.setItem("loggedInUser", currentUsername);

          alert("username successfully updated in firebase");
        } else {
          alert("original user not found in firebase");
          console.error("no user doc found for:", currentUsername);
        }
      } catch (error) {
        console.error("error updating username:", error);
        alert("failed to update username in Firebase.");
      }
    } else {
      console.log("username unchanged or invalid.");
    }

    usernameEdit.style.display = "none";
    usernameDisplay.style.display = "inline";
    changeUsernameLink.style.display = "inline";
  });

  // == Password ==
  const changePasswordLink = document.getElementById("changePasswordLink");
  const passwordEdit = document.querySelector(".password-edit");
  const confirmPasswordButton = document.getElementById("confirmPasswordButton");
  const passwordInput = document.getElementById("passwordInput");
  const passwordSuccessMessage = document.getElementById("passwordSuccessMessage");
  const togglePassword = document.getElementById("togglePassword");

  changePasswordLink.addEventListener("click", function (e) {
    e.preventDefault();
    changePasswordLink.style.display = "none";
    passwordEdit.style.display = "flex";
    passwordInput.focus();
  });

  togglePassword.addEventListener("click", function () {
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      togglePassword.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
      passwordInput.type = "password";
      togglePassword.innerHTML = '<i class="fas fa-eye"></i>';
    }
  });

  confirmPasswordButton.addEventListener("click", async function () {
    const newPassword = passwordInput.value.trim();
    if (!newPassword) {
      alert("please enter a new password.");
      return;
    }

    try {
      const userRef = doc(db, "users", currentUsername);
      await setDoc(userRef, { password: newPassword }, { merge: true });

      passwordEdit.style.display = "none";
      passwordInput.value = "";
      passwordInput.type = "password";
      togglePassword.innerHTML = '<i class="fas fa-eye"></i>';
      passwordSuccessMessage.style.display = "block";

      alert("password updated successfully!");
    } catch (error) {
      console.error("error updating password:", error);
      alert("failed to update password: " + error.message);
    }
  });


  // === First Name ===
  const changeFirstNameLink = document.getElementById("changeFirstNameLink");
  const firstNameInput = document.getElementById("firstNameInput");
  const confirmFirstNameButton = document.getElementById("confirmFirstNameButton");
  const firstNameEdit = document.querySelector(".firstName-edit");

  changeFirstNameLink.addEventListener("click", function(e) {
    e.preventDefault();
    firstNameInput.value = firstNameDisplay.textContent;
    firstNameEdit.style.display = "flex";
    changeFirstNameLink.style.display = "none";
  });

  confirmFirstNameButton.addEventListener("click", async function () {
    const newFirstName = firstNameInput.value.trim();
    if (!newFirstName) return;

    try {
      const userRef = doc(db, "users", currentUsername);
      await setDoc(userRef, { firstName: newFirstName }, { merge: true });

      firstNameDisplay.textContent = newFirstName;
      firstNameEdit.style.display = "none";
      changeFirstNameLink.style.display = "inline";
      alert("first name updated!");
    } catch (error) {
      console.error("error updating first name:", error);
    }
  });

// === Last Name ===
  const changeLastNameLink = document.getElementById("changeLastNameLink");
  const lastNameInput = document.getElementById("lastNameInput");
  const confirmLastNameButton = document.getElementById("confirmLastNameButton");
  const lastNameEdit = document.querySelector(".lastName-edit");

  changeLastNameLink.addEventListener("click", function(e) {
    e.preventDefault();
    lastNameInput.value = lastNameDisplay.textContent;
    lastNameEdit.style.display = "flex";
    changeLastNameLink.style.display = "none";
  });

  confirmLastNameButton.addEventListener("click", async function () {
    const newLastName = lastNameInput.value.trim();
    if (!newLastName) return;

    try {
      const userRef = doc(db, "users", currentUsername);
      await setDoc(userRef, { lastName: newLastName }, { merge: true });

      lastNameDisplay.textContent = newLastName;
      lastNameEdit.style.display = "none";
      changeLastNameLink.style.display = "inline";
      alert("last name updated!");
    } catch (error) {
      console.error("Error updating last name:", error);
    }
  });

// === Email ===
  const changeEmailLink = document.getElementById("changeEmailLink");
  const emailInput = document.getElementById("emailInput");
  const confirmEmailButton = document.getElementById("confirmEmailButton");
  const emailEdit = document.querySelector(".email-edit");

  changeEmailLink.addEventListener("click", function(e) {
    e.preventDefault();
    emailInput.value = emailDisplay.textContent;
    emailEdit.style.display = "flex";
    changeEmailLink.style.display = "none";
  });

  confirmEmailButton.addEventListener("click", async function () {
    const newEmail = emailInput.value.trim();
    if (!newEmail || !newEmail.includes("@")) {
      alert("please enter a valid email.");
      return;
    }

    try {
      const userRef = doc(db, "users", currentUsername);
      await setDoc(userRef, { email: newEmail }, { merge: true });

      emailDisplay.textContent = newEmail;
      emailEdit.style.display = "none";
      changeEmailLink.style.display = "inline";
      alert("email updated!");
    } catch (error) {
      console.error("error updating email:", error);
    }
  });

  // === Favorite Genres ===
  const genreDisplay = document.getElementById("genreDisplay");

  try {
    const genreSnap = await getDocs(collection(db, "users", currentUsername, "genres"));
    if (!genreSnap.empty) {
      const genres = genreSnap.docs.map(doc => doc.id);
      genreDisplay.textContent = genres.join(", ");
    } else {
      genreDisplay.textContent = "None selected";
    }
  } catch (error) {
    console.error("error fetching favorite genres:", error);
    genreDisplay.textContent = "Error loading genres";
  }

  // === Bio ===
  const changeBioLink = document.getElementById("changeBioLink");
  const bioInput = document.getElementById("bioInput");
  const confirmBioButton = document.getElementById("confirmBioButton");
  const bioEdit = document.querySelector(".bio-edit");

  changeBioLink.addEventListener("click", function(e) {
    e.preventDefault();
    bioInput.value = bioDisplay.textContent;
    bioEdit.style.display = "flex";
    changeBioLink.style.display = "none";
  });

  confirmBioButton.addEventListener("click", async function () {
    const newBio = bioInput.value.trim();
    if (!newBio) {
      alert("please enter a bio.");
      return;
    }

    try {
      const userRef = doc(db, "users", currentUsername);
      await setDoc(userRef, { bio: newBio }, { merge: true });

      bioDisplay.textContent = newBio;
      bioEdit.style.display = "none";
      changeBioLink.style.display = "inline";
      alert("bio updated!");
    } catch (error) {
      console.error("error updating bio:", error);
    }
  });

  // === Profile Picture ===
  const profilePicDisplay = document.getElementById("profilePicDisplay");
  const profilePicInput = document.getElementById("profilePicInput");
  const changeProfilePicLink = document.getElementById("changeProfilePicLink");

  const MAX_IMAGE_SIZE = 1 * 1024 * 1024; // 1MB

  function getBase64Size(base64String) {
    let stringLength = base64String.length - 'data:image/png;base64,'.length;
    let sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383812;
    return sizeInBytes;
  }

  changeProfilePicLink.addEventListener("click", function(e) {
    e.preventDefault();
    profilePicInput.click();
  });

  profilePicInput.addEventListener("change", async function() {
    const file = profilePicInput.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Please select a valid image file.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE * 1.33) {
      alert("Image is too large! Max size is 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
      const base64Image = e.target.result;

      if (getBase64Size(base64Image) > MAX_IMAGE_SIZE) {
        alert("Image is too large after conversion!");
        return;
      }

      // update image on the page
      profilePicDisplay.src = base64Image;

      // save to firestore
      const username = localStorage.getItem("loggedInUser");
      if (username) {
        try {
          const userRef = doc(db, "users", username);
          await setDoc(userRef, { profilePicture: base64Image }, { merge: true });
          alert("Profile picture updated!");
        } catch (error) {
          console.error("Error updating profile picture:", error);
          alert("Failed to update profile picture. Try again.");
        }
      }
    };
    reader.readAsDataURL(file);
  });

  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("sign-out")) {
      e.preventDefault();
      localStorage.clear();
      window.location.replace("/login&create/index.html");
    }
  });


});