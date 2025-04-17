import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

async function updateSidebar(currentUser) {
   const sidebar =document.getElementById("userList");

   if(!currentUser){
       alert("you must be logged in to view this section");
       return
   }

    try {
        const followingRef = collection(db, "users", currentUser, "following");
        const followingSnap = await getDocs(followingRef);
        const following = followingSnap.docs.map(doc =>id);

        if(following.length ===0){
            sidebar.innerHTML = "<div>Wow so empty</div>";
            return;
        }


        for (const username of following) {
            const userDoc = await getDoc(doc(db, "users", username));
            const data = userDoc.exists() ? userDoc.data() : null;
            const displayName = data
                ? `${data.firstName} ${data.lastName}`.trim() || username
                : username;

            const userDiv = document.createElement("div");
            userDiv.classList.add("user-row");
            userDiv.innerHTML = `
                <div class="user-info">
                        <strong>${displayName}</strong>(@username)
                </div>
                <div class="user-actions">
                       <button class="chat-btn" data-user="${followedUser}">Chat</button>
                 </div>            
            `;
            sidebar.appendChild(userDiv);
        }

        sidebar.querySelectorAll('.chat-btn').forEach(button => {
            button.addEventListener('click', function () {
                const user = this.getAttribute('data-user');
                openChatWindow(user);
            });
        });

    } catch (error) {
        alert("You must be logged in to view this page.");
        return;
    }
}