import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import {
    collection,
    getDocs,
    getFirestore,
    orderBy,
    query,
    where,
    doc,
    updateDoc,
    getDoc,
    arrayRemove
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

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
const loggedInUser = localStorage.getItem("loggedInUser");

document.addEventListener("DOMContentLoaded", () => {
    if (loggedInUser) {
        loadMyCommunities();
    } else {
        document.getElementById("myCommunities").innerHTML = "";
        document.getElementById("noMyCommunities").style.display = "block";
    }
});

async function loadMyCommunities() {
    try {
        const myCommunityQuery = query(
            collection(db, "communities"),
            where("members", "array-contains", loggedInUser),
            orderBy("name")
        );

        const snapshot = await getDocs(myCommunityQuery);
        const grid = document.getElementById("myCommunities");

        if (snapshot.empty) {
            grid.innerHTML = "";
            document.getElementById("noMyCommunities").style.display = "block";
            return;
        }

        let html = "";
        snapshot.forEach(doc => {
            const data = doc.data();
            const id = doc.id;
            const displayedGenres = data.genres.slice(0, 3).map(g => `<span class="genre-tag">${g}</span>`).join("");

            html += `
        <div class="community-card" data-id="${id}" data-creator="${data.createdBy}">
          <div class="community-header">
            <img class="community-img" src="${data.profilePicture || 'https://placehold.co/60x60/444/aaa?text=🌀'}" alt="${data.name}">
            <h3>${data.name}</h3>
          </div>
          <div class="community-genres">
            ${displayedGenres}
            ${data.genres.length > 3 ? `<span class="genre-tag">+${data.genres.length - 3}</span>` : ''}
          </div>
          <p class="members-count">${data.memberCount || 0} members</p>
          <div class="button-group">
            <a class="view-btn" href="../homePage/communityProfile.html?id=${id}">👁 View</a>
            <button class="leave-btn">🚪 Leave</button>
          </div>
        </div>
      `;
        });

        grid.innerHTML = html;
        document.getElementById("noMyCommunities").style.display = "none";

        document.querySelectorAll(".leave-btn").forEach(button => {
            button.addEventListener("click", handleLeaveCommunity);
        });

    } catch (err) {
        console.error("Error loading communities", err);
        document.getElementById("myCommunities").innerHTML = `<div class="loading error">Failed to load communities</div>`;
    }
}

async function handleLeaveCommunity(event) {
    const card = event.target.closest(".community-card");
    const communityId = card.getAttribute("data-id");
    const creatorId = card.getAttribute("data-creator");

    if (creatorId === loggedInUser) {
        alert("You are the creator of this community and cannot leave it.");
        return;
    }

    try {
        const ref = doc(db, "communities", communityId);
        const snap = await getDoc(ref);
        const data = snap.data();

        await updateDoc(ref, {
            members: arrayRemove(loggedInUser),
            memberCount: (data.memberCount || 1) - 1
        });

        card.remove();

        if (document.querySelectorAll(".community-card").length === 0) {
            document.getElementById("noMyCommunities").style.display = "block";
        }

    } catch (error) {
        console.error("Error leaving community:", error);
        alert("Failed to leave community. Try again.");
    }
}

