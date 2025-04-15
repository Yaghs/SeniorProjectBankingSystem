import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

const TMDB_API_KEY = "bc7c4e7c62d9e223e196bbd15978fc51";

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
export { db };

const auth = getAuth();

onAuthStateChanged(auth,  (user) =>{

    if(user){
        const currnetUser = user.uid;


        document.querySelectorAll(".Follow").forEach(button =>{
            button.addEventListener("click", async function(){
                const targetUser = this.getAttribute("data_user_id")
            try{
                await setDoc(doc(db, "users", currentUser, "following",targetUser), {});
                await setDoc(doc(db, "users", targetUser, "following",currentUser), {});
                await updateSidebar(currnetUser);
            }catch (error) {
                console.error("user was not add to the sidebar: ", error)
            }
            });
        });
         updateSidebar(currnetUser);
    }else{
        console.log("user not sign in")
    }

});


async function updateSidebar(currentUser){
    try {
        const followingRef = collection(db, "users", currentUser, "following");
        const followingSnap = await getDocs(followingRef);

        const sidebar = document.getElementById("userList");
        sidebar.innerHTML = "";

        if (followingSnap.empty) {
            sidebar.innerHTML = "<h1>Wow so empty!</h1>";
            return;
        }

        followingSnap.forEach(doc => {
            const followedUser = doc.id;

            const userDiv = document.createElement("div");
            userDiv.classList.add("user");
            userDiv.innerHTML = `
                <p>${followedUser}</p>
                <button class="chat-btn" data-user="${followedUser}">Chat</button>
            `;
            sidebar.appendChild(userDiv);
        });


        document.querySelectorAll('.chat-btn').forEach(button => {
            button.addEventListener('click', function () {
                const user = this.getAttribute('data-user');
                openChatWindow(user);
            });
        });

    } catch (error) {
        console.error("Error loading following list:", error);
    }
}
