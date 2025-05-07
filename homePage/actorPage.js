import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs,
    orderBy,
    addDoc,
    serverTimestamp,
    query,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// initialize firebase
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

const API_KEY = "bc7c4e7c62d9e223e196bbd15978fc51";
const actor = JSON.parse(localStorage.getItem("selectedActor"));

document.addEventListener("DOMContentLoaded", () => {
    if (actor) {
        fetchActorDetails(actor.id);
    } else {
        window.location.href = "homePage.html";
    }

    setupNotificationBell();
});

async function fetchActorDetails(actorId) {
    try {
        const response = await fetch(
            `https://api.themoviedb.org/3/person/${actorId}?api_key=${API_KEY}`
        );
        const data = await response.json();

        document.getElementById("actorImage").src = data.profile_path
            ? `https://image.tmdb.org/t/p/original${data.profile_path}`
            : "https://via.placeholder.com/300?text=No+Image";

        document.getElementById("actorBio").textContent = data.biography || "Biography not available.";

        fetchKnownMovies(actorId);
    } catch (error) {
        console.error("Error fetching actor details:", error);
        alert("Failed to load actor details.");
    }
}

async function fetchKnownMovies(actorId) {
    try {
        const response = await fetch(
            `https://api.themoviedb.org/3/person/${actorId}/movie_credits?api_key=${API_KEY}`
        );
        const data = await response.json();

        const knownMovies = data.cast.filter(movie => !movie.adult)
            .sort((a, b) => b.popularity - a.popularity)
            .slice(0, 30);

        const knownMoviesDiv = document.getElementById("knownMovies");
        knownMoviesDiv.innerHTML = "";

        knownMovies.forEach(movie => {
            const isAdult = movie.adult;
            const blurStyle = isAdult ? 'style="filter: blur(8px);"' : '';

            const movieItem = document.createElement("div");
            movieItem.classList.add("movie-item");
            movieItem.style.cursor = "pointer";
            movieItem.innerHTML = `
                <img src="https://image.tmdb.org/t/p/w300${movie.poster_path}" alt="${movie.title}" ${blurStyle}>
                <p>${movie.title}</p>
            `;

            movieItem.addEventListener("click", () => {
                localStorage.setItem("selectedMovie", JSON.stringify(movie));
                window.location.href = "moviePage.html";
            });

            knownMoviesDiv.appendChild(movieItem);
        });
    } catch (error) {
        console.error("Error fetching known movies:", error);
        alert("Failed to load known movies.");
    }
}

// ✅ Notifications Setup
function setupNotificationBell() {
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
                Object.assign(notificationBox.style, {
                    position: "fixed",
                    top: bellRect.bottom + "px",
                    right: (window.innerWidth - bellRect.right) + "px",
                    backgroundColor: "#000",
                    width: "300px",
                    border: "1px solid #444",
                    borderRadius: "5px",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                    zIndex: "1000"
                });
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
            content.innerHTML = latestNotifications.map(n => {
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
            }).join("");
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
                    zIndex: '1000'
                });

                notificationBell.appendChild(badge);
            }
            badge.textContent = count;
        } else if (badge) {
            badge.remove();
        }
    }
}

