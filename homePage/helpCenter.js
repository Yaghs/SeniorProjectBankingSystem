import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyD1LpIBMmZAiQFwberKbx2G29t6fNph3Xg",
    authDomain: "sample-dc6d0.firebaseapp.com",
    projectId: "sample-dc6d0",
    storageBucket: "sample-dc6d0.appspot.com",
    messagingSenderId: "650782048731",
    appId: "1:650782048731:web:d2828c5b87f0a4e62367fe",
    measurementId: "G-WJMEY6J7BR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// No need to import from Firebase in this version

document.getElementById("helpForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("email").value.trim();
    const subject = document.getElementById("subject").value.trim();
    const message = document.getElementById("description").value.trim();
    const time = new Date().toLocaleString();

    const templateParams = {
        name,
        message: `Subject: ${subject}\n\n${message}`,
        time
    };

    try {
        const result = await emailjs.send("service_sqxezsn", "template_ukaye6t", templateParams);

        console.log("✅ Email sent:", result);

        const msg = document.getElementById("successMessage");
        msg.textContent = `✅ Request sent successfully! Ticket created at ${time}`;
        msg.style.display = "block";

        document.getElementById("helpForm").reset();
    } catch (error) {
        console.error("❌ Email sending error:", error);
        alert(`Failed to send request. ${error?.text || "See console for details."}`);
    }
});





