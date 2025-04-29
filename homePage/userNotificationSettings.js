import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// — your firebaseConfig here —
const firebaseConfig = {
  apiKey: "...",
  authDomain: "sample-dc6d0.firebaseapp.com",
  projectId: "sample-dc6d0",
  storageBucket: "sample-dc6d0.appspot.com",
  messagingSenderId: "650782048731",
  appId: "1:650782048731:web:d2828c5b87f0a4e62367fe",
  measurementId: "G-WJMEY6J7BR"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", async function() {
  const currentUser = localStorage.getItem("loggedInUser");
  if (!currentUser) return;

  const userRef = doc(db, "users", currentUser);

  // 1) Load existing prefs or initialize defaults
  const defaultPrefs = {
    messages_off: true,
    followers_off: true,
    comments_off: true,
    likes_off: true
  };
  const snap = await getDoc(userRef);

  let prefs;
  if (snap.exists() && snap.data().notificationPreferences) {
    // merge Firestore’s partial map into our defaults
    prefs = {
      ...defaultPrefs,
      ...snap.data().notificationPreferences
    };
  } else {
    // first‐time setup: write out all defaults
    prefs = defaultPrefs;
    await setDoc(userRef, { notificationPreferences: prefs }, { merge: true });
  }

  // 2) Grab DOM elements and set their initial states
  const toggles = {
    messages_off:  document.getElementById("messagesToggle"),
    followers_off: document.getElementById("followersToggle"),
    comments_off:  document.getElementById("commentsToggle"),
    likes_off:     document.getElementById("likesToggle")
  };

  for (const [key, elem] of Object.entries(toggles)) {
    if (!elem) continue;
    elem.checked = prefs[key];

    // 3) Wire up live writes
    elem.addEventListener("change", async () => {
      const newVal = elem.checked;
      console.log(`${key} notifications toggled:`, newVal);
      await updateDoc(userRef, {
        [`notificationPreferences.${key}`]: newVal
      });
    });
  }
});